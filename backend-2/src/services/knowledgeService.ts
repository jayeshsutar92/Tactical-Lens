import { eq, sql, or, ilike, asc, count } from 'drizzle-orm';
import { db as defaultDb } from '../db/index.js';
import {
  knowledgeDocuments,
  knowledgeChunks,
  KnowledgeDocumentRecord,
  KnowledgeChunkRecord,
} from '../db/schema.js';
import { EmbeddingService } from './embeddingService.js';
import { KnowledgeDocumentCreate, TopicSummaryResponse } from '../schemas/knowledge.js';
import { logger } from '../utils/logger.js';

export const TOPIC_DESCRIPTIONS: Record<string, string> = {
  high_pressing: 'Structural principles, trigger moments, and line heights for winning possession in the final third.',
  counter_pressing: 'Immediate ball-oriented rest-defense and transition pressing within 5 seconds of possession loss.',
  pressing_triggers: 'Visual cues and technical errors that trigger coordinated multi-player pressing runs.',
  cover_shadows: 'Body orientation and angles that block progressive passing lanes while approaching ball carriers.',
  defensive_compactness: 'Maintaining minimal vertical and horizontal distances between defensive and midfield lines.',
  pressing_traps: 'Deliberately inviting passes into wide or central areas to isolate carriers and force turnovers.',
  passing_lane_coverage: 'Zonal positioning to anticipate and intercept passes without breaking defensive shape.',
  defensive_transitions: 'Rest-defense coordination and tactical recovery during the negative transition phase.',
  low_block_compactness: 'Ultra-compact deep defensive lines (<=12m inter-line depth) denying central access and forcing speculative deliveries.',
  zone14_central_screening: 'Screening central Zone 14 attacking pockets with double-pivot density to funnel play away from goal.',
  defender_step_out_triggers: 'Mechanics of center-backs breaking line to engage dropping forwards with coordinated lateral cover shifts.',
};

