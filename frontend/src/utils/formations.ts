import type { Player, TeamTacticalSetup } from '../types/scenario.ts'

export type FormationPreset =
  | '4-3-3'
  | '4-2-3-1'
  | '3-2-4-1'
  | '3-5-2'
  | '4-4-2'
  | '5-3-2'
  | '5-4-1'
  | '3-4-3'
  | '4-1-4-1'

export const AVAILABLE_FORMATIONS: { id: FormationPreset; name: string }[] = [
  { id: '4-3-3', name: '4-3-3 (Dynamic Triangles)' },
  { id: '4-2-3-1', name: '4-2-3-1 (Double Pivot)' },
  { id: '3-2-4-1', name: '3-2-4-1 (Box Midfield Build-up)' },
  { id: '3-5-2', name: '3-5-2 (Wing-Back Dominance)' },
  { id: '4-4-2', name: '4-4-2 (Compact Zonal Flat Lines)' },
  { id: '5-3-2', name: '5-3-2 (Deep Block & Low Line)' },
  { id: '5-4-1', name: '5-4-1 (Solid Low Block & Counter)' },
  { id: '3-4-3', name: '3-4-3 (Wide Attack & Front Press)' },
  { id: '4-1-4-1', name: '4-1-4-1 (Single Pivot Zonal Block)' },
]

const DEFAULT_ROLE_NAMES = new Set([
  'goalkeeper',
  'defending gk',
  'right back',
  'left back',
  'center back',
  'center back (r)',
  'center back (l)',
  'central defender',
  'right center back',
  'left center back',
  'right wing-back',
  'left wing-back',
  'defensive midfielder',
  'anchor pivot',
  'holding midfielder (r)',
  'holding midfielder (l)',
  'pivot (r)',
  'pivot (l)',
  'double pivot (r)',
  'double pivot (l)',
  'central midfielder',
  'central midfielder (r)',
  'central midfielder (l)',
  'pressing 8 (r)',
  'pressing 8 (l)',
  'attacking midfielder',
  'inside attacker (r)',
  'inside attacker (l)',
  'shadowing 10',
  'right midfielder',
  'left midfielder',
  'right winger',
  'left winger',
  'pressing wing (r)',
  'pressing wing (l)',
  'wide wing (r)',
  'wide wing (l)',
  'striker',
  'center forward',
  'center forward (r)',
  'center forward (l)',
  'front presser',
  'front presser (r)',
  'front presser (l)',
  'pressing striker',
  'target striker',
  'lead presser',
  'lone presser',
  'screening anchor',
  'player',
])

export function isDefaultGenericRoleName(name: string): boolean {
  return DEFAULT_ROLE_NAMES.has(name.trim().toLowerCase())
}

