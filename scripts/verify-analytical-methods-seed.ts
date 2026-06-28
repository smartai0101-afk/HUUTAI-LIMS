import { db } from "../lib/db";
import { seedAnalyticalMethods } from "../prisma/seed-data/analytical-methods";

async function main() {
  const reset = process.argv.includes("--reset");
  if (reset) {
    await db.analyticalMethod.deleteMany({
      where: { methodCode: { in: ["PP-ICP-WAT-001", "PP-LCMS-PST-001"] } },
    });
    console.log("Deleted existing demo methods");
  }
  await seedAnalyticalMethods(db);

  const methods = await db.analyticalMethod.findMany({
    where: { methodCode: { in: ["PP-ICP-WAT-001", "PP-LCMS-PST-001"] } },
    include: {
      currentVersion: {
        include: {
          workflow: { include: { nodes: true, edges: true } },
          reagents: { include: { chemical: true, standard: true } },
          equipmentLinks: { include: { equipment: true } },
          qcRequirements: true,
          acceptanceCriteria: true,
          safetyNotes: true,
        },
      },
    },
  });

  for (const m of methods) {
    const v = m.currentVersion!;
    console.log(`\n${m.methodCode}: nodes=${v.workflow?.nodes.length}, edges=${v.workflow?.edges.length}, reagents=${v.reagents.length}, equipment=${v.equipmentLinks.length}, qc=${v.qcRequirements.length}, acceptance=${v.acceptanceCriteria.length}, safety=${v.safetyNotes.length}`);
    const hno3 = v.reagents.find((r) => r.nameFreeText.includes("Nitric"));
    console.log(`  HNO3 linked: ${hno3?.chemical?.code ?? "none"}`);
    const acn = v.reagents.find((r) => r.nameFreeText.includes("Acetamiprid"));
    console.log(`  Acetamiprid std linked: ${acn?.standard?.code ?? "none"}`);
    const condition = v.workflow?.nodes.filter((n) => n.type === "Condition").length ?? 0;
    console.log(`  Condition nodes: ${condition}`);
  }

  console.log("\nverify-analytical-methods-seed.ts OK");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
