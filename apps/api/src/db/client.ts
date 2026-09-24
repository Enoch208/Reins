import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDb(databaseUrl: string) {
  return drizzle({ client: postgres(databaseUrl), schema });
}

export type Db = ReturnType<typeof createDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type Executor = Db | Tx;

export type JobRow = typeof schema.jobs.$inferSelect;
export type AgentRow = typeof schema.agents.$inferSelect;
export type AuthorizationRow = typeof schema.authorizations.$inferSelect;
export type SpendRequestRow = typeof schema.spendRequests.$inferSelect;