export function generateTeamPlayers(
  formation: FormationPreset,
  teamType: 'attacking' | 'defending',
): Player[] {
  const prefix = teamType === 'attacking' ? 'att' : 'def'

  if (teamType === 'attacking') {
    // Attacking team defending goal at x=0, attacking towards x=105
    switch (formation) {
      case '4-3-3':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Goalkeeper', role: 'GK', position: { x: 6.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 2, name: 'Right Back', role: 'RB', position: { x: 26.0, y: 58.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Center Back (R)', role: 'CB', position: { x: 18.0, y: 46.0 } },
          { id: `${prefix}_4`, number: 5, name: 'Center Back (L)', role: 'CB', position: { x: 18.0, y: 22.0 } },
          { id: `${prefix}_5`, number: 3, name: 'Left Back', role: 'LB', position: { x: 26.0, y: 10.0 } },
          { id: `${prefix}_6`, number: 6, name: 'Defensive Midfielder', role: 'DM', position: { x: 30.0, y: 34.0 } },
          { id: `${prefix}_7`, number: 8, name: 'Central Midfielder (R)', role: 'CM', position: { x: 42.0, y: 46.0 } },
          { id: `${prefix}_8`, number: 10, name: 'Central Midfielder (L)', role: 'CM', position: { x: 42.0, y: 22.0 } },
          { id: `${prefix}_9`, number: 7, name: 'Right Winger', role: 'RW', position: { x: 62.0, y: 60.0 } },
          { id: `${prefix}_10`, number: 11, name: 'Left Winger', role: 'LW', position: { x: 62.0, y: 8.0 } },
          { id: `${prefix}_11`, number: 9, name: 'Striker', role: 'ST', position: { x: 68.0, y: 34.0 } },
        ]

      case '4-2-3-1':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Goalkeeper', role: 'GK', position: { x: 6.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 2, name: 'Right Back', role: 'RB', position: { x: 28.0, y: 60.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Center Back (R)', role: 'CB', position: { x: 17.0, y: 46.0 } },
          { id: `${prefix}_4`, number: 5, name: 'Center Back (L)', role: 'CB', position: { x: 17.0, y: 22.0 } },
          { id: `${prefix}_5`, number: 3, name: 'Left Back', role: 'LB', position: { x: 28.0, y: 8.0 } },
          { id: `${prefix}_6`, number: 6, name: 'Pivot (R)', role: 'DM', position: { x: 28.0, y: 42.0 } },
          { id: `${prefix}_7`, number: 8, name: 'Pivot (L)', role: 'DM', position: { x: 28.0, y: 26.0 } },
          { id: `${prefix}_8`, number: 10, name: 'Attacking Midfielder', role: 'AM', position: { x: 48.0, y: 34.0 } },
          { id: `${prefix}_9`, number: 7, name: 'Right Winger', role: 'RW', position: { x: 58.0, y: 58.0 } },
          { id: `${prefix}_10`, number: 11, name: 'Left Winger', role: 'LW', position: { x: 58.0, y: 10.0 } },
          { id: `${prefix}_11`, number: 9, name: 'Striker', role: 'ST', position: { x: 66.0, y: 34.0 } },
        ]

      case '3-2-4-1':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Goalkeeper', role: 'GK', position: { x: 6.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 4, name: 'Right Center Back', role: 'RCB', position: { x: 18.0, y: 52.0 } },
          { id: `${prefix}_3`, number: 3, name: 'Central Defender', role: 'CB', position: { x: 16.0, y: 34.0 } },
          { id: `${prefix}_4`, number: 5, name: 'Left Center Back', role: 'LCB', position: { x: 18.0, y: 16.0 } },
          { id: `${prefix}_5`, number: 8, name: 'Double Pivot (R)', role: 'DM', position: { x: 30.0, y: 42.0 } },
          { id: `${prefix}_6`, number: 6, name: 'Double Pivot (L)', role: 'DM', position: { x: 30.0, y: 26.0 } },
          { id: `${prefix}_7`, number: 7, name: 'Wide Wing (R)', role: 'RWB', position: { x: 55.0, y: 62.0 } },
          { id: `${prefix}_8`, number: 10, name: 'Inside Attacker (R)', role: 'AM', position: { x: 52.0, y: 44.0 } },
          { id: `${prefix}_9`, number: 17, name: 'Inside Attacker (L)', role: 'AM', position: { x: 52.0, y: 24.0 } },
          { id: `${prefix}_10`, number: 11, name: 'Wide Wing (L)', role: 'LWB', position: { x: 55.0, y: 6.0 } },
          { id: `${prefix}_11`, number: 9, name: 'Target Striker', role: 'ST', position: { x: 70.0, y: 34.0 } },
        ]

      case '3-5-2':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Goalkeeper', role: 'GK', position: { x: 6.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 4, name: 'Right Center Back', role: 'RCB', position: { x: 18.0, y: 50.0 } },
          { id: `${prefix}_3`, number: 3, name: 'Central Defender', role: 'CB', position: { x: 16.0, y: 34.0 } },
          { id: `${prefix}_4`, number: 5, name: 'Left Center Back', role: 'LCB', position: { x: 18.0, y: 18.0 } },
          { id: `${prefix}_5`, number: 2, name: 'Right Wing-Back', role: 'RWB', position: { x: 40.0, y: 62.0 } },
          { id: `${prefix}_6`, number: 6, name: 'Defensive Midfielder', role: 'DM', position: { x: 30.0, y: 34.0 } },
          { id: `${prefix}_7`, number: 8, name: 'Central Midfielder (R)', role: 'CM', position: { x: 44.0, y: 44.0 } },
          { id: `${prefix}_8`, number: 10, name: 'Central Midfielder (L)', role: 'CM', position: { x: 44.0, y: 24.0 } },
          { id: `${prefix}_9`, number: 3, name: 'Left Wing-Back', role: 'LWB', position: { x: 40.0, y: 6.0 } },
          { id: `${prefix}_10`, number: 9, name: 'Center Forward (R)', role: 'ST', position: { x: 66.0, y: 42.0 } },
          { id: `${prefix}_11`, number: 11, name: 'Center Forward (L)', role: 'ST', position: { x: 66.0, y: 26.0 } },
        ]

      case '4-4-2':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Goalkeeper', role: 'GK', position: { x: 6.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 2, name: 'Right Back', role: 'RB', position: { x: 24.0, y: 58.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Center Back (R)', role: 'CB', position: { x: 18.0, y: 44.0 } },
          { id: `${prefix}_4`, number: 5, name: 'Center Back (L)', role: 'CB', position: { x: 18.0, y: 24.0 } },
          { id: `${prefix}_5`, number: 3, name: 'Left Back', role: 'LB', position: { x: 24.0, y: 10.0 } },
          { id: `${prefix}_6`, number: 7, name: 'Right Midfielder', role: 'RM', position: { x: 45.0, y: 58.0 } },
          { id: `${prefix}_7`, number: 8, name: 'Central Midfielder (R)', role: 'CM', position: { x: 38.0, y: 42.0 } },
          { id: `${prefix}_8`, number: 6, name: 'Central Midfielder (L)', role: 'CM', position: { x: 38.0, y: 26.0 } },
          { id: `${prefix}_9`, number: 11, name: 'Left Midfielder', role: 'LM', position: { x: 45.0, y: 10.0 } },
          { id: `${prefix}_10`, number: 9, name: 'Center Forward (R)', role: 'ST', position: { x: 65.0, y: 42.0 } },
          { id: `${prefix}_11`, number: 10, name: 'Center Forward (L)', role: 'ST', position: { x: 65.0, y: 26.0 } },
        ]

      case '5-3-2':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Goalkeeper', role: 'GK', position: { x: 6.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 2, name: 'Right Wing-Back', role: 'RWB', position: { x: 30.0, y: 62.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Right Center Back', role: 'RCB', position: { x: 18.0, y: 48.0 } },
          { id: `${prefix}_4`, number: 3, name: 'Central Defender', role: 'CB', position: { x: 16.0, y: 34.0 } },
          { id: `${prefix}_5`, number: 5, name: 'Left Center Back', role: 'LCB', position: { x: 18.0, y: 20.0 } },
          { id: `${prefix}_6`, number: 3, name: 'Left Wing-Back', role: 'LWB', position: { x: 30.0, y: 6.0 } },
          { id: `${prefix}_7`, number: 8, name: 'Central Midfielder (R)', role: 'CM', position: { x: 42.0, y: 46.0 } },
          { id: `${prefix}_8`, number: 6, name: 'Defensive Midfielder', role: 'DM', position: { x: 34.0, y: 34.0 } },
          { id: `${prefix}_9`, number: 10, name: 'Central Midfielder (L)', role: 'CM', position: { x: 42.0, y: 22.0 } },
          { id: `${prefix}_10`, number: 9, name: 'Center Forward (R)', role: 'ST', position: { x: 66.0, y: 42.0 } },
          { id: `${prefix}_11`, number: 11, name: 'Center Forward (L)', role: 'ST', position: { x: 66.0, y: 26.0 } },
        ]

      case '5-4-1':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Goalkeeper', role: 'GK', position: { x: 6.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 2, name: 'Right Wing-Back', role: 'RWB', position: { x: 32.0, y: 62.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Right Center Back', role: 'RCB', position: { x: 18.0, y: 48.0 } },
          { id: `${prefix}_4`, number: 3, name: 'Central Defender', role: 'CB', position: { x: 16.0, y: 34.0 } },
          { id: `${prefix}_5`, number: 5, name: 'Left Center Back', role: 'LCB', position: { x: 18.0, y: 20.0 } },
          { id: `${prefix}_6`, number: 3, name: 'Left Wing-Back', role: 'LWB', position: { x: 32.0, y: 6.0 } },
          { id: `${prefix}_7`, number: 7, name: 'Right Midfielder', role: 'RM', position: { x: 50.0, y: 56.0 } },
          { id: `${prefix}_8`, number: 8, name: 'Central Midfielder (R)', role: 'CM', position: { x: 42.0, y: 42.0 } },
          { id: `${prefix}_9`, number: 6, name: 'Central Midfielder (L)', role: 'CM', position: { x: 42.0, y: 26.0 } },
          { id: `${prefix}_10`, number: 11, name: 'Left Midfielder', role: 'LM', position: { x: 50.0, y: 12.0 } },
          { id: `${prefix}_11`, number: 9, name: 'Striker', role: 'ST', position: { x: 68.0, y: 34.0 } },
        ]

      case '3-4-3':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Goalkeeper', role: 'GK', position: { x: 6.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 4, name: 'Right Center Back', role: 'RCB', position: { x: 18.0, y: 52.0 } },
          { id: `${prefix}_3`, number: 3, name: 'Central Defender', role: 'CB', position: { x: 16.0, y: 34.0 } },
          { id: `${prefix}_4`, number: 5, name: 'Left Center Back', role: 'LCB', position: { x: 18.0, y: 16.0 } },
          { id: `${prefix}_5`, number: 2, name: 'Right Wing-Back', role: 'RWB', position: { x: 44.0, y: 62.0 } },
          { id: `${prefix}_6`, number: 8, name: 'Central Midfielder (R)', role: 'CM', position: { x: 36.0, y: 42.0 } },
          { id: `${prefix}_7`, number: 6, name: 'Central Midfielder (L)', role: 'CM', position: { x: 36.0, y: 26.0 } },
          { id: `${prefix}_8`, number: 3, name: 'Left Wing-Back', role: 'LWB', position: { x: 44.0, y: 6.0 } },
          { id: `${prefix}_9`, number: 7, name: 'Right Winger', role: 'RW', position: { x: 62.0, y: 56.0 } },
          { id: `${prefix}_10`, number: 11, name: 'Left Winger', role: 'LW', position: { x: 62.0, y: 12.0 } },
          { id: `${prefix}_11`, number: 9, name: 'Striker', role: 'ST', position: { x: 68.0, y: 34.0 } },
        ]

      case '4-1-4-1':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Goalkeeper', role: 'GK', position: { x: 6.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 2, name: 'Right Back', role: 'RB', position: { x: 26.0, y: 58.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Center Back (R)', role: 'CB', position: { x: 18.0, y: 46.0 } },
          { id: `${prefix}_4`, number: 5, name: 'Center Back (L)', role: 'CB', position: { x: 18.0, y: 22.0 } },
          { id: `${prefix}_5`, number: 3, name: 'Left Back', role: 'LB', position: { x: 26.0, y: 10.0 } },
          { id: `${prefix}_6`, number: 6, name: 'Defensive Midfielder', role: 'DM', position: { x: 30.0, y: 34.0 } },
          { id: `${prefix}_7`, number: 7, name: 'Right Midfielder', role: 'RM', position: { x: 54.0, y: 58.0 } },
          { id: `${prefix}_8`, number: 8, name: 'Central Midfielder (R)', role: 'CM', position: { x: 46.0, y: 44.0 } },
          { id: `${prefix}_9`, number: 10, name: 'Central Midfielder (L)', role: 'CM', position: { x: 46.0, y: 24.0 } },
          { id: `${prefix}_10`, number: 11, name: 'Left Midfielder', role: 'LM', position: { x: 54.0, y: 10.0 } },
          { id: `${prefix}_11`, number: 9, name: 'Striker', role: 'ST', position: { x: 68.0, y: 34.0 } },
        ]

      default:
        // 4-4-2 fallback
        return [
          { id: `${prefix}_1`, number: 1, name: 'Goalkeeper', role: 'GK', position: { x: 6.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 2, name: 'Right Back', role: 'RB', position: { x: 24.0, y: 58.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Center Back (R)', role: 'CB', position: { x: 18.0, y: 44.0 } },
          { id: `${prefix}_4`, number: 5, name: 'Center Back (L)', role: 'CB', position: { x: 18.0, y: 24.0 } },
          { id: `${prefix}_5`, number: 3, name: 'Left Back', role: 'LB', position: { x: 24.0, y: 10.0 } },
          { id: `${prefix}_6`, number: 7, name: 'Right Midfielder', role: 'RM', position: { x: 45.0, y: 58.0 } },
          { id: `${prefix}_7`, number: 8, name: 'Central Midfielder (R)', role: 'CM', position: { x: 38.0, y: 42.0 } },
          { id: `${prefix}_8`, number: 6, name: 'Central Midfielder (L)', role: 'CM', position: { x: 38.0, y: 26.0 } },
          { id: `${prefix}_9`, number: 11, name: 'Left Midfielder', role: 'LM', position: { x: 45.0, y: 10.0 } },
          { id: `${prefix}_10`, number: 9, name: 'Center Forward (R)', role: 'ST', position: { x: 65.0, y: 42.0 } },
          { id: `${prefix}_11`, number: 10, name: 'Center Forward (L)', role: 'ST', position: { x: 65.0, y: 26.0 } },
        ]
    }
  } else {
    // Defending team defending goal at x=105, pressing forward towards x=0
    switch (formation) {
      case '4-3-3':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Defending GK', role: 'GK', position: { x: 96.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 2, name: 'Left Back', role: 'LB', position: { x: 68.0, y: 58.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Center Back (L)', role: 'CB', position: { x: 72.0, y: 44.0 } },
          { id: `${prefix}_4`, number: 5, name: 'Center Back (R)', role: 'CB', position: { x: 72.0, y: 24.0 } },
          { id: `${prefix}_5`, number: 3, name: 'Right Back', role: 'RB', position: { x: 68.0, y: 10.0 } },
          { id: `${prefix}_6`, number: 6, name: 'Anchor Pivot', role: 'DM', position: { x: 50.0, y: 34.0 } },
          { id: `${prefix}_7`, number: 8, name: 'Pressing 8 (L)', role: 'CM', position: { x: 36.0, y: 44.0 } },
          { id: `${prefix}_8`, number: 10, name: 'Pressing 8 (R)', role: 'CM', position: { x: 36.0, y: 24.0 } },
          { id: `${prefix}_9`, number: 7, name: 'Pressing Wing (L)', role: 'LW', position: { x: 26.0, y: 54.0 } },
          { id: `${prefix}_10`, number: 11, name: 'Pressing Wing (R)', role: 'RW', position: { x: 26.0, y: 14.0 } },
          { id: `${prefix}_11`, number: 9, name: 'Pressing Striker', role: 'ST', position: { x: 20.0, y: 34.0 } },
        ]

      case '4-2-3-1':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Defending GK', role: 'GK', position: { x: 96.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 3, name: 'Left Back', role: 'LB', position: { x: 68.0, y: 58.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Center Back (L)', role: 'CB', position: { x: 72.0, y: 44.0 } },
          { id: `${prefix}_4`, number: 5, name: 'Center Back (R)', role: 'CB', position: { x: 72.0, y: 24.0 } },
          { id: `${prefix}_5`, number: 2, name: 'Right Back', role: 'RB', position: { x: 68.0, y: 10.0 } },
          { id: `${prefix}_6`, number: 6, name: 'Holding Midfielder (L)', role: 'DM', position: { x: 48.0, y: 42.0 } },
          { id: `${prefix}_7`, number: 8, name: 'Holding Midfielder (R)', role: 'DM', position: { x: 48.0, y: 26.0 } },
          { id: `${prefix}_8`, number: 10, name: 'Shadowing 10', role: 'AM', position: { x: 32.0, y: 34.0 } },
          { id: `${prefix}_9`, number: 11, name: 'Pressing Wing (L)', role: 'LW', position: { x: 28.0, y: 54.0 } },
          { id: `${prefix}_10`, number: 7, name: 'Pressing Wing (R)', role: 'RW', position: { x: 28.0, y: 14.0 } },
          { id: `${prefix}_11`, number: 9, name: 'Lead Presser', role: 'ST', position: { x: 22.0, y: 34.0 } },
        ]

      case '3-2-4-1':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Defending GK', role: 'GK', position: { x: 96.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 5, name: 'Left Center Back', role: 'LCB', position: { x: 74.0, y: 52.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Central Defender', role: 'CB', position: { x: 76.0, y: 34.0 } },
          { id: `${prefix}_4`, number: 3, name: 'Right Center Back', role: 'RCB', position: { x: 74.0, y: 16.0 } },
          { id: `${prefix}_5`, number: 6, name: 'Double Pivot (L)', role: 'DM', position: { x: 52.0, y: 42.0 } },
          { id: `${prefix}_6`, number: 8, name: 'Double Pivot (R)', role: 'DM', position: { x: 52.0, y: 26.0 } },
          { id: `${prefix}_7`, number: 11, name: 'Wide Wing (L)', role: 'LWB', position: { x: 42.0, y: 58.0 } },
          { id: `${prefix}_8`, number: 17, name: 'Inside Attacker (L)', role: 'AM', position: { x: 36.0, y: 42.0 } },
          { id: `${prefix}_9`, number: 10, name: 'Inside Attacker (R)', role: 'AM', position: { x: 36.0, y: 26.0 } },
          { id: `${prefix}_10`, number: 7, name: 'Wide Wing (R)', role: 'RWB', position: { x: 42.0, y: 10.0 } },
          { id: `${prefix}_11`, number: 9, name: 'Target Striker', role: 'ST', position: { x: 22.0, y: 34.0 } },
        ]

      case '3-5-2':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Defending GK', role: 'GK', position: { x: 96.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 5, name: 'Left Center Back', role: 'LCB', position: { x: 74.0, y: 50.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Central Defender', role: 'CB', position: { x: 76.0, y: 34.0 } },
          { id: `${prefix}_4`, number: 3, name: 'Right Center Back', role: 'RCB', position: { x: 74.0, y: 18.0 } },
          { id: `${prefix}_5`, number: 11, name: 'Left Wing-Back', role: 'LWB', position: { x: 58.0, y: 60.0 } },
          { id: `${prefix}_6`, number: 6, name: 'Anchor Pivot', role: 'DM', position: { x: 52.0, y: 34.0 } },
          { id: `${prefix}_7`, number: 8, name: 'Pressing 8 (L)', role: 'CM', position: { x: 44.0, y: 42.0 } },
          { id: `${prefix}_8`, number: 10, name: 'Pressing 8 (R)', role: 'CM', position: { x: 44.0, y: 26.0 } },
          { id: `${prefix}_9`, number: 2, name: 'Right Wing-Back', role: 'RWB', position: { x: 58.0, y: 8.0 } },
          { id: `${prefix}_10`, number: 9, name: 'Front Presser (L)', role: 'ST', position: { x: 24.0, y: 42.0 } },
          { id: `${prefix}_11`, number: 7, name: 'Front Presser (R)', role: 'ST', position: { x: 24.0, y: 26.0 } },
        ]

      case '4-4-2':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Defending GK', role: 'GK', position: { x: 96.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 3, name: 'Left Back', role: 'LB', position: { x: 70.0, y: 58.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Center Back (L)', role: 'CB', position: { x: 74.0, y: 42.0 } },
          { id: `${prefix}_4`, number: 5, name: 'Center Back (R)', role: 'CB', position: { x: 74.0, y: 26.0 } },
          { id: `${prefix}_5`, number: 2, name: 'Right Back', role: 'RB', position: { x: 70.0, y: 10.0 } },
          { id: `${prefix}_6`, number: 11, name: 'Left Midfielder', role: 'LM', position: { x: 44.0, y: 56.0 } },
          { id: `${prefix}_7`, number: 8, name: 'Central Midfielder (L)', role: 'CM', position: { x: 46.0, y: 40.0 } },
          { id: `${prefix}_8`, number: 6, name: 'Central Midfielder (R)', role: 'CM', position: { x: 46.0, y: 28.0 } },
          { id: `${prefix}_9`, number: 7, name: 'Right Midfielder', role: 'RM', position: { x: 44.0, y: 12.0 } },
          { id: `${prefix}_10`, number: 9, name: 'Front Presser (L)', role: 'ST', position: { x: 24.0, y: 40.0 } },
          { id: `${prefix}_11`, number: 10, name: 'Front Presser (R)', role: 'ST', position: { x: 24.0, y: 28.0 } },
        ]

      case '5-3-2':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Defending GK', role: 'GK', position: { x: 96.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 3, name: 'Left Wing-Back', role: 'LWB', position: { x: 78.0, y: 60.0 } },
          { id: `${prefix}_3`, number: 5, name: 'Left Center Back', role: 'LCB', position: { x: 82.0, y: 46.0 } },
          { id: `${prefix}_4`, number: 4, name: 'Central Defender', role: 'CB', position: { x: 84.0, y: 34.0 } },
          { id: `${prefix}_5`, number: 2, name: 'Right Center Back', role: 'RCB', position: { x: 82.0, y: 22.0 } },
          { id: `${prefix}_6`, number: 7, name: 'Right Wing-Back', role: 'RWB', position: { x: 78.0, y: 8.0 } },
          { id: `${prefix}_7`, number: 8, name: 'Central Midfielder (L)', role: 'CM', position: { x: 62.0, y: 44.0 } },
          { id: `${prefix}_8`, number: 6, name: 'Holding Midfielder', role: 'DM', position: { x: 60.0, y: 34.0 } },
          { id: `${prefix}_9`, number: 10, name: 'Central Midfielder (R)', role: 'CM', position: { x: 62.0, y: 24.0 } },
          { id: `${prefix}_10`, number: 9, name: 'Front Presser (L)', role: 'ST', position: { x: 36.0, y: 40.0 } },
          { id: `${prefix}_11`, number: 11, name: 'Front Presser (R)', role: 'ST', position: { x: 36.0, y: 28.0 } },
        ]

      case '5-4-1':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Defending GK', role: 'GK', position: { x: 96.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 3, name: 'Left Wing-Back', role: 'LWB', position: { x: 80.0, y: 60.0 } },
          { id: `${prefix}_3`, number: 5, name: 'Left Center Back', role: 'LCB', position: { x: 84.0, y: 46.0 } },
          { id: `${prefix}_4`, number: 4, name: 'Central Defender', role: 'CB', position: { x: 86.0, y: 34.0 } },
          { id: `${prefix}_5`, number: 2, name: 'Right Center Back', role: 'RCB', position: { x: 84.0, y: 22.0 } },
          { id: `${prefix}_6`, number: 7, name: 'Right Wing-Back', role: 'RWB', position: { x: 80.0, y: 8.0 } },
          { id: `${prefix}_7`, number: 11, name: 'Left Midfielder', role: 'LM', position: { x: 66.0, y: 56.0 } },
          { id: `${prefix}_8`, number: 8, name: 'Central Midfielder (L)', role: 'CM', position: { x: 68.0, y: 42.0 } },
          { id: `${prefix}_9`, number: 6, name: 'Central Midfielder (R)', role: 'CM', position: { x: 68.0, y: 26.0 } },
          { id: `${prefix}_10`, number: 17, name: 'Right Midfielder', role: 'RM', position: { x: 66.0, y: 12.0 } },
          { id: `${prefix}_11`, number: 9, name: 'Lone Presser', role: 'ST', position: { x: 42.0, y: 34.0 } },
        ]

      case '3-4-3':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Defending GK', role: 'GK', position: { x: 96.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 5, name: 'Left Center Back', role: 'LCB', position: { x: 72.0, y: 50.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Central Defender', role: 'CB', position: { x: 74.0, y: 34.0 } },
          { id: `${prefix}_4`, number: 3, name: 'Right Center Back', role: 'RCB', position: { x: 72.0, y: 18.0 } },
          { id: `${prefix}_5`, number: 11, name: 'Left Wing-Back', role: 'LWB', position: { x: 52.0, y: 60.0 } },
          { id: `${prefix}_6`, number: 8, name: 'Central Midfielder (L)', role: 'CM', position: { x: 48.0, y: 42.0 } },
          { id: `${prefix}_7`, number: 6, name: 'Central Midfielder (R)', role: 'CM', position: { x: 48.0, y: 26.0 } },
          { id: `${prefix}_8`, number: 2, name: 'Right Wing-Back', role: 'RWB', position: { x: 52.0, y: 8.0 } },
          { id: `${prefix}_9`, number: 10, name: 'Pressing Wing (L)', role: 'LW', position: { x: 28.0, y: 54.0 } },
          { id: `${prefix}_10`, number: 7, name: 'Pressing Wing (R)', role: 'RW', position: { x: 28.0, y: 14.0 } },
          { id: `${prefix}_11`, number: 9, name: 'Lead Presser', role: 'ST', position: { x: 22.0, y: 34.0 } },
        ]

      case '4-1-4-1':
        return [
          { id: `${prefix}_1`, number: 1, name: 'Defending GK', role: 'GK', position: { x: 96.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 3, name: 'Left Back', role: 'LB', position: { x: 70.0, y: 58.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Center Back (L)', role: 'CB', position: { x: 74.0, y: 44.0 } },
          { id: `${prefix}_4`, number: 5, name: 'Center Back (R)', role: 'CB', position: { x: 74.0, y: 24.0 } },
          { id: `${prefix}_5`, number: 2, name: 'Right Back', role: 'RB', position: { x: 70.0, y: 10.0 } },
          { id: `${prefix}_6`, number: 6, name: 'Screening Anchor', role: 'DM', position: { x: 56.0, y: 34.0 } },
          { id: `${prefix}_7`, number: 11, name: 'Left Midfielder', role: 'LM', position: { x: 38.0, y: 56.0 } },
          { id: `${prefix}_8`, number: 8, name: 'Central Midfielder (L)', role: 'CM', position: { x: 40.0, y: 42.0 } },
          { id: `${prefix}_9`, number: 10, name: 'Central Midfielder (R)', role: 'CM', position: { x: 40.0, y: 26.0 } },
          { id: `${prefix}_10`, number: 7, name: 'Right Midfielder', role: 'RM', position: { x: 38.0, y: 12.0 } },
          { id: `${prefix}_11`, number: 9, name: 'Front Presser', role: 'ST', position: { x: 22.0, y: 34.0 } },
        ]

      default:
        // 4-4-2 fallback
        return [
          { id: `${prefix}_1`, number: 1, name: 'Defending GK', role: 'GK', position: { x: 96.0, y: 34.0 } },
          { id: `${prefix}_2`, number: 3, name: 'Left Back', role: 'LB', position: { x: 70.0, y: 58.0 } },
          { id: `${prefix}_3`, number: 4, name: 'Center Back (L)', role: 'CB', position: { x: 74.0, y: 42.0 } },
          { id: `${prefix}_4`, number: 5, name: 'Center Back (R)', role: 'CB', position: { x: 74.0, y: 26.0 } },
          { id: `${prefix}_5`, number: 2, name: 'Right Back', role: 'RB', position: { x: 70.0, y: 10.0 } },
          { id: `${prefix}_6`, number: 11, name: 'Left Midfielder', role: 'LM', position: { x: 44.0, y: 56.0 } },
          { id: `${prefix}_7`, number: 8, name: 'Central Midfielder (L)', role: 'CM', position: { x: 46.0, y: 40.0 } },
          { id: `${prefix}_8`, number: 6, name: 'Central Midfielder (R)', role: 'CM', position: { x: 46.0, y: 28.0 } },
          { id: `${prefix}_9`, number: 7, name: 'Right Midfielder', role: 'RM', position: { x: 44.0, y: 12.0 } },
          { id: `${prefix}_10`, number: 9, name: 'Front Presser (L)', role: 'ST', position: { x: 24.0, y: 40.0 } },
          { id: `${prefix}_11`, number: 10, name: 'Front Presser (R)', role: 'ST', position: { x: 24.0, y: 28.0 } },
        ]
    }
  }
}

export function createDefaultTeamSetup(
  teamType: 'attacking' | 'defending',
  formation: FormationPreset = '4-3-3',
  name?: string,
  existingPlayers?: Player[],
): TeamTacticalSetup {
  const defaultName =
    name || (teamType === 'attacking' ? 'Attacking Team (Build-up)' : 'Defending Team (High Press)')

  const newPlayers = generateTeamPlayers(formation, teamType)

  // If existing players are provided, preserve custom player names edited by the user
  const players =
    existingPlayers && existingPlayers.length > 0
      ? newPlayers.map((newP, idx) => {
          const existing = existingPlayers[idx]
          if (existing && existing.name && !isDefaultGenericRoleName(existing.name)) {
            return {
              ...newP,
              name: existing.name,
            }
          }
          return newP
        })
      : newPlayers

  return {
    name: defaultName,
    formation,
    players,
  }
}
