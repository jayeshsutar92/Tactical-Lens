import { z } from 'zod';
import { paginationQuerySchema, uuidSchema } from './common.js';

export const playerPositionSchema = z.object({
  x: z.number().min(0.0).max(105.0),
  y: z.number().min(0.0).max(68.0),
  z: z.number().min(0.0).max(30.0).optional(),
});

export const playerSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().min(1).max(99),
  name: z.string().min(1),
  role: z.string().min(1),
  position: playerPositionSchema,
});

export const teamTacticalSetupSchema = z.object({
  name: z.string().min(2).max(100),
  formation: z.string().min(3).max(20),
  players: z.array(playerSchema).min(1).max(11),
});

export const ballPositionSchema = z.object({
  x: z.number().min(0.0).max(105.0),
  y: z.number().min(0.0).max(68.0),
  z: z.number().min(0.0).max(30.0).default(0.0).optional(),
  zone: z.string().optional().nullable(),
});

export const matchContextSchema = z.object({
  minute: z.number().int().min(0).max(130).optional().nullable(),
  score: z.string().optional().nullable(),
  competition: z.string().optional().nullable(),
  pitch_dimensions: z
    .object({
      length: z.number().positive().default(105.0),
      width: z.number().positive().default(68.0),
    })
    .default({ length: 105.0, width: 68.0 })
    .optional(),
});

export const scenarioCreateSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional().nullable(),
  match_phase: z.string().min(1).max(50),
  tactical_situation: z.string().min(1).max(100),
  attacking_team: teamTacticalSetupSchema,
  defending_team: teamTacticalSetupSchema,
  ball_position: ballPositionSchema,
  match_context: matchContextSchema.optional().nullable(),
});

export const scenarioQuerySchema = paginationQuerySchema.extend({
  match_phase: z.string().optional(),
  is_prepared: z
    .string()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    })
    .pipe(z.boolean().optional())
    .optional(),
});

export const scenarioIdParamSchema = z.object({
  scenario_id: uuidSchema,
});

export const scenarioSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  match_phase: z.string(),
  tactical_situation: z.string(),
  is_prepared: z.boolean(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export const scenarioResponseSchema = scenarioSummaryResponseSchema.extend({
  description: z.string().nullable().optional(),
  attacking_team: teamTacticalSetupSchema,
  defending_team: teamTacticalSetupSchema,
  ball_position: ballPositionSchema,
  match_context: matchContextSchema.nullable().optional(),
});

export type PlayerPosition = z.infer<typeof playerPositionSchema>;
export type Player = z.infer<typeof playerSchema>;
export type TeamTacticalSetup = z.infer<typeof teamTacticalSetupSchema>;
export type BallPosition = z.infer<typeof ballPositionSchema>;
export type MatchContext = z.infer<typeof matchContextSchema>;
export type ScenarioCreateInput = z.infer<typeof scenarioCreateSchema>;
export type ScenarioQueryInput = z.infer<typeof scenarioQuerySchema>;
export type ScenarioSummaryResponse = z.infer<typeof scenarioSummaryResponseSchema>;
export type ScenarioResponse = z.infer<typeof scenarioResponseSchema>;
