import crypto from 'crypto';
import { and, asc, desc, eq } from 'drizzle-orm';
import { analyses, conversationMessages, db, scenarios } from '../db/index.js';
import { TacticalAgentOrchestrator } from '../engine/orchestrator.js';
import type {
  AnalysisCreateRequest,
  AnalysisDetailResponse,
  AnalysisFollowUpRequest,
  AnalysisFollowUpResponse,
  AnalysisQueryInput,
  AnalysisResponse,
  AnalysisStatusResponse,
  ConversationMessage,
  FullTacticalAnalysisReport,
} from '../schemas/analysis.js';
import { EntityNotFoundError } from '../utils/errors.js';

export class AnalysisService {
  /**
   * Executes tactical analysis on a match scenario using the sequential AI/RAG orchestrator,
   * with automatic fallback to the deterministic engine if AI providers are unreachable or fail validation.
   */
  public static async createAnalysis(request: AnalysisCreateRequest): Promise<AnalysisResponse> {
    const scenarioRows = await db
      .select()
      .from(scenarios)
      .where(eq(scenarios.id, request.scenario_id))
      .limit(1);

    const scenario = scenarioRows[0];
    if (!scenario) {
      throw new EntityNotFoundError('Scenario', request.scenario_id);
    }

    const scenarioData: Record<string, unknown> = {
      id: scenario.id,
      title: scenario.title,
      description: scenario.description,
      match_phase: scenario.match_phase,
      tactical_situation: scenario.tactical_situation,
      attacking_team: scenario.attacking_team,
      defending_team: scenario.defending_team,
      ball_position: scenario.ball_position,
      match_context: scenario.match_context,
    };

    // Execute sequential orchestration workflow
    const orchestrator = new TacticalAgentOrchestrator();
    const { report, spatialMetrics, toolsExecuted } = await orchestrator.runAnalysis(
      db,
      scenarioData,
      request.user_query,
      request.focus_areas
    );

    const analysisId = crypto.randomUUID();
    const now = new Date().toISOString();

    const metricsPayload = {
      user_query: request.user_query ?? null,
      focus_areas: request.focus_areas ?? [],
      structured_analysis: report,
      spatial_metrics: spatialMetrics,
      tools_executed: toolsExecuted,
      confidence_score: report.confidence_and_limitations.confidence_score,
    };

    // Persist Analysis Record
    await db.insert(analyses).values({
      id: analysisId,
      scenario_id: scenario.id,
      tactical_summary: report.situation_overview.summary,
      pressing_intensity: report.pressing_strategy.intensity,
      metrics: metricsPayload,
      status: 'completed',
      created_at: now,
      updated_at: now,
    });

    // Persist Initial Conversation Turns
    const queryText =
      request.user_query || `Analyze tactical pressing structure for ${scenario.title}.`;

    await db.insert(conversationMessages).values([
      {
        id: crypto.randomUUID(),
        session_id: analysisId,
        role: 'user',
        content: queryText,
        msg_metadata: { type: 'initial_query' },
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        session_id: analysisId,
        role: 'assistant',
        content: report.situation_overview.summary,
        msg_metadata: { summary_highlight: true },
        created_at: now,
        updated_at: now,
      },
    ]);

    return {
      id: analysisId,
      scenario_id: scenario.id,
      scenario_title: scenario.title,
      status: 'completed',
      tactical_summary: report.situation_overview.summary,
      pressing_intensity: report.pressing_strategy.intensity,
      analysis: report,
      spatial_metrics: spatialMetrics as unknown as Record<string, unknown>,
      tools_executed: toolsExecuted,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Executes a contextual follow-up question turn and persists multi-turn conversation history.
   */
  public static async createFollowUp(
    analysisId: string,
    request: AnalysisFollowUpRequest
  ): Promise<AnalysisFollowUpResponse> {
    const analysisRows = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, analysisId))
      .limit(1);

    const analysis = analysisRows[0];
    if (!analysis) {
      throw new EntityNotFoundError('Analysis', analysisId);
    }

    const scenarioRows = await db
      .select()
      .from(scenarios)
      .where(eq(scenarios.id, analysis.scenario_id))
      .limit(1);

    const scenario = scenarioRows[0];
    if (!scenario) {
      throw new EntityNotFoundError('Scenario', analysis.scenario_id);
    }

    const scenarioData: Record<string, unknown> = {
      id: scenario.id,
      title: scenario.title,
      description: scenario.description,
      match_phase: scenario.match_phase,
      tactical_situation: scenario.tactical_situation,
      attacking_team: scenario.attacking_team,
      defending_team: scenario.defending_team,
      ball_position: scenario.ball_position,
      match_context: scenario.match_context,
    };

    // Retrieve previous conversation history
    const pastMessages = await db
      .select({
        role: conversationMessages.role,
        content: conversationMessages.content,
      })
      .from(conversationMessages)
      .where(eq(conversationMessages.session_id, analysisId))
      .orderBy(asc(conversationMessages.created_at));

    const initialSummary = analysis.tactical_summary || 'Tactical analysis scenario breakdown';
    const conversationHistory = pastMessages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    const orchestrator = new TacticalAgentOrchestrator();
    const result = await orchestrator.runFollowUp(
      db,
      scenarioData,
      initialSummary,
      conversationHistory,
      request.question
    );

    const now = new Date().toISOString();

    // Persist user follow-up turn and assistant response turn
    await db.insert(conversationMessages).values([
      {
        id: crypto.randomUUID(),
        session_id: analysisId,
        role: 'user',
        content: request.question,
        msg_metadata: { type: 'follow_up_query' },
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        session_id: analysisId,
        role: 'assistant',
        content: result.answer,
        msg_metadata: {
          relevant_players_mentioned: result.relevant_players_mentioned,
          clarified_tactics: result.clarified_tactics,
          sources_cited: result.citations,
        },
        created_at: now,
        updated_at: now,
      },
    ]);

    return {
      analysis_id: analysisId,
      question: request.question,
      answer: result.answer,
      relevant_players_mentioned: result.relevant_players_mentioned,
      clarified_tactics: result.clarified_tactics,
      sources_cited: result.citations,
      created_at: now,
    };
  }

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
        analysis: (metrics.structured_analysis as FullTacticalAnalysisReport) || null,
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
      analysis: (metrics.structured_analysis as FullTacticalAnalysisReport) || null,
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
