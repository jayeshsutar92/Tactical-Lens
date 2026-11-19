import { and, asc, desc, eq } from 'drizzle-orm';
import { analyses, conversationMessages, db, scenarios } from '../db/index.js';
import type {
  AnalysisDetailResponse,
  AnalysisQueryInput,
  AnalysisResponse,
  AnalysisStatusResponse,
  ConversationMessage,
} from '../schemas/analysis.js';
import { EntityNotFoundError } from '../utils/errors.js';

export class AnalysisService {
  /**
   * Retrieves a paginated list of past analyses with scenario titles.
   */
  public static async getAnalyses(query: AnalysisQueryInput): Promise<AnalysisResponse[]> {
    const { scenario_id, skip = 0, limit = 20 } = query;

    const condition = scenario_id ? eq(analyses.scenario_id, scenario_id) : undefined;

    const rows = await db
      .select({
        id: analyses.id,
        scenario_id: analyses.scenario_id,
        scenario_title: scenarios.title,
        status: analyses.status,
        tactical_summary: analyses.tactical_summary,
        pressing_intensity: analyses.pressing_intensity,
        metrics: analyses.metrics,
        created_at: analyses.created_at,
        updated_at: analyses.updated_at,
      })
      .from(analyses)
      .leftJoin(scenarios, eq(analyses.scenario_id, scenarios.id))
      .where(condition)
      .orderBy(desc(analyses.created_at))
      .offset(skip)
      .limit(limit);

    return rows.map((r) => {
      const metrics = (r.metrics as Record<string, unknown>) || {};
      return {
        id: r.id,
        scenario_id: r.scenario_id,
        scenario_title: r.scenario_title || 'Tactical Scenario',
        status: r.status,
        tactical_summary: r.tactical_summary,
        pressing_intensity: r.pressing_intensity,
        analysis: (metrics.structured_analysis as Record<string, unknown>) || null,
        spatial_metrics: (metrics.spatial_metrics as Record<string, unknown>) || null,
        tools_executed: (metrics.tools_executed as string[]) || null,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    });
  }

  /**
   * Retrieves a single analysis with complete conversation history turns.
   */
  public static async getAnalysisById(id: string): Promise<AnalysisDetailResponse> {
    const rows = await db
      .select({
        id: analyses.id,
        scenario_id: analyses.scenario_id,
        scenario_title: scenarios.title,
        status: analyses.status,
        tactical_summary: analyses.tactical_summary,
        pressing_intensity: analyses.pressing_intensity,
        metrics: analyses.metrics,
        created_at: analyses.created_at,
        updated_at: analyses.updated_at,
      })
      .from(analyses)
      .leftJoin(scenarios, eq(analyses.scenario_id, scenarios.id))
      .where(eq(analyses.id, id))
      .limit(1);

    const record = rows[0];
    if (!record) {
      throw new EntityNotFoundError('Analysis', id);
    }

    // Retrieve conversation messages for this analysis session
    const messages = await db
      .select({
        id: conversationMessages.id,
        role: conversationMessages.role,
        content: conversationMessages.content,
        msg_metadata: conversationMessages.msg_metadata,
        created_at: conversationMessages.created_at,
      })
      .from(conversationMessages)
      .where(eq(conversationMessages.session_id, id))
      .orderBy(asc(conversationMessages.created_at));

    const metrics = (record.metrics as Record<string, unknown>) || {};

    return {
      id: record.id,
      scenario_id: record.scenario_id,
      scenario_title: record.scenario_title || 'Tactical Scenario',
      status: record.status,
      tactical_summary: record.tactical_summary,
      pressing_intensity: record.pressing_intensity,
      analysis: (metrics.structured_analysis as Record<string, unknown>) || null,
      spatial_metrics: (metrics.spatial_metrics as Record<string, unknown>) || null,
      tools_executed: (metrics.tools_executed as string[]) || null,
      messages: messages as ConversationMessage[],
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  /**
   * Retrieves lightweight status for a given analysis ID.
   */
  public static async getAnalysisStatus(id: string): Promise<AnalysisStatusResponse> {
    const rows = await db
      .select({
        id: analyses.id,
        scenario_id: analyses.scenario_id,
        status: analyses.status,
        metrics: analyses.metrics,
        created_at: analyses.created_at,
        updated_at: analyses.updated_at,
      })
      .from(analyses)
      .where(eq(analyses.id, id))
      .limit(1);

    const record = rows[0];
    if (!record) {
      throw new EntityNotFoundError('Analysis', id);
    }

    const metrics = (record.metrics as Record<string, unknown>) || {};
    const errorMessage = typeof metrics.error_message === 'string' ? metrics.error_message : null;

    return {
      id: record.id,
      scenario_id: record.scenario_id,
      status: record.status,
      created_at: record.created_at,
      updated_at: record.updated_at,
      error_message: errorMessage,
    };
  }
}
