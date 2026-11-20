import { z } from 'zod';
import { db as defaultDb } from '../db/index.js';
import { ValidationTool } from './validationTool.js';
import { ScenarioTool } from './scenarioTool.js';
import { TacticalEngine, type TacticalEngineResult } from './tacticalEngine.js';
import { generateFallbackReport } from './fallbackReport.js';
import { KnowledgeService } from '../services/knowledgeService.js';
import { GroqClient } from '../integrations/groqClient.js';
import { buildAnalysisPrompt, buildFollowUpPrompt } from './prompts.js';
import {
  FullTacticalAnalysisReport,
  fullTacticalAnalysisReportSchema,
  SourceCitation,
} from '../schemas/analysis.js';
import { logger } from '../utils/logger.js';

export const followUpResponseSchema = z.object({
  answer: z.string(),
  relevant_players_mentioned: z.array(z.string()).default([]),
  clarified_tactics: z.array(z.string()).default([]),
});

export class TacticalAgentOrchestrator {
  /**
   * Executes the full sequential tactical analysis pipeline:
   * Validate -> Inspect -> Calculate Tactics -> Retrieve RAG Knowledge -> Groq LLM -> Zod Validate
   * Falls back automatically to deterministic fallback report on provider or schema failures.
   */
  async runAnalysis(
    db = defaultDb,
    scenarioData: Record<string, any>,
    userQuery?: string | null,
    focusAreas?: string[] | null
  ): Promise<{
    report: FullTacticalAnalysisReport;
    spatialMetrics: TacticalEngineResult;
    toolsExecuted: string[];
  }> {
    const toolsExecuted: string[] = [];

    // 1. Tool: Context Validation
    const validationData = ValidationTool.execute(scenarioData);
    toolsExecuted.push(ValidationTool.name);

    // 2. Tool: Scenario Inspection
    const scenarioInfo = ScenarioTool.execute(scenarioData);
    toolsExecuted.push(ScenarioTool.name);

    // 3. Tool: Tactical Relationship & Spatial Analysis
    const spatialMetrics = TacticalEngine.analyzeScenario(scenarioData);
    toolsExecuted.push('tactical_engine');

    // 4. Tool: Knowledge Retrieval (RAG)
    let retrievalQuery =
      userQuery && userQuery.trim()
        ? userQuery.trim()
        : `${scenarioData.match_phase || 'high_press'} ${scenarioData.tactical_situation || ''} cover shadows pressing triggers low block Zone 14`;
    if (focusAreas && focusAreas.length > 0) {
      retrievalQuery += ` ${focusAreas.join(' ')}`;
    }

    let knowledgeChunks: Array<{
      documentTitle: string;
      topic: string;
      content: string;
      author?: string;
      publication?: string;
      score: number;
    }> = [];
    let citations: SourceCitation[] = [];

    try {
      const searchResults = await KnowledgeService.semanticSearchChunks(db, retrievalQuery, {
        topic: scenarioData.match_phase,
        topK: 4,
        minSimilarity: 0.15,
      });
      toolsExecuted.push('knowledge_retrieval');

      knowledgeChunks = searchResults.map((r) => ({
        documentTitle: r.documentTitle,
        topic: r.topic,
        content: r.chunk.content,
        author: r.author,
        publication: r.publication,
        score: r.score,
      }));

      citations = searchResults.map((r) => ({
        document_title: r.documentTitle,
        topic: r.topic,
        author: r.author || undefined,
        publication: r.publication || undefined,
        relevance_score: Math.round(r.score * 100) / 100,
      }));
    } catch (ragErr: any) {
      logger.warn(`Knowledge retrieval failed or database empty (${ragErr?.message || ragErr}). Continuing.`);
    }

    // 5. Build Grounded Prompt
    const messages = buildAnalysisPrompt({
      userQuery,
      scenarioInfo,
      spatialInfo: spatialMetrics,
      validationInfo: validationData,
      knowledgeChunks,
    });

    // 6. LLM Generation with Fallback Resilience
    try {
      logger.info('Calling Groq LLM for tactical report generation...');
      const report = await GroqClient.chatCompletionStructured(
        messages,
        fullTacticalAnalysisReportSchema
      );

      // Ensure citations and validation metadata are properly aligned
      report.supporting_sources = citations;
      if (!validationData.is_sufficient) {
        report.confidence_and_limitations.confidence_level = validationData.confidence_level || 'Low';
        report.confidence_and_limitations.confidence_score = validationData.confidence_score ?? 0.4;
        report.confidence_and_limitations.limitations = validationData.limitations || [];
      }

      logger.info('Successfully generated and validated tactical analysis report from Groq.');
      return { report, spatialMetrics, toolsExecuted };
    } catch (llmErr: any) {
      logger.warn(
        `Groq report generation unavailable or failed (${llmErr?.message || llmErr}). Generating deterministic grounded analysis report.`
      );
      const fallbackReport = generateFallbackReport(
        scenarioData,
        spatialMetrics,
        validationData,
        citations
      );
      return { report: fallbackReport, spatialMetrics, toolsExecuted };
    }
  }

