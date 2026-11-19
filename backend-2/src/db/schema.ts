import crypto from 'crypto';
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Custom type for PostgreSQL REAL[] or FLOAT[] vector embeddings
const floatArray = customType<{ data: number[] }>({
  dataType() {
    return 'real[]';
  },
  toDriver(value: number[]) {
    return `{${value.join(',')}}`;
  },
  fromDriver(value: unknown): number[] {
    if (Array.isArray(value)) return value.map(Number);
    if (typeof value === 'string') {
      return value
        .replace(/^\{|\}$/g, '')
        .split(',')
        .filter(Boolean)
        .map(Number);
    }
    return [];
  },
});

// Helper for client-side ISO timestamp default
const isoNow = () => new Date().toISOString();

// ==========================================
// 1. SCENARIOS TABLE
// ==========================================
export const scenarios = pgTable(
  'scenarios',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    match_phase: varchar('match_phase', { length: 50 }).notNull(),
    tactical_situation: varchar('tactical_situation', { length: 100 }).notNull(),
    attacking_team: jsonb('attacking_team').notNull(),
    defending_team: jsonb('defending_team').notNull(),
    ball_position: jsonb('ball_position').notNull(),
    match_context: jsonb('match_context'),
    is_prepared: boolean('is_prepared').default(false).notNull(),
    status: varchar('status', { length: 50 }).default('active').notNull(),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .$defaultFn(isoNow),
    updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .$defaultFn(isoNow)
      .$onUpdateFn(isoNow),
  },
  (table) => [
    index('ix_scenarios_title').on(table.title),
    index('ix_scenarios_match_phase').on(table.match_phase),
    index('ix_scenarios_is_prepared').on(table.is_prepared),
    index('ix_scenarios_status').on(table.status),
  ]
);

// ==========================================
// 2. ANALYSES TABLE
// ==========================================
export const analyses = pgTable(
  'analyses',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    scenario_id: uuid('scenario_id')
      .notNull()
      .references(() => scenarios.id, { onDelete: 'cascade' }),
    tactical_summary: text('tactical_summary'),
    pressing_intensity: varchar('pressing_intensity', { length: 50 }),
    metrics: jsonb('metrics'),
    status: varchar('status', { length: 50 }).default('pending').notNull(),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .$defaultFn(isoNow),
    updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .$defaultFn(isoNow)
      .$onUpdateFn(isoNow),
  },
  (table) => [
    index('ix_analyses_scenario_id').on(table.scenario_id),
    index('ix_analyses_status').on(table.status),
  ]
);

// ==========================================
// 3. CONVERSATION MESSAGES TABLE
// ==========================================
export const conversationMessages = pgTable(
  'conversation_messages',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    session_id: varchar('session_id', { length: 100 }).notNull(),
    role: varchar('role', { length: 50 }).notNull(),
    content: text('content').notNull(),
    msg_metadata: jsonb('msg_metadata'),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .$defaultFn(isoNow),
    updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .$defaultFn(isoNow)
      .$onUpdateFn(isoNow),
  },
  (table) => [
    index('ix_conversation_messages_session_id').on(table.session_id),
  ]
);

// ==========================================
// 4. KNOWLEDGE DOCUMENTS TABLE
// ==========================================
export const knowledgeDocuments = pgTable(
  'knowledge_documents',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: varchar('title', { length: 255 }).notNull(),
    topic: varchar('topic', { length: 100 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    summary: text('summary').notNull(),
    content: text('content').notNull(),
    tactical_principles: jsonb('tactical_principles').notNull().$defaultFn(() => []),
    source_metadata: jsonb('source_metadata').notNull(),
    tags: jsonb('tags').notNull().$defaultFn(() => []),
    embedding: floatArray('embedding'),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .$defaultFn(isoNow),
    updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .$defaultFn(isoNow)
      .$onUpdateFn(isoNow),
  },
  (table) => [
    index('ix_knowledge_documents_title').on(table.title),
    index('ix_knowledge_documents_topic').on(table.topic),
    index('ix_knowledge_documents_category').on(table.category),
  ]
);

// ==========================================
// 5. KNOWLEDGE CHUNKS TABLE
// ==========================================
export const knowledgeChunks = pgTable(
  'knowledge_chunks',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    document_id: uuid('document_id')
      .notNull()
      .references(() => knowledgeDocuments.id, { onDelete: 'cascade' }),
    chunk_index: integer('chunk_index').default(0).notNull(),
    content: text('content').notNull(),
    embedding: floatArray('embedding').notNull(),
    chunk_metadata: jsonb('chunk_metadata'),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .$defaultFn(isoNow),
    updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .$defaultFn(isoNow)
      .$onUpdateFn(isoNow),
  },
  (table) => [
    index('ix_knowledge_chunks_document_id').on(table.document_id),
  ]
);

// ==========================================
// DRIZZLE RELATIONS
// ==========================================
export const scenariosRelations = relations(scenarios, ({ many }) => ({
  analyses: many(analyses),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [analyses.scenario_id],
    references: [scenarios.id],
  }),
}));

export const knowledgeDocumentsRelations = relations(knowledgeDocuments, ({ many }) => ({
  chunks: many(knowledgeChunks),
}));

export const knowledgeChunksRelations = relations(knowledgeChunks, ({ one }) => ({
  document: one(knowledgeDocuments, {
    fields: [knowledgeChunks.document_id],
    references: [knowledgeDocuments.id],
  }),
}));

// Export inferred types
export type ScenarioRecord = typeof scenarios.$inferSelect;
export type NewScenarioRecord = typeof scenarios.$inferInsert;
export type AnalysisRecord = typeof analyses.$inferSelect;
export type NewAnalysisRecord = typeof analyses.$inferInsert;
export type ConversationMessageRecord = typeof conversationMessages.$inferSelect;
export type NewConversationMessageRecord = typeof conversationMessages.$inferInsert;
export type KnowledgeDocumentRecord = typeof knowledgeDocuments.$inferSelect;
export type KnowledgeChunkRecord = typeof knowledgeChunks.$inferSelect;
