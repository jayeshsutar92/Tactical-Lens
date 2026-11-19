import { Router } from 'express';
import { AnalysisController } from '../controllers/analysisController.js';
import { validateParams, validateQuery } from '../middleware/validate.js';
import { analysisIdParamSchema, analysisQuerySchema } from '../schemas/analysis.js';

export const analysisRouter = Router();

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
