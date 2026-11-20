import type { Request, Response, NextFunction } from 'express';
import { KnowledgeService } from '../services/knowledgeService.js';
import type { KnowledgeDocumentCreate } from '../schemas/knowledge.js';
import { EntityNotFoundError } from '../utils/errors.js';

export class KnowledgeController {
  public static async listTopics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const topics = await KnowledgeService.getTopicsSummary();
      res.status(200).json(topics);
    } catch (err) {
      next(err);
    }
  }

  public static async listDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const topic = req.query.topic as string | undefined;
      const category = req.query.category as string | undefined;
      const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const docs = await KnowledgeService.getKnowledgeDocuments(undefined, {
        topic,
        category,
        skip,
        limit,
      });
      res.status(200).json(docs);
    } catch (err) {
      next(err);
    }
  }

  public static async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const doc = await KnowledgeService.getKnowledgeDocumentById(undefined, docId as string);
      if (!doc) {
        throw new EntityNotFoundError('KnowledgeDocument', docId as string);
      }
      res.status(200).json(doc);
    } catch (err) {
      next(err);
    }
  }

  public static async createDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await KnowledgeService.createKnowledgeDocument(
        undefined,
        req.body as KnowledgeDocumentCreate
      );
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  }

  public static async seedKnowledge(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await KnowledgeService.seedCuratedKnowledge();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
