import { Router } from 'express';
import { analysisRouter } from './analysisRoutes.js';
import { healthRouter } from './healthRoutes.js';
import { scenarioRouter } from './scenarioRoutes.js';

export const apiV1Router = Router();

// Mount individual domain route modules
apiV1Router.use('/', healthRouter);
apiV1Router.use('/scenarios', scenarioRouter);
apiV1Router.use('/analysis', analysisRouter);
