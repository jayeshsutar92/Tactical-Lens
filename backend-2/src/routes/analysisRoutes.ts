import { Router } from 'express';
import { AnalysisController } from '../controllers/analysisController.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  analysisCreateRequestSchema,
  analysisIdParamSchema,
  analysisQuerySchema,
} from '../schemas/analysis.js';

export const analysisRouter = Router();

analysisRouter.post(
  '/',
  validateBody(analysisCreateRequestSchema),
  AnalysisController.createAnalysis
);

analysisRouter.get(
  '/',
  validateQuery(analysisQuerySchema),
  AnalysisController.listAnalyses
);

analysisRouter.get(
  '/:id',
  validateParams(analysisIdParamSchema),
  AnalysisController.getAnalysisById
);

analysisRouter.get(
  '/:id/status',
  validateParams(analysisIdParamSchema),
  AnalysisController.getAnalysisStatus
);
