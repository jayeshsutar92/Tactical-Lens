import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TacticalAgentOrchestrator } from '../src/engine/orchestrator.js';
import { GroqClient } from '../src/integrations/groqClient.js';
import { fullTacticalAnalysisReportSchema } from '../src/schemas/analysis.js';
import { AIProviderError } from '../src/utils/errors.js';

describe('TacticalAgentOrchestrator & Resilience Fallback', () => {
  const mockScenario = {
    title: '4-3-3 High Press Trap vs Goal Kick Build-Up',
    description: 'Pressing trap along touchline',
    match_phase: 'high_press',
    tactical_situation: 'Touchline trap on goal kick short build-up',
    attacking_team: {
      name: 'Brighton',
      formation: '4-2-3-1',
      players: [
        { id: 'att_1', number: 1, name: 'Verbruggen', role: 'GK', position: { x: 6, y: 34 } },
        { id: 'att_2', number: 29, name: 'Van Hecke', role: 'CB', position: { x: 16.5, y: 48 } },
        { id: 'att_3', number: 5, name: 'Dunk', role: 'CB', position: { x: 16.5, y: 20 } },
        { id: 'att_4', number: 34, name: 'Veltman', role: 'RB', position: { x: 28, y: 62 } },
        { id: 'att_5', number: 30, name: 'Estupinan', role: 'LB', position: { x: 28, y: 6 } },
        { id: 'att_6', number: 13, name: 'Gross', role: 'DM', position: { x: 26, y: 38 } },
        { id: 'att_7', number: 20, name: 'Baleba', role: 'DM', position: { x: 25, y: 26 } },
        { id: 'att_8', number: 11, name: 'Adingra', role: 'RW', position: { x: 55, y: 60 } },
        { id: 'att_9', number: 22, name: 'Mitoma', role: 'LW', position: { x: 55, y: 8 } },
        { id: 'att_10', number: 10, name: 'Enciso', role: 'AM', position: { x: 46, y: 34 } },
        { id: 'att_11', number: 18, name: 'Welbeck', role: 'CF', position: { x: 68, y: 34 } },
      ],
    },
    defending_team: {
      name: 'Liverpool',
      formation: '4-3-3',
      players: [
        { id: 'def_1', number: 1, name: 'Alisson', role: 'GK', position: { x: 92, y: 34 } },
        { id: 'def_2', number: 4, name: 'Van Dijk', role: 'CB', position: { x: 65, y: 38 } },
        { id: 'def_3', number: 5, name: 'Konate', role: 'CB', position: { x: 65, y: 26 } },
        { id: 'def_4', number: 66, name: 'Alexander-Arnold', role: 'RB', position: { x: 60, y: 8 } },
        { id: 'def_5', number: 26, name: 'Robertson', role: 'LB', position: { x: 58, y: 60 } },
        { id: 'def_6', number: 10, name: 'Mac Allister', role: 'DM', position: { x: 42, y: 34 } },
        { id: 'def_7', number: 8, name: 'Szoboszlai', role: 'CM', position: { x: 30, y: 42 } },
        { id: 'def_8', number: 17, name: 'Jones', role: 'CM', position: { x: 32, y: 24 } },
        { id: 'def_9', number: 11, name: 'Salah', role: 'RW', position: { x: 22, y: 18 } },
        { id: 'def_10', number: 7, name: 'Diaz', role: 'LW', position: { x: 24, y: 55 } },
        { id: 'def_11', number: 9, name: 'Nunez', role: 'CF', position: { x: 19, y: 32 } },
      ],
    },
    ball_position: { x: 17.5, y: 47, z: 0, zone: 'Defensive Third - Right Half-space' },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executes full sequential workflow and returns Groq report when AI is available', async () => {
    const orchestrator = new TacticalAgentOrchestrator();

    const mockAiReport = {
      situation_overview: {
        match_phase: 'high_press',
        tactical_situation: 'Goal kick short build-up trap',
        attacking_team_setup: 'Brighton (4-2-3-1)',
        defending_team_setup: 'Liverpool (4-3-3)',
        ball_location_summary: 'Right half-space',
        summary: 'Coordinated high press isolating CB Van Hecke.',
      },
      pressing_strategy: {
        intensity: 'High Press',
        primary_objective: 'Isolate ball carrier against boundary',
        pressing_direction: 'touchline_lock',
        coordination_scheme: 'Wingers and CF converge to seal passing lane',
      },
      pressing_triggers: {
        visual_triggers: ['Pass towards sideline', 'Body turned away from goal'],
        tactical_traps: ['Sideline confinement'],
        primary_trigger_player: '#7 Diaz',
      },
      passing_lane_coverage: {
        cover_shadows_active: ['Gross shadow-marked'],
        blocked_options: ['Direct pass to pivot'],
        contested_options: ['Lateral pass to GK'],
        open_escape_routes: ['Long switch to LB'],
      },
      tactical_advantages: {
        compactness_advantage: 'Defensive line compresses space',
        turnover_potential: 'Immediate turnover risk within 5m',
        key_advantages: ['Sideline cuts off 180 degrees'],
      },
      exposed_spaces: {
        exposed_zones: ['Weak-side flank'],
        rest_defense_risk: 'Space behind fullbacks',
        key_vulnerabilities: ['Long lofted diagonal switch'],
      },
      opposition_responses: {
        recommended_counters: ['Switch play early', 'Third-man wall pass'],
        switch_potential: 'Feasible if carrier gains 1.5s',
        third_man_runs: 'Striker checking into Zone 14',
      },
      fan_watch_points: {
        what_to_watch_next: 'Watch if Van Hecke can find an exit pass',
        key_duel_to_follow: 'Diaz vs Van Hecke',
        tactical_takeaway: 'High press traps the opponent on the touchline.',
      },
      confidence_and_limitations: {
        confidence_score: 0.95,
        confidence_level: 'High',
        data_sufficiency: 'Sufficient',
        limitations: [],
      },
      supporting_sources: [],
    };

    vi.spyOn(GroqClient, 'chatCompletionStructured').mockResolvedValue(mockAiReport as any);

    // Mock db parameter as dummy
    const dummyDb: any = {
      select: () => ({
        from: () => ({
          innerJoin: () => ({
            where: () => Promise.resolve([]),
          }),
        }),
      }),
    };

    const { report, spatialMetrics, toolsExecuted } = await orchestrator.runAnalysis(
      dummyDb,
      mockScenario,
      'Analyze the pressing trap'
    );

    expect(report.situation_overview.match_phase).toBe('high_press');
    expect(toolsExecuted).toContain('context_validation');
    expect(toolsExecuted).toContain('scenario_inspection');
    expect(toolsExecuted).toContain('tactical_engine');
    expect(spatialMetrics).toHaveProperty('ball_carrier');
    expect(spatialMetrics).toHaveProperty('low_block_compactness');
    expect(spatialMetrics).toHaveProperty('zone14_density');
  });

  it('falls back seamlessly to deterministic 10-section report when Groq throws an error', async () => {
    const orchestrator = new TacticalAgentOrchestrator();

    vi.spyOn(GroqClient, 'chatCompletionStructured').mockRejectedValue(
      new AIProviderError('Groq service overloaded (503)', 503)
    );

    const dummyDb: any = {
      select: () => ({
        from: () => ({
          innerJoin: () => Promise.resolve([]),
        }),
      }),
    };

    const { report, spatialMetrics, toolsExecuted } = await orchestrator.runAnalysis(
      dummyDb,
      mockScenario
    );

    // Verify it did not crash with 500 error and produced valid 10-section fallback report
    expect(report).toBeDefined();
    expect(report.situation_overview).toBeDefined();
    expect(report.pressing_strategy).toBeDefined();
    expect(report.pressing_triggers).toBeDefined();
    expect(report.passing_lane_coverage).toBeDefined();
    expect(report.tactical_advantages).toBeDefined();
    expect(report.exposed_spaces).toBeDefined();
    expect(report.opposition_responses).toBeDefined();
    expect(report.fan_watch_points).toBeDefined();
    expect(report.confidence_and_limitations).toBeDefined();

    // Verify schema passes Zod parse
    const validated = fullTacticalAnalysisReportSchema.safeParse(report);
    expect(validated.success).toBe(true);

    expect(toolsExecuted).toContain('tactical_engine');
    expect(spatialMetrics.ball_carrier.name).toBe('Van Hecke');
  });

  it('handles follow-up queries with fallback when Groq is unavailable', async () => {
    const orchestrator = new TacticalAgentOrchestrator();

    vi.spyOn(GroqClient, 'chatCompletion').mockRejectedValue(
      new AIProviderError('Groq network error', 502)
    );

    const dummyDb: any = {
      select: () => ({
        from: () => ({
          innerJoin: () => Promise.resolve([]),
        }),
      }),
    };

    const result = await orchestrator.runFollowUp(
      dummyDb,
      mockScenario,
      'Initial tactical summary',
      [{ role: 'user', content: 'What is the primary trigger?' }],
      'How does Liverpool protect Zone 14 if the first press is bypassed?'
    );

    expect(result.answer).toContain('Zone 14');
    expect(result.answer).not.toContain('Addressing your follow-up inquiry');
    expect(result.relevant_players_mentioned.length).toBeGreaterThan(0);
    expect(result.clarified_tactics).toContain('Zone 14 Protection');
  });

  it('handles live follow-up queries parsing JSON output from Groq', async () => {
    const orchestrator = new TacticalAgentOrchestrator();

    const mockAiResponse = JSON.stringify({
      answer:
        'Diaz angles his run from 4.2m away to cut off the pass to Van Hecke, forcing play toward the touchline. This allows Liverpool to compress the pitch while maintaining defensive compactness across their midfield line.',
      relevant_players_mentioned: ['#7 Diaz', '#29 Van Hecke'],
      clarified_tactics: ['Touchline Trap', 'Cover Shadows'],
    });

    vi.spyOn(GroqClient, 'chatCompletion').mockResolvedValue(mockAiResponse);

    const dummyDb: any = {
      select: () => ({
        from: () => ({
          innerJoin: () => Promise.resolve([]),
        }),
      }),
    };

    const result = await orchestrator.runFollowUp(
      dummyDb,
      mockScenario,
      'Initial tactical summary',
      [{ role: 'user', content: 'What is the primary trigger?' }],
      'Why did Diaz press the centre-back?'
    );

    expect(result.answer).toContain('Diaz angles his run');
    expect(result.relevant_players_mentioned).toContain('#7 Diaz');
    expect(result.clarified_tactics).toContain('Touchline Trap');
  });
});
