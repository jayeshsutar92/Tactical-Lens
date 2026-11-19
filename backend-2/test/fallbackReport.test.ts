import { describe, expect, it } from 'vitest';
import {
  FallbackReportEngine,
  ScenarioTool,
  TacticalEngine,
  ValidationTool,
} from '../src/engine/index.js';
import { fullTacticalAnalysisReportSchema } from '../src/schemas/analysis.js';

describe('FallbackReportEngine (Deterministic 10-Section Report)', () => {
  const sampleScenario = {
    title: '4-3-3 High Press Trap vs Goal Kick Build-Up',
    description: 'Goal kick short build-up pressing trap along the touchline',
    match_phase: 'high_press',
    tactical_situation: 'Goal kick short build-up pressing trap along the touchline',
    ball_position: { x: 17.5, y: 47.0, z: 0.0, zone: 'Defensive Third - Right Half-space' },
    attacking_team: {
      name: 'Brighton & Hove Albion (Build-up)',
      formation: '4-3-3',
      players: [
        { id: 'att_1', name: 'Verbruggen', role: 'GK', number: 1, position: { x: 8.0, y: 34.0 } },
        { id: 'att_2', name: 'Van Hecke', role: 'CB', number: 29, position: { x: 18.0, y: 46.0 } },
        { id: 'att_3', name: 'Dunk', role: 'CB', number: 5, position: { x: 18.0, y: 22.0 } },
        { id: 'att_4', name: 'Veltman', role: 'RB', number: 34, position: { x: 26.0, y: 58.0 } },
        { id: 'att_5', name: 'Estupinan', role: 'LB', number: 30, position: { x: 26.0, y: 10.0 } },
        { id: 'att_6', name: 'Baleba', role: 'DM', number: 20, position: { x: 30.0, y: 34.0 } },
        { id: 'att_7', name: 'Ayari', role: 'CM', number: 26, position: { x: 42.0, y: 44.0 } },
        { id: 'att_8', name: 'Hinshelwood', role: 'CM', number: 41, position: { x: 42.0, y: 24.0 } },
        { id: 'att_9', name: 'Rutter', role: 'AM', number: 14, position: { x: 55.0, y: 34.0 } },
        { id: 'att_10', name: 'Mitoma', role: 'LW', number: 22, position: { x: 62.0, y: 12.0 } },
        { id: 'att_11', name: 'Welbeck', role: 'CF', number: 18, position: { x: 65.0, y: 34.0 } },
      ],
    },
    defending_team: {
      name: 'Liverpool (High Press)',
      formation: '4-3-3',
      players: [
        { id: 'def_1', name: 'Alisson', role: 'GK', number: 1, position: { x: 96.0, y: 34.0 } },
        { id: 'def_2', name: 'Alexander-Arnold', role: 'RB', number: 66, position: { x: 58.0, y: 56.0 } },
        { id: 'def_3', name: 'Konate', role: 'CB', number: 5, position: { x: 68.0, y: 42.0 } },
        { id: 'def_4', name: 'Van Dijk', role: 'CB', number: 4, position: { x: 68.0, y: 26.0 } },
        { id: 'def_5', name: 'Robertson', role: 'LB', number: 26, position: { x: 58.0, y: 12.0 } },
        { id: 'def_6', name: 'Gravenberch', role: 'DM', number: 38, position: { x: 48.0, y: 34.0 } },
        { id: 'def_7', name: 'Mac Allister', role: 'CM', number: 10, position: { x: 38.0, y: 24.0 } },
        { id: 'def_8', name: 'Szoboszlai', role: 'CM', number: 8, position: { x: 36.0, y: 44.0 } },
        { id: 'def_9', name: 'Salah', role: 'RW', number: 11, position: { x: 26.0, y: 52.0 } },
        { id: 'def_10', name: 'Diaz', role: 'LW', number: 7, position: { x: 28.0, y: 16.0 } },
        { id: 'def_11', name: 'Nunez', role: 'CF', number: 9, position: { x: 20.0, y: 38.0 } },
      ],
    },
    match_context: {
      score: '0-0',
      minute: 28,
      competition: 'Premier League',
      pitch_dimensions: { width: 68.0, length: 105.0 },
    },
  };

  it('should generate a complete, valid 10-section report conforming strictly to Zod schema', () => {
    const valResult = ValidationTool.execute(sampleScenario);
    const scenResult = ScenarioTool.execute(sampleScenario);
    const spatResult = TacticalEngine.analyzeScenario(sampleScenario);

    const report = FallbackReportEngine.generateReport({
      scenarioData: sampleScenario,
      scenarioInfo: scenResult,
      spatialInfo: spatResult,
      validationData: valResult,
    });

    // 1. Validate complete object with Zod schema
    const parsed = fullTacticalAnalysisReportSchema.parse(report);
    expect(parsed).toBeDefined();

    // 2. Validate all 10 individual sections
    expect(report.situation_overview).toBeDefined();
    expect(report.situation_overview.summary).toContain('Liverpool (High Press)');

    expect(report.pressing_strategy).toBeDefined();
    expect(report.pressing_strategy.intensity).toBe('High Press');

    expect(report.pressing_triggers).toBeDefined();
    expect(report.pressing_triggers.visual_triggers.length).toBeGreaterThan(0);

    expect(report.passing_lane_coverage).toBeDefined();
    expect(Array.isArray(report.passing_lane_coverage.cover_shadows_active)).toBe(true);

    expect(report.tactical_advantages).toBeDefined();
    expect(report.tactical_advantages.key_advantages.length).toBeGreaterThan(0);

    expect(report.exposed_spaces).toBeDefined();
    expect(report.exposed_spaces.exposed_zones.length).toBeGreaterThan(0);

    expect(report.opposition_responses).toBeDefined();
    expect(report.opposition_responses.recommended_counters.length).toBeGreaterThan(0);

    expect(report.fan_watch_points).toBeDefined();
    expect(report.fan_watch_points.tactical_takeaway).toBeDefined();

    expect(report.confidence_and_limitations).toBeDefined();
    expect(report.confidence_and_limitations.confidence_level).toBe('High');
    expect(report.confidence_and_limitations.confidence_score).toBe(0.95);

    expect(report.supporting_sources).toBeDefined();
    expect(report.supporting_sources.length).toBeGreaterThanOrEqual(3);
  });
});
