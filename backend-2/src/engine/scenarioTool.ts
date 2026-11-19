import { get18Zone, type PitchZoneInfo } from './pitchZones.js';

export interface PlayerInfo {
  id?: string;
  name: string;
  number: number;
  role: string;
  position: { x: number; y: number; z?: number };
}

export interface TeamInspection {
  name: string;
  formation: string;
  player_count: number;
  players: PlayerInfo[];
  key_roles: Record<string, string>;
}

export interface BallInspection {
  x: number;
  y: number;
  z?: number;
  zone: string;
  zoneInfo: PitchZoneInfo;
}

export interface ScenarioInspectionResult {
  title: string;
  match_phase: string;
  tactical_situation: string;
  attacking_team: TeamInspection;
  defending_team: TeamInspection;
  ball_position: BallInspection;
  match_context: Record<string, unknown>;
  summary: string;
}

export class ScenarioTool {
  public static readonly name = 'scenario_inspection';
  public static readonly description =
    'Inspects and structures player positions, formations, tactical roles, and 18-zone ball mapping from a scenario.';

  /**
   * Structures scenario data and extracts key tactical formations and 18-zone positioning.
   */
  public static execute(scenarioData: Record<string, unknown>): ScenarioInspectionResult {
    const title = (scenarioData.title as string) || 'Untitled Tactical Scenario';
    const phase = (scenarioData.match_phase as string) || 'unknown_phase';
    const situation = (scenarioData.tactical_situation as string) || 'Unspecified tactical situation';

    const attTeamRaw = (scenarioData.attacking_team as Record<string, unknown>) || {};
    const defTeamRaw = (scenarioData.defending_team as Record<string, unknown>) || {};
    const ballRaw = (scenarioData.ball_position as Record<string, unknown>) || {};
    const matchCtx = (scenarioData.match_context as Record<string, unknown>) || {};

    const attPlayers = (Array.isArray(attTeamRaw.players) ? attTeamRaw.players : []) as PlayerInfo[];
    const defPlayers = (Array.isArray(defTeamRaw.players) ? defTeamRaw.players : []) as PlayerInfo[];

    const extractRoles = (players: PlayerInfo[]): Record<string, string> => {
      const roles: Record<string, string> = {};
      for (const p of players) {
        if (p.role) {
          roles[p.role] = `#${p.number ?? ''} ${p.name ?? ''}`.trim();
        }
      }
      return roles;
    };

    const bx = Number(ballRaw.x ?? 52.5);
    const by = Number(ballRaw.y ?? 34.0);
    const zoneInfo = get18Zone(bx, by);

    const attackingTeam: TeamInspection = {
      name: (attTeamRaw.name as string) || 'Attacking Team',
      formation: (attTeamRaw.formation as string) || 'Unknown',
      player_count: attPlayers.length,
      players: attPlayers,
      key_roles: extractRoles(attPlayers),
    };

    const defendingTeam: TeamInspection = {
      name: (defTeamRaw.name as string) || 'Defending Team',
      formation: (defTeamRaw.formation as string) || 'Unknown',
      player_count: defPlayers.length,
      players: defPlayers,
      key_roles: extractRoles(defPlayers),
    };

    const ballPosition: BallInspection = {
      x: bx,
      y: by,
      z: Number(ballRaw.z ?? 0.0),
      zone: (ballRaw.zone as string) || zoneInfo.name,
      zoneInfo,
    };

    const summary =
      `Scenario '${title}' (${phase}): ${attackingTeam.name} (${attackingTeam.formation}) vs ` +
      `${defendingTeam.name} (${defendingTeam.formation}). ` +
      `Ball at (${bx.toFixed(1)}, ${by.toFixed(1)}) in ${zoneInfo.name}.`;

    return {
      title,
      match_phase: phase,
      tactical_situation: situation,
      attacking_team: attackingTeam,
      defending_team: defendingTeam,
      ball_position: ballPosition,
      match_context: matchCtx,
      summary,
    };
  }
}
