import type { PrismaClient } from "@prisma/client";
import {
  InventoryItemStatus,
  PreparedStandardLevel,
  StandardExpiryStatus,
  UsageLogType,
  UsageSourceType,
} from "@prisma/client";
import { formatCasProductSnapshot } from "../../lib/chemicals-fields";
import { computeStandardStatus } from "../../lib/standard-status";
import { parseDate } from "./helpers";

const MULTI_LOT_EXTRA = [
  { kind: "chemical" as const, code: "CHEM-0010", lot: "IPA-2502", quantity: 4, unit: "L", expiry: "2027-08-01" },
  { kind: "chemical" as const, code: "CHEM-0011", lot: "FA-2501", quantity: 250, unit: "mL", expiry: "2027-01-01" },
  { kind: "standard" as const, code: "STD-0007", lot: "PAR-2501", quantity: 3, unit: "g", expiry: "2027-09-01", afterOpen: "2028-03-01" },
  { kind: "standard" as const, code: "STD-0008", lot: "IBU-2501", quantity: 2, unit: "g", expiry: "2027-11-01", afterOpen: "2028-05-01" },
  { kind: "strain" as const, code: "MS-0003", lot: "SAL-2501", quantity: 1, unit: "vial", expiry: "2027-12-01" },
  { kind: "strain" as const, code: "MS-0004", lot: "CAN-2501", quantity: 1, unit: "vial", expiry: "2028-01-01" },
];

export async function seedExtendedMultiLots(prisma: PrismaClient) {
  for (const row of MULTI_LOT_EXTRA) {
    if (row.kind === "chemical") {
      const master = await prisma.chemical.findUnique({ where: { code: row.code } });
      if (!master) continue;
      await prisma.stockLot.create({
        data: {
          chemicalId: master.id,
          lot: row.lot,
          quantity: row.quantity,
          unit: row.unit,
          expiryDate: parseDate(row.expiry),
          storageLocation: master.storageLocation,
          status: computeStandardStatus(parseDate(row.expiry)),
        },
      });
      const lots = await prisma.stockLot.findMany({ where: { chemicalId: master.id } });
      await prisma.chemical.update({
        where: { id: master.id },
        data: { lot: "Nhiều lot", quantity: lots.reduce((s, l) => s + l.quantity, 0) },
      });
    } else if (row.kind === "standard") {
      const master = await prisma.standard.findUnique({ where: { code: row.code } });
      if (!master) continue;
      await prisma.stockLot.create({
        data: {
          standardId: master.id,
          lot: row.lot,
          quantity: row.quantity,
          unit: row.unit,
          expiryDate: parseDate(row.expiry),
          afterOpenExpiry: row.afterOpen ? parseDate(row.afterOpen) : null,
          storageLocation: master.storageLocation,
          status: computeStandardStatus(parseDate(row.expiry)),
        },
      });
      const lots = await prisma.stockLot.findMany({ where: { standardId: master.id } });
      await prisma.standard.update({
        where: { id: master.id },
        data: { lot: "Nhiều lot", quantity: lots.reduce((s, l) => s + l.quantity, 0) },
      });
    } else {
      const master = await prisma.microbialStrain.findUnique({ where: { code: row.code } });
      if (!master) continue;
      await prisma.stockLot.create({
        data: {
          microbialStrainId: master.id,
          lot: row.lot,
          quantity: row.quantity,
          unit: row.unit,
          expiryDate: parseDate(row.expiry),
          storageLocation: master.storageLocation,
          status: computeStandardStatus(parseDate(row.expiry)),
        },
      });
      const lots = await prisma.stockLot.findMany({ where: { microbialStrainId: master.id } });
      await prisma.microbialStrain.update({
        where: { id: master.id },
        data: { lot: "Nhiều lot", quantity: lots.reduce((s, l) => s + l.quantity, 0) },
      });
    }
  }
  console.log(`  Extended multi-lot: ${MULTI_LOT_EXTRA.length} extra lots`);
}