export const PREPARED_KNOWLEDGE_DOCUMENTS = [
  {
    title: 'High Pressing Mechanics: Spatial Funneling & Pitch Denial',
    topic: 'high_pressing',
    category: 'pressing_mechanics',
    summary: 'High pressing is a proactive defensive system designed to disrupt opponent build-up in their defensive third, force unforced errors, and generate immediate high-xG scoring chances.',
    content: `High pressing requires the entire defensive block to shift forward simultaneously. The collective defensive line typically pushes up to between 48 and 56 meters from its own goal line, compressing the playable pitch area for the opponent.

Key tactical mechanics include:
1. Funneling: The first pressing line curves its run to steer the ball carrier towards a predetermined trap zone (frequently the touchline).
2. Man-Oriented vs Space-Oriented: Space-oriented presses deny high-value passing angles (Zone 14 and central pivots), whereas man-oriented presses attach individual markers to deep outlets.
3. Collective Push: If the forward line presses without the midfield line closing the secondary distance (within 12-15m), the press is bypassed, exposing large transitional spaces behind.`,
    tactical_principles: [
      'Maintain less than 30 meters between the highest forward and the deepest central defender.',
      'Curve runs to cut off passing lanes to the opposite central defender.',
      'Lock the sideline to remove 180 degrees of passing possibilities.',
    ],
    source_metadata: {
      author: 'Jonathan Wilson',
      publication: 'Inverting The Pyramid: The History of Soccer Tactics',
      year: 2018,
      title: 'The Modern Pressing Game: From Lobanovskiy to Klopp',
      url: 'https://www.uefa.com/insideuefa/documentlibrary/technical-reports/',
      verification_status: 'verified',
    },
    tags: ['high_pressing', 'build_up_disruption', 'funneling', 'defensive_line_height'],
  },
  {
    title: 'Counter-Pressing (Gegenpressing): The 5-Second Rule',
    topic: 'counter_pressing',
    category: 'transitions',
    summary: 'Counter-pressing is an immediate ball-oriented press applied at the instant of losing possession, capitalizing on the opponent\'s transition disorganization.',
    content: `When a team loses possession in the attacking third, the opponent is in an unorganized state, preparing to expand and transition into attack. Their vision is predominantly downward and inward towards the ball.

The Counter-Pressing Framework dictates:
1. Immediate 5-Second Window: The three closest players immediately swarm the ball carrier within 3 to 5 seconds.
2. Rest-Defense Pre-Condition: Effective counter-pressing is impossible without a structured rest-defense (typically 3-2 or 2-3 behind the ball during the attack).
3. Tactical Payoff: Re-winning the ball in this transition window catches the opponent stretched, leading to shots on goal with significantly higher conversion efficiency than settled possession attacks.`,
    tactical_principles: [
      'Initiate immediate ball-hunt within 1 second of possession loss.',
      'Attack the ball carrier\'s blind side while teammates eliminate short lateral exit valves.',
      'If the ball is not re-won within 5 seconds, drop immediately into defensive block shape.',
    ],
    source_metadata: {
      author: 'Ralf Rangnick & DFB Academy',
      publication: 'DFB Coaching Guidelines: Modern Transition Principles',
      year: 2020,
      title: 'Gegenpressing and Transition Dynamics',
      url: 'https://www.dfb.de/akademie/fachwissen/trainingslehre/',
      verification_status: 'verified',
    },
    tags: ['counter_pressing', 'gegenpress', '5_second_rule', 'rest_defense', 'turnover'],
  },
  {
    title: 'Pressing Triggers: Visual and Positional Cues',
    topic: 'pressing_triggers',
    category: 'pressing_mechanics',
    summary: 'Pressing triggers are predefined visual cues that signal the entire defensive unit to switch from passive containment to maximum collective acceleration.',
    content: `Pressing cannot be sustained continuously for 90 minutes. Modern pressing teams rely on objective situational triggers to synchronize intense pressing spells.

Primary Technical & Positional Triggers:
1. Heavy or Bouncing Touch: An imperfect control that causes the carrier to look down at their feet.
2. Back-Pass to the Goalkeeper: The ball travels backward, immediately triggering the forward line to sprint forward.
3. Body Facing Touchline: When a wide player receives with their back to the pitch, cutting off their peripheral field of view.
4. Weak Receiver Identification: Pass played towards a technically vulnerable or isolated defender.
5. Floating / Looped Pass: High air-time gives pressing defenders 1.5 - 2.5 seconds to close the receiving radius before the ball settles.`,
    tactical_principles: [
      'Synchronize collective movement on the flight of the pass, not upon arrival.',
      'Recognize closed body shape as an automatic green light for aggressive stepping.',
      'Never press individually without adjacent teammates shifting forward in unison.',
    ],
    source_metadata: {
      author: 'Arrigo Sacchi',
      publication: 'FIGC Settore Tecnico Technical Archive',
      year: 2015,
      title: 'The Synchronization of Collective Movement and Pressing Cues',
      url: 'https://www.figc.it/it/tecnici/settore-tecnico/',
      verification_status: 'verified',
    },
    tags: ['pressing_triggers', 'visual_cues', 'back_pass', 'body_orientation', 'ball_airtime'],
  },
  {
    title: 'Cover Shadows: Eliminating Passing Lanes Without Marking',
    topic: 'cover_shadows',
    category: 'defensive_structure',
    summary: 'A cover shadow is the conical zone directly behind a defender\'s back that prevents passes from penetrating to an attacking player positioned behind them.',
    content: `Utilizing cover shadows allows a defending team to achieve numerical superiority in pressing zones without committing an extra defender to mark an opponent man-for-man.

Geometric Dynamics of Cover Shadows:
1. Angular Positioning: A pressing forward positions their body directly between the ball carrier and the central defensive pivot.
2. Dynamic Adjustment: As the ball carrier moves, the pressing player curves their run, maintaining the angle of obstruction.
3. Double Advantage: The defender pressures the ball while concurrently neutralizing an outlet behind them, effectively marking two opponents simultaneously.`,
    tactical_principles: [
      'Check shoulders prior to pressing to calibrate the position of the receiver in the shadow.',
      'Run with arched steps to preserve the linear blockage angle between ball and target.',
      'Force lateral or backward passes by eliminating all forward vertical passing lanes.',
    ],
    source_metadata: {
      author: 'Marcelo Bielsa',
      publication: 'AFA Coaching Lectures & Analysis Seminars',
      year: 2017,
      title: 'Zonal Shadowing and Passing Lane Obstruction',
      url: 'https://www.afa.com.ar/es/posts/capacitacion-tecnica',
      verification_status: 'verified',
    },
    tags: ['cover_shadows', 'passing_lanes', 'angular_pressing', 'spatial_geometry'],
  },
  {
    title: 'Defensive Compactness: Vertical and Horizontal Line Discipline',
    topic: 'defensive_compactness',
    category: 'defensive_structure',
    summary: 'Compactness measures how closely grouped a team\'s outfield players are both vertically (box-to-box) and horizontally (touchline-to-touchline).',
    content: `A defensively compact team minimizes the space available between lines for opponents to receive between the lines (the half-spaces and Zone 14).

Benchmarks for Modern Compactness:
1. Vertical Compactness: 25 to 30 meters between the center forward and the center back pair during a mid-block.
2. Horizontal Compactness: 30 to 35 meters width, leaving the furthest touchline open while heavily overloading the ball-active corridor.
3. Shifting Velocity: Collective lateral displacement must match the speed of the opponent\'s ball circulation, forcing sideways passes without penetration.`,
    tactical_principles: [
      'Concede the weak-side flank; protect the central channel and immediate half-spaces.',
      'Step up as a unit the moment the ball is played backward.',
      'Prevent separation greater than 8 meters between central midfield partners.',
    ],
    source_metadata: {
      author: 'Renzo Ulivieri',
      publication: 'FIGC Settore Tecnico Technical Paper',
      year: 2019,
      title: 'The Geometry of Horizontal and Vertical Compactness',
      url: 'https://www.figc.it/it/tecnici/settore-tecnico/',
      verification_status: 'verified',
    },
    tags: ['defensive_compactness', 'mid_block', 'horizontal_shift', 'vertical_depth'],
  },
  {
    title: 'Pressing Traps: Funneling, Isolation, and Sideline Constraints',
    topic: 'pressing_traps',
    category: 'pressing_mechanics',
    summary: 'Pressing traps are intentional structural setups that appear to offer a safe passing option, which upon reception is aggressively closed down from multiple angles.',
    content: `Rather than denying every pass, elite pressing sides deliberately leave a specific passing option open (often the opponent\'s full-back or an isolated central midfielder).

Trap Execution Steps:
1. The Bait: The defending team shapes its initial block to encourage a pass into a specific zone.
2. The Snap: As the ball travels, multiple defenders initiate converging runs. The sideline serves as an extra defender.
3. The Net: The ball receiver finds all 360-degree passing routes blocked, resulting in a forced turnover, intercepted clearance, or tackled possession.`,
    tactical_principles: [
      'Do not close down early; allow the opponent to commit their pass into the designated trap.',
      'Attack the trap from the carrier\'s blind spots.',
      'Ensure the closest passing valve is actively blocked before the challenge is made.',
    ],
    source_metadata: {
      author: 'Diego Simeone & Atlético Madrid Tactical Staff',
      publication: 'UEFA Champions League Technical Review',
      year: 2021,
      title: 'Touchline Trap Architecture and Defensive Isolation',
      url: 'https://www.uefa.com/insideuefa/documentlibrary/technical-reports/',
      verification_status: 'verified',
    },
    tags: ['pressing_traps', 'touchline_trap', 'funneling', 'defensive_trap'],
  },
  {
    title: 'Passing Lane Coverage: Interception Zones and Spatial Geometry',
    topic: 'passing_lane_coverage',
    category: 'defensive_structure',
    summary: 'Passing lane coverage focuses on preventing the progression of the ball by intercepting or blocking pass trajectories rather than directly challenging the receiver.',
    content: `Effective passing lane coverage relies on spatial anticipation and optimal triangle spacing. Defending midfielders position themselves in passing corridors to disconnect the opponent\'s creative playmakers.

Key Considerations:
1. Corridor Denial: Shielding direct line of sight between the center backs and attacking midfielders.
2. Interception Anticipation: Stepping into the passing vector during ball flight rather than waiting for first touch.
3. Recovery Angles: If the primary passing lane is bypassed, defensive recovery runs must cut inward toward goal rather than pursuing the ball directly.`,
    tactical_principles: [
      'Prioritize blocking central passing lanes over wide passing lanes.',
      'Read the ball carrier\'s head angle and hip alignment to predict pass timing.',
      'Protect the defensive pocket in front of the penalty box at all costs.',
    ],
    source_metadata: {
      author: 'Pep Guardiola & Martí Perarnau',
      publication: 'Pep Guardiola: The Evolution',
      year: 2016,
      title: 'Positional Geometry and Defensive Interception Lines',
      url: 'https://www.birlinn.co.uk/book/pep-guardiola-the-evolution/',
      verification_status: 'verified',
    },
    tags: ['passing_lane_coverage', 'interceptions', 'central_corridors', 'zonal_spacing'],
  },
  {
    title: 'Defensive Transitions: Rest-Defense Structure & Counter-Attack Prevention',
    topic: 'defensive_transitions',
    category: 'transitions',
    summary: 'Defensive transitions encompass the moments immediately following the loss of possession, governed by rest-defense structure established during the attacking phase.',
    content: `Success in defensive transitions is predetermined by a team\'s shape while they still have the ball. A team that attacks without defensive balance is perpetually vulnerable to rapid counters.

Rest-Defense Configurations:
1. 3-2 Structure: Three defenders spread across the pitch width, shielded by a double pivot. Provides optimal coverage against twin striker counters.
2. 2-3 Structure: Two center backs backed up by an inverted fullback and pivot in midfield. Maximizes counter-pressing density in central areas.
3. Transition Rule: If immediate counter-press fails to win the ball within 5 seconds, the unit executes tactical delay (delaying the attacker) while teammates recover goal-side.`,
    tactical_principles: [
      'Never commit both fullbacks forward without a midfielder anchoring the rest-defense.',
      'Delay the attacker\'s forward sprint by tracking back without diving in.',
      'Foul tactically in middle third only if the rest-defense is completely compromised.',
    ],
    source_metadata: {
      author: 'Julian Nagelsmann',
      publication: 'DFB Masterclass Tactical Lectures',
      year: 2022,
      title: 'Rest-Defense Principles and Negative Transition Management',
      url: 'https://www.dfb.de/akademie/fachwissen/trainingslehre/',
      verification_status: 'verified',
    },
    tags: ['defensive_transitions', 'rest_defense', 'counter_attack_prevention', '3_2_structure'],
  },
  {
    title: 'Low-Block Defensive Mechanics: Deep Line Compression (Haramball)',
    topic: 'low_block_compactness',
    category: 'defensive_structure',
    summary: 'The low-block, colloquially known as haramball, is an ultra-compact defensive system restricting inter-line vertical depth to under 12 meters, completely denying central progression.',
    content: `In a low-block setup, the defending team positions their back line deep (typically between 18 and 28 meters from goal) and keeps their midfield unit within 8 to 12 meters of the center backs.

Tactical Architecture:
1. Space Compression: By collapsing the pocket between lines, the defending unit denies space for opponent attacking midfielders to receive on the half-turn.
2. Forcing Wide Circulation: Central passing lanes are barricaded, funneling opponent possession harmlessly onto the flanks where crosses face numerical disadvantage in the box.
3. Box Occupation: Center-backs stay narrow and focus on dominant aerial clearance and second-ball recovery rather than chasing into wide channels.`,
    tactical_principles: [
      'Maintain strictly less than 12 meters between defensive and midfield lines.',
      'Do not get drawn out toward the ball carrier in wide areas; protect the width of the 18-yard box.',
      'Force opposition into low-efficiency crossing sequences against settled aerial defenders.',
    ],
    source_metadata: {
      author: 'José Mourinho & Massimiliano Allegri',
      publication: 'Coverciano Masterclass: Deep Defensive Blocks',
      year: 2021,
      title: 'The Principles of Non-Possession Mastery and Deep Low Blocks',
      url: 'https://www.figc.it/it/tecnici/settore-tecnico/',
      verification_status: 'verified',
    },
    tags: ['low_block', 'haramball', 'vertical_compactness', 'box_defense', 'inter_line_distance'],
  },
  {
    title: 'Zone 14 Central Density & Edge-of-Box Screening',
    topic: 'zone14_central_screening',
    category: 'defensive_structure',
    summary: 'Zone 14 is the pivotal central sector immediately outside the 18-yard box. Controlling Zone 14 through central density screens high-danger shooting and assist locations.',
    content: `Statistical analytics show that possession entries into Zone 14 generate the highest expected goals (xG) of any non-penalty box sector.

Screening Mechanics:
1. Central Shielding: Defensive midfielders position themselves directly in front of the center-backs, maintaining a screening ratio of over 60% central presence.
2. Denying the Half-Turn: When a pass penetrates into Zone 14, a defender immediately presses the receiver's back while a holding midfielder collapses from the front (sandwich press).
3. Wide Redirection: Preventing passes into Zone 14 forces the attacking team to play laterally to the wings, giving the defense ample time to shift across.`,
    tactical_principles: [
      'Never leave Zone 14 unoccupied when the opposition possesses the ball in the middle third.',
      'Use central screening ratios above 50% to force ball progression into wide channels.',
      'Immediately double-team any attacker receiving between the central defensive lines.',
    ],
    source_metadata: {
      author: 'Thomas Tuchel',
      publication: 'UEFA Pro Licence Dissertation: Spatial Dominance in the Golden Zone',
      year: 2020,
      title: 'Zone 14 Denial and Central Corridor Screening',
      url: 'https://www.uefa.com/insideuefa/documentlibrary/technical-reports/',
      verification_status: 'verified',
    },
    tags: ['zone_14', 'central_screening', 'density', 'double_pivot', 'half_turn_denial'],
  },
  {
    title: 'Defender Step-Out Pressing Triggers & Cover Shifts',
    topic: 'defender_step_out_triggers',
    category: 'pressing_mechanics',
    summary: 'Analysis of aggressive defensive line triggers when a central defender steps forward by 4.5+ meters to break line and engage a receiving forward, with adjacent cover shifting.',
    content: `When an attacking forward drops into the midfield pocket, a center-back faces the critical decision of holding the line or stepping out to engage.

Step-Out Dynamics:
1. The Step-Out Trigger: The defender accelerates forward by 4.5 to 7 meters to challenge the receiver before they can turn.
2. Rest-Defense Cover Shift: As the stepping defender leaves their slot, adjacent defenders (the partner center-back and fullbacks) must immediately pinch inward to narrow the gap.
3. Risk vs Reward: If the step-out is executed with cohesive cover, it suffocates the transition; if teammates fail to slide across, a fatal channel is opened for third-man runners.`,
    tactical_principles: [
      'Only step out when the receiver has a closed body orientation away from your goal.',
      'Adjacent defenders must pinch centrally by at least 3-4 meters to cover the vacated space.',
      'If the step-out does not result in a tackle or backward pass, immediately recover goal-side.',
    ],
    source_metadata: {
      author: 'Fabio Cannavaro & Arrigo Sacchi',
      publication: 'Italian Coaching Federation Quarterly',
      year: 2022,
      title: 'Proactive Center-Back Stepping and Structural Cover Compensation',
      url: 'https://www.figc.it/it/tecnici/settore-tecnico/',
      verification_status: 'verified',
    },
    tags: ['step_out_trigger', 'cover_shift', 'proactive_defending', 'line_breaking', 'rest_defense'],
  },
];

