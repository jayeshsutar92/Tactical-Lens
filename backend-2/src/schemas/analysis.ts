import { z } from 'zod';
import { paginationQuerySchema, uuidSchema } from './common.js';

export const analysisIdParamSchema = z.object({
  id: uuidSchema,
});

export const analysisQuerySchema = paginationQuerySchema.extend({
  scenario_id: uuidSchema.optional(),
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
  analysis: z.record(z.string(), z.unknown()).nullable().optional(),
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

export type AnalysisQueryInput = z.infer<typeof analysisQuerySchema>;
export type ConversationMessage = z.infer<typeof conversationMessageSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
export type AnalysisDetailResponse = z.infer<typeof analysisDetailResponseSchema>;
export type AnalysisStatusResponse = z.infer<typeof analysisStatusResponseSchema>;
