import {
  ContainerStatus,
  InventoryItemStatus,
  PreparedStandardLevel,
  StandardExpiryStatus,
  PrismaClient,
  UsageLogType,
  UsageSourceType,
} from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { PERMISSION_KEYS, PERMISSION_LABELS } from "../lib/auth/permissions";
import { computeContainerStatus } from "../lib/container-status";
import { formatCasProductSnapshot } from "../lib/chemicals-fields";
import { addCycleMonths, computeScheduleStatus } from "../lib/equipment-schedule";
import { computeStandardStatus } from "../lib/standard-status";

const prisma = new PrismaClient();

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function mapChemicalStatus(status: string): ContainerStatus {
  switch (status) {
    case "Low Stock":
      return ContainerStatus.LowStock;
    case "Expired":
      return ContainerStatus.Expired;
    case "Pending Disposal":
      return ContainerStatus.PendingDisposal;
    default:
      return ContainerStatus.Available;
  }
}

function mapStandardStatus(status: string): ContainerStatus {
  switch (status) {
    case "Expired":
      return ContainerStatus.Expired;
    case "Pending Review":
      return ContainerStatus.LowStock;
    default:
      return ContainerStatus.Available;
  }
}

async function seedStockLotsFromCatalog() {
  const chemicals = await prisma.chemical.findMany();
  for (const chem of chemicals) {
    if (!chem.lot.trim() && chem.quantity <= 0) continue;
    await prisma.stockLot.create({
      data: {
        chemicalId: chem.id,
        lot: chem.lot.trim() || `LEGACY-${chem.id.slice(0, 8)}`,
        quantity: chem.quantity,
        unit: chem.unit,
        expiryDate: chem.expiryDate,
        coaPath: chem.coaPath,
        storageLocation: chem.storageLocation,
        notes: chem.notes,
        status: chem.status,
      },
    });
  }

  const standards = await prisma.standard.findMany();
  for (const std of standards) {
    if (!std.lot.trim() && std.quantity <= 0) continue;
    await prisma.stockLot.create({
      data: {
        standardId: std.id,
        lot: std.lot.trim() || `LEGACY-${std.id.slice(0, 8)}`,
        quantity: std.quantity,
        unit: std.unit,
        expiryDate: std.expiryDate,
        afterOpenExpiry: std.afterOpenExpiry,
        coaPath: std.coaPath,
        storageLocation: std.storageLocation,
        notes: std.notes,
        status: std.status,
      },
    });
  }

  const strains = await prisma.microbialStrain.findMany();
  for (const strain of strains) {
    if (!strain.lot.trim() && strain.quantity <= 0) continue;
    await prisma.stockLot.create({
      data: {
        microbialStrainId: strain.id,
        lot: strain.lot.trim() || `LEGACY-${strain.id.slice(0, 8)}`,
        quantity: strain.quantity,
        unit: strain.unit,
        expiryDate: strain.expiryDate,
        storageLocation: strain.storageLocation,
        notes: strain.notes,
        status: strain.status,
      },
    });
  }

  const chemMulti = await prisma.chemical.findUnique({ where: { code: "CHEM-0001" } });
  if (chemMulti) {
    await prisma.stockLot.create({
      data: {
        chemicalId: chemMulti.id,
        lot: "MET-2501",
        quantity: 500,
        unit: "mL",
        expiryDate: parseDate("2026-10-15"),
        storageLocation: chemMulti.storageLocation,
        status: computeStandardStatus(parseDate("2026-10-15")),
      },
    });
    await prisma.chemical.update({
      where: { id: chemMulti.id },
      data: { lot: "Nhiều lot", quantity: chemMulti.quantity + 500 },
    });
  }

  const stdMulti = await prisma.standard.findUnique({ where: { code: "STD-0002" } });
  if (stdMulti) {
    await prisma.stockLot.create({
      data: {
        standardId: stdMulti.id,
        lot: "H2354",
        quantity: 3,
        unit: stdMulti.unit,
        expiryDate: parseDate("2027-03-12"),
        afterOpenExpiry: parseDate("2027-09-12"),
        storageLocation: stdMulti.storageLocation,
        status: computeStandardStatus(parseDate("2027-03-12")),
      },
    });
    await prisma.standard.update({
      where: { id: stdMulti.id },
      data: { lot: "Nhiều lot", quantity: stdMulti.quantity + 3 },
    });
  }

  const strainMulti = await prisma.microbialStrain.findUnique({ where: { code: "MS-0001" } });
  if (strainMulti) {
    await prisma.stockLot.create({
      data: {
        microbialStrainId: strainMulti.id,
        lot: "EC-2501",
        quantity: 1,
        unit: strainMulti.unit,
        expiryDate: parseDate("2027-06-15"),
        storageLocation: strainMulti.storageLocation,
        status: computeStandardStatus(parseDate("2027-06-15")),
      },
    });
    await prisma.microbialStrain.update({
      where: { id: strainMulti.id },
      data: { lot: "Nhiều lot", quantity: strainMulti.quantity + 1 },
    });
  }
}

