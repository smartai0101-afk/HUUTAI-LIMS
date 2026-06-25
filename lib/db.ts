import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createDb() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function modelKey(name: string) {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/** Every model in the generated schema must expose findMany on the client instance. */
function hasAllDelegates(client: PrismaClient): boolean {
  return Prisma.dmmf.datamodel.models.every((model) => {
    const delegate = (client as unknown as Record<string, unknown>)[modelKey(model.name)];
    return (
      typeof delegate === "object" &&
      delegate !== null &&
      typeof (delegate as { findMany?: unknown }).findMany === "function"
    );
  });
}

function getClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && hasAllDelegates(cached)) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect().catch(() => undefined);
  }

  const next = createDb();
  globalForPrisma.prisma = next;
  return next;
}

/**
 * Lazy singleton — re-creates the client when Turbopack/hot reload leaves a stale
 * Prisma instance missing newly generated model delegates (e.g. equipment module).
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client as object, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
