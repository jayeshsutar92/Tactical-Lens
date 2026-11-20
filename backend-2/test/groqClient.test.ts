import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { GroqClient } from '../src/integrations/groqClient.js';
import { fullTacticalAnalysisReportSchema } from '../src/schemas/analysis.js';
import { AIProviderError, ConfigurationError } from '../src/utils/errors.js';

describe('GroqClient & Zod Structured Validation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('validates structured JSON output against Zod schema', async () => {
    const testSchema = z.object({
      tactic_name: z.string(),
      intensity: z.enum(['high', 'medium', 'low']),
      zones_covered: z.array(z.number()),
    });

    const mockJsonResponse = JSON.stringify({
      tactic_name: 'Touchline Pressing Trap',
      intensity: 'high',
      zones_covered: [14, 15, 17],
    });

    vi.spyOn(GroqClient, 'chatCompletion').mockResolvedValue(mockJsonResponse);

    const result = await GroqClient.chatCompletionStructured(
      [{ role: 'user', content: 'test query' }],
      testSchema
    );

    expect(result.tactic_name).toBe('Touchline Pressing Trap');
    expect(result.intensity).toBe('high');
    expect(result.zones_covered).toEqual([14, 15, 17]);
  });

  it('throws AIProviderError when Groq returns malformed non-JSON string', async () => {
    const testSchema = z.object({ score: z.number() });

    vi.spyOn(GroqClient, 'chatCompletion').mockResolvedValue('Not a valid JSON {score:');

    await expect(
      GroqClient.chatCompletionStructured([{ role: 'user', content: 'test' }], testSchema)
    ).rejects.toThrow(AIProviderError);
  });

  it('throws AIProviderError when Groq JSON violates Zod schema contract', async () => {
    const testSchema = z.object({
      required_field: z.string(),
      rating: z.number().min(0).max(10),
    });

    const invalidPayload = JSON.stringify({
      required_field: 'valid string',
      rating: 99, // out of range
    });

    vi.spyOn(GroqClient, 'chatCompletion').mockResolvedValue(invalidPayload);

    await expect(
      GroqClient.chatCompletionStructured([{ role: 'user', content: 'test' }], testSchema)
    ).rejects.toThrow(AIProviderError);
  });

  it('validates full 10-section FullTacticalAnalysisReport schema', () => {
    const sampleReport = {
      situation_overview: {
        match_phase: 'high_press',
        tactical_situation: 'Touchline trap build-up',
        attacking_team_setup: 'Brighton (4-2-3-1)',
        defending_team_setup: 'Liverpool (4-3-3)',
        ball_location_summary: 'Defensive third flank',
        summary: 'Liverpool executes high pressing funneling wide.',
      },
      pressing_strategy: {
        intensity: 'High Press',
        primary_objective: 'Isolate ball carrier against touchline',
        pressing_direction: 'touchline_lock',
        coordination_scheme: 'Wingers cut central lane while fullbacks press',
      },
      pressing_triggers: {
        visual_triggers: ['Back-pass to fullback', 'Body facing sideline'],
        tactical_traps: ['Sideline confinement'],
        primary_trigger_player: '#11 Salah',
      },
      passing_lane_coverage: {
        cover_shadows_active: ['Central midfielder'],
        blocked_options: ['Direct pass to pivot'],
        contested_options: ['Back-pass to GK'],
        open_escape_routes: ['Long diagonal switch'],
      },
      tactical_advantages: {
        compactness_advantage: '28m vertical line distance denies pockets',
        turnover_potential: 'High turnover probability on next touch',
        key_advantages: ['Sideline serves as extra defender'],
      },
      exposed_spaces: {
        exposed_zones: ['Opposite flank'],
        rest_defense_risk: 'High line leaves space behind CBs',
        key_vulnerabilities: ['Direct switch of play'],
      },
      opposition_responses: {
        recommended_counters: ['Switch play diagonally'],
        switch_potential: 'High if carrier has 1.5s',
        third_man_runs: 'Striker dropping deep',
      },
      fan_watch_points: {
        what_to_watch_next: 'Watch if carrier clears or turns over',
        key_duel_to_follow: 'Winger vs Fullback',
        tactical_takeaway: 'Great pressing uses the sideline.',
      },
      confidence_and_limitations: {
        confidence_score: 0.95,
        confidence_level: 'High',
        data_sufficiency: 'Sufficient',
        limitations: [],
      },
      supporting_sources: [
        {
          document_title: 'High Pressing Mechanics',
          topic: 'high_pressing',
          relevance_score: 0.92,
        },
      ],
    };

    const parsed = fullTacticalAnalysisReportSchema.parse(sampleReport);
    expect(parsed.situation_overview.match_phase).toBe('high_press');
    expect(parsed.pressing_strategy.intensity).toBe('High Press');
    expect(parsed.supporting_sources).toHaveLength(1);
  });
});
