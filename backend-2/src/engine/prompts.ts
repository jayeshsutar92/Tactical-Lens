import { ChatMessage } from '../integrations/groqClient.js';

export const SYSTEM_TACTICAL_ANALYST =
  'You are TacticalLens Tactical Agent, an expert football tactical analyst, defensive systems architect, and pressing specialist. ' +
  'Your objective is to deliver precise, deeply grounded, context-aware analysis of football pressing situations, ' +
  'low-block defensive structures ("haramball"), Zone 14 central screening, defender step-out triggers, cover shadows, and spatial geometry.\n\n' +
  'MANDATORY ANALYSIS RULES:\n' +
  '1. Strict Tactical Grounding: Anchor tactical points in established football literature and retrieved theory. Never fabricate tactical concepts.\n' +
  '2. Deterministic Grounding: Use the deterministic spatial calculations provided (exact distances, pressing vectors, low-block inter-line distances, Zone 14 screening ratios, and identified cover shadows). Do not invent coordinates or player positions.\n' +
  '3. Anti-Hallucination & Uncertainty: If context validation flags missing data or limitations, communicate uncertainty clearly in your "confidence_and_limitations" section rather than making confident unsupported claims.\n' +
  '4. Fan Accessibility with Tactical Precision: Your explanations must be clear and intuitive to an ordinary football fan, while preserving professional analytical depth.\n' +
  '5. JSON Schema Output: You must respond ONLY with a valid JSON object matching the requested schema.\n';

