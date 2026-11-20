import { Router } from 'express';
import { KnowledgeController } from '../controllers/knowledgeController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { knowledgeDocumentCreateSchema } from '../schemas/knowledge.js';
import { uuidSchema } from '../schemas/common.js';
import { z } from 'zod';

const docIdParamSchema = z.object({
  id: uuidSchema,
});

export const knowledgeRouter = Router();

knowledgeRouter.get('/topics', KnowledgeController.listTopics);
knowledgeRouter.post('/seed', KnowledgeController.seedKnowledge);
knowledgeRouter.get('/', KnowledgeController.listDocuments);
knowledgeRouter.get('/:id', validateParams(docIdParamSchema), KnowledgeController.getDocumentById);
knowledgeRouter.post(
  '/',
  validateBody(knowledgeDocumentCreateSchema),
  KnowledgeController.createDocument
);
