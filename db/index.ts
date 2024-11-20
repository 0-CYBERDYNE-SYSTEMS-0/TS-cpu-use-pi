import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const createMockDb = () => ({
  query: {
    toolPermissions: {
      findFirst: async () => null
    }
  },
  select: async () => [],
  insert: async () => ({ values: () => [] }),
  update: async () => ({ set: () => ({ where: () => [] }) }),
  delete: async () => ({ where: () => [] }),
  transaction: async (callback: (tx: any) => Promise<any>) => {
    return callback(createMockDb())
  }
});

export const db = process.env.NODE_ENV === 'development' 
  ? createMockDb()
  : drizzle({ connection: process.env.DATABASE_URL!, schema });