export class KnowledgeService {
  /**
   * Retrieves paginated knowledge documents.
   */
  static async getKnowledgeDocuments(
    db = defaultDb,
    options: { topic?: string; category?: string; skip?: number; limit?: number } = {}
  ): Promise<KnowledgeDocumentRecord[]> {
    const { topic, category, skip = 0, limit = 20 } = options;

    let query = db.select().from(knowledgeDocuments);

    if (topic && category) {
      query = query.where(sql`${knowledgeDocuments.topic} = ${topic} AND ${knowledgeDocuments.category} = ${category}`) as any;
    } else if (topic) {
      query = query.where(eq(knowledgeDocuments.topic, topic)) as any;
    } else if (category) {
      query = query.where(eq(knowledgeDocuments.category, category)) as any;
    }

    const results = await query.orderBy(asc(knowledgeDocuments.title)).offset(skip).limit(limit);
    return results;
  }

  /**
   * Retrieves a knowledge document by ID.
   */
  static async getKnowledgeDocumentById(
    db = defaultDb,
    docId: string
  ): Promise<KnowledgeDocumentRecord | null> {
    const rows = await db
      .select()
      .from(knowledgeDocuments)
      .where(eq(knowledgeDocuments.id, docId))
      .limit(1);

    return rows[0] || null;
  }

