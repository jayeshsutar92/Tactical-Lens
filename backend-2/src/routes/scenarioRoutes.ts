import { Router } from 'express';
import { ScenarioController } from '../controllers/scenarioController.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  scenarioCreateSchema,
  scenarioIdParamSchema,
  scenarioQuerySchema,
} from '../schemas/scenario.js';

export const scenarioRouter = Router();

scenarioRouter.get(
  '/',
  validateQuery(scenarioQuerySchema),
  ScenarioController.listScenarios
);

scenarioRouter.post(
  '/',
  validateBody(scenarioCreateSchema),
  ScenarioController.createScenario
);

scenarioRouter.get(
  '/:scenario_id',
  validateParams(scenarioIdParamSchema),
  ScenarioController.getScenarioById
);

scenarioRouter.delete(
  '/:scenario_id',
  validateParams(scenarioIdParamSchema),
  ScenarioController.deleteScenario
);
