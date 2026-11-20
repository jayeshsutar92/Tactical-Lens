import { describe, it, expect } from 'vitest';
import {
  EmbeddingService,
  generateDeterministicFallback,
} from '../src/services/embeddingService.js';

describe('EmbeddingService & Vector Math', () => {
  it('generates a 384-dimensional unit-normalized deterministic vector', () => {
    const text = 'Liverpool 4-3-3 high press trap along touchline';
    const vec = generateDeterministicFallback(text, 384);

    expect(vec).toHaveLength(384);

    // Verify unit length (L2 norm should be ~1.0)
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 5);
  });

  it('guarantees identical embeddings for identical text (determinism)', () => {
    const text = 'Low-block compactness and Zone 14 screening';
    const vec1 = generateDeterministicFallback(text, 384);
    const vec2 = generateDeterministicFallback(text, 384);

    expect(vec1).toEqual(vec2);
  });

  it('generates distinct vectors for distinct text inputs', () => {
    const vecA = generateDeterministicFallback('Counter-pressing within 5 seconds', 384);
    const vecB = generateDeterministicFallback('Deep defensive line and box clearing', 384);

    expect(vecA).not.toEqual(vecB);
    const sim = EmbeddingService.cosineSimilarity(vecA, vecB);
    expect(sim).toBeLessThan(0.95);
  });

  it('handles empty or blank text gracefully with zero vector', async () => {
    const zeroVec = await EmbeddingService.generateEmbedding('');
    expect(zeroVec).toHaveLength(384);
    expect(zeroVec.every((v) => v === 0)).toBe(true);

    const blankVec = await EmbeddingService.generateEmbedding('   ');
    expect(blankVec.every((v) => v === 0)).toBe(true);
  });

  it('batch generates embeddings for multiple texts', async () => {
    const texts = [
      'Gegenpressing and transition moments',
      'Defensive compactness and line distance',
      'Cover shadows blocking vertical passes',
    ];
    const embeddings = await EmbeddingService.generateEmbeddings(texts);

    expect(embeddings).toHaveLength(3);
    for (const emb of embeddings) {
      expect(emb).toHaveLength(384);
      const norm = Math.sqrt(emb.reduce((sum, v) => sum + v * v, 0));
      expect(norm).toBeCloseTo(1.0, 5);
    }
  });

  it('correctly calculates cosine similarity for unit and orthogonal vectors', () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];
    const vecD = [-1, 0, 0];

    expect(EmbeddingService.cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 5);
    expect(EmbeddingService.cosineSimilarity(vecA, vecC)).toBeCloseTo(0.0, 5);
    expect(EmbeddingService.cosineSimilarity(vecA, vecD)).toBeCloseTo(-1.0, 5);
  });

  it('chunks document content into structured overview, principles, and paragraphs', () => {
    const title = 'High Pressing Mechanics';
    const topic = 'high_pressing';
    const summary = 'Proactive high block disrupting build-up in final third.';
    const content =
      'Paragraph 1: High pressing requires the entire team to push forward as a cohesive unit.\n\n' +
      'Paragraph 2: Funneling runs force the opponent towards the sideline trap zone.';
    const principles = [
      'Keep block length under 30 meters.',
      'Cut off switch passing lanes.',
    ];

    const chunks = EmbeddingService.chunkDocumentContent(
      title,
      topic,
      summary,
      content,
      principles
    );

    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks[0]).toContain(`Title: ${title}`);
    expect(chunks[0]).toContain(`Topic: ${topic}`);
    expect(chunks[1]).toContain('Tactical Principles for High Pressing Mechanics:');
    expect(chunks[1]).toContain('- Keep block length under 30 meters.');
    expect(chunks[2]).toContain('Paragraph 1: High pressing requires');
  });
});
