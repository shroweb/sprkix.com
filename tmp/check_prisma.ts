import { prisma } from "../lib/prisma";

async function check() {
  try {
    const dmmf = (prisma as any)._baseDmmf;
    const matchModel = dmmf.modelMap.Match;
    console.log("Match model fields:", matchModel.fields.map((f: any) => f.name));
  } catch (e) {
    console.error("Error checking DMMF:", e);
  } finally {
    process.exit();
  }
}

check();
