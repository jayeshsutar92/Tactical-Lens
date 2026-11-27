import type { Request, Response, NextFunction } from 'express';
import { ScenarioService } from '../services/scenarioService.js';
import type {
  ScenarioCreateInput,
  ScenarioQueryInput,
  ScenarioUpdateInput,
} from '../schemas/scenario.js';

export class ScenarioController {
  public static async listScenarios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scenarios = await ScenarioService.getScenarios(req.query as unknown as ScenarioQueryInput);
      res.status(200).json(scenarios);
    } catch (err) {
      next(err);
    }
  }

  public static async getScenarioById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scenarioId = Array.isArray(req.params.scenario_id)
        ? req.params.scenario_id[0]
        : req.params.scenario_id;
      const scenario = await ScenarioService.getScenarioById(scenarioId as string);
      res.status(200).json(scenario);
    } catch (err) {
      next(err);
    }
  }

  public static async createScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scenario = await ScenarioService.createScenario(req.body as ScenarioCreateInput);
      res.status(201).json(scenario);
    } catch (err) {
      next(err);
    }
  }

  public static async updateScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scenarioId = Array.isArray(req.params.scenario_id)
        ? req.params.scenario_id[0]
        : req.params.scenario_id;
      const scenario = await ScenarioService.updateScenario(
        scenarioId as string,
        req.body as ScenarioUpdateInput
      );
      res.status(200).json(scenario);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scenarioId = Array.isArray(req.params.scenario_id)
        ? req.params.scenario_id[0]
        : req.params.scenario_id;
      await ScenarioService.deleteScenario(scenarioId as string);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
}