async function seedEquipment() {
  const devices = [
    {
      code: "EQ-HPLC-001",
      name: "HPLC Agilent 1260",
      model: "1260 Infinity II",
      serialNumber: "DE62987654",
      manufacturer: "Agilent",
      department: "Phòng thí nghiệm",
      location: "Lab A-01",
      manager: "A. Minh",
      status: "InUse" as const,
      lastCalibrationDate: "2025-12-10",
      cycleMonths: 12,
      planName: "Hiệu chuẩn định kỳ HPLC",
    },
    {
      code: "EQ-UV-001",
      name: "UV-Vis Shimadzu UV-1800",
      model: "UV-1800",
      serialNumber: "UV1800-88421",
      manufacturer: "Shimadzu",
      department: "QC",
      location: "QC-02",
      manager: "Q. Hoa",
      status: "InUse" as const,
      lastCalibrationDate: "2026-01-15",
      cycleMonths: 12,
      planName: "Hiệu chuẩn UV-Vis",
    },
    {
      code: "EQ-BAL-001",
      name: "Cân phân tích Mettler Toledo",
      model: "ME204E",
      serialNumber: "B823456789",
      manufacturer: "Mettler Toledo",
      department: "Phòng thí nghiệm",
      location: "Lab B-03",
      manager: "B. Quang",
      status: "InUse" as const,
      lastCalibrationDate: "2026-03-01",
      cycleMonths: 6,
      planName: "Hiệu chuẩn cân",
    },
    {
      code: "EQ-ICP-001",
      name: "ICP-OES PerkinElmer Avio 500",
      model: "Avio 500",
      serialNumber: "ICP-2024-7712",
      manufacturer: "PerkinElmer",
      department: "Phòng thí nghiệm",
      location: "Lab C-01",
      manager: "V. Lam",
      status: "Maintenance" as const,
      lastCalibrationDate: "2025-06-20",
      cycleMonths: 12,
      planName: "Hiệu chuẩn ICP-OES",
    },
    {
      code: "EQ-HPLC-002",
      name: "HPLC Waters Alliance e2695",
      model: "e2695",
      serialNumber: "WAT-556677",
      manufacturer: "Waters",
      department: "QC",
      location: "QC-01",
      manager: "QC Analyst",
      status: "InUse" as const,
      lastCalibrationDate: "2025-11-05",
      cycleMonths: 12,
      planName: "Hiệu chuẩn HPLC Waters",
    },
    {
      code: "EQ-UV-002",
      name: "UV-Vis Thermo Genesys 50",
      model: "Genesys 50",
      serialNumber: "GEN50-11223",
      manufacturer: "Thermo Fisher",
      department: "QA",
      location: "QA-01",
      manager: "Q. Hoa",
      status: "Broken" as const,
    },
    {
      code: "EQ-BAL-002",
      name: "Cân Sartorius Entris II",
      model: "Entris II BCE",
      serialNumber: "SAR-998877",
      manufacturer: "Sartorius",
      department: "Sản xuất",
      location: "SX-02",
      manager: "M. Kieu",
      status: "InUse" as const,
      lastCalibrationDate: "2026-02-20",
      cycleMonths: 6,
      planName: "Hiệu chuẩn cân Sartorius",
    },
  ];

  for (const dev of devices) {
    const lastCal = dev.lastCalibrationDate ? parseDate(dev.lastCalibrationDate) : null;
    const calExpiry = lastCal && dev.cycleMonths ? addCycleMonths(lastCal, dev.cycleMonths) : null;

    const equipment = await prisma.equipment.create({
      data: {
        code: dev.code,
        name: dev.name,
        model: dev.model,
        serialNumber: dev.serialNumber,
        manufacturer: dev.manufacturer,
        department: dev.department,
        location: dev.location,
        manager: dev.manager,
        status: dev.status,
        lastCalibrationDate: lastCal,
        calibrationExpiryDate: calExpiry,
        calibrator: "Đơn vị HC ngoài",
        commissioningDate: lastCal,
        createdBy: "Seed",
        updatedBy: "Seed",
      },
    });

    if (lastCal && dev.cycleMonths && dev.planName) {
      const nextDate = addCycleMonths(lastCal, dev.cycleMonths);
      await prisma.calibrationPlan.create({
        data: {
          equipmentId: equipment.id,
          name: dev.planName,
          cycleMonths: dev.cycleMonths,
          lastDate: lastCal,
          nextDate,
          vendor: "VietCal Lab",
          status: computeScheduleStatus(nextDate),
          createdBy: "Seed",
          updatedBy: "Seed",
        },
      });
    }
  }

  await prisma.sparePart.create({
    data: {
      code: "SP-LAMP-D2",
      name: "Đèn D2 UV-Vis",
      manufacturer: "Shimadzu VN",
      stockQty: 2,
      minQty: 3,
      unit: "cái",
      createdBy: "Seed",
      updatedBy: "Seed",
    },
  });
}

