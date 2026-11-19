import crypto from 'crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db, scenarios, type ScenarioRecord } from '../db/index.js';
import type {
  ScenarioCreateInput,
  ScenarioQueryInput,
  ScenarioResponse,
  ScenarioSummaryResponse,
} from '../schemas/scenario.js';
import { EntityNotFoundError } from '../utils/errors.js';

export class ScenarioService {
  /**
   * Retrieves paginated scenarios summary list with optional filtering.
   */
  public static async getScenarios(query: ScenarioQueryInput): Promise<ScenarioSummaryResponse[]> {
    const { match_phase, is_prepared, skip = 0, limit = 20 } = query;

    const conditions = [];
    if (match_phase) {
      conditions.push(eq(scenarios.match_phase, match_phase));
    }
    if (is_prepared !== undefined) {
      conditions.push(eq(scenarios.is_prepared, is_prepared));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: scenarios.id,
        title: scenarios.title,
        match_phase: scenarios.match_phase,
        tactical_situation: scenarios.tactical_situation,
        is_prepared: scenarios.is_prepared,
        status: scenarios.status,
        created_at: scenarios.created_at,
        updated_at: scenarios.updated_at,
      })
      .from(scenarios)
      .where(whereClause)
      .orderBy(desc(scenarios.created_at))
      .offset(skip)
      .limit(limit);

    return rows;
  }

  /**
   * Retrieves single scenario details by UUID.
   */
  public static async getScenarioById(id: string): Promise<ScenarioResponse> {
    const rows = await db
      .select()
      .from(scenarios)
      .where(eq(scenarios.id, id))
      .limit(1);

    const scenario = rows[0];
    if (!scenario) {
      throw new EntityNotFoundError('Scenario', id);
    }

    return scenario as unknown as ScenarioResponse;
  }

  /**
   * Creates a new custom tactical scenario.
   */
  public static async createScenario(input: ScenarioCreateInput): Promise<ScenarioResponse> {
    const now = new Date().toISOString();
    const rows = await db
      .insert(scenarios)
      .values({
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description ?? null,
        match_phase: input.match_phase,
        tactical_situation: input.tactical_situation,
        attacking_team: input.attacking_team,
        defending_team: input.defending_team,
        ball_position: input.ball_position,
        match_context: input.match_context ?? null,
        is_prepared: false,
        status: 'active',
        created_at: now,
        updated_at: now,
      })
      .returning();

    return rows[0] as unknown as ScenarioResponse;
  }

  /**
   * Deletes a scenario by UUID.
   */
  public static async deleteScenario(id: string): Promise<void> {
    const existing = await db
      .select({ id: scenarios.id })
      .from(scenarios)
      .where(eq(scenarios.id, id))
      .limit(1);

    if (existing.length === 0) {
      throw new EntityNotFoundError('Scenario', id);
    }

    await db.delete(scenarios).where(eq(scenarios.id, id));
  }

  /**
   * Total scenarios count helper.
   */
  public static async countScenarios(): Promise<number> {
    const res = await db.select({ count: sql<number>`count(*)` }).from(scenarios);
    return Number(res[0]?.count ?? 0);
  }
}
