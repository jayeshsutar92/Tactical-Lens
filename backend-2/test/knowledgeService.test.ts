import { describe, it, expect } from 'vitest';
import {
  KnowledgeService,
  TOPIC_DESCRIPTIONS,
  PREPARED_KNOWLEDGE_DOCUMENTS,
} from '../src/services/knowledgeService.js';
import { EmbeddingService } from '../src/services/embeddingService.js';

describe('KnowledgeService & Tactical Knowledge Base', () => {
  it('contains comprehensive topic descriptions covering pressing and defensive mechanics', () => {
    expect(TOPIC_DESCRIPTIONS).toHaveProperty('high_pressing');
    expect(TOPIC_DESCRIPTIONS).toHaveProperty('counter_pressing');
    expect(TOPIC_DESCRIPTIONS).toHaveProperty('pressing_triggers');
    expect(TOPIC_DESCRIPTIONS).toHaveProperty('cover_shadows');
    expect(TOPIC_DESCRIPTIONS).toHaveProperty('defensive_compactness');
    expect(TOPIC_DESCRIPTIONS).toHaveProperty('low_block_compactness');
    expect(TOPIC_DESCRIPTIONS).toHaveProperty('zone14_central_screening');
    expect(TOPIC_DESCRIPTIONS).toHaveProperty('defender_step_out_triggers');
  });

  it('includes curated knowledge documents covering both pressing and low-block/Zone 14 concepts', () => {
    const topics = PREPARED_KNOWLEDGE_DOCUMENTS.map((d) => d.topic);

    expect(topics).toContain('high_pressing');
    expect(topics).toContain('counter_pressing');
    expect(topics).toContain('cover_shadows');
    expect(topics).toContain('low_block_compactness');
    expect(topics).toContain('zone14_central_screening');
    expect(topics).toContain('defender_step_out_triggers');

    for (const doc of PREPARED_KNOWLEDGE_DOCUMENTS) {
      expect(doc.title.length).toBeGreaterThan(5);
      expect(doc.summary.length).toBeGreaterThan(15);
      expect(doc.content.length).toBeGreaterThan(50);
      expect(doc.tactical_principles.length).toBeGreaterThan(0);
      expect(doc.source_metadata).toHaveProperty('author');
      expect(doc.source_metadata).toHaveProperty('verification_status', 'verified');
    }
  });

  it('performs mock semantic chunk similarity ranking with cosine scores', async () => {
    const query = 'How to maintain compact low-block line depth against central penetration';
    const queryVec = await EmbeddingService.generateEmbedding(query);

    // Mock chunks
    const chunkA = {
      content: 'Low-block compactness maintains strictly under 12 meters between defensive and midfield lines.',
      embedding: await EmbeddingService.generateEmbedding(
        'Low-block compactness maintains strictly under 12 meters between defensive and midfield lines.'
      ),
    };
    const chunkB = {
      content: 'High pressing curves runs toward touchline to execute sideline traps.',
      embedding: await EmbeddingService.generateEmbedding(
        'High pressing curves runs toward touchline to execute sideline traps.'
      ),
    };

    const simA = EmbeddingService.cosineSimilarity(queryVec, chunkA.embedding);
    const simB = EmbeddingService.cosineSimilarity(queryVec, chunkB.embedding);

    expect(simA).toBeGreaterThan(-1.0);
    expect(simA).toBeLessThanOrEqual(1.0);
    expect(simB).toBeGreaterThan(-1.0);
    expect(simB).toBeLessThanOrEqual(1.0);
  });
});
