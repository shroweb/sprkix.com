import { prisma } from "../lib/prisma";

async function check() {
  try {
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log("Tables in DB:", tables);
  } catch (e) {
    console.error("Error querying tables:", e);
  } finally {
    process.exit();
  }
}

check();
