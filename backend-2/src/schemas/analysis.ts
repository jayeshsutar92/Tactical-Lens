import { z } from 'zod';
import { paginationQuerySchema, uuidSchema } from './common.js';

export const analysisIdParamSchema = z.object({
  id: uuidSchema,
});

export const analysisCreateRequestSchema = z.object({
  scenario_id: uuidSchema,
  user_query: z.string().max(500).optional().nullable(),
  focus_areas: z.array(z.string()).optional().nullable(),
});

export const analysisQuerySchema = paginationQuerySchema.extend({
  scenario_id: uuidSchema.optional(),
});

export const sourceCitationSchema = z.object({
  document_title: z.string(),
  topic: z.string(),
  author: z.string().optional(),
  publication: z.string().optional(),
  relevance_score: z.number(),
});

export const situationOverviewSchema = z.object({
  match_phase: z.string(),
  tactical_situation: z.string(),
  attacking_team_setup: z.string(),
  defending_team_setup: z.string(),
  ball_location_summary: z.string(),
  summary: z.string(),
});

export const pressingStrategySchema = z.object({
  intensity: z.string(),
  primary_objective: z.string(),
  pressing_direction: z.string(),
  coordination_scheme: z.string(),
});

export const pressingTriggersSchema = z.object({
  visual_triggers: z.array(z.string()).default([]),
  tactical_traps: z.array(z.string()).default([]),
  primary_trigger_player: z.string().nullable().optional(),
});

export const passingLaneCoverageSchema = z.object({
  cover_shadows_active: z.array(z.string()).default([]),
  blocked_options: z.array(z.string()).default([]),
  contested_options: z.array(z.string()).default([]),
  open_escape_routes: z.array(z.string()).default([]),
});

export const tacticalAdvantagesSchema = z.object({
  compactness_advantage: z.string(),
  turnover_potential: z.string(),
  key_advantages: z.array(z.string()).default([]),
});

export const exposedSpacesSchema = z.object({
  exposed_zones: z.array(z.string()).default([]),
  rest_defense_risk: z.string(),
  key_vulnerabilities: z.array(z.string()).default([]),
});

export const oppositionResponsesSchema = z.object({
  recommended_counters: z.array(z.string()).default([]),
  switch_potential: z.string(),
  third_man_runs: z.string().nullable().optional(),
});

export const fanWatchPointsSchema = z.object({
  what_to_watch_next: z.string(),
  key_duel_to_follow: z.string(),
  tactical_takeaway: z.string(),
});

export const confidenceAndLimitationsSchema = z.object({
  confidence_score: z.number().min(0.0).max(1.0),
  confidence_level: z.enum(['High', 'Medium', 'Low']).or(z.string()),
  data_sufficiency: z.string(),
  limitations: z.array(z.string()).default([]),
});

export const fullTacticalAnalysisReportSchema = z.object({
  situation_overview: situationOverviewSchema,
  pressing_strategy: pressingStrategySchema,
  pressing_triggers: pressingTriggersSchema,
  passing_lane_coverage: passingLaneCoverageSchema,
  tactical_advantages: tacticalAdvantagesSchema,
  exposed_spaces: exposedSpacesSchema,
  opposition_responses: oppositionResponsesSchema,
  fan_watch_points: fanWatchPointsSchema,
  confidence_and_limitations: confidenceAndLimitationsSchema,
  supporting_sources: z.array(sourceCitationSchema).default([]),
});

export const conversationMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']).or(z.string()),
  content: z.string(),
  msg_metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  created_at: z.string(),
});

export const analysisResponseSchema = z.object({
  id: z.string().uuid(),
  scenario_id: z.string().uuid(),
  scenario_title: z.string(),
  status: z.string(),
  tactical_summary: z.string().nullable().optional(),
  pressing_intensity: z.string().nullable().optional(),
  analysis: fullTacticalAnalysisReportSchema.nullable().optional(),
  spatial_metrics: z.record(z.string(), z.unknown()).nullable().optional(),
  tools_executed: z.array(z.string()).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const analysisDetailResponseSchema = analysisResponseSchema.extend({
  messages: z.array(conversationMessageSchema).default([]),
});

export const analysisStatusResponseSchema = z.object({
  id: z.string().uuid(),
  scenario_id: z.string().uuid(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  error_message: z.string().nullable().optional(),
});

export type SourceCitation = z.infer<typeof sourceCitationSchema>;
export type SituationOverview = z.infer<typeof situationOverviewSchema>;
export type PressingStrategy = z.infer<typeof pressingStrategySchema>;
export type PressingTriggers = z.infer<typeof pressingTriggersSchema>;
export type PassingLaneCoverage = z.infer<typeof passingLaneCoverageSchema>;
export type TacticalAdvantages = z.infer<typeof tacticalAdvantagesSchema>;
export type ExposedSpaces = z.infer<typeof exposedSpacesSchema>;
export type OppositionResponses = z.infer<typeof oppositionResponsesSchema>;
export type FanWatchPoints = z.infer<typeof fanWatchPointsSchema>;
export type ConfidenceAndLimitations = z.infer<typeof confidenceAndLimitationsSchema>;
export type FullTacticalAnalysisReport = z.infer<typeof fullTacticalAnalysisReportSchema>;

export type AnalysisQueryInput = z.infer<typeof analysisQuerySchema>;
export type AnalysisCreateRequest = z.infer<typeof analysisCreateRequestSchema>;
export type ConversationMessage = z.infer<typeof conversationMessageSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
export type AnalysisDetailResponse = z.infer<typeof analysisDetailResponseSchema>;
export type AnalysisStatusResponse = z.infer<typeof analysisStatusResponseSchema>;
