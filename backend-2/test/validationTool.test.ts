import { describe, expect, it } from 'vitest';
import { ValidationTool } from '../src/engine/validationTool.js';

describe('ValidationTool (105x68m boundary & context sufficiency)', () => {
  it('should return Low confidence when scenario data is completely missing', () => {
    const res = ValidationTool.execute(null);
    expect(res.is_sufficient).toBe(false);
    expect(res.confidence_level).toBe('Low');
    expect(res.confidence_score).toBe(0.2);
    expect(res.missing_elements).toContain('scenario_data');
  });

  it('should flag ball out-of-bounds when outside 105x68m regulation pitch', () => {
    const scenario = {
      title: 'Out of Bounds Ball',
      match_phase: 'high_press',
      ball_position: { x: 110.0, y: 34.0 }, // x > 105
      attacking_team: { players: [] },
      defending_team: { players: [] },
    };

    const res = ValidationTool.execute(scenario);
    expect(res.out_of_bounds_count).toBeGreaterThan(0);
    expect(res.missing_elements).toContain('ball_out_of_bounds');
    expect(res.is_sufficient).toBe(false);
  });

  it('should flag sparse player squads when teams have under 5 players', () => {
    const scenario = {
      title: 'Sparse Setup',
      match_phase: 'mid_block',
      ball_position: { x: 50.0, y: 34.0 },
      attacking_team: {
        players: [{ id: 'att_1', name: 'A', number: 1, role: 'GK', position: { x: 10, y: 34 } }],
      },
      defending_team: {
        players: [{ id: 'def_1', name: 'D', number: 4, role: 'CB', position: { x: 30, y: 34 } }],
      },
    };

    const res = ValidationTool.execute(scenario);
    expect(res.missing_elements).toContain('attacking_players_sparse');
    expect(res.missing_elements).toContain('defending_players_sparse');
    expect(res.confidence_level).toBe('Low');
  });

  it('should assign High confidence (0.95) when 10+ attackers and defenders with valid coordinates are present', () => {
    const makePlayers = (prefix: string) =>
      Array.from({ length: 11 }, (_, i) => ({
        id: `${prefix}_${i + 1}`,
        name: `Player ${i + 1}`,
        number: i + 1,
        role: i === 0 ? 'GK' : 'CM',
        position: { x: 20 + i * 5, y: 10 + (i % 5) * 10 },
      }));

    const scenario = {
      title: 'Full 11v11 Regulation Match',
      match_phase: 'high_press',
      ball_position: { x: 52.5, y: 34.0 },
      attacking_team: { name: 'Team A', formation: '4-3-3', players: makePlayers('att') },
      defending_team: { name: 'Team B', formation: '4-2-3-1', players: makePlayers('def') },
    };

    const res = ValidationTool.execute(scenario);
    expect(res.is_sufficient).toBe(true);
    expect(res.confidence_level).toBe('High');
    expect(res.confidence_score).toBe(0.95);
    expect(res.missing_elements).toHaveLength(0);
    expect(res.out_of_bounds_count).toBe(0);
  });

  it('should assign Medium confidence (0.75) for 5-9 players per team with valid coordinates', () => {
    const makePlayers = (prefix: string, count: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: `${prefix}_${i + 1}`,
        name: `Player ${i + 1}`,
        number: i + 1,
        role: 'MF',
        position: { x: 30 + i * 5, y: 20 + i * 4 },
      }));

    const scenario = {
      title: 'Reduced 6v6 Small-Sided Scenario',
      match_phase: 'counter_press',
      ball_position: { x: 45.0, y: 34.0 },
      attacking_team: { players: makePlayers('att', 6) },
      defending_team: { players: makePlayers('def', 6) },
    };

    const res = ValidationTool.execute(scenario);
    expect(res.is_sufficient).toBe(true);
    expect(res.confidence_level).toBe('Medium');
    expect(res.confidence_score).toBe(0.75);
  });
});
