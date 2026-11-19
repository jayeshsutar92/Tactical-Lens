import type { Request, Response, NextFunction } from 'express';
import { AnalysisService } from '../services/analysisService.js';
import type { AnalysisQueryInput } from '../schemas/analysis.js';

export class AnalysisController {
  public static async listAnalyses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AnalysisService.getAnalyses(req.query as unknown as AnalysisQueryInput);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getAnalysisById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analysisId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await AnalysisService.getAnalysisById(analysisId as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getAnalysisStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analysisId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await AnalysisService.getAnalysisStatus(analysisId as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
