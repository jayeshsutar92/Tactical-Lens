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
   * Executes a contextual follow-up question turn grounded in deterministic scenario metrics.
   */
  async runFollowUp(
    db = defaultDb,
    scenarioData: Record<string, any>,
    initialSummary: string,
    conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    followUpQuestion: string,
    spatialMetricsInput?: Record<string, any> | null
  ): Promise<{
    answer: string;
    relevant_players_mentioned: string[];
    clarified_tactics: string[];
    citations: SourceCitation[];
  }> {
    // 1. Ensure deterministic spatial metrics are computed for grounding
    let spatialMetrics: Record<string, any> | null = spatialMetricsInput || null;
    if (!spatialMetrics) {
      try {
        spatialMetrics = TacticalEngine.analyzeScenario(scenarioData) as unknown as Record<string, any>;
      } catch (calcErr: any) {
        logger.warn(`Deterministic spatial calculation notice: ${calcErr?.message || calcErr}`);
      }
    }

    // 2. Retrieve additional tactical knowledge for the question
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
      spatialInfo: spatialMetrics || undefined,
      additionalKnowledge: additionalChunks,
    });

    try {
      const respStr = await GroqClient.chatCompletion(messages, {
        responseFormat: { type: 'json_object' },
      });

      let cleaned = respStr.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      }

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = {
          answer: cleaned,
          relevant_players_mentioned: this.extractPlayerReferences(cleaned, scenarioData),
          clarified_tactics: this.extractTacticalConcepts(cleaned),
        };
      }

      let rawAnswer = typeof parsed.answer === 'string' ? parsed.answer : cleaned;
      // Strip any canned greeting or intro if echoed by LLM
      rawAnswer = rawAnswer.replace(/^Addressing your follow-up inquiry regarding [^:]*:\s*/i, '').trim();

      const validated = followUpResponseSchema.safeParse({
        answer: rawAnswer,
        relevant_players_mentioned: Array.isArray(parsed.relevant_players_mentioned)
          ? parsed.relevant_players_mentioned
          : this.extractPlayerReferences(rawAnswer, scenarioData),
        clarified_tactics: Array.isArray(parsed.clarified_tactics)
          ? parsed.clarified_tactics
          : this.extractTacticalConcepts(rawAnswer),
      });

      if (validated.success) {
        return {
          answer: validated.data.answer,
          relevant_players_mentioned: validated.data.relevant_players_mentioned,
          clarified_tactics: validated.data.clarified_tactics,
          citations,
        };
      }

      return {
        answer: rawAnswer,
        relevant_players_mentioned: this.extractPlayerReferences(rawAnswer, scenarioData),
        clarified_tactics: this.extractTacticalConcepts(rawAnswer),
        citations,
      };
    } catch (err: any) {
      logger.warn(
        `Groq follow-up generation failed (${err?.message || err}). Using dynamic grounded fallback synthesis.`
      );
      const fallback = this.buildFollowUpFallback(
        followUpQuestion,
        scenarioData,
        spatialMetrics || undefined
      );
      return {
        answer: fallback.answer,
        relevant_players_mentioned: fallback.relevant_players_mentioned,
        clarified_tactics: fallback.clarified_tactics,
        citations,
      };
    }
  }

  /**
   * Generates a dynamic, metric-grounded fallback answer when the external Groq API is unavailable.
   */
  private buildFollowUpFallback(
    question: string,
    scenarioData: Record<string, any>,
    spatialMetrics?: Record<string, any>
  ): {
    answer: string;
    relevant_players_mentioned: string[];
    clarified_tactics: string[];
  } {
    const att = scenarioData.attacking_team || {};
    const df = scenarioData.defending_team || {};
    const attName = att.name || 'the attacking team';
    const defName = df.name || 'the defending unit';

    const carrier = spatialMetrics?.ball_carrier;
    const carrierName = carrier ? `#${carrier.number} ${carrier.name}` : 'the ball carrier';
    const carrierZone = scenarioData.ball_position?.zone || 'the build-up zone';

    const presser = spatialMetrics?.primary_presser;
    const presserName = presser
      ? `#${presser.number} ${presser.name} (${presser.role})`
      : 'the lead presser';
    const presserDist = presser?.distance_to_ball ?? 4.2;

    const passingLanes: any[] = spatialMetrics?.passing_lanes || [];
    const blockedLanes = passingLanes
      .filter((l: any) => l.status === 'blocked_by_cover_shadow')
      .map((l: any) => l.target_player);
    const openLanes = passingLanes
      .filter((l: any) => l.status === 'open')
      .map((l: any) => l.target_player);

    const lowBlock = spatialMetrics?.low_block_compactness;
    const interLineDist = lowBlock?.inter_line_distance_meters ?? 14.5;
    const blockRating = lowBlock?.haramball_rating || 'compact defensive block';

    const zone14 = spatialMetrics?.zone14_density;
    const zone14Defenders = zone14?.zone14_defenders_count ?? 2;
    const screeningRatio = Math.round((zone14?.central_screening_ratio ?? 0.75) * 100);

    const qLower = question.toLowerCase();
    let answer = '';
    const relevantPlayers: string[] = [];
    const clarifiedTactics: string[] = [];

    if (presser) relevantPlayers.push(`#${presser.number} ${presser.name}`);
    if (carrier) relevantPlayers.push(`#${carrier.number} ${carrier.name}`);

    // Contextual branching based on tactical inquiry topic
    if (
      qLower.includes('zone 14') ||
      qLower.includes('bypass') ||
      qLower.includes('low block') ||
      qLower.includes('compact')
    ) {
      clarifiedTactics.push('Zone 14 Protection', 'Defensive Compactness', 'Rest-Defense Balance');
      answer =
        `If ${attName} manages to bypass ${presserName}, ${defName} relies on their ${blockRating} maintaining an inter-line distance of ${interLineDist}m between defense and midfield. ` +
        `Zone 14 is screened with ${zone14Defenders} defenders providing a ${screeningRatio}% central coverage ratio, forcing progression away from high-danger central shooting zones toward the flanks. ` +
        `${defName}'s defensive line must hold their horizontal shape to prevent third-man combinations while the midfield double pivot collapses to recover rest-defense equilibrium.`;
    } else if (
      qLower.includes('pass') ||
      qLower.includes('lane') ||
      qLower.includes('shadow') ||
      qLower.includes('option') ||
      qLower.includes('escape')
    ) {
      clarifiedTactics.push('Cover Shadows', 'Passing Lane Interception', 'Escape Outlets');
      const blockedText =
        blockedLanes.length > 0 ? blockedLanes.slice(0, 2).join(' and ') : 'central progression options';
      const openText = openLanes.length > 0 ? openLanes.slice(0, 2).join(' and ') : 'wide outlets';
      if (blockedLanes[0]) relevantPlayers.push(blockedLanes[0]);
      if (openLanes[0]) relevantPlayers.push(openLanes[0]);

      answer =
        `${presserName} aggressively closes down ${carrierName} from ${presserDist}m away, angling the pressing vector to cast an active cover shadow over ${blockedText}. ` +
        `This spatial restriction forces ${attName} to look toward ${openText} as primary escape channels before the trap snaps shut. ` +
        `If the pass is delayed, supporting defenders will compress the remaining open passing angles to win possession.`;
    } else if (
      qLower.includes('trigger') ||
      qLower.includes('winger') ||
      qLower.includes('trap') ||
      qLower.includes('press')
    ) {
      clarifiedTactics.push('Pressing Triggers', 'Touchline Trap', 'Directional Funneling');
      answer =
        `The primary pressing trigger is activated by ${presserName} engaging ${carrierName} at ${presserDist}m as soon as possession enters ${carrierZone}. ` +
        `This directional press funnels the ball carrier toward the boundary, cutting off central passing avenues and initiating synchronized shifts from supporting teammates. ` +
        `${defName} leverages this pressing trap to force an immediate hurried decision or a contested aerial clearance.`;
    } else {
      clarifiedTactics.push('Spatial Compactness', 'Cover Shadows', 'Defensive Transition');
      answer =
        `In this setup, ${presserName} exerts targeted pressure on ${carrierName} (${presserDist}m away) in ${carrierZone}, restricting direct central advancement. ` +
        `${defName} preserves defensive compactness with an inter-line separation of ${interLineDist}m, shielding Zone 14 against vertical line-breaking passes. ` +
        `To progress cleanly, ${attName} must circulate play through open passing outlets before ${defName}'s defensive structure completely seals the active corridor.`;
    }

    return {
      answer,
      relevant_players_mentioned: Array.from(new Set(relevantPlayers)),
      clarified_tactics: Array.from(new Set(clarifiedTactics)),
    };
  }

  private extractPlayerReferences(text: string, scenarioData: Record<string, any>): string[] {
    const result: string[] = [];
    const allPlayers: any[] = [
      ...(scenarioData.attacking_team?.players || []),
      ...(scenarioData.defending_team?.players || []),
    ];
    for (const p of allPlayers) {
      if (p.name && text.toLowerCase().includes(p.name.toLowerCase())) {
        result.push(`#${p.number || ''} ${p.name}`.trim());
      }
    }
    return Array.from(new Set(result)).slice(0, 5);
  }

  private extractTacticalConcepts(text: string): string[] {
    const knownConcepts = [
      'Cover Shadows',
      'Zone 14 Protection',
      'Defensive Compactness',
      'Pressing Triggers',
      'Rest-Defense Balance',
      'Third-Man Runs',
      'Touchline Trap',
      'Inter-Line Distance',
      'Haramball Low Block',
      'Passing Lane Interception',
    ];
    const found = knownConcepts.filter((c) => text.toLowerCase().includes(c.toLowerCase()));
    return found.length > 0 ? found : ['Tactical Spatial Dynamics', 'Defensive Compactness'];
  }
}
