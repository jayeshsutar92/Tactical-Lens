import { describe, expect, it } from 'vitest';
import {
  euclideanDist,
  pointToSegmentDistance,
  TacticalEngine,
} from '../src/engine/tacticalEngine.js';

describe('TacticalEngine (Spatial & Defensive Geometry)', () => {
  it('should calculate Euclidean distance and point-to-segment perpendicular distance correctly', () => {
    const d = euclideanDist({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(d).toBeCloseTo(5.0, 5);

    // Point (5, 2) to segment (0, 0)-(10, 0): perpendicular distance is 2.0 at projection t = 0.5
    const { dist, t } = pointToSegmentDistance(5, 2, 0, 0, 10, 0);
    expect(dist).toBeCloseTo(2.0, 5);
    expect(t).toBeCloseTo(0.5, 5);
  });

  it('should identify ball carrier, primary presser, and calculate pressing vector', () => {
    const scenario = {
      ball_position: { x: 20.0, y: 55.0 }, // Near right touchline
      attacking_team: {
        players: [
          { name: 'Fullback', number: 2, role: 'RB', position: { x: 20.5, y: 54.5 } }, // Carrier (dist ~ 0.7m)
          { name: 'Winger', number: 7, role: 'RW', position: { x: 50.0, y: 58.0 } },
          { name: 'Pivot', number: 6, role: 'DM', position: { x: 30.0, y: 34.0 } },
        ],
      },
      defending_team: {
        players: [
          { name: 'Pressing Winger', number: 11, role: 'LW', position: { x: 23.0, y: 53.0 } }, // ~2.9m
          { name: 'Midfielder', number: 8, role: 'CM', position: { x: 28.0, y: 48.0 } }, // ~10m
          { name: 'Center Back', number: 4, role: 'CB', position: { x: 15.0, y: 30.0 } },
        ],
      },
    };

    const res = TacticalEngine.analyzeScenario(scenario);
    expect(res.ball_carrier.name).toBe('Fullback');
    expect(res.primary_presser?.name).toBe('Pressing Winger');
    expect(res.primary_presser?.distance_to_ball).toBeLessThan(3.5);
    expect(res.pressing_funnel).toBe('touchline_lock'); // y >= 50m
    expect(res.pressing_vector).not.toBeNull();
  });

  it('should detect cover-shadow obstruction on passing lanes when defender is in passing cone', () => {
    // Carrier at (20, 20), Target at (60, 20).
    // Defender at (40, 20.5) is directly on the passing lane (perp dist 0.5m, t = 0.5)
    const scenario = {
      ball_position: { x: 20.0, y: 20.0 },
      attacking_team: {
        players: [
          { name: 'Carrier', number: 8, role: 'CM', position: { x: 20.0, y: 20.0 } },
          { name: 'Forward', number: 9, role: 'CF', position: { x: 60.0, y: 20.0 } },
          { name: 'Unmarked Winger', number: 11, role: 'LW', position: { x: 40.0, y: 60.0 } },
        ],
      },
      defending_team: {
        players: [
          { name: 'Cover Shadow Defender', number: 6, role: 'DM', position: { x: 40.0, y: 20.5 } },
          { name: 'Distant CB', number: 4, role: 'CB', position: { x: 10.0, y: 10.0 } },
        ],
      },
    };

    const res = TacticalEngine.analyzeScenario(scenario);
    const forwardLane = res.passing_lanes.find((l) => l.target_player.includes('Forward'));
    expect(forwardLane).toBeDefined();
    expect(forwardLane?.status).toBe('blocked_by_cover_shadow');
    expect(forwardLane?.cover_shadow_defenders).toContain('Cover Shadow Defender');

    const openLane = res.passing_lanes.find((l) => l.target_player.includes('Unmarked Winger'));
    expect(openLane?.status).toBe('open');
  });

  it('should accurately calculate low-block ("haramball") vertical compactness and inter-line spacing', () => {
    // Deep defensive line at x = 18m, midfield line at x = 26m -> inter-line gap = 8m
    const scenario = {
      ball_position: { x: 30.0, y: 34.0 },
      attacking_team: {
        players: [
          { name: 'Attacker', number: 10, role: 'AM', position: { x: 30.0, y: 34.0 } },
          { name: 'Striker', number: 9, role: 'CF', position: { x: 24.0, y: 34.0 } },
        ],
      },
      defending_team: {
        players: [
          { name: 'CB1', number: 4, role: 'CB', position: { x: 18.0, y: 30.0 } },
          { name: 'CB2', number: 5, role: 'CB', position: { x: 18.0, y: 38.0 } },
          { name: 'LB', number: 3, role: 'LB', position: { x: 19.0, y: 15.0 } },
          { name: 'RB', number: 2, role: 'RB', position: { x: 19.0, y: 53.0 } },
          { name: 'DM1', number: 6, role: 'DM', position: { x: 26.0, y: 28.0 } },
          { name: 'DM2', number: 8, role: 'DM', position: { x: 26.0, y: 40.0 } },
        ],
      },
    };

    const res = TacticalEngine.analyzeScenario(scenario);
    expect(res.low_block_compactness.is_low_block).toBe(true);
    expect(res.low_block_compactness.inter_line_distance_meters).toBeLessThanOrEqual(12.0);
    expect(res.low_block_compactness.haramball_rating).toBe('Ultra-Compact Haramball Low Block');
  });

  it('should evaluate Zone 14 central density and determine when play is forced wide', () => {
    // 4 defenders concentrated in the central corridor between y = 25m and y = 43m
    const scenario = {
      ball_position: { x: 75.0, y: 34.0 },
      attacking_team: {
        players: [
          { name: 'Attacker', number: 10, role: 'AM', position: { x: 75.0, y: 34.0 } },
          { name: 'Winger', number: 7, role: 'RW', position: { x: 80.0, y: 60.0 } },
        ],
      },
      defending_team: {
        players: [
          { name: 'Def 1', number: 4, role: 'CB', position: { x: 74.0, y: 30.0 } },
          { name: 'Def 2', number: 5, role: 'CB', position: { x: 76.0, y: 38.0 } },
          { name: 'Def 3', number: 6, role: 'DM', position: { x: 72.0, y: 34.0 } },
          { name: 'Def 4', number: 3, role: 'LB', position: { x: 70.0, y: 15.0 } },
        ],
      },
    };

    const res = TacticalEngine.analyzeScenario(scenario);
    expect(res.zone14_density.central_screening_ratio).toBeGreaterThanOrEqual(0.7);
    expect(res.zone14_density.forces_play_wide).toBe(true);
    expect(res.zone14_density.is_zone14_screened).toBe(true);
  });

  it('should detect when a defender steps out of the block to press and analyze rest-defense cover', () => {
    // Def Line at x = 20m, but CB1 stepped forward to x = 26m (delta = 6m >= 4.5m)
    const scenario = {
      ball_position: { x: 28.0, y: 34.0 },
      attacking_team: {
        players: [
          { name: 'Playmaker', number: 10, role: 'AM', position: { x: 28.0, y: 34.0 } },
          { name: 'Winger', number: 11, role: 'LW', position: { x: 40.0, y: 10.0 } },
        ],
      },
      defending_team: {
        players: [
          { name: 'Stepping CB', number: 4, role: 'CB', position: { x: 26.0, y: 34.0 } }, // stepped out
          { name: 'Covering CB', number: 5, role: 'CB', position: { x: 20.0, y: 30.0 } },
          { name: 'Covering LB', number: 3, role: 'LB', position: { x: 20.0, y: 24.0 } },
          { name: 'Covering RB', number: 2, role: 'RB', position: { x: 20.0, y: 36.0 } },
        ],
      },
    };

    const res = TacticalEngine.analyzeScenario(scenario);
    expect(res.pressing_trigger_analysis.has_stepped_out).toBe(true);
    expect(res.pressing_trigger_analysis.step_out_player).toContain('Stepping CB');
    expect(res.pressing_trigger_analysis.step_out_distance_meters).toBeGreaterThanOrEqual(4.5);
    expect(res.pressing_trigger_analysis.rest_defense_covered).toBe(true);
    expect(res.pressing_trigger_analysis.trigger_type).toBe('Defender Step-Out with Compact Cover');
  });
});
