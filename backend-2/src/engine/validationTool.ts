import { isWithinPitch, PITCH_LENGTH, PITCH_WIDTH } from './pitchZones.js';

export interface ValidationToolResult {
  is_sufficient: boolean;
  confidence_level: 'High' | 'Medium' | 'Low';
  confidence_score: number;
  missing_elements: string[];
  limitations: string[];
  attacker_count: number;
  defender_count: number;
  out_of_bounds_count: number;
  summary: string;
}

export class ValidationTool {
  public static readonly name = 'context_validation';
  public static readonly description =
    'Validates scenario completeness, pitch coordinates (105x68m), player counts, and identifies data limitations before analysis.';

  /**
   * Validates scenario context and pitch boundaries.
   */
  public static execute(scenarioData?: Record<string, unknown> | null): ValidationToolResult {
    if (!scenarioData || typeof scenarioData !== 'object') {
      return {
        is_sufficient: false,
        confidence_level: 'Low',
        confidence_score: 0.2,
        missing_elements: ['scenario_data'],
        limitations: ['Scenario object is completely absent.'],
        attacker_count: 0,
        defender_count: 0,
        out_of_bounds_count: 0,
        summary: 'Validation failed: Scenario data is missing.',
      };
    }

    const missingElements: string[] = [];
    const limitations: string[] = [];
    let outOfBoundsCount = 0;

    // 1. Ball Position Validation
    const ball = scenarioData.ball_position as { x?: number; y?: number } | undefined;
    if (!ball || ball.x === undefined || ball.y === undefined || isNaN(ball.x) || isNaN(ball.y)) {
      missingElements.push('ball_position');
      limitations.push('Exact ball position coordinates are missing; proximity calculations are estimated.');
    } else if (!isWithinPitch(ball.x, ball.y)) {
      outOfBoundsCount++;
      missingElements.push('ball_out_of_bounds');
      limitations.push(
        `Ball position (${ball.x}, ${ball.y}) is out of regulation pitch bounds (0-${PITCH_LENGTH}m x 0-${PITCH_WIDTH}m).`
      );
    }

    // 2. Player Validation
    const attTeam = (scenarioData.attacking_team as Record<string, unknown>) || {};
    const defTeam = (scenarioData.defending_team as Record<string, unknown>) || {};
    const attPlayers = Array.isArray(attTeam.players) ? (attTeam.players as Array<Record<string, unknown>>) : [];
    const defPlayers = Array.isArray(defTeam.players) ? (defTeam.players as Array<Record<string, unknown>>) : [];

    if (attPlayers.length < 5) {
      missingElements.push('attacking_players_sparse');
      limitations.push(
        `Attacking team has only ${attPlayers.length} players; full passing network cannot be verified.`
      );
    }
    if (defPlayers.length < 5) {
      missingElements.push('defending_players_sparse');
      limitations.push(
        `Defending team has only ${defPlayers.length} players; full defensive block cannot be verified.`
      );
    }

    // Check player coordinate validity and boundaries
    let missingCoordsCount = 0;
    const allPlayers = [...attPlayers, ...defPlayers];

    for (const p of allPlayers) {
      const pos = (p.position as { x?: number; y?: number }) || {};
      const px = pos.x;
      const py = pos.y;

      if (px === undefined || py === undefined || isNaN(px) || isNaN(py)) {
        missingCoordsCount++;
      } else if (!isWithinPitch(px, py)) {
        outOfBoundsCount++;
      }
    }

    if (missingCoordsCount > 0) {
      missingElements.push('player_coordinates_missing');
      limitations.push(`${missingCoordsCount} players are missing exact pitch coordinates.`);
    }

    if (outOfBoundsCount > 0 && !missingElements.includes('ball_out_of_bounds')) {
      limitations.push(
        `${outOfBoundsCount} entities (players/ball) are positioned outside pitch boundaries (0-${PITCH_LENGTH}m x 0-${PITCH_WIDTH}m).`
      );
    }

    // 3. Match Phase & Context
    const phase = scenarioData.match_phase as string | undefined;
    if (!phase || phase === 'unknown') {
      limitations.push('Match phase is unspecified; tactical context must be inferred from geometry.');
    }

    // 4. Score Confidence
    let isSufficient: boolean;
    let confidenceLevel: 'High' | 'Medium' | 'Low';
    let confidenceScore: number;

    if (
      missingElements.length === 0 &&
      outOfBoundsCount === 0 &&
      attPlayers.length >= 10 &&
      defPlayers.length >= 10
    ) {
      confidenceLevel = 'High';
      confidenceScore = 0.95;
      isSufficient = true;
    } else if (
      attPlayers.length >= 5 &&
      defPlayers.length >= 5 &&
      ball &&
      missingCoordsCount === 0 &&
      outOfBoundsCount === 0
    ) {
      confidenceLevel = 'Medium';
      confidenceScore = 0.75;
      isSufficient = true;
      if (limitations.length === 0) {
        limitations.push('Reduced squad sample observed; analysis limited to active ball-near zone.');
      }
    } else {
      confidenceLevel = 'Low';
      confidenceScore = 0.4;
      isSufficient = false;
      limitations.push('Significant data deficiencies detected. Explicit uncertainty communication required.');
    }

    const summary =
      `Context sufficiency: ${isSufficient ? 'Sufficient' : 'Insufficient'} ` +
      `(${confidenceLevel} confidence, score=${confidenceScore.toFixed(2)}). ` +
      `Observed: ${attPlayers.length} attackers, ${defPlayers.length} defenders. ` +
      `Limitations flagged: ${limitations.length}.`;

    return {
      is_sufficient: isSufficient,
      confidence_level: confidenceLevel,
      confidence_score: confidenceScore,
      missing_elements: missingElements,
      limitations,
      attacker_count: attPlayers.length,
      defender_count: defPlayers.length,
      out_of_bounds_count: outOfBoundsCount,
      summary,
    };
  }
}
