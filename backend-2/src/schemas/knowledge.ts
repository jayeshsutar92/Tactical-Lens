import { z } from 'zod';
import { paginationQuerySchema, uuidSchema } from './common.js';

export const sourceMetadataSchema = z.object({
  author: z.string().optional().nullable(),
  publication: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  title: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  verification_status: z.string().default('verified'),
});

export const knowledgeDocumentBaseSchema = z.object({
  title: z.string().min(3).max(255),
  topic: z.string().min(2).max(100),
  category: z.string().min(2).max(100),
  summary: z.string().min(10),
  content: z.string().min(20),
  tactical_principles: z.array(z.string()).default([]),
  source_metadata: sourceMetadataSchema,
  tags: z.array(z.string()).default([]),
});

export const knowledgeDocumentCreateSchema = knowledgeDocumentBaseSchema;

export const knowledgeDocumentResponseSchema = knowledgeDocumentBaseSchema.extend({
  id: uuidSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const topicSummaryResponseSchema = z.object({
  topic: z.string(),
  category: z.string(),
  document_count: z.number(),
  description: z.string(),
});

export const knowledgeQuerySchema = paginationQuerySchema.extend({
  topic: z.string().optional(),
  category: z.string().optional(),
  query: z.string().optional(),
});

export type SourceMetadata = z.infer<typeof sourceMetadataSchema>;
export type KnowledgeDocumentCreate = z.infer<typeof knowledgeDocumentCreateSchema>;
export type KnowledgeDocumentResponse = z.infer<typeof knowledgeDocumentResponseSchema>;
export type TopicSummaryResponse = z.infer<typeof topicSummaryResponseSchema>;
export type KnowledgeQuery = z.infer<typeof knowledgeQuerySchema>;
