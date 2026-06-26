import type { EquipmentStatus, PrismaClient } from "@prisma/client";
import { addCycleMonths, computeScheduleStatus } from "../../lib/equipment-schedule";
import { parseDate } from "./helpers";

type DeviceSeed = {
  code: string;
  name: string;
  model: string;
  serialNumber: string;
  manufacturer: string;
  department: string;
  location: string;
  manager: string;
  status: EquipmentStatus;
  lastCalibrationDate?: string;
  cycleMonths?: number;
  planName?: string;
};

export const EXTENDED_EQUIPMENT: DeviceSeed[] = [
  { code: "EQ-GC-001", name: "GC Agilent 7890B", model: "7890B", serialNumber: "GC7890-4412", manufacturer: "Agilent", department: "Phòng thí nghiệm", location: "Lab A-02", manager: "V. Lam", status: "InUse", lastCalibrationDate: "2025-10-01", cycleMonths: 12, planName: "Hiệu chuẩn GC" },
  { code: "EQ-GC-002", name: "GC-MS Thermo Trace 1310", model: "Trace 1310", serialNumber: "GCMS-8821", manufacturer: "Thermo Fisher", department: "QC", location: "QC-03", manager: "Q. Hoa", status: "InUse", lastCalibrationDate: "2026-01-20", cycleMonths: 12, planName: "Hiệu chuẩn GC-MS" },
  { code: "EQ-HPLC-003", name: "HPLC Shimadzu Nexera", model: "Nexera X2", serialNumber: "LC-2024-991", manufacturer: "Shimadzu", department: "Phòng thí nghiệm", location: "Lab A-03", manager: "A. Minh", status: "InUse", lastCalibrationDate: "2025-09-15", cycleMonths: 12, planName: "Hiệu chuẩn HPLC Shimadzu" },
  { code: "EQ-LC-MS-001", name: "LC-MS AB Sciex QTRAP 4500", model: "QTRAP 4500", serialNumber: "MS-4500-772", manufacturer: "SCIEX", department: "Phòng thí nghiệm", location: "Lab C-02", manager: "V. Lam", status: "InUse", lastCalibrationDate: "2025-11-10", cycleMonths: 12, planName: "Hiệu chuẩn LC-MS" },
  { code: "EQ-FTIR-001", name: "FTIR PerkinElmer Spectrum Two", model: "Spectrum Two", serialNumber: "FTIR-5566", manufacturer: "PerkinElmer", department: "QA", location: "QA-02", manager: "Q. Hoa", status: "InUse", lastCalibrationDate: "2026-02-01", cycleMonths: 24, planName: "Hiệu chuẩn FTIR" },
  { code: "EQ-KF-001", name: "Karl Fischer Metrohm 917", model: "917 Ti-Touch", serialNumber: "KF917-3344", manufacturer: "Metrohm", department: "QC", location: "QC-04", manager: "B. Quang", status: "InUse", lastCalibrationDate: "2026-03-10", cycleMonths: 12, planName: "Hiệu chuẩn Karl Fischer" },
  { code: "EQ-pH-001", name: "pH meter Mettler SevenCompact", model: "S220", serialNumber: "pH-S220-889", manufacturer: "Mettler Toledo", department: "Phòng thí nghiệm", location: "Lab B-04", manager: "B. Quang", status: "InUse", lastCalibrationDate: "2026-04-01", cycleMonths: 6, planName: "Hiệu chuẩn pH" },
  { code: "EQ-AUT-001", name: "Autoclave Tuttnauer 3870", model: "3870EA", serialNumber: "AUT-3870-112", manufacturer: "Tuttnauer", department: "Vi sinh", location: "VS-01", manager: "D. Tran", status: "InUse", lastCalibrationDate: "2025-12-01", cycleMonths: 12, planName: "Validation autoclave" },
  { code: "EQ-INC-001", name: "Tủ ấm Memmert INE 400", model: "INE 400", serialNumber: "INC-400-223", manufacturer: "Memmert", department: "Vi sinh", location: "VS-02", manager: "D. Tran", status: "InUse", lastCalibrationDate: "2026-01-05", cycleMonths: 12, planName: "Hiệu chuẩn tủ ấm" },
  { code: "EQ-FRZ-001", name: "Tủ đông -80°C Thermo", model: "TSX Series ULT", serialNumber: "ULT-80-445", manufacturer: "Thermo Fisher", department: "Vi sinh", location: "VS-03", manager: "N. Pham", status: "InUse", lastCalibrationDate: "2025-08-20", cycleMonths: 12, planName: "Mapping nhiệt độ tủ đông" },
  { code: "EQ-VORT-001", name: "Máy lắc vortex IKA", model: "MS 3", serialNumber: "VORT-7788", manufacturer: "IKA", department: "Pha chế", location: "PC-01", manager: "N. Anh", status: "InUse" },
  { code: "EQ-MIC-001", name: "Kính hiển vi Olympus CX23", model: "CX23", serialNumber: "MIC-CX23-991", manufacturer: "Olympus", department: "Vi sinh", location: "VS-04", manager: "K. Hoa", status: "InUse", lastCalibrationDate: "2026-05-01", cycleMonths: 24, planName: "Bảo trì kính hiển vi" },
  { code: "EQ-PUMP-001", name: "Bơm chân không Brand", model: "ME 16C NT", serialNumber: "VAC-ME16-332", manufacturer: "Brand", department: "Phòng thí nghiệm", location: "Lab B-05", manager: "M. Kieu", status: "Maintenance", lastCalibrationDate: "2025-07-01", cycleMonths: 12, planName: "Bảo trì bơm chân không" },
  { code: "EQ-DIS-001", name: "Máy dập viên Erweka", model: "TBH 125", serialNumber: "DIS-TBH-881", manufacturer: "Erweka", department: "Sản xuất", location: "SX-03", manager: "M. Kieu", status: "InUse", lastCalibrationDate: "2026-02-15", cycleMonths: 12, planName: "Hiệu chuẩn dập viên" },
  { code: "EQ-DIS-002", name: "Máy tan rã Erweka DT 700", model: "DT 700", serialNumber: "DIS-DT700-554", manufacturer: "Erweka", department: "Sản xuất", location: "SX-04", manager: "M. Kieu", status: "Broken" },
  { code: "EQ-WATER-001", name: "Hệ thống nước Milli-Q IQ", model: "IQ 7000", serialNumber: "MQ-IQ7-667", manufacturer: "Merck", department: "Phòng thí nghiệm", location: "Lab A-04", manager: "A. Minh", status: "InUse", lastCalibrationDate: "2026-03-20", cycleMonths: 6, planName: "Kiểm tra resistivity nước" },
  { code: "EQ-SPEC-001", name: "Spectrophotometer BioTek", model: "Epoch 2", serialNumber: "SPEC-E2-778", manufacturer: "BioTek", department: "Vi sinh", location: "VS-05", manager: "D. Tran", status: "InUse", lastCalibrationDate: "2026-04-10", cycleMonths: 12, planName: "Hiệu chuẩn plate reader" },
  { code: "EQ-HOOD-001", name: "Tủ hút khí độc Esco", model: "AC2-4S8", serialNumber: "HOOD-AC2-991", manufacturer: "Esco", department: "Phòng thí nghiệm", location: "Lab B-06", manager: "B. Quang", status: "InUse", lastCalibrationDate: "2025-11-30", cycleMonths: 12, planName: "Kiểm tra face velocity" },
  { code: "EQ-STIR-001", name: "Máy khuấy từ IKA RCT", model: "RCT basic", serialNumber: "STIR-RCT-445", manufacturer: "IKA", department: "Pha chế", location: "PC-02", manager: "N. Anh", status: "InUse" },
  { code: "EQ-TOC-001", name: "TOC Analyzer Shimadzu", model: "TOC-L", serialNumber: "TOC-L-882", manufacturer: "Shimadzu", department: "QC", location: "QC-05", manager: "Q. Hoa", status: "InUse", lastCalibrationDate: "2026-01-25", cycleMonths: 12, planName: "Hiệu chuẩn TOC" },
];

