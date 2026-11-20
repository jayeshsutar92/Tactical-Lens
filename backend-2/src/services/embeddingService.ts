import crypto from 'crypto';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let _pipeline: any = null;
let _pipelineDisabled = false;
let _pipelinePromise: Promise<any> | null = null;

async function getEmbeddingPipeline(): Promise<any> {
  if (_pipelineDisabled || process.env.NODE_ENV === 'test') {
    return null;
  }
  if (_pipeline) {
    return _pipeline;
  }
  if (_pipelinePromise) {
    return _pipelinePromise;
  }

  _pipelinePromise = (async () => {
    try {
      logger.info(`Initializing @huggingface/transformers embedding model: ${config.embeddingModel}...`);
      const { pipeline } = await import('@huggingface/transformers');
      // Set a short initialization timeout so server startup is not blocked if offline
      const initPromise = (pipeline as any)('feature-extraction', config.embeddingModel);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Embedding model load timeout')), 5000)
      );

      _pipeline = await Promise.race([initPromise, timeoutPromise]);
      logger.info('HuggingFace embedding model initialized successfully.');
      return _pipeline;
    } catch (err: any) {
      logger.warn(`Could not initialize @huggingface/transformers model (${err?.message || err}). Fallback mode active.`);
      _pipelineDisabled = true;
      _pipeline = null;
      return null;
    } finally {
      _pipelinePromise = null;
    }
  })();

  return _pipelinePromise;
}

export function generateDeterministicFallback(text: string, dim: number = 384): number[] {
  if (!text || !text.trim()) {
    return new Array(dim).fill(0);
  }

  // Seed PRNG using MD5 hash of text for strict determinism
  const hash = crypto.createHash('md5').update(text, 'utf-8').digest();
  let seed = hash.readUInt32BE(0);

  // Mulberry32 32-bit deterministic PRNG
  function nextRandom(): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Generate normal distributed random variates via Box-Muller transform
  const raw: number[] = new Array(dim);
  for (let i = 0; i < dim; i += 2) {
    const u1 = Math.max(1e-15, nextRandom());
    const u2 = nextRandom();
    const mag = Math.sqrt(-2.0 * Math.log(u1));
    const z0 = mag * Math.cos(2.0 * Math.PI * u2);
    const z1 = mag * Math.sin(2.0 * Math.PI * u2);
    raw[i] = z0;
    if (i + 1 < dim) {
      raw[i + 1] = z1;
    }
  }

  // L2 unit-normalization
  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    sumSq += raw[i] * raw[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      raw[i] = raw[i] / norm;
    }
  }

  return raw;
}

export class EmbeddingService {
  /**
   * Generates a 384-dimensional dense vector embedding for a single text string.
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    if (!text || !text.trim()) {
      return new Array(config.embeddingDimension).fill(0);
    }

    try {
      const pipe = await getEmbeddingPipeline();
      if (pipe) {
        const output = await pipe(text, { pooling: 'mean', normalize: true });
        if (output && output.data) {
          const raw = Array.from(output.data) as number[];
          if (raw.length === config.embeddingDimension) {
            return raw;
          }
        }
      }
    } catch (e: any) {
      logger.warn(`Transformer embedding failed (${e?.message || e}), using deterministic fallback.`);
    }

    return generateDeterministicFallback(text, config.embeddingDimension);
  }

  /**
   * Generates dense vector embeddings for an array of text strings.
   */
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    const results: number[][] = [];
    for (const t of texts) {
      const emb = await this.generateEmbedding(t);
      results.push(emb);
    }
    return results;
  }

  /**
   * Computes cosine similarity between two vectors.
   */
  static cosineSimilarity(v1: number[], v2: number[]): number {
    if (!v1 || !v2 || v1.length === 0 || v2.length === 0 || v1.length !== v2.length) {
      return 0.0;
    }

    let dot = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
      normA += v1[i] * v1[i];
      normB += v2[i] * v2[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (denom === 0.0) return 0.0;
    return Math.max(-1.0, Math.min(1.0, dot / denom));
  }

  /**
   * Splits document content into structured, semantically meaningful text chunks for RAG.
   */
  static chunkDocumentContent(
    title: string,
    topic: string,
    summary: string,
    content: string,
    tacticalPrinciples?: string[]
  ): string[] {
    const chunks: string[] = [];

    // Chunk 1: Document Overview & Summary
    const overview = `Title: ${title}\nTopic: ${topic}\nSummary: ${summary}`;
    chunks.push(overview);

    // Chunk 2: Tactical Principles (if present)
    if (tacticalPrinciples && tacticalPrinciples.length > 0) {
      const principlesStr = tacticalPrinciples.join('\n- ');
      chunks.push(`Tactical Principles for ${title}:\n- ${principlesStr}`);
    }

    // Chunk 3+: Content paragraphs or sections
    const paragraphs = content
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 30);

    for (const p of paragraphs) {
      chunks.push(`${title} (${topic}):\n${p}`);
    }

    return chunks;
  }
}
