import { db } from "../lib/db";

async function main() {
  const methods = await db.analyticalMethod.findMany({
    select: { id: true, methodCode: true },
  });
  console.log(JSON.stringify(methods, null, 2));
}

main()
  .finally(() => db.$disconnect());