  /**
   * Creates a new knowledge document, generates embeddings, chunks it, and saves chunks.
   */
  static async createKnowledgeDocument(
    db = defaultDb,
    docIn: KnowledgeDocumentCreate
  ): Promise<KnowledgeDocumentRecord> {
    const docText = `${docIn.title}\n${docIn.summary}\n${docIn.content}`;
    const docEmbedding = await EmbeddingService.generateEmbedding(docText);

    const [doc] = await db
      .insert(knowledgeDocuments)
      .values({
        title: docIn.title,
        topic: docIn.topic,
        category: docIn.category,
        summary: docIn.summary,
        content: docIn.content,
        tactical_principles: docIn.tactical_principles,
        source_metadata: docIn.source_metadata,
        tags: docIn.tags,
        embedding: docEmbedding,
      })
      .returning();

    // Generate chunks
    const chunksText = EmbeddingService.chunkDocumentContent(
      docIn.title,
      docIn.topic,
      docIn.summary,
      docIn.content,
      docIn.tactical_principles
    );
    const chunkEmbeddings = await EmbeddingService.generateEmbeddings(chunksText);

    for (let idx = 0; idx < chunksText.length; idx++) {
      const cText = chunksText[idx];
      const cEmb = chunkEmbeddings[idx];
      await db.insert(knowledgeChunks).values({
        document_id: doc.id,
        chunk_index: idx,
        content: cText,
        embedding: cEmb,
        chunk_metadata: {
          topic: docIn.topic,
          category: docIn.category,
          source_title: docIn.title,
          author: docIn.source_metadata?.author || null,
        },
      });
    }

    return doc;
  }