export function buildAnalysisPrompt(params: {
  userQuery?: string | null;
  scenarioInfo: Record<string, any>;
  spatialInfo: Record<string, any>;
  validationInfo: Record<string, any>;
  knowledgeChunks: Array<{
    documentTitle: string;
    topic: string;
    content: string;
    author?: string;
  }>;
}): ChatMessage[] {
  const { userQuery, scenarioInfo, spatialInfo, validationInfo, knowledgeChunks } = params;
  const sections: string[] = [];

  // 1. Observed Scenario Context
  sections.push('### OBSERVED MATCH SCENARIO:');
  sections.push(`Title: ${scenarioInfo.title || 'Untitled Scenario'}`);
  sections.push(
    `Phase: ${scenarioInfo.match_phase || 'high_press'} | Situation: ${scenarioInfo.tactical_situation || 'Defensive sequence'}`
  );
  const att = scenarioInfo.attacking_team || {};
  const def = scenarioInfo.defending_team || {};
  sections.push(
    `Attacking Team: ${att.name || 'Attacking'} (${att.formation || 'Unknown'}, ${att.player_count || 11} players)`
  );
  sections.push(
    `Defending Team: ${def.name || 'Defending'} (${def.formation || 'Unknown'}, ${def.player_count || 11} players)`
  );
  const ball = scenarioInfo.ball_position || {};
  sections.push(`Ball Position: Zone '${ball.zone || 'Field'}' at x=${ball.x}, y=${ball.y}`);

  // 2. Deterministic Spatial & Relationship Metrics
  sections.push('\n### DETERMINISTIC SPATIAL RELATIONSHIPS:');
  const bc = spatialInfo.ball_carrier || {};
  sections.push(
    `- Ball Carrier: #${bc.number ?? ''} ${bc.name || 'Ball Carrier'} (${bc.role || 'Player'}) at coordinates (${bc.coordinates?.x}, ${bc.coordinates?.y})`
  );

  const pp = spatialInfo.primary_presser || {};
  sections.push(
    `- Primary Presser: #${pp.number ?? ''} ${pp.name || 'Primary Presser'} (${pp.role || 'Defender'}) - Distance to ball: ${pp.distance_to_ball ?? 'N/A'} meters`
  );
  sections.push(`- Pressing Direction / Funnel: ${spatialInfo.pressing_funnel || 'neutral'}`);

  const comp = spatialInfo.compactness || {};
  sections.push(
    `- Defending Block Compactness: ${comp.vertical_block_length_meters ?? 30}m vertical length x ${comp.horizontal_block_width_meters ?? 40}m horizontal width (Area: ${comp.block_area_sq_meters ?? 1200}m²)`
  );

  // TacticalLens Specific Low-Block & Zone 14 Metrics
  const lowBlock = spatialInfo.low_block_compactness;
  if (lowBlock) {
    sections.push(
      `- Low-Block Structure: Classification="${lowBlock.classification}" | Inter-line Vertical Distance=${lowBlock.inter_line_distance_meters}m | Def-Line Avg X=${lowBlock.defensive_line_avg_x}m | Mid-Line Avg X=${lowBlock.midfield_line_avg_x}m`
    );
  }

  const z14 = spatialInfo.zone14_density;
  if (z14) {
    sections.push(
      `- Zone 14 Central Density: Defenders in/near Zone 14=${z14.defenders_in_zone14_count} | Central Screening Ratio=${Math.round(z14.screening_ratio * 100)}% | Space Protection Status="${z14.is_zone14_screened ? 'Central Pockets Screened (Forcing Wide Play)' : 'Central Access Vulnerable'}"`
    );
  }

  const stepOut = spatialInfo.pressing_trigger_analysis;
  if (stepOut) {
    sections.push(
      `- Pressing Trigger / Step-Out Mechanics: Step-Out Detected=${stepOut.step_out_detected ? 'YES' : 'NO'}${stepOut.stepping_defender ? ` by ${stepOut.stepping_defender.name} (Delta forward: ${stepOut.step_out_delta_x_meters}m)` : ''} | Adjacent Cover Shift=${stepOut.cover_shift_executed ? 'Cover Shift Executed' : 'Cover Gap Exposed'}`
    );
  }

  // Passing lanes and cover shadows
  const lanes = spatialInfo.passing_lanes || [];
  if (lanes.length > 0) {
    sections.push('- Passing Lane Evaluation:');
    for (const lane of lanes.slice(0, 6)) {
      const shadows = (lane.cover_shadow_defenders || []).join(', ') || 'None';
      sections.push(
        `  * To ${lane.target_player}: Status=${lane.status} | Dist=${lane.lane_distance_meters}m | Cover Shadow Cast By: ${shadows}`
      );
    }
  }

  const openOpts = spatialInfo.open_options || [];
  if (openOpts.length > 0) {
    sections.push(`- Open Escape Options: ${openOpts.join(', ')}`);
  }

  // 3. Validation & Limitations
  sections.push('\n### DATA VALIDATION & SUFFICIENCY:');
  sections.push(`- Data Sufficiency: ${validationInfo.is_sufficient ? 'Sufficient' : 'Limited'}`);
  sections.push(
    `- Confidence Level: ${validationInfo.confidence_level || 'High'} (${validationInfo.confidence_score ?? 0.85})`
  );
  const limitations = validationInfo.limitations || [];
  if (limitations.length > 0) {
    sections.push('- Identified Limitations / Missing Elements:');
    for (const lim of limitations) {
      sections.push(`  * ${lim}`);
    }
  }

  // 4. Retrieved Tactical Knowledge
  sections.push('\n### RETRIEVED THEORETICAL TACTICAL KNOWLEDGE:');
  if (knowledgeChunks && knowledgeChunks.length > 0) {
    knowledgeChunks.forEach((chunk, idx) => {
      sections.push(
        `[${idx + 1}] Source: ${chunk.documentTitle} (Topic: ${chunk.topic})\n${chunk.content}\n`
      );
    });
  } else {
    sections.push(
      'Rely on foundational football tactical theory (pressing systems, low block compactness, cover shadows, and Zone 14 screening) and state appropriate uncertainty.'
    );
  }

  // 5. User Inquiry
  sections.push('\n### USER INQUIRY:');
  const queryText =
    userQuery && userQuery.trim()
      ? userQuery.trim()
      : 'Provide a comprehensive tactical analysis breakdown of this scenario covering pressing, low-block structure, and transition dynamics.';
  sections.push(`"${queryText}"`);

  sections.push(
    '\nProvide your analysis formatted as a JSON object strictly conforming to the FullTacticalAnalysisReport schema:\n' +
      '{\n' +
      '  "situation_overview": { "match_phase": "...", "tactical_situation": "...", "attacking_team_setup": "...", "defending_team_setup": "...", "ball_location_summary": "...", "summary": "..." },\n' +
      '  "pressing_strategy": { "intensity": "...", "primary_objective": "...", "pressing_direction": "...", "coordination_scheme": "..." },\n' +
      '  "pressing_triggers": { "visual_triggers": [...], "tactical_traps": [...], "primary_trigger_player": "..." },\n' +
      '  "passing_lane_coverage": { "cover_shadows_active": [...], "blocked_options": [...], "contested_options": [...], "open_escape_routes": [...] },\n' +
      '  "tactical_advantages": { "compactness_advantage": "...", "turnover_potential": "...", "key_advantages": [...] },\n' +
      '  "exposed_spaces": { "exposed_zones": [...], "rest_defense_risk": "...", "key_vulnerabilities": [...] },\n' +
      '  "opposition_responses": { "recommended_counters": [...], "switch_potential": "...", "third_man_runs": "..." },\n' +
      '  "fan_watch_points": { "what_to_watch_next": "...", "key_duel_to_follow": "...", "tactical_takeaway": "..." },\n' +
      '  "confidence_and_limitations": { "confidence_score": 0.0-1.0, "confidence_level": "High|Medium|Low", "data_sufficiency": "...", "limitations": [...] },\n' +
      '  "supporting_sources": [ ... ]\n' +
      '}'
  );

  return [
    { role: 'system', content: SYSTEM_TACTICAL_ANALYST },
    { role: 'user', content: sections.join('\n') },
  ];
}