  /**
   * Executes a contextual follow-up question turn.
   */
  async runFollowUp(
    db = defaultDb,
    scenarioData: Record<string, any>,
    initialSummary: string,
    conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    followUpQuestion: string
  ): Promise<{
    answer: string;
    relevant_players_mentioned: string[];
    clarified_tactics: string[];
    citations: SourceCitation[];
  }> {
    // 1. Retrieve additional tactical knowledge for the question
    let additionalChunks: Array<{
      documentTitle: string;
      topic: string;
      content: string;
    }> = [];
    let citations: SourceCitation[] = [];

    try {
      const searchRes = await KnowledgeService.semanticSearchChunks(db, followUpQuestion, {
        topK: 2,
        minSimilarity: 0.15,
      });

      additionalChunks = searchRes.map((r) => ({
        documentTitle: r.documentTitle,
        topic: r.topic,
        content: r.chunk.content,
      }));

      citations = searchRes.map((r) => ({
        document_title: r.documentTitle,
        topic: r.topic,
        author: r.author || undefined,
        publication: r.publication || undefined,
        relevance_score: Math.round(r.score * 100) / 100,
      }));
    } catch (kErr: any) {
      logger.warn(`Follow-up knowledge retrieval notice: ${kErr?.message || kErr}`);
    }

    const scenarioInfo = ScenarioTool.execute(scenarioData);

    const messages = buildFollowUpPrompt({
      followUpQuestion,
      scenarioInfo,
      initialAnalysisSummary: initialSummary,
      conversationHistory,
      additionalKnowledge: additionalChunks,
    });

    try {
      const respStr = await GroqClient.chatCompletion(messages, {
        responseFormat: { type: 'json_object' },
      });

      let parsed: any;
      try {
        parsed = JSON.parse(respStr);
      } catch {
        parsed = { answer: respStr, relevant_players_mentioned: [], clarified_tactics: [] };
      }

      const validated = followUpResponseSchema.safeParse(parsed);
      if (validated.success) {
        return {
          answer: validated.data.answer,
          relevant_players_mentioned: validated.data.relevant_players_mentioned,
          clarified_tactics: validated.data.clarified_tactics,
          citations,
        };
      }

      return {
        answer: parsed.answer || respStr,
        relevant_players_mentioned: Array.isArray(parsed.relevant_players_mentioned)
          ? parsed.relevant_players_mentioned
          : [],
        clarified_tactics: Array.isArray(parsed.clarified_tactics) ? parsed.clarified_tactics : [],
        citations,
      };
    } catch (err: any) {
      logger.warn(`Groq follow-up generation failed (${err?.message || err}). Using grounded fallback synthesis.`);
      const fallback = this.buildFollowUpFallback(followUpQuestion, scenarioData);
      return {
        answer: fallback.answer,
        relevant_players_mentioned: fallback.relevant_players_mentioned,
        clarified_tactics: fallback.clarified_tactics,
        citations,
      };
    }
  }

  /**
   * Generates a grounded fallback answer for contextual follow-up inquiries.
   */
  private buildFollowUpFallback(
    question: string,
    scenarioData: Record<string, any>
  ): {
    answer: string;
    relevant_players_mentioned: string[];
    clarified_tactics: string[];
  } {
    const df = scenarioData.defending_team || {};
    const defPlayers: any[] = df.players || [];
    const names = defPlayers.slice(0, 3).map((p: any) => `#${p.number || ''} ${p.name || 'Defender'}`);

    const answer =
      `Addressing your follow-up inquiry regarding "${question}": In this scenario setup, ` +
      `${df.name || 'the defending unit'} relies heavily on disciplined spatial compactness and synchronized line shifting. ` +
      `If the attacking team attempts to bypass the primary pressure zone, the defensive line and midfield pivot ` +
      `must immediately collapse inward to protect Zone 14 and screen high-value passing angles. ` +
      `This preserves rest-defense balance and limits progressive central penetration.`;

    const tactics = [
      'Cover Shadows',
      'Zone 14 Protection',
      'Defensive Compactness',
      'Rest-Defense Balance',
    ];

    return {
      answer,
      relevant_players_mentioned: names,
      clarified_tactics: tactics,
    };
  }
}