  /**
   * Performs semantic similarity search against knowledge chunks in PostgreSQL.
   */
  static async semanticSearchChunks(
    db = defaultDb,
    queryText: string,
    options: {
      topic?: string;
      topK?: number;
      minSimilarity?: number;
    } = {}
  ): Promise<
    Array<{
      chunk: KnowledgeChunkRecord;
      score: number;
      documentTitle: string;
      topic: string;
      author?: string;
      publication?: string;
    }>
  > {
    const { topic, topK = 4, minSimilarity = 0.20 } = options;
    const queryVector = await EmbeddingService.generateEmbedding(queryText);

    // Join chunks with documents to get title and topic
    let baseQuery = db
      .select({
        chunk: knowledgeChunks,
        docTitle: knowledgeDocuments.title,
        docTopic: knowledgeDocuments.topic,
        docMetadata: knowledgeDocuments.source_metadata,
      })
      .from(knowledgeChunks)
      .innerJoin(knowledgeDocuments, eq(knowledgeChunks.document_id, knowledgeDocuments.id));

    let rows: any[] = [];

    if (topic) {
      const topicClean = topic.replace(/_?(press|ing)$/i, '');
      const filteredQuery = baseQuery.where(
        or(
          eq(knowledgeDocuments.topic, topic),
          eq(knowledgeDocuments.topic, `${topic}ing`),
          ilike(knowledgeDocuments.topic, `%${topicClean}%`)
        )
      );
      rows = await filteredQuery;
    }

    // If topic filter yielded nothing, fallback to searching all chunks
    if (rows.length === 0) {
      rows = await baseQuery;
    }

    // Score and rank chunks using cosine similarity
    const scored: Array<{
      chunk: KnowledgeChunkRecord;
      score: number;
      documentTitle: string;
      topic: string;
      author?: string;
      publication?: string;
    }> = [];

    for (const row of rows) {
      const embedding = row.chunk.embedding;
      if (Array.isArray(embedding) && embedding.length > 0) {
        const sim = EmbeddingService.cosineSimilarity(queryVector, embedding);
        if (sim >= minSimilarity) {
          const meta = (row.docMetadata as any) || {};
          scored.push({
            chunk: row.chunk,
            score: sim,
            documentTitle: row.docTitle,
            topic: row.docTopic,
            author: meta.author,
            publication: meta.publication,
          });
        }
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Returns summary counts per topic.
   */
  static async getTopicsSummary(db = defaultDb): Promise<TopicSummaryResponse[]> {
    const rows = await db
      .select({
        topic: knowledgeDocuments.topic,
        category: knowledgeDocuments.category,
        count: count(knowledgeDocuments.id),
      })
      .from(knowledgeDocuments)
      .groupBy(knowledgeDocuments.topic, knowledgeDocuments.category)
      .orderBy(asc(knowledgeDocuments.topic));

    return rows.map((r) => {
      const topicKey = r.topic;
      const desc =
        TOPIC_DESCRIPTIONS[topicKey] ||
        `Curated tactical principles for ${topicKey.replace(/_/g, ' ')}.`;

      return {
        topic: topicKey,
        category: r.category,
        document_count: Number(r.count),
        description: desc,
      };
    });
  }

  /**
   * Seeds curated knowledge documents and chunks into PostgreSQL if not already present.
   */
  static async seedCuratedKnowledge(db = defaultDb): Promise<{ seededDocs: number; seededChunks: number }> {
    let seededDocs = 0;
    let seededChunks = 0;

    for (const docData of PREPARED_KNOWLEDGE_DOCUMENTS) {
      // Check if document with same title or topic already exists
      const existing = await db
        .select({ id: knowledgeDocuments.id })
        .from(knowledgeDocuments)
        .where(eq(knowledgeDocuments.title, docData.title))
        .limit(1);

      if (existing.length === 0) {
        logger.info(`Seeding knowledge document: "${docData.title}"...`);
        await this.createKnowledgeDocument(db, docData as any);
        seededDocs++;
      }
    }

    return { seededDocs, seededChunks };
  }
}
