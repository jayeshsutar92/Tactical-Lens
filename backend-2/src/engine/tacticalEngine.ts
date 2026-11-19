import { get18Zone } from './pitchZones.js';

export interface Point2D {
  x: number;
  y: number;
}

export function euclideanDist(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Calculates perpendicular distance from point (px, py) to line segment (x1, y1)-(x2, y2)
 * and projection scalar t clamped in [0, 1].
 */
export function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { dist: number; t: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const segLenSq = dx * dx + dy * dy;

  if (segLenSq < 1e-6) {
    return { dist: Math.hypot(px - x1, py - y1), t: 0.0 };
  }

  const t = ((px - x1) * dx + (py - y1) * dy) / segLenSq;
  const tClamped = Math.max(0.0, Math.min(1.0, t));
  const projX = x1 + tClamped * dx;
  const projY = y1 + tClamped * dy;

  return { dist: Math.hypot(px - projX, py - projY), t: tClamped };
}

// ---------------------------------------------------------------------------
// Engine Data Types
// ---------------------------------------------------------------------------

export interface BallCarrierMetric {
  name: string;
  number: number;
  role: string;
  coordinates: Point2D;
  distance_to_ball: number;
}

export interface PresserMetric {
  id?: string;
  name: string;
  number: number;
  role: string;
  position: Point2D;
  distance_to_ball: number;
}

export interface PassingLaneMetric {
  target_player: string;
  target_zone: string;
  lane_distance_meters: number;
  status: 'blocked_by_cover_shadow' | 'contested' | 'open';
  cover_shadow_defenders: string[];
  nearest_defender_distance: number;
}

export interface CompactnessMetric {
  vertical_block_length_meters: number;
  horizontal_block_width_meters: number;
  is_compact: boolean;
}

export interface LowBlockCompactnessMetric {
  defensive_line_avg_x: number;
  midfield_line_avg_x: number;
  inter_line_distance_meters: number;
  is_low_block: boolean;
  block_classification: string;
  haramball_rating: 'Ultra-Compact Haramball Low Block' | 'Organized Low Block' | 'Disciplined Mid Block' | 'Extended/Stretched Block';
}

export interface Zone14DensityMetric {
  zone14_defenders_count: number;
  defensive_pocket_defenders_count: number;
  central_screening_ratio: number;
  is_zone14_screened: boolean;
  forces_play_wide: boolean;
  description: string;
}

export interface PressingTriggerMetric {
  has_stepped_out: boolean;
  step_out_player?: string;
  step_out_distance_meters?: number;
  rest_defense_covered: boolean;
  trigger_type: string;
  tactical_observation: string;
}

export interface TacticalEngineResult {
  ball_carrier: BallCarrierMetric;
  primary_presser: PresserMetric | null;
  supporting_pressers: PresserMetric[];
  pressing_funnel: 'touchline_lock' | 'flank_funneling' | 'central_compression' | 'neutral';
  pressing_vector: { dx: number; dy: number } | null;
  passing_lanes: PassingLaneMetric[];
  passing_lane_summary: {
    total_outlets: number;
    blocked_by_cover_shadow: number;
    contested: number;
    open: number;
  };
  compactness: CompactnessMetric;
  low_block_compactness: LowBlockCompactnessMetric;
  zone14_density: Zone14DensityMetric;
  pressing_trigger_analysis: PressingTriggerMetric;
  open_options: string[];
  summary: string;
}

export class TacticalEngine {
  /**
   * Runs the complete deterministic spatial and defensive mechanics pipeline.
   */
  public static analyzeScenario(scenarioData: Record<string, unknown>): TacticalEngineResult {
    const ball = (scenarioData.ball_position as Record<string, unknown>) || {};
    const bx = Number(ball.x ?? 52.5);
    const by = Number(ball.y ?? 34.0);
    const ballPos: Point2D = { x: bx, y: by };

    const attTeam = (scenarioData.attacking_team as Record<string, unknown>) || {};
    const defTeam = (scenarioData.defending_team as Record<string, unknown>) || {};
    const attPlayers = (Array.isArray(attTeam.players) ? attTeam.players : []) as Array<{
      id?: string;
      name?: string;
      number?: number;
      role?: string;
      position?: { x?: number; y?: number };
    }>;
    const defPlayers = (Array.isArray(defTeam.players) ? defTeam.players : []) as Array<{
      id?: string;
      name?: string;
      number?: number;
      role?: string;
      position?: { x?: number; y?: number };
    }>;

    if (attPlayers.length === 0 || defPlayers.length === 0) {
      throw new Error('Insufficient players to execute deterministic tactical engine analysis.');
    }

    // 1. Identify Ball Carrier (Attacking player closest to the ball)
    const attDistances = attPlayers.map((p) => {
      const pos: Point2D = { x: Number(p.position?.x ?? 0.0), y: Number(p.position?.y ?? 0.0) };
      return { dist: euclideanDist(pos, ballPos), player: p, pos };
    });
    attDistances.sort((a, b) => a.dist - b.dist);

    const nearestAtt = attDistances[0];
    const bcPos = nearestAtt.pos;
    const ballCarrier: BallCarrierMetric = {
      name: nearestAtt.player.name ?? 'Unknown Carrier',
      number: nearestAtt.player.number ?? 0,
      role: nearestAtt.player.role ?? 'ATT',
      coordinates: bcPos,
      distance_to_ball: Math.round(nearestAtt.dist * 100) / 100,
    };

    // 2. Identify Defending Pressers
    const defDistances = defPlayers.map((d) => {
      const pos: Point2D = { x: Number(d.position?.x ?? 0.0), y: Number(d.position?.y ?? 0.0) };
      const dist = euclideanDist(pos, bcPos);
      return {
        id: d.id,
        name: d.name ?? 'Defender',
        number: d.number ?? 0,
        role: d.role ?? 'DEF',
        position: pos,
        distance_to_ball: Math.round(dist * 10) / 10,
      };
    });
    defDistances.sort((a, b) => a.distance_to_ball - b.distance_to_ball);

    const primaryPresser: PresserMetric | null = defDistances[0] ?? null;
    const supportingPressers: PresserMetric[] = defDistances
      .slice(1, 4)
      .filter((d) => d.distance_to_ball <= 15.0);

    // 3. Pressing Direction and Vector
    let pressingVector: { dx: number; dy: number } | null = null;
    let pressingFunnel: 'touchline_lock' | 'flank_funneling' | 'central_compression' | 'neutral' = 'neutral';

    if (primaryPresser) {
      const vx = bcPos.x - primaryPresser.position.x;
      const vy = bcPos.y - primaryPresser.position.y;
      pressingVector = { dx: Math.round(vx * 100) / 100, dy: Math.round(vy * 100) / 100 };

      if (bcPos.y >= 50.0 || bcPos.y <= 18.0) {
        pressingFunnel = 'touchline_lock';
      } else if (Math.abs(vy) > Math.abs(vx)) {
        pressingFunnel = 'flank_funneling';
      } else {
        pressingFunnel = 'central_compression';
      }
    }

    // 4. Passing Lane Analysis & Cover Shadows
    const passingLanes: PassingLaneMetric[] = [];
    for (let i = 1; i < attDistances.length; i++) {
      const teammate = attDistances[i].player;
      if (teammate.role === 'GK') continue; // Exclude keeper from standard outfield outlet evaluation

      const tx = Number(teammate.position?.x ?? 0.0);
      const ty = Number(teammate.position?.y ?? 0.0);
      const targetPos: Point2D = { x: tx, y: ty };
      const laneDist = euclideanDist(bcPos, targetPos);

      // Check which defenders cast cover shadows onto this lane
      const shadowingDefenders: string[] = [];
      for (const d of defPlayers) {
        const dx = Number(d.position?.x ?? 0.0);
        const dy = Number(d.position?.y ?? 0.0);
        const { dist: perpDist, t } = pointToSegmentDistance(dx, dy, bcPos.x, bcPos.y, tx, ty);

        // Defender between carrier and receiver casting cover shadow
        if (t >= 0.1 && t <= 0.9 && perpDist <= 3.0) {
          shadowingDefenders.push(d.name ?? 'Defender');
        }
      }

      // Proximity of receiver to nearest defender
      const distToNearestDef = Math.min(...defDistances.map((d) => euclideanDist(targetPos, d.position)));

      let status: 'blocked_by_cover_shadow' | 'contested' | 'open';
      if (shadowingDefenders.length > 0) {
        status = 'blocked_by_cover_shadow';
      } else if (distToNearestDef <= 3.5) {
        status = 'contested';
      } else {
        status = 'open';
      }

      const zoneInfo = get18Zone(tx, ty);
      passingLanes.push({
        target_player: `#${teammate.number ?? ''} ${teammate.name ?? 'Player'} (${teammate.role ?? ''})`,
        target_zone: zoneInfo.name,
        lane_distance_meters: Math.round(laneDist * 10) / 10,
        status,
        cover_shadow_defenders: shadowingDefenders,
        nearest_defender_distance: Math.round(distToNearestDef * 10) / 10,
      });
    }

    // 5. Team Compactness Metrics
    const outfieldDef = defPlayers.filter((d) => d.role !== 'GK');
    let blockLength = 0.0;
    let blockWidth = 0.0;

    if (outfieldDef.length > 0) {
      const xs = outfieldDef.map((d) => Number(d.position?.x ?? 0.0));
      const ys = outfieldDef.map((d) => Number(d.position?.y ?? 0.0));
      blockLength = Math.round((Math.max(...xs) - Math.min(...xs)) * 10) / 10;
      blockWidth = Math.round((Math.max(...ys) - Math.min(...ys)) * 10) / 10;
    }

    // 6. TacticalLens Addition: Low-Block ("Haramball") Vertical Compactness
    const defensiveLineRoles = new Set(['CB', 'LB', 'RB', 'LWB', 'RWB', 'DF', 'SW']);
    const midfieldRoles = new Set(['DM', 'CM', 'AM', 'LM', 'RM', 'MF', 'LW', 'RW']);

    let defLinePlayers = outfieldDef.filter((d) => d.role && defensiveLineRoles.has(d.role.toUpperCase()));
    let midLinePlayers = outfieldDef.filter((d) => d.role && midfieldRoles.has(d.role.toUpperCase()));

    // Fallback only if no roles match defensive or midfield sets
    if (defLinePlayers.length === 0 && midLinePlayers.length === 0) {
      const sortedByX = [...outfieldDef].sort(
        (a, b) => Number(a.position?.x ?? 0.0) - Number(b.position?.x ?? 0.0)
      );
      const half = Math.max(1, Math.floor(sortedByX.length / 2));
      defLinePlayers = sortedByX.slice(0, half);
      midLinePlayers = sortedByX.slice(half);
    } else if (defLinePlayers.length === 0) {
      defLinePlayers = midLinePlayers;
    } else if (midLinePlayers.length === 0) {
      midLinePlayers = defLinePlayers;
    }

    const defLineXs = defLinePlayers.map((d) => Number(d.position?.x ?? 0.0));
    const midLineXs = midLinePlayers.map((d) => Number(d.position?.x ?? 0.0));

    const defLineAvgX = Math.round((defLineXs.reduce((a, b) => a + b, 0) / defLineXs.length) * 10) / 10;
    const midLineAvgX = Math.round((midLineXs.reduce((a, b) => a + b, 0) / midLineXs.length) * 10) / 10;
    const interLineDistance = Math.round(Math.abs(midLineAvgX - defLineAvgX) * 10) / 10;

    const isLowBlock = defLineAvgX <= 32.0;

    let haramballRating: LowBlockCompactnessMetric['haramball_rating'];
    let blockClassification: string;

    if (defLineAvgX <= 30.0 && interLineDistance <= 12.0) {
      haramballRating = 'Ultra-Compact Haramball Low Block';
      blockClassification = `Ultra-dense defensive bunker with only ${interLineDistance}m inter-line spacing.`;
    } else if (defLineAvgX <= 35.0 && interLineDistance <= 16.0) {
      haramballRating = 'Organized Low Block';
      blockClassification = `Compact deep defensive shell anchored at x=${defLineAvgX}m.`;
    } else if (defLineAvgX <= 50.0 && interLineDistance <= 18.0) {
      haramballRating = 'Disciplined Mid Block';
      blockClassification = `Midfield block controlling central zones with ${interLineDistance}m line separation.`;
    } else {
      haramballRating = 'Extended/Stretched Block';
      blockClassification = `Stretched defensive shape vulnerable to vertical line-breaking passes.`;
    }

    const lowBlockCompactness: LowBlockCompactnessMetric = {
      defensive_line_avg_x: defLineAvgX,
      midfield_line_avg_x: midLineAvgX,
      inter_line_distance_meters: interLineDistance,
      is_low_block: isLowBlock,
      block_classification: blockClassification,
      haramball_rating: haramballRating,
    };

    // 7. TacticalLens Addition: Zone 14 Central Density
    // Zone 14: Attacking third central pocket: X in [70.0, 87.5], Y in [22.67, 45.33]
    // Defensive pocket (Zone 5): X in [17.5, 35.0], Y in [22.67, 45.33]
    const inCentralChannel = (y: number) => y >= 22.67 && y <= 45.33;

    const defendersInZone14 = outfieldDef.filter((d) => {
      const x = Number(d.position?.x ?? 0.0);
      const y = Number(d.position?.y ?? 0.0);
      return x >= 70.0 && x <= 87.5 && inCentralChannel(y);
    }).length;

    const defendersInDefPocket = outfieldDef.filter((d) => {
      const x = Number(d.position?.x ?? 0.0);
      const y = Number(d.position?.y ?? 0.0);
      return x >= 17.5 && x <= 35.0 && inCentralChannel(y);
    }).length;

    const totalCentralDefenders = outfieldDef.filter((d) => inCentralChannel(Number(d.position?.y ?? 0.0))).length;
    const centralScreeningRatio =
      outfieldDef.length > 0 ? Math.round((totalCentralDefenders / outfieldDef.length) * 100) / 100 : 0.0;

    const isZone14Screened = defendersInZone14 >= 1 || (isLowBlock && defendersInDefPocket >= 2);
    const forcesPlayWide = centralScreeningRatio >= 0.5;

    const zone14Density: Zone14DensityMetric = {
      zone14_defenders_count: defendersInZone14,
      defensive_pocket_defenders_count: defendersInDefPocket,
      central_screening_ratio: centralScreeningRatio,
      is_zone14_screened: isZone14Screened,
      forces_play_wide: forcesPlayWide,
      description: forcesPlayWide
        ? `Heavy central screen (${Math.round(centralScreeningRatio * 100)}% of defenders) actively forces play toward wide touchlines.`
        : `Moderate central density; central pockets remain open for progressive line-breaking passes.`,
    };

    // 8. TacticalLens Addition: Pressing Trigger & Step-Out Analysis
    let stepOutPlayer: string | undefined;
    let stepOutDist = 0.0;
    let hasSteppedOut = false;
    let restDefenseCovered = true;
    let triggerType = 'Stationary Zonal Hold';
    let triggerObs = 'Defensive unit holds horizontal shape without individual forward step-outs.';

    // Baseline defensive line position (median X represents the held line before stepping out)
    const sortedDefXs = [...defLineXs].sort((a, b) => a - b);
    const baselineDefX = sortedDefXs[Math.floor(sortedDefXs.length / 2)] ?? defLineAvgX;

    // Check if any defender in the defensive unit stepped forward significantly relative to line
    for (const d of defLinePlayers) {
      const dx = Number(d.position?.x ?? 0.0);
      const forwardDelta = dx - baselineDefX;
      if (forwardDelta >= 4.5) {
        hasSteppedOut = true;
        stepOutPlayer = `#${d.number ?? ''} ${d.name ?? 'Defender'} (${d.role ?? 'CB'})`;
        stepOutDist = Math.round(forwardDelta * 10) / 10;
        break;
      }
    }

    if (hasSteppedOut && stepOutPlayer) {
      // Check remaining defenders in defensive line for compact cover slide
      const remainingDefLine = defLinePlayers.filter((d) => d.name !== stepOutPlayer?.split(' ')[1]);
      if (remainingDefLine.length >= 2) {
        const remYs = remainingDefLine.map((d) => Number(d.position?.y ?? 0.0)).sort((a, b) => a - b);
        let maxGap = 0;
        for (let i = 0; i < remYs.length - 1; i++) {
          maxGap = Math.max(maxGap, remYs[i + 1] - remYs[i]);
        }
        restDefenseCovered = maxGap <= 8.5;
      }

      if (restDefenseCovered) {
        triggerType = 'Defender Step-Out with Compact Cover';
        triggerObs = `${stepOutPlayer} stepped out ${stepOutDist}m to apply pressure while adjacent defenders pinched inward to protect rest defense.`;
      } else {
        triggerType = 'Isolated Step-Out (Rest-Defense Gap Exposed)';
        triggerObs = `${stepOutPlayer} stepped out ${stepOutDist}m to engage, leaving an uncompact gap between remaining center-backs.`;
      }
    } else if (primaryPresser && primaryPresser.distance_to_ball <= 4.0) {
      triggerType = 'Immediate Touchline Trap';
      triggerObs = `Primary presser #${primaryPresser.number} ${primaryPresser.name} closed under 4.0m, triggering active flank squeeze.`;
    }

    const pressingTriggerAnalysis: PressingTriggerMetric = {
      has_stepped_out: hasSteppedOut,
      step_out_player: stepOutPlayer,
      step_out_distance_meters: stepOutDist > 0 ? stepOutDist : undefined,
      rest_defense_covered: restDefenseCovered,
      trigger_type: triggerType,
      tactical_observation: triggerObs,
    };

    // Summary of Outlets
    const openOptions = passingLanes.filter((l) => l.status === 'open');
    const blockedCount = passingLanes.filter((l) => l.status === 'blocked_by_cover_shadow').length;
    const contestedCount = passingLanes.filter((l) => l.status === 'contested').length;

    const summary =
      `Ball carrier: #${ballCarrier.number} ${ballCarrier.name}. ` +
      `Primary presser: #${primaryPresser?.number ?? ''} ${primaryPresser?.name ?? ''} (${primaryPresser?.distance_to_ball ?? 0}m). ` +
      `Funneling: ${pressingFunnel}. ` +
      `Block: ${haramballRating} (${interLineDistance}m inter-line gap, ${blockLength}m length x ${blockWidth}m width). ` +
      `Outlets: ${blockedCount} blocked by cover shadow, ${openOptions.length} open.`;

    return {
      ball_carrier: ballCarrier,
      primary_presser: primaryPresser,
      supporting_pressers: supportingPressers,
      pressing_funnel: pressingFunnel,
      pressing_vector: pressingVector,
      passing_lanes: passingLanes,
      passing_lane_summary: {
        total_outlets: passingLanes.length,
        blocked_by_cover_shadow: blockedCount,
        contested: contestedCount,
        open: openOptions.length,
      },
      compactness: {
        vertical_block_length_meters: blockLength,
        horizontal_block_width_meters: blockWidth,
        is_compact: blockLength <= 35.0,
      },
      low_block_compactness: lowBlockCompactness,
      zone14_density: zone14Density,
      pressing_trigger_analysis: pressingTriggerAnalysis,
      open_options: openOptions.map((o) => o.target_player),
      summary,
    };
  }
}
