import http from 'http';
import { createApp } from '../dist/app.js';
import { checkDbConnection, checkSchemaReadiness, closeDb } from '../dist/db/index.js';

const PORT = 8005;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          if (data) json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING BACKEND-2 VERIFICATION TESTS ---');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${message}`);
      failedCount++;
    }
  }

  // 1. Direct DB checks
  console.log('\n1. Testing Database Connectivity & Schema Readiness...');
  const dbOk = await checkDbConnection();
  assert(dbOk === true, 'Database connectivity (checkDbConnection)');
  const schemaOk = await checkSchemaReadiness();
  assert(schemaOk === true, "Schema readiness check (to_regclass('public.scenarios'))");

  // 2. Start HTTP Server
  const app = createApp();
  const server = app.listen(PORT);
  await new Promise((res) => setTimeout(res, 300));
  console.log(`\n2. HTTP Server listening on ${BASE_URL}`);

  try {
    // 3. Test Root endpoint
    console.log('\n3. Testing Root Endpoint GET / ...');
    const rootRes = await makeRequest('GET', '/');
    assert(rootRes.status === 200, 'Root status is 200');
    assert(rootRes.data?.status === 'running', 'Root response reports running status');

    // 4. Test Health endpoint
    console.log('\n4. Testing Health Endpoint GET /api/v1/health ...');
    const healthRes = await makeRequest('GET', '/api/v1/health');
    assert(healthRes.status === 200, 'Health endpoint status is 200');
    assert(healthRes.data?.status === 'healthy', "Health status is 'healthy'");
    assert(healthRes.data?.database === 'connected', "Database status is 'connected'");
    assert(typeof healthRes.data?.timestamp === 'string', 'Timestamp present in ISO format');

    // 4b. Test Health 503 Behavior when schema is missing
    console.log('\n4b. Testing Health 503 Behavior (schema missing simulation) ...');
    const { HealthService } = await import('../dist/services/healthService.js');
    const originalGetHealth = HealthService.getHealth;
    HealthService.getHealth = async () => ({
      status: 'degraded',
      database: 'connected',
      version: '1.0.0',
      environment: 'development',
      timestamp: new Date().toISOString(),
      isHealthy: false,
    });
    const healthDegradedRes = await makeRequest('GET', '/api/v1/health');
    assert(healthDegradedRes.status === 503, 'Health endpoint returns HTTP 503 when schema is missing/unhealthy');
    assert(healthDegradedRes.data?.status === 'degraded', "Degraded health reports status 'degraded'");
    HealthService.getHealth = originalGetHealth;

    // 5. Test Scenarios list
    console.log('\n5. Testing Scenarios List GET /api/v1/scenarios ...');
    const scenariosRes = await makeRequest('GET', '/api/v1/scenarios?limit=5');
    assert(scenariosRes.status === 200, 'Scenarios list status is 200');
    assert(Array.isArray(scenariosRes.data), 'Scenarios response is an array');
    assert(scenariosRes.data.length > 0, `Scenarios array has items (found ${scenariosRes.data.length})`);
    const firstScenario = scenariosRes.data[0];
    assert(!!firstScenario.id, 'Scenario summary has UUID id');
    assert(!!firstScenario.title, 'Scenario summary has title');

    // 6. Test Scenario Get by ID
    console.log(`\n6. Testing Scenario GET /api/v1/scenarios/${firstScenario.id} ...`);
    const scenarioDetailRes = await makeRequest('GET', `/api/v1/scenarios/${firstScenario.id}`);
    assert(scenarioDetailRes.status === 200, 'Scenario detail status is 200');
    assert(scenarioDetailRes.data.id === firstScenario.id, 'Scenario detail ID matches');
    assert(!!scenarioDetailRes.data.attacking_team, 'Scenario detail contains attacking_team');
    assert(!!scenarioDetailRes.data.defending_team, 'Scenario detail contains defending_team');
    assert(!!scenarioDetailRes.data.ball_position, 'Scenario detail contains ball_position');

    // 7. Test Scenario Creation POST /api/v1/scenarios
    console.log('\n7. Testing Custom Scenario POST /api/v1/scenarios ...');
    const customPayload = {
      title: 'Automated Test 4-2-3-1 Pressing Trap',
      description: 'Test scenario created during verification of backend-2',
      match_phase: 'mid_block',
      tactical_situation: 'Central midfield pressing trap against double pivot',
      attacking_team: {
        name: 'Attacking FC',
        formation: '4-3-3',
        players: [
          {
            id: 'att_1',
            number: 1,
            name: 'Keeper',
            role: 'GK',
            position: { x: 10.0, y: 34.0 },
          },
          {
            id: 'att_2',
            number: 6,
            name: 'Pivot',
            role: 'DM',
            position: { x: 35.0, y: 34.0 },
          },
        ],
      },
      defending_team: {
        name: 'Defending City',
        formation: '4-2-3-1',
        players: [
          {
            id: 'def_1',
            number: 10,
            name: 'Attacking Mid',
            role: 'AM',
            position: { x: 42.0, y: 34.0 },
          },
        ],
      },
      ball_position: {
        x: 35.0,
        y: 34.0,
        z: 0.0,
        zone: 'Zone 14',
      },
      match_context: {
        minute: 44,
        score: '1-0',
        competition: 'Test League',
      },
    };

    const createRes = await makeRequest('POST', '/api/v1/scenarios', customPayload);
    assert(createRes.status === 201, 'Scenario created with HTTP 201');
    assert(createRes.data?.title === customPayload.title, 'Created scenario has correct title');
    assert(createRes.data?.is_prepared === false, 'Created scenario has is_prepared = false');
    assert(createRes.data?.status === 'active', "Created scenario has status = 'active'");
    const createdId = createRes.data?.id;

    // 8. Test Scenario Deletion DELETE /api/v1/scenarios/:id
    console.log(`\n8. Testing Scenario DELETE /api/v1/scenarios/${createdId} ...`);
    const deleteRes = await makeRequest('DELETE', `/api/v1/scenarios/${createdId}`);
    assert(deleteRes.status === 204, 'Scenario deleted with HTTP 204 No Content');

    // Verify it is gone
    const getDeletedRes = await makeRequest('GET', `/api/v1/scenarios/${createdId}`);
    assert(getDeletedRes.status === 404, 'Getting deleted scenario returns HTTP 404');
    assert(getDeletedRes.data?.error?.code === 'ENTITY_NOT_FOUND', "Error code is 'ENTITY_NOT_FOUND'");

    // 9. Test Analysis Retrieval GET /api/v1/analysis
    console.log('\n9. Testing Analysis List GET /api/v1/analysis ...');
    const analysesRes = await makeRequest('GET', '/api/v1/analysis?limit=5');
    assert(analysesRes.status === 200, 'Analysis list status is 200');
    assert(Array.isArray(analysesRes.data), 'Analyses response is an array');
    assert(analysesRes.data.length > 0, `Analyses array has items (found ${analysesRes.data.length})`);
    const firstAnalysis = analysesRes.data[0];
    assert(!!firstAnalysis.id, 'Analysis summary has id');
    assert(!!firstAnalysis.scenario_id, 'Analysis has scenario_id');
    assert(!!firstAnalysis.scenario_title, 'Analysis has scenario_title');

    // 9b. Test Deterministic Analysis Generation POST /api/v1/analysis
    console.log('\n9b. Testing Deterministic Analysis POST /api/v1/analysis ...');
    const createAnalysisRes = await makeRequest('POST', '/api/v1/analysis', {
      scenario_id: firstScenario.id,
      user_query: 'How does the defending team coordinate cover shadows to funnel play wide?',
      focus_areas: ['cover_shadows', 'compactness'],
    });
    assert(createAnalysisRes.status === 201, 'Analysis created with HTTP 201');
    assert(createAnalysisRes.data?.status === 'completed', "Analysis status is 'completed'");
    assert(!!createAnalysisRes.data?.analysis?.situation_overview, '10-section report generated with situation_overview');
    assert(!!createAnalysisRes.data?.spatial_metrics?.low_block_compactness, 'TacticalLens low_block_compactness present in metrics');
    assert(!!createAnalysisRes.data?.spatial_metrics?.zone14_density, 'TacticalLens zone14_density present in metrics');
    assert(!!createAnalysisRes.data?.spatial_metrics?.pressing_trigger_analysis, 'TacticalLens pressing_trigger_analysis present in metrics');

    // 10. Test Analysis Detail GET /api/v1/analysis/:id
    console.log(`\n10. Testing Analysis Detail GET /api/v1/analysis/${firstAnalysis.id} ...`);
    const analysisDetailRes = await makeRequest('GET', `/api/v1/analysis/${firstAnalysis.id}`);
    assert(analysisDetailRes.status === 200, 'Analysis detail status is 200');
    assert(analysisDetailRes.data.id === firstAnalysis.id, 'Analysis ID matches');
    assert(Array.isArray(analysisDetailRes.data.messages), 'Analysis messages is an array');

    // 11. Test Analysis Status GET /api/v1/analysis/:id/status
    console.log(`\n11. Testing Analysis Status GET /api/v1/analysis/${firstAnalysis.id}/status ...`);
    const analysisStatusRes = await makeRequest('GET', `/api/v1/analysis/${firstAnalysis.id}/status`);
    assert(analysisStatusRes.status === 200, 'Analysis status endpoint is 200');
    assert(analysisStatusRes.data.id === firstAnalysis.id, 'Analysis status ID matches');
    assert(!!analysisStatusRes.data.status, `Analysis status is '${analysisStatusRes.data.status}'`);

    // 11b. Test Knowledge Topics GET /api/v1/knowledge/topics
    console.log('\n11b. Testing Knowledge Topics GET /api/v1/knowledge/topics ...');
    const topicsRes = await makeRequest('GET', '/api/v1/knowledge/topics');
    assert(topicsRes.status === 200, 'Knowledge topics endpoint is 200');
    assert(Array.isArray(topicsRes.data), 'Topics response is an array');
    assert(topicsRes.data.length > 0, `Topics array has items (found ${topicsRes.data.length})`);

    // 11c. Test Knowledge Documents List GET /api/v1/knowledge
    console.log('\n11c. Testing Knowledge Documents List GET /api/v1/knowledge?limit=3 ...');
    const docsRes = await makeRequest('GET', '/api/v1/knowledge?limit=3');
    assert(docsRes.status === 200, 'Knowledge docs endpoint is 200');
    assert(Array.isArray(docsRes.data), 'Knowledge docs response is an array');
    assert(docsRes.data.length > 0, `Knowledge docs array has items (found ${docsRes.data.length})`);

    // 11d. Test Analysis Follow-Up POST /api/v1/analysis/:id/follow-up
    console.log(`\n11d. Testing Analysis Follow-Up POST /api/v1/analysis/${firstAnalysis.id}/follow-up ...`);
    const followUpRes = await makeRequest('POST', `/api/v1/analysis/${firstAnalysis.id}/follow-up`, {
      question: 'How do the central defenders adjust if the primary presser is beaten on the outside?',
    });
    assert(followUpRes.status === 200, 'Follow-up endpoint returns HTTP 200');
    assert(followUpRes.data?.analysis_id === firstAnalysis.id, 'Follow-up response matches analysis ID');
    assert(typeof followUpRes.data?.answer === 'string' && followUpRes.data.answer.length > 10, 'Follow-up returns grounded answer text');
    assert(Array.isArray(followUpRes.data?.relevant_players_mentioned), 'Follow-up mentions relevant players');
    assert(Array.isArray(followUpRes.data?.clarified_tactics), 'Follow-up returns clarified tactics array');

    // 12. Test Validation Error Handling
    console.log('\n12. Testing Validation Error Handling (Zod schema rejection) ...');
    const invalidPayload = {
      title: 'A', // too short, min is 3
      match_phase: '',
    };
    const badReqRes = await makeRequest('POST', '/api/v1/scenarios', invalidPayload);
    assert(badReqRes.status === 422, 'Invalid payload returns HTTP 422');
    assert(badReqRes.data?.error?.code === 'VALIDATION_ERROR', "Error code is 'VALIDATION_ERROR'");
    assert(Array.isArray(badReqRes.data?.error?.details), 'Validation details array present');

    // 13. Test 404 Route Handling
    console.log('\n13. Testing Unmatched Route 404 ...');
    const notFoundRes = await makeRequest('GET', '/api/v1/nonexistent-route');
    assert(notFoundRes.status === 404, 'Unmatched route returns HTTP 404');
    assert(notFoundRes.data?.error?.code === 'NOT_FOUND', "Error code is 'NOT_FOUND'");

  } finally {
    // Teardown
    console.log('\n--- TEARDOWN ---');
    server.close();
    await closeDb();
    console.log('HTTP Server and DB connections closed.');
  }

  console.log(`\n=== FINAL RESULTS: ${passedCount} PASSED, ${failedCount} FAILED ===`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
