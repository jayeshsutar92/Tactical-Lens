/**
 * Pitch spatial geometry and 18-zone tactical classification system.
 * Standard regulation pitch dimensions: 105.0m length (X-axis) x 68.0m width (Y-axis).
 */

export const PITCH_LENGTH = 105.0;
export const PITCH_WIDTH = 68.0;

export const BAND_LENGTH = PITCH_LENGTH / 6; // 17.5m per longitudinal strip
export const CHANNEL_WIDTH = PITCH_WIDTH / 3; // ~22.67m per lateral channel

export interface PitchZoneInfo {
  zoneNumber: number;
  name: string;
  band: number; // 1 to 6
  channel: 'Left' | 'Center' | 'Right';
  isZone14: boolean;
  isCentral: boolean;
  third: 'Defensive' | 'Middle' | 'Attacking';
}

const ZONE_NAMES: Record<number, { name: string; third: 'Defensive' | 'Middle' | 'Attacking' }> = {
  1: { name: 'Zone 1 (Defensive Left Penalty Corner)', third: 'Defensive' },
  2: { name: 'Zone 2 (Defensive Six-Yard / Goal Area)', third: 'Defensive' },
  3: { name: 'Zone 3 (Defensive Right Penalty Corner)', third: 'Defensive' },
  4: { name: 'Zone 4 (Defensive Left Flank)', third: 'Defensive' },
  5: { name: 'Zone 5 (Defensive Central Pocket / Edge of Box)', third: 'Defensive' },
  6: { name: 'Zone 6 (Defensive Right Flank)', third: 'Defensive' },
  7: { name: 'Zone 7 (Defensive Midfield Left Flank)', third: 'Middle' },
  8: { name: 'Zone 8 (Defensive Midfield Central Anchor)', third: 'Middle' },
  9: { name: 'Zone 9 (Defensive Midfield Right Flank)', third: 'Middle' },
  10: { name: 'Zone 10 (Attacking Midfield Left Channel)', third: 'Middle' },
  11: { name: 'Zone 11 (Attacking Midfield Central Hole)', third: 'Middle' },
  12: { name: 'Zone 12 (Attacking Midfield Right Channel)', third: 'Middle' },
  13: { name: 'Zone 13 (Left Half-Space / Wing Edge)', third: 'Attacking' },
  14: { name: 'Zone 14 (Central Attacking Pocket / Hole)', third: 'Attacking' },
  15: { name: 'Zone 15 (Right Half-Space / Wing Edge)', third: 'Attacking' },
  16: { name: 'Zone 16 (Attacking Left Box / Cutback Area)', third: 'Attacking' },
  17: { name: 'Zone 17 (Penalty Spot / Six-Yard Danger Zone)', third: 'Attacking' },
  18: { name: 'Zone 18 (Attacking Right Box / Cutback Area)', third: 'Attacking' },
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function isWithinPitch(x: number, y: number): boolean {
  return x >= 0.0 && x <= PITCH_LENGTH && y >= 0.0 && y <= PITCH_WIDTH;
}

/**
 * Maps 2D pitch coordinates to the standard 18-zone tactical football system.
 */
export function get18Zone(x: number, y: number): PitchZoneInfo {
  const clampedX = clamp(x, 0.0, PITCH_LENGTH);
  const clampedY = clamp(y, 0.0, PITCH_WIDTH);

  // 6 Longitudinal Bands (X axis: 0 to 105m)
  const bandIndex = Math.min(5, Math.max(0, Math.floor(clampedX / BAND_LENGTH)));

  // 3 Lateral Channels (Y axis: 0 to 68m)
  const channelIndex = Math.min(2, Math.max(0, Math.floor(clampedY / CHANNEL_WIDTH)));

  // 1-based zone index (1 to 18)
  const zoneNumber = bandIndex * 3 + channelIndex + 1;

  const channelMap: Array<'Left' | 'Center' | 'Right'> = ['Left', 'Center', 'Right'];
  const channel = channelMap[channelIndex];
  const meta = ZONE_NAMES[zoneNumber] ?? { name: `Zone ${zoneNumber}`, third: 'Middle' };

  return {
    zoneNumber,
    name: meta.name,
    band: bandIndex + 1,
    channel,
    isZone14: zoneNumber === 14,
    isCentral: channel === 'Center',
    third: meta.third,
  };
}