export async function seedExtendedPreparedAndUsage(prisma: PrismaClient) {
  const chem10 = await prisma.chemical.findUnique({ where: { code: "CHEM-0010" } });
  const chem11 = await prisma.chemical.findUnique({ where: { code: "CHEM-0011" } });
  const chem9 = await prisma.chemical.findUnique({ where: { code: "CHEM-0009" } });
  const std7 = await prisma.standard.findUnique({ where: { code: "STD-0007" } });
  const ms3 = await prisma.microbialStrain.findUnique({ where: { code: "MS-0003" } });
  const ms4 = await prisma.microbialStrain.findUnique({ where: { code: "MS-0004" } });

  const lotChem10 = chem10
    ? await prisma.stockLot.findFirst({ where: { chemicalId: chem10.id, lot: "IPA-2411" } })
    : null;
  const lotStd7 = std7
    ? await prisma.stockLot.findFirst({ where: { standardId: std7.id, lot: "PAR-2411" } })
    : null;
  const lotMs3 = ms3
    ? await prisma.stockLot.findFirst({ where: { microbialStrainId: ms3.id, lot: "SAL-2411" } })
    : null;
  const lotMs4 = ms4
    ? await prisma.stockLot.findFirst({ where: { microbialStrainId: ms4.id, lot: "CAN-2410" } })
    : null;

  if (chem10 && chem11) {
    await prisma.preparedChemical.create({
      data: {
        code: "PCHEM-0002",
        name: "Mobile phase LC-MS 0.1% FA",
        concentration: "0.1",
        concentrationUnit: "% v/v",
        preparedQuantity: 2000,
        unit: "mL",
        preparedDate: parseDate("2026-06-15"),
        preparedBy: "N. Anh",
        expiryDate: parseDate("2026-09-15"),
        storageLocation: "Cabinet A1",
        status: StandardExpiryStatus.Ready,
        notes: "Dùng EQ-HPLC-001 / EQ-HPLC-003",
        ingredients: {
          create: [
            {
              chemicalId: chem10.id,
              stockLotId: lotChem10?.id ?? null,
              chemicalNameSnapshot: chem10.name,
              casProductCodeSnapshot: formatCasProductSnapshot(chem10.casNumber, chem10.productCode),
              lotNumberSnapshot: lotChem10?.lot ?? chem10.lot,
              quantityUsed: 1900,
              unit: "mL",
            },
            {
              chemicalId: chem11.id,
              chemicalNameSnapshot: chem11.name,
              casProductCodeSnapshot: formatCasProductSnapshot(chem11.casNumber, chem11.productCode),
              lotNumberSnapshot: chem11.lot,
              quantityUsed: 100,
              unit: "mL",
            },
          ],
        },
      },
    });
  }

  if (std7 && chem9) {
    const pstdRoot = await prisma.preparedStandard.create({
      data: {
        parentCode: "PSTD-0005",
        codePrefix: "PSTD",
        sequenceNumber: 5,
        batchNumber: 1,
        code: "PSTD-0005",
        name: "Paracetamol stock 100 ppm",
        level: PreparedStandardLevel.RootPrepared,
        concentration: "100",
        concentrationUnit: "ppm",
        originalConcentration: "99.8",
        finalConcentration: "100",
        solventVolume: 100,
        solventUnit: "mL",
        preparedDate: parseDate("2026-06-14"),
        preparedBy: "N. Pham",
        expiryDate: parseDate("2026-09-14"),
        status: StandardExpiryStatus.Ready,
        storageLocation: "Tủ chuẩn B1",
        quantity: 100,
        unit: "mL",
        notes: "Từ STD-0007 Paracetamol CRM",
      },
    });

    await prisma.preparedStandardComponent.create({
      data: {
        preparedStandardId: pstdRoot.id,
        sourceType: "Standard",
        standardId: std7.id,
        stockLotId: lotStd7?.id ?? null,
        standardCodeSnapshot: std7.code,
        standardNameSnapshot: std7.name,
        lotNumberSnapshot: lotStd7?.lot ?? std7.lot,
        concentrationSnapshot: std7.purity,
        concentrationUnitSnapshot: "%",
        levelSnapshot: PreparedStandardLevel.RootPrepared,
        preparedDateSnapshot: parseDate("2026-06-14"),
        expiryDateSnapshot: parseDate("2026-09-14"),
        quantityUsed: 0.01,
        unit: "g",
      },
    });

    await prisma.preparedStandardSolvent.create({
      data: {
        preparedStandardId: pstdRoot.id,
        chemicalId: chem9.id,
        chemicalCodeSnapshot: chem9.code,
        chemicalNameSnapshot: chem9.name,
        casProductCodeSnapshot: formatCasProductSnapshot(chem9.casNumber, chem9.productCode),
        lotNumberSnapshot: chem9.lot,
        quantityUsed: 100,
        unit: "mL",
      },
    });

    await prisma.preparedStandard.create({
      data: {
        parentCode: "WSTD-0006",
        codePrefix: "WSTD",
        sequenceNumber: 6,
        batchNumber: 1,
        code: "WSTD-0006",
        name: "Paracetamol working 10 ppm",
        level: PreparedStandardLevel.WorkingPrepared,
        concentration: "10",
        concentrationUnit: "ppm",
        originalConcentration: "100",
        finalConcentration: "10",
        solventVolume: 50,
        solventUnit: "mL",
        preparedDate: parseDate("2026-06-16"),
        preparedBy: "N. Pham",
        expiryDate: parseDate("2026-07-16"),
        status: StandardExpiryStatus.Ready,
        storageLocation: "Tủ chuẩn B1",
        quantity: 50,
        unit: "mL",
        components: {
          create: [
            {
              sourceType: "PreparedStandard",
              sourcePreparedStandardId: pstdRoot.id,
              standardCodeSnapshot: pstdRoot.code,
              standardNameSnapshot: pstdRoot.name,
              lotNumberSnapshot: pstdRoot.code,
              concentrationSnapshot: "100",
              concentrationUnitSnapshot: "ppm",
              levelSnapshot: PreparedStandardLevel.RootPrepared,
              preparedDateSnapshot: parseDate("2026-06-14"),
              expiryDateSnapshot: parseDate("2026-09-14"),
              quantityUsed: 5,
              unit: "mL",
            },
          ],
        },
        solvents: {
          create: [
            {
              chemicalId: chem9.id,
              chemicalCodeSnapshot: chem9.code,
              chemicalNameSnapshot: chem9.name,
              casProductCodeSnapshot: formatCasProductSnapshot(chem9.casNumber, chem9.productCode),
              lotNumberSnapshot: chem9.lot,
              quantityUsed: 45,
              unit: "mL",
            },
          ],
        },
      },
    });
  }

  if (ms3 && lotMs3) {
    await prisma.preparedStrain.create({
      data: {
        code: "PMS-0002",
        name: "Salmonella working culture",
        sourceStrainId: ms3.id,
        sourceStockLotId: lotMs3.id,
        sourceLotNumberSnapshot: lotMs3.lot,
        lot: "PSAL-WK-2406",
        preparedDate: parseDate("2026-06-14"),
        preparedBy: "D. Tran",
        checkedBy: "K. Hoa",
        expiryDate: parseDate("2026-06-28"),
        passage: 2,
        storageCondition: "2-8°C",
        status: InventoryItemStatus.Available,
        responsiblePerson: "D. Tran",
        notes: "Từ MS-0003 lot SAL-2411",
      },
    });
  }

  if (ms4 && lotMs4) {
    await prisma.preparedStrain.create({
      data: {
        code: "PMS-0003",
        name: "Candida working suspension",
        sourceStrainId: ms4.id,
        sourceStockLotId: lotMs4.id,
        sourceLotNumberSnapshot: lotMs4.lot,
        lot: "PCAN-WK-2406",
        preparedDate: parseDate("2026-06-15"),
        preparedBy: "N. Pham",
        checkedBy: "D. Tran",
        expiryDate: parseDate("2026-06-29"),
        passage: 3,
        storageCondition: "2-8°C",
        status: InventoryItemStatus.Available,
        responsiblePerson: "N. Pham",
      },
    });
  }

  const usageRows = [
    { code: "CHEM-0010", type: UsageLogType.USE, qty: 200, unit: "mL", purpose: "Mobile phase prep", by: "N. Anh" },
    { code: "CHEM-0011", type: UsageLogType.OUT, qty: 50, unit: "mL", purpose: "LC-MS run batch 42", by: "A. Minh" },
    { code: "STD-0007", type: UsageLogType.USE, qty: 0.01, unit: "g", purpose: "PSTD-0005 prep", by: "N. Pham" },
    { code: "STD-0011", type: UsageLogType.USE, qty: 1, unit: "mL", purpose: "ICP-OES QC", by: "V. Lam" },
    { code: "CHEM-0015", type: UsageLogType.OUT, qty: 0.5, unit: "L", purpose: "GC sample prep", by: "V. Lam" },
  ];

  for (const u of usageRows) {
    const chem = await prisma.chemical.findUnique({ where: { code: u.code } });
    const std = chem ? null : await prisma.standard.findUnique({ where: { code: u.code } });
    const source = chem ?? std;
    if (!source) continue;
    const sourceType = chem ? UsageSourceType.Chemical : UsageSourceType.Standard;
    await prisma.usageLog.create({
      data: {
        date: parseDate("2026-06-18"),
        type: u.type,
        sourceType,
        sourceId: source.id,
        quantity: u.qty,
        unit: u.unit,
        performedBy: u.by,
        purpose: u.purpose,
        referenceCode: u.code,
      },
    });
  }

  console.log("  Extended prepared + usage logs");
}

export async function seedExtendedPostStockLots(prisma: PrismaClient) {
  await seedExtendedMultiLots(prisma);
  await seedExtendedPreparedAndUsage(prisma);
}