type SparePartSeed = {
  code: string;
  name: string;
  manufacturer: string;
  productCode: string;
  lotNumber: string;
  stockQty: number;
  minQty: number;
  unit: string;
  linkEquipmentCodes: string[];
};

export const EXTENDED_SPARE_PARTS: SparePartSeed[] = [
  { code: "SP-COL-HPLC", name: "Cột HPLC C18 250mm", manufacturer: "Agilent", productCode: "959990-902", lotNumber: "COL-2411", stockQty: 3, minQty: 2, unit: "cái", linkEquipmentCodes: ["EQ-HPLC-001", "EQ-HPLC-003"] },
  { code: "SP-LAMP-D2-2", name: "Đèn D2 dự phòng", manufacturer: "Shimadzu VN", productCode: "228-34016-01", lotNumber: "D2-2410", stockQty: 1, minQty: 2, unit: "cái", linkEquipmentCodes: ["EQ-UV-001", "EQ-UV-002"] },
  { code: "SP-SEAL-GC", name: "Septa GC 11mm", manufacturer: "Agilent", productCode: "5183-4759", lotNumber: "SEP-2412", stockQty: 100, minQty: 50, unit: "cái", linkEquipmentCodes: ["EQ-GC-001", "EQ-GC-002"] },
  { code: "SP-FILT-SYR", name: "Lọc syringe 0.22µm", manufacturer: "Merck", productCode: "SLGP033RS", lotNumber: "FIL-2411", stockQty: 200, minQty: 100, unit: "cái", linkEquipmentCodes: ["EQ-HPLC-001", "EQ-LC-MS-001"] },
  { code: "SP-BAL-WGT", name: "Quả cân chuẩn 100g F1", manufacturer: "Mettler Toledo", productCode: "11123456", lotNumber: "WGT-2410", stockQty: 1, minQty: 1, unit: "bộ", linkEquipmentCodes: ["EQ-BAL-001", "EQ-BAL-002"] },
  { code: "SP-PUMP-HEAD", name: "Pump head LC-20AD", manufacturer: "Shimadzu", productCode: "228-00301-91", lotNumber: "PH-2411", stockQty: 2, minQty: 1, unit: "cái", linkEquipmentCodes: ["EQ-HPLC-003"] },
  { code: "SP-UV-LAMP", name: "Đèn halogen UV-Vis", manufacturer: "Shimadzu", productCode: "228-34016-02", lotNumber: "HAL-2409", stockQty: 2, minQty: 2, unit: "cái", linkEquipmentCodes: ["EQ-UV-001"] },
  { code: "SP-AUTOCL-SEAL", name: "Gioăng cửa autoclave", manufacturer: "Tuttnauer", productCode: "3870-SEAL", lotNumber: "GSK-2410", stockQty: 2, minQty: 1, unit: "cái", linkEquipmentCodes: ["EQ-AUT-001"] },
];

export async function seedExtendedEquipment(prisma: PrismaClient) {
  for (const dev of EXTENDED_EQUIPMENT) {
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

  for (const sp of EXTENDED_SPARE_PARTS) {
    const spare = await prisma.sparePart.create({
      data: {
        code: sp.code,
        name: sp.name,
        manufacturer: sp.manufacturer,
        productCode: sp.productCode,
        lotNumber: sp.lotNumber,
        stockQty: sp.stockQty,
        minQty: sp.minQty,
        unit: sp.unit,
        createdBy: "Seed",
        updatedBy: "Seed",
      },
    });

    for (const eqCode of sp.linkEquipmentCodes) {
      const eq = await prisma.equipment.findUnique({ where: { code: eqCode } });
      if (!eq) continue;
      await prisma.equipmentSparePartLink.create({
        data: { equipmentId: eq.id, sparePartId: spare.id },
      });
    }
  }

  console.log(`  Extended equipment: ${EXTENDED_EQUIPMENT.length} devices, ${EXTENDED_SPARE_PARTS.length} spare parts`);
}