export function buildFollowUpPrompt(params: {
  followUpQuestion: string;
  scenarioInfo: Record<string, any>;
  initialAnalysisSummary: string;
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  additionalKnowledge?: Array<{
    documentTitle: string;
    topic: string;
    content: string;
  }>;
}): ChatMessage[] {
  const { followUpQuestion, scenarioInfo, initialAnalysisSummary, conversationHistory, additionalKnowledge } =
    params;

  const systemPrompt =
    'You are TacticalLens Tactical Agent continuing a tactical conversation with a user about a specific match scenario. ' +
    'Maintain deep context of the previously analyzed scenario, players, pressing direction, and tactical concepts.\n' +
    'IMPORTANT RULES:\n' +
    '1. Direct Answer: Answer the user\'s specific follow-up question directly and thoroughly without re-summarizing the entire initial analysis.\n' +
    '2. Grounded references: Reference specific player names, roles, numbers, and pitch areas from the scenario.\n' +
    '3. Tactical Accuracy: Distinguish between verified theoretical principles and scenario-specific observations.\n' +
    '4. Output JSON: Respond with a JSON object with keys: "answer" (string), "relevant_players_mentioned" (array of strings), and "clarified_tactics" (array of strings).\n';

  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  // Provide initial scenario & analysis baseline as context
  const initialContext =
    `### SCENARIO BASELINE: ${scenarioInfo.title || 'Scenario'} (${scenarioInfo.match_phase || 'Phase'})\n` +
    `Attacking: ${scenarioInfo.attacking_team?.name || 'Attacking'} | Defending: ${scenarioInfo.defending_team?.name || 'Defending'}\n` +
    `Initial Analysis Summary: ${initialAnalysisSummary}\n`;

  messages.push({ role: 'system', content: initialContext });

  // Prior conversation history turns (pruned to last 6 for token efficiency)
  const historySlice = conversationHistory.slice(-6);
  for (const msg of historySlice) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Additional retrieved knowledge if any
  if (additionalKnowledge && additionalKnowledge.length > 0) {
    let kText = '\n### ADDITIONAL RETRIEVED TACTICAL KNOWLEDGE FOR FOLLOW-UP:\n';
    for (const chunk of additionalKnowledge) {
      kText += `- Source: ${chunk.documentTitle}: ${chunk.content}\n`;
    }
    messages.push({ role: 'system', content: kText });
  }

  // Current user follow-up inquiry
  messages.push({
    role: 'user',
    content:
      `User Follow-up Question: "${followUpQuestion}"\n\n` +
      'Respond in JSON format with keys: answer (string), relevant_players_mentioned (list of player names/numbers), ' +
      'clarified_tactics (list of key tactical terms clarified).',
  });

  return messages;
}