async function main() {
  await prisma.stockInLog.deleteMany();
  await prisma.usageLog.deleteMany();
  await prisma.container.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.preparedStrain.deleteMany();
  await prisma.preparedStandardComponent.deleteMany();
  await prisma.preparedStandardSolvent.deleteMany();
  await prisma.preparedStandard.deleteMany();
  await prisma.preparedChemicalIngredient.deleteMany();
  await prisma.preparedChemical.deleteMany();
  await prisma.microbialStrain.deleteMany();
  await prisma.chemical.deleteMany();
  await prisma.standard.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.sparePartUsage.deleteMany();
  await prisma.equipmentSparePartLink.deleteMany();
  await prisma.sparePart.deleteMany();
  await prisma.equipmentAttachment.deleteMany();
  await prisma.equipment.deleteMany();

  const staffSeed = [
    { code: "NV001", name: "QC Analyst", department: "QC" },
    { code: "NV002", name: "A. Minh", department: "Phòng thí nghiệm" },
    { code: "NV003", name: "B. Quang", department: "Phòng thí nghiệm" },
    { code: "NV004", name: "Q. Hoa", department: "QA/QC" },
    { code: "NV005", name: "M. Kieu", department: "Phòng thí nghiệm" },
    { code: "NV006", name: "P. Huy", department: "Kho" },
    { code: "NV007", name: "V. Lam", department: "Phòng thí nghiệm" },
    { code: "NV008", name: "N. Anh", department: "Pha chế" },
  ];

  for (const member of staffSeed) {
    await prisma.staff.create({ data: member });
  }

  const sourceByItemCode = new Map<string, { sourceType: UsageSourceType; sourceId: string }>();
  const containerByItemCode = new Map<string, string>();

  const chemicalsData = [
    { code: "CHEM-0001", name: "Methanol", chemicalGroup: "Dung môi", manufacturer: "Merck", casNumber: "67-56-1", productCode: "106009", lot: "MET-2401", purity: "≥99.9%", uncertainty: "±0.1%", grade: "HPLC", location: "A1-03", quantity: 1000, unit: "mL", expiryDate: "2026-08-18", storageCondition: "15-25°C, khô", notes: "Dung môi HPLC", status: "Available" },
    { code: "CHEM-0002", name: "Acetonitrile", chemicalGroup: "Dung môi", manufacturer: "Sigma-Aldrich", casNumber: "75-05-8", productCode: "271004", lot: "ACN-2405", purity: "≥99.9%", uncertainty: "±0.1%", grade: "LC-MS", location: "A1-04", quantity: 4, unit: "L", expiryDate: "2026-07-02", storageCondition: "15-25°C", notes: "", status: "Low Stock" },
    { code: "CHEM-0003", name: "Hydrochloric acid", chemicalGroup: "Acid", manufacturer: "Honeywell", casNumber: "7647-01-0", productCode: "258148", lot: "HCL-2309", purity: "37%", uncertainty: "±0.5%", grade: "ACS", location: "B2-01", quantity: 22, unit: "L", expiryDate: "2026-09-29", storageCondition: "Tủ hóa chất ăn mòn", notes: "Dùng điều pH", status: "Available" },
    { code: "CHEM-0004", name: "Sodium hydroxide", chemicalGroup: "Base", manufacturer: "Merck", casNumber: "1310-73-2", productCode: "1310", lot: "NAOH-2402", purity: "≥98%", uncertainty: "±0.2%", grade: "Pellet", location: "B2-03", quantity: 7, unit: "kg", expiryDate: "2026-06-30", storageCondition: "Khô, tránh ẩm", notes: "", status: "Low Stock" },
    { code: "CHEM-0005", name: "Sulfuric acid", chemicalGroup: "Acid", manufacturer: "Sigma-Aldrich", casNumber: "7664-93-9", productCode: "84728", lot: "H2SO4-2308", purity: "95-98%", uncertainty: "±0.5%", grade: "Analytical", location: "B3-02", quantity: 3, unit: "L", expiryDate: "2026-06-21", storageCondition: "Tủ hóa chất ăn mòn", notes: "Chờ thanh lý", status: "Expired" },
    { code: "CHEM-0006", name: "Toluene", chemicalGroup: "Dung môi", manufacturer: "Merck", casNumber: "108-88-3", productCode: "108325", lot: "TOL-2407", purity: "≥99.8%", uncertainty: "±0.1%", grade: "HPLC", location: "A2-05", quantity: 11, unit: "L", expiryDate: "2026-10-10", storageCondition: "15-25°C, cháy", notes: "", status: "Available" },
    { code: "CHEM-0007", name: "Potassium dihydrogen phosphate", chemicalGroup: "Muối", manufacturer: "Honeywell", casNumber: "7778-77-0", productCode: "P0662", lot: "KH2PO4-2404", purity: "≥99%", uncertainty: "±0.1%", grade: "Reagent", location: "C1-02", quantity: 5, unit: "kg", expiryDate: "2026-07-18", storageCondition: "Khô", notes: "Chờ xử lý", status: "Pending Disposal" },
    { code: "CHEM-0008", name: "Water HPLC grade", chemicalGroup: "Dung môi", manufacturer: "Merck", casNumber: "7732-18-5", productCode: "115333", lot: "H2O-2406", purity: "HPLC", uncertainty: "", grade: "HPLC", location: "A1-01", quantity: 30, unit: "L", expiryDate: "2026-11-30", storageCondition: "15-25°C", notes: "", status: "Available" },
    { code: "CHEM-0009", name: "Nước cất", chemicalGroup: "Dung môi", manufacturer: "Nội bộ", casNumber: "7732-18-5", productCode: "", lot: "", purity: "Type I", uncertainty: "", grade: "", location: "A1-02", quantity: 10000, unit: "mL", expiryDate: "2027-12-31", storageCondition: "15-25°C", notes: "Pha chế nội bộ", status: "Available" },
  ];

  for (const item of chemicalsData) {
    const expiryDate = parseDate(item.expiryDate);
    const chemical = await prisma.chemical.create({
      data: {
        code: item.code,
        name: item.name,
        chemicalGroup: item.chemicalGroup,
        manufacturer: item.manufacturer,
        casNumber: item.casNumber,
        productCode: item.productCode,
        lot: item.lot,
        purity: item.purity || item.grade,
        uncertainty: item.uncertainty,
        unit: item.unit,
        quantity: item.quantity,
        expiryDate,
        storageCondition: item.storageCondition,
        storageLocation: item.location,
        notes: item.notes,
        status: computeStandardStatus(expiryDate),
        reorderLevel: 5,
      },
    });

    const status = computeContainerStatus({
      quantity: item.quantity,
      reorderLevel: 5,
      expiryDate: parseDate(item.expiryDate),
      forcePendingDisposal: item.status === "Pending Disposal",
    });

    const container = await prisma.container.create({
      data: {
        code: `CNT-${item.code}`,
        chemicalId: chemical.id,
        lot: item.lot,
        location: item.location,
        quantity: item.quantity,
        unit: item.unit,
        expiryDate: parseDate(item.expiryDate),
        status: item.status === "Pending Disposal" ? ContainerStatus.PendingDisposal : status,
      },
    });

    containerByItemCode.set(item.code, container.id);
    sourceByItemCode.set(item.code, { sourceType: UsageSourceType.Chemical, sourceId: chemical.id });
  }

  const standardsData = [
    { code: "STD-0001", name: "Caffeine CRM", standardGroup: "CRM", manufacturer: "Sigma-Aldrich", casNumber: "58-08-2", productCode: "C0750", lot: "CAF-2301", purity: "99.98%", uncertainty: "0.03%", unit: "g", quantity: 10, certificateExpiry: "2026-12-15", afterOpenExpiry: "2027-06-15", storageCondition: "2-8°C, khô", storageLocation: "C2-04", notes: "CRM caffeine" },
    { code: "STD-0002", name: "Benzoic Acid CRM", standardGroup: "CRM", manufacturer: "Merck", casNumber: "65-85-0", productCode: "109049", lot: "BEN-2304", purity: "99.95%", uncertainty: "0.04%", unit: "g", quantity: 5, certificateExpiry: "2026-09-12", afterOpenExpiry: "2027-03-12", storageCondition: "15-25°C", storageLocation: "C2-05", notes: "" },
    { code: "STD-0003", name: "Sodium Chloride RM", standardGroup: "RM", manufacturer: "Honeywell", casNumber: "7647-14-5", productCode: "S7653", lot: "NaCl-2403", purity: "99.90%", uncertainty: "0.02%", unit: "g", quantity: 8, certificateExpiry: "2027-01-10", afterOpenExpiry: "2027-07-10", storageCondition: "Khô, tránh ẩm", storageLocation: "C3-02", notes: "" },
    { code: "STD-0004", name: "Nickel Standard 1000 mg/L", standardGroup: "Working", manufacturer: "Inorganic Ventures", casNumber: "7440-02-0", productCode: "NI-1000", lot: "NI-2408", purity: "99.50%", uncertainty: "0.5%", unit: "mL", quantity: 6, certificateExpiry: "2026-08-05", afterOpenExpiry: "2026-11-05", storageCondition: "2-8°C", storageLocation: "D1-01", notes: "" },
    { code: "STD-0005", name: "CO2 Calibration Gas", standardGroup: "Working", manufacturer: "Air Liquide", casNumber: "124-38-9", productCode: "CO2-5%", lot: "CO2-2409", purity: "99.999%", uncertainty: "0.01%", unit: "L", quantity: 2, certificateExpiry: "2026-06-15", afterOpenExpiry: "2026-09-15", storageCondition: "Chai áp suất", storageLocation: "D1-03", notes: "Sắp hết hạn" },
    { code: "STD-0006", name: "Ruthenium Standard", standardGroup: "RM", manufacturer: "Spex CertiPrep", casNumber: "7440-18-8", productCode: "RU-100", lot: "RU-2410", purity: "99.96%", uncertainty: "0.05%", unit: "mL", quantity: 12, certificateExpiry: "2027-02-18", afterOpenExpiry: "2027-08-18", storageCondition: "2-8°C", storageLocation: "C3-05", notes: "" },
  ];

  for (const item of standardsData) {
    const expiryDate = parseDate(item.certificateExpiry);
    const afterOpenExpiry = item.afterOpenExpiry ? parseDate(item.afterOpenExpiry) : null;
    const standard = await prisma.standard.create({
      data: {
        code: item.code,
        name: item.name,
        standardGroup: item.standardGroup,
        manufacturer: item.manufacturer,
        casNumber: item.casNumber,
        productCode: item.productCode,
        lot: item.lot,
        purity: item.purity,
        uncertainty: item.uncertainty,
        unit: item.unit,
        quantity: item.quantity,
        expiryDate,
        afterOpenExpiry,
        storageCondition: item.storageCondition,
        storageLocation: item.storageLocation,
        notes: item.notes,
        status: computeStandardStatus(expiryDate),
      },
    });

    const status = computeContainerStatus({
      quantity: item.quantity,
      reorderLevel: 3,
      expiryDate,
    });

    const container = await prisma.container.create({
      data: {
        code: `CNT-${item.code}`,
        standardId: standard.id,
        lot: item.lot,
        location: item.storageLocation,
        quantity: item.quantity,
        unit: item.unit,
        expiryDate,
        afterOpenExpiry: afterOpenExpiry ?? expiryDate,
        status,
      },
    });

    containerByItemCode.set(item.code, container.id);
    sourceByItemCode.set(item.code, { sourceType: UsageSourceType.Standard, sourceId: standard.id });
  }

  const transactions = [
    { id: "TRX-001", date: "2026-06-16", type: UsageLogType.IN, itemCode: "CHEM-0001", quantity: 5, unit: "L", performedBy: "A. Minh", purpose: "New shipment receipt", notes: "" },
    { id: "TRX-002", date: "2026-06-15", type: UsageLogType.OUT, itemCode: "CHEM-0002", quantity: 2, unit: "L", performedBy: "B. Quang", purpose: "HPLC run", notes: "" },
    { id: "TRX-003", date: "2026-06-14", type: UsageLogType.USE, itemCode: "STD-0001", quantity: 1, unit: "mL", performedBy: "Q. Hoa", purpose: "Calibration", notes: "" },
    { id: "TRX-004", date: "2026-06-13", type: UsageLogType.DISPOSE, itemCode: "CHEM-0005", quantity: 1, unit: "L", performedBy: "M. Kieu", purpose: "Expired reagent disposal", notes: "Hết hạn" },
    { id: "TRX-005", date: "2026-06-12", type: UsageLogType.IN, itemCode: "CHEM-0008", quantity: 20, unit: "L", performedBy: "P. Huy", purpose: "Refill stock", notes: "" },
    { id: "TRX-007", date: "2026-06-10", type: UsageLogType.USE, itemCode: "CHEM-0006", quantity: 4, unit: "L", performedBy: "V. Lam", purpose: "Cleaning solvent", notes: "" },
    { id: "TRX-008", date: "2026-06-09", type: UsageLogType.IN, itemCode: "CHEM-0007", quantity: 8, unit: "kg", performedBy: "N. Anh", purpose: "Buffer preparation", notes: "" },
    { id: "TRX-009", date: "2026-06-08", type: UsageLogType.OUT, itemCode: "CHEM-0004", quantity: 1, unit: "kg", performedBy: "K. Hoa", purpose: "Neutralization", notes: "" },
    { id: "TRX-010", date: "2026-06-07", type: UsageLogType.USE, itemCode: "STD-0003", quantity: 2, unit: "g", performedBy: "L. Tuan", purpose: "Method validation", notes: "" },
  ];

  for (const trx of transactions) {
    const source = sourceByItemCode.get(trx.itemCode);
    if (!source) continue;

    await prisma.usageLog.create({
      data: {
        date: parseDate(trx.date),
        type: trx.type,
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        containerId: containerByItemCode.get(trx.itemCode),
        quantity: trx.quantity,
        unit: trx.unit,
        performedBy: trx.performedBy,
        purpose: trx.purpose,
        notes: trx.notes,
      },
    });
  }

  const auditLogs = [
    { time: "2026-06-18 08:15", user: "QC Analyst", action: "Updated", object: "CHEM-0002", entityType: "Container", entityId: "CHEM-0002", before: "Qty 5 L", after: "Qty 4 L" },
    { time: "2026-06-17 16:55", user: "A. Minh", action: "Created", object: "TRX-001", entityType: "UsageLog", entityId: "TRX-001", before: "-", after: "IN 5 L Methanol" },
    { time: "2026-06-17 15:20", user: "Q. Hoa", action: "Uploaded", object: "STD-0001", entityType: "Standard", entityId: "STD-0001", before: "No COA", after: "COA attached" },
    { time: "2026-06-17 12:10", user: "D. Son", action: "Reassigned", object: "CHEM-0007", entityType: "Container", entityId: "CHEM-0007", before: "Shelf C1-02", after: "Shelf C1-04" },
    { time: "2026-06-17 09:45", user: "N. Anh", action: "Disposed", object: "CHEM-0005", entityType: "Container", entityId: "CHEM-0005", before: "Stored", after: "Disposed" },
    { time: "2026-06-16 14:05", user: "L. Tuan", action: "Reviewed", object: "STD-0004", entityType: "Standard", entityId: "STD-0004", before: "Pending review", after: "Approved" },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({
      data: {
        time: new Date(log.time.replace(" ", "T") + ":00.000Z"),
        user: log.user,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        object: log.object,
        beforeJson: JSON.stringify(log.before),
        afterJson: JSON.stringify(log.after),
      },
    });
  }

  const chem1 = await prisma.chemical.findUnique({ where: { code: "CHEM-0001" } });
  const chemWater = await prisma.chemical.findUnique({ where: { code: "CHEM-0009" } });
  const std1 = await prisma.standard.findUnique({ where: { code: "STD-0001" } });

  const ms1 = await prisma.microbialStrain.create({
    data: {
      code: "MS-0001",
      name: "E. coli ATCC 25922",
      strainGroup: "Vi khuẩn",
      manufacturer: "ATCC",
      atccProductCode: "25922",
      speciesStrain: "Escherichia coli",
      storageCondition: "-80°C glycerol",
      lot: "EC-2401",
      unit: "vial",
      quantity: 1,
      expiryDate: parseDate("2027-01-15"),
      storageLocation: "Freezer A1",
      status: computeStandardStatus(parseDate("2027-01-15")),
      passage: 2,
      responsiblePerson: "D. Tran",
      notes: "Chủng gốc vi sinh",
    },
  });

  await prisma.microbialStrain.create({
    data: {
      code: "MS-0002",
      name: "S. aureus ATCC 6538",
      strainGroup: "Vi khuẩn",
      manufacturer: "ATCC",
      atccProductCode: "6538",
      speciesStrain: "Staphylococcus aureus",
      storageCondition: "2-8°C",
      lot: "SA-2402",
      unit: "vial",
      quantity: 1,
      expiryDate: parseDate("2026-12-01"),
      storageLocation: "Fridge B2",
      status: computeStandardStatus(parseDate("2026-12-01")),
      passage: 1,
      responsiblePerson: "N. Pham",
    },
  });

  if (chem1 && chemWater) {
    const metUsed = 700;
    const waterUsed = 300;
    await prisma.preparedChemical.create({
      data: {
        code: "PCHEM-0001",
        name: "Methanol 70% working",
        concentration: "70",
        concentrationUnit: "% v/v",
        preparedQuantity: 1000,
        unit: "mL",
        preparedDate: parseDate("2026-06-01"),
        preparedBy: "Lab Tech A",
        expiryDate: parseDate("2026-09-01"),
        storageLocation: "Cabinet C1",
        status: computeStandardStatus(parseDate("2026-09-01")),
        ingredients: {
          create: [
            {
              chemicalId: chem1.id,
              chemicalNameSnapshot: chem1.name,
              casProductCodeSnapshot: formatCasProductSnapshot(chem1.casNumber, chem1.productCode),
              lotNumberSnapshot: chem1.lot,
              quantityUsed: metUsed,
              unit: "mL",
            },
            {
              chemicalId: chemWater.id,
              chemicalNameSnapshot: chemWater.name,
              casProductCodeSnapshot: formatCasProductSnapshot(chemWater.casNumber, chemWater.productCode),
              lotNumberSnapshot: chemWater.lot,
              quantityUsed: waterUsed,
              unit: "mL",
            },
          ],
        },
      },
    });
    await prisma.chemical.update({
      where: { id: chem1.id },
      data: { quantity: chem1.quantity - metUsed },
    });
    await prisma.chemical.update({
      where: { id: chemWater.id },
      data: { quantity: chemWater.quantity - waterUsed },
    });
  }

  if (std1 && chemWater) {
    const pstdRoot = await prisma.preparedStandard.create({
      data: {
        code: "PSTD-0000",
        name: "Caffeine stock 1000 ppm",
        level: PreparedStandardLevel.RootPrepared,
        concentration: "1000",
        concentrationUnit: "ppm",
        solventVolume: 100,
        solventUnit: "mL",
        preparedDate: parseDate("2026-06-05"),
        preparedBy: "N. Pham",
        expiryDate: parseDate("2026-09-05"),
        status: StandardExpiryStatus.Ready,
        storageLocation: "Tủ chuẩn A0",
        notes: "Chuẩn gốc pha từ CRM Caffeine",
        quantity: 100,
        unit: "mL",
      },
    });
    await prisma.standard.update({
      where: { id: std1.id },
      data: { quantity: 9.99 },
    });
    await prisma.chemical.update({
      where: { id: chemWater.id },
      data: { quantity: 9900 },
    });
    await prisma.preparedStandardComponent.create({
      data: {
        preparedStandardId: pstdRoot.id,
        sourceType: "Standard",
        standardId: std1.id,
        standardCodeSnapshot: std1.code,
        standardNameSnapshot: std1.name,
        manufacturerSnapshot: std1.manufacturer,
        productCodeSnapshot: std1.productCode,
        lotNumberSnapshot: std1.lot,
        puritySnapshot: std1.purity,
        quantityUsed: 10,
        unit: "mg",
      },
    });
    await prisma.preparedStandardSolvent.create({
      data: {
        preparedStandardId: pstdRoot.id,
        chemicalId: chemWater.id,
        chemicalCodeSnapshot: chemWater.code,
        chemicalNameSnapshot: chemWater.name,
        casProductCodeSnapshot: formatCasProductSnapshot(chemWater.casNumber, chemWater.productCode),
        lotNumberSnapshot: chemWater.lot,
        quantityUsed: 100,
        unit: "mL",
      },
    });

    const pstd2 = await prisma.preparedStandard.create({
      data: {
        code: "PSTD-0002",
        name: "Caffeine intermediate 100 ppm",
        level: PreparedStandardLevel.Intermediate1,
        concentration: "100",
        concentrationUnit: "ppm",
        solventVolume: 50,
        solventUnit: "mL",
        preparedDate: parseDate("2026-06-08"),
        preparedBy: "N. Pham",
        expiryDate: parseDate("2026-08-08"),
        status: StandardExpiryStatus.Ready,
        storageLocation: "Tủ chuẩn A1",
        notes: "Chuẩn trung gian cấp 1 từ Chuẩn gốc pha",
        quantity: 50,
        unit: "mL",
      },
    });
    await prisma.preparedStandard.update({
      where: { id: pstdRoot.id },
      data: { quantity: 95 },
    });
    await prisma.chemical.update({
      where: { id: chemWater.id },
      data: { quantity: 9850 },
    });
    await prisma.preparedStandardComponent.create({
      data: {
        preparedStandardId: pstd2.id,
        sourceType: "PreparedStandard",
        sourcePreparedStandardId: pstdRoot.id,
        standardCodeSnapshot: pstdRoot.code,
        standardNameSnapshot: pstdRoot.name,
        lotNumberSnapshot: pstdRoot.code,
        concentrationSnapshot: "1000",
        concentrationUnitSnapshot: "ppm",
        levelSnapshot: PreparedStandardLevel.RootPrepared,
        preparedDateSnapshot: parseDate("2026-06-05"),
        expiryDateSnapshot: parseDate("2026-09-05"),
        quantityUsed: 5,
        unit: "mL",
      },
    });
    await prisma.preparedStandardSolvent.create({
      data: {
        preparedStandardId: pstd2.id,
        chemicalId: chemWater.id,
        chemicalCodeSnapshot: chemWater.code,
        chemicalNameSnapshot: chemWater.name,
        casProductCodeSnapshot: formatCasProductSnapshot(chemWater.casNumber, chemWater.productCode),
        lotNumberSnapshot: chemWater.lot,
        quantityUsed: 50,
        unit: "mL",
      },
    });

    const pstd3 = await prisma.preparedStandard.create({
      data: {
        code: "PSTD-0003",
        name: "Caffeine intermediate 50 ppm",
        level: PreparedStandardLevel.Intermediate2,
        concentration: "50",
        concentrationUnit: "ppm",
        solventVolume: 50,
        solventUnit: "mL",
        preparedDate: parseDate("2026-06-09"),
        preparedBy: "N. Pham",
        expiryDate: parseDate("2026-08-09"),
        status: StandardExpiryStatus.Ready,
        storageLocation: "Tủ chuẩn A1",
        notes: "Chuẩn trung gian cấp 2",
        quantity: 50,
        unit: "mL",
      },
    });
    await prisma.preparedStandard.update({
      where: { id: pstd2.id },
      data: { quantity: 45 },
    });
    await prisma.chemical.update({
      where: { id: chemWater.id },
      data: { quantity: 9800 },
    });
    await prisma.preparedStandardComponent.create({
      data: {
        preparedStandardId: pstd3.id,
        sourceType: "PreparedStandard",
        sourcePreparedStandardId: pstd2.id,
        standardCodeSnapshot: pstd2.code,
        standardNameSnapshot: pstd2.name,
        lotNumberSnapshot: pstd2.code,
        concentrationSnapshot: "100",
        concentrationUnitSnapshot: "ppm",
        levelSnapshot: PreparedStandardLevel.Intermediate1,
        preparedDateSnapshot: parseDate("2026-06-08"),
        expiryDateSnapshot: parseDate("2026-08-08"),
        quantityUsed: 5,
        unit: "mL",
      },
    });
    await prisma.preparedStandardSolvent.create({
      data: {
        preparedStandardId: pstd3.id,
        chemicalId: chemWater.id,
        chemicalCodeSnapshot: chemWater.code,
        chemicalNameSnapshot: chemWater.name,
        casProductCodeSnapshot: formatCasProductSnapshot(chemWater.casNumber, chemWater.productCode),
        lotNumberSnapshot: chemWater.lot,
        quantityUsed: 50,
        unit: "mL",
      },
    });

    const pstd4 = await prisma.preparedStandard.create({
      data: {
        code: "PSTD-0004",
        name: "Caffeine intermediate 20 ppm",
        level: PreparedStandardLevel.Intermediate3,
        concentration: "20",
        concentrationUnit: "ppm",
        solventVolume: 50,
        solventUnit: "mL",
        preparedDate: parseDate("2026-06-10"),
        preparedBy: "N. Pham",
        expiryDate: parseDate("2026-08-10"),
        status: StandardExpiryStatus.Ready,
        storageLocation: "Tủ chuẩn A2",
        notes: "Chuẩn trung gian cấp 3",
        quantity: 50,
        unit: "mL",
      },
    });
    await prisma.preparedStandard.update({
      where: { id: pstd3.id },
      data: { quantity: 45 },
    });
    await prisma.chemical.update({
      where: { id: chemWater.id },
      data: { quantity: 9750 },
    });
    await prisma.preparedStandardComponent.create({
      data: {
        preparedStandardId: pstd4.id,
        sourceType: "PreparedStandard",
        sourcePreparedStandardId: pstd3.id,
        standardCodeSnapshot: pstd3.code,
        standardNameSnapshot: pstd3.name,
        lotNumberSnapshot: pstd3.code,
        concentrationSnapshot: "50",
        concentrationUnitSnapshot: "ppm",
        levelSnapshot: PreparedStandardLevel.Intermediate2,
        preparedDateSnapshot: parseDate("2026-06-09"),
        expiryDateSnapshot: parseDate("2026-08-09"),
        quantityUsed: 5,
        unit: "mL",
      },
    });
    await prisma.preparedStandardSolvent.create({
      data: {
        preparedStandardId: pstd4.id,
        chemicalId: chemWater.id,
        chemicalCodeSnapshot: chemWater.code,
        chemicalNameSnapshot: chemWater.name,
        casProductCodeSnapshot: formatCasProductSnapshot(chemWater.casNumber, chemWater.productCode),
        lotNumberSnapshot: chemWater.lot,
        quantityUsed: 50,
        unit: "mL",
      },
    });

    const pstd1 = await prisma.preparedStandard.create({
      data: {
        code: "PSTD-0001",
        name: "Caffeine 10 ppm",
        level: PreparedStandardLevel.WorkingPrepared,
        concentration: "10",
        concentrationUnit: "ppm",
        solventVolume: 100,
        solventUnit: "mL",
        preparedDate: parseDate("2026-06-10"),
        preparedBy: "N. Pham",
        expiryDate: parseDate("2026-07-10"),
        status: StandardExpiryStatus.Ready,
        storageLocation: "Tủ chuẩn A2",
        notes: "Chuẩn làm việc — nguồn đa cấp (gốc pha + TG1 + TG3)",
        quantity: 100,
        unit: "mL",
      },
    });
    await prisma.preparedStandard.update({
      where: { id: pstdRoot.id },
      data: { quantity: 94 },
    });
    await prisma.preparedStandard.update({
      where: { id: pstd2.id },
      data: { quantity: 43 },
    });
    await prisma.preparedStandard.update({
      where: { id: pstd4.id },
      data: { quantity: 48 },
    });
    await prisma.chemical.update({
      where: { id: chemWater.id },
      data: { quantity: 9650 },
    });
    await prisma.preparedStandardComponent.create({
      data: {
        preparedStandardId: pstd1.id,
        sourceType: "PreparedStandard",
        sourcePreparedStandardId: pstdRoot.id,
        standardCodeSnapshot: pstdRoot.code,
        standardNameSnapshot: pstdRoot.name,
        lotNumberSnapshot: pstdRoot.code,
        concentrationSnapshot: "1000",
        concentrationUnitSnapshot: "ppm",
        levelSnapshot: PreparedStandardLevel.RootPrepared,
        preparedDateSnapshot: parseDate("2026-06-05"),
        expiryDateSnapshot: parseDate("2026-08-05"),
        quantityUsed: 1,
        unit: "mL",
      },
    });
    await prisma.preparedStandardComponent.create({
      data: {
        preparedStandardId: pstd1.id,
        sourceType: "PreparedStandard",
        sourcePreparedStandardId: pstd2.id,
        standardCodeSnapshot: pstd2.code,
        standardNameSnapshot: pstd2.name,
        lotNumberSnapshot: pstd2.code,
        concentrationSnapshot: "100",
        concentrationUnitSnapshot: "ppm",
        levelSnapshot: PreparedStandardLevel.Intermediate1,
        preparedDateSnapshot: parseDate("2026-06-08"),
        expiryDateSnapshot: parseDate("2026-08-08"),
        quantityUsed: 2,
        unit: "mL",
      },
    });
    await prisma.preparedStandardComponent.create({
      data: {
        preparedStandardId: pstd1.id,
        sourceType: "PreparedStandard",
        sourcePreparedStandardId: pstd4.id,
        standardCodeSnapshot: pstd4.code,
        standardNameSnapshot: pstd4.name,
        lotNumberSnapshot: pstd4.code,
        concentrationSnapshot: "20",
        concentrationUnitSnapshot: "ppm",
        levelSnapshot: PreparedStandardLevel.Intermediate3,
        preparedDateSnapshot: parseDate("2026-06-10"),
        expiryDateSnapshot: parseDate("2026-08-10"),
        quantityUsed: 2,
        unit: "mL",
      },
    });
    await prisma.preparedStandardSolvent.create({
      data: {
        preparedStandardId: pstd1.id,
        chemicalId: chemWater.id,
        chemicalCodeSnapshot: chemWater.code,
        chemicalNameSnapshot: chemWater.name,
        casProductCodeSnapshot: formatCasProductSnapshot(chemWater.casNumber, chemWater.productCode),
        lotNumberSnapshot: chemWater.lot,
        quantityUsed: 100,
        unit: "mL",
      },
    });
  }

  await prisma.preparedStrain.create({
    data: {
      code: "PMS-0001",
      name: "E. coli working culture",
      sourceStrainId: ms1.id,
      lot: "PEC-WK-2406",
      preparedDate: parseDate("2026-06-12"),
      preparedBy: "D. Tran",
      checkedBy: "K. Hoa",
      expiryDate: parseDate("2026-06-26"),
      passage: 3,
      storageCondition: "2-8°C",
      status: InventoryItemStatus.Available,
      responsiblePerson: "D. Tran",
    },
  });

  await seedEquipment();
  await seedStockLotsFromCatalog();
  await seedAuth();

  console.log("Seed completed.");
}

