import { describe, expect, it } from 'vitest';
import { get18Zone } from '../src/engine/pitchZones.js';
import { ScenarioTool } from '../src/engine/scenarioTool.js';

describe('ScenarioTool & 18-Zone Mapping', () => {
  it('should accurately identify Zone 14 in the central attacking pocket (Band 5 Center)', () => {
    // Band 5: X in [70, 87.5), Channel Center: Y in [22.67, 45.33)
    const z14 = get18Zone(78.0, 34.0);
    expect(z14.zoneNumber).toBe(14);
    expect(z14.isZone14).toBe(true);
    expect(z14.isCentral).toBe(true);
    expect(z14.third).toBe('Attacking');
    expect(z14.name).toContain('Zone 14');
  });

  it('should accurately map defensive six-yard box to Zone 2', () => {
    const z2 = get18Zone(5.0, 34.0);
    expect(z2.zoneNumber).toBe(2);
    expect(z2.third).toBe('Defensive');
    expect(z2.isCentral).toBe(true);
  });

  it('should map wide attacking wing positions to Zone 13 and Zone 15', () => {
    const leftWing = get18Zone(75.0, 10.0);
    expect(leftWing.zoneNumber).toBe(13);
    expect(leftWing.channel).toBe('Left');

    const rightWing = get18Zone(75.0, 58.0);
    expect(rightWing.zoneNumber).toBe(15);
    expect(rightWing.channel).toBe('Right');
  });

  it('should extract team formations and player role lookups properly', () => {
    const scenario = {
      title: 'Counter Press Trap in Half-Space',
      match_phase: 'counter_press',
      tactical_situation: 'Midfield turnover trigger',
      ball_position: { x: 78.0, y: 34.0 },
      attacking_team: {
        name: 'Manchester City',
        formation: '4-3-3',
        players: [
          { id: 'att_1', name: 'Ederson', number: 31, role: 'GK', position: { x: 12.0, y: 34.0 } },
          { id: 'att_2', name: 'Rodri', number: 16, role: 'DM', position: { x: 75.0, y: 34.0 } },
        ],
      },
      defending_team: {
        name: 'Arsenal',
        formation: '4-4-2',
        players: [
          { id: 'def_1', name: 'Saliba', number: 2, role: 'CB', position: { x: 30.0, y: 30.0 } },
          { id: 'def_2', name: 'Rice', number: 41, role: 'CM', position: { x: 73.0, y: 35.0 } },
        ],
      },
    };

    const res = ScenarioTool.execute(scenario);
    expect(res.title).toBe(scenario.title);
    expect(res.attacking_team.name).toBe('Manchester City');
    expect(res.attacking_team.key_roles['DM']).toBe('#16 Rodri');
    expect(res.defending_team.key_roles['CB']).toBe('#2 Saliba');
    expect(res.ball_position.zoneInfo.isZone14).toBe(true);
    expect(res.summary).toContain('Zone 14');
  });
});
