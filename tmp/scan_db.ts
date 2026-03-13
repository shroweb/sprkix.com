import { prisma } from "../lib/prisma";

async function scanDb() {
  const targetId = "cmmnu1s0I000h9bfn0gmkwvjq";
  const tables = await prisma.$queryRaw<any[]>`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
  
  for (const { tablename } of tables) {
    try {
      const records = await (prisma as any)[tablename.charAt(0).toLowerCase() + tablename.slice(1)].findMany();
      for (const record of records) {
        if (JSON.stringify(record).includes(targetId)) {
          console.log(`Found ID in table: ${tablename}`);
          console.log(record);
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

scanDb();