async function seedAuth() {
  const keys = [...PERMISSION_KEYS];

  await prisma.userPermission.deleteMany({
    where: { permission: { key: { notIn: keys } } },
  });
  await prisma.permission.deleteMany({
    where: { key: { notIn: keys } },
  });

  for (const key of PERMISSION_KEYS) {
    await prisma.permission.upsert({
      where: { key },
      update: { name: PERMISSION_LABELS[key] },
      create: { key, name: PERMISSION_LABELS[key] },
    });
  }

  const adminHash = await hashPassword("Admin@123456");
  const demoHash = await hashPassword("Demo@123456");

  await prisma.user.upsert({
    where: { email: "smartai0101@gmail.com" },
    update: {
      name: "System Admin",
      passwordHash: adminHash,
      role: "Admin",
      status: "Active",
    },
    create: {
      name: "System Admin",
      email: "smartai0101@gmail.com",
      passwordHash: adminHash,
      role: "Admin",
      status: "Active",
    },
  });

  const demoUsers = [
    { name: "Lab Manager Demo", email: "labmanager@demo.local", role: "LabManager" as const },
    { name: "Analyst Demo", email: "analyst@demo.local", role: "Analyst" as const },
    { name: "Viewer Demo", email: "viewer@demo.local", role: "Viewer" as const },
  ];

  for (const demo of demoUsers) {
    await prisma.user.upsert({
      where: { email: demo.email },
      update: {
        name: demo.name,
        passwordHash: demoHash,
        role: demo.role,
        status: "Active",
      },
      create: {
        name: demo.name,
        email: demo.email,
        passwordHash: demoHash,
        role: demo.role,
        status: "Active",
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
