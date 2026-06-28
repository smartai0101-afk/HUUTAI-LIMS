import type { PrismaClient } from "@prisma/client";
import { ContainerStatus } from "@prisma/client";
import { computeContainerStatus } from "../../lib/container-status";
import { CHEMICAL_COA_PATHS } from "./assets";
import { expiryStatus, parseDate } from "./helpers";

type ChemSeed = {
  code: string;
  name: string;
  chemicalGroup: string;
  manufacturer: string;
  casNumber: string;
  productCode: string;
  lot: string;
  purity: string;
  unit: string;
  quantity: number;
  expiryDate: string;
  storageCondition: string;
  location: string;
  notes: string;
  status: string;
};

export const EXTENDED_CHEMICALS: ChemSeed[] = [
  { code: "CHEM-0010", name: "Isopropanol", chemicalGroup: "Dung môi", manufacturer: "Merck", casNumber: "67-63-0", productCode: "109634", lot: "IPA-2411", purity: "≥99.5%", unit: "L", quantity: 8, expiryDate: "2027-02-14", storageCondition: "15-25°C", location: "A1-05", notes: "Dung môi rửa HPLC", status: "Available" },
  { code: "CHEM-0011", name: "Formic acid", chemicalGroup: "Acid", manufacturer: "Sigma-Aldrich", casNumber: "64-18-6", productCode: "56302", lot: "FA-2408", purity: "≥98%", unit: "mL", quantity: 500, expiryDate: "2026-11-20", storageCondition: "Tủ acid", location: "B2-04", notes: "Mobile phase LC-MS", status: "Available" },
  { code: "CHEM-0012", name: "Phosphoric acid", chemicalGroup: "Acid", manufacturer: "Honeywell", casNumber: "7664-38-2", productCode: "345245", lot: "H3PO4-2410", purity: "85%", unit: "mL", quantity: 250, expiryDate: "2027-04-01", storageCondition: "Tủ acid", location: "B2-05", notes: "Buffer pH 2.1", status: "Available" },
  { code: "CHEM-0013", name: "Ammonium acetate", chemicalGroup: "Muối", manufacturer: "Merck", casNumber: "631-61-8", productCode: "101116", lot: "NH4Ac-2406", purity: "≥98%", unit: "g", quantity: 500, expiryDate: "2027-06-30", storageCondition: "Khô", location: "C1-06", notes: "Buffer LC-MS", status: "Available" },
  { code: "CHEM-0014", name: "Ethyl acetate", chemicalGroup: "Dung môi", manufacturer: "Sigma-Aldrich", casNumber: "141-78-6", productCode: "650528", lot: "EtOAc-2412", purity: "≥99.8%", unit: "L", quantity: 6, expiryDate: "2026-12-01", storageCondition: "15-25°C, cháy", location: "A2-06", notes: "Chiết HPLC prep", status: "Available" },
  { code: "CHEM-0015", name: "Hexane", chemicalGroup: "Dung môi", manufacturer: "Merck", casNumber: "110-54-3", productCode: "104374", lot: "HEX-2409", purity: "≥95%", unit: "L", quantity: 10, expiryDate: "2027-01-15", storageCondition: "15-25°C", location: "A2-07", notes: "GC sample prep", status: "Available" },
  { code: "CHEM-0016", name: "Magnesium sulfate", chemicalGroup: "Muối", manufacturer: "Honeywell", casNumber: "7487-88-9", productCode: "M7506", lot: "MgSO4-2411", purity: "Anhydrous", unit: "kg", quantity: 2, expiryDate: "2028-03-01", storageCondition: "Khô", location: "C1-07", notes: "Sấy khối mẫu", status: "Available" },
  { code: "CHEM-0017", name: "Sodium chloride", chemicalGroup: "Muối", manufacturer: "Merck", casNumber: "7647-14-5", productCode: "106404", lot: "NaCl-2410", purity: "≥99.5%", unit: "kg", quantity: 5, expiryDate: "2028-06-01", storageCondition: "Khô", location: "C1-08", notes: "Pha buffer vi sinh", status: "Available" },
  { code: "CHEM-0018", name: "Triethylamine", chemicalGroup: "Base", manufacturer: "Sigma-Aldrich", casNumber: "121-44-8", productCode: "471283", lot: "TEA-2407", purity: "≥99%", unit: "mL", quantity: 100, expiryDate: "2026-10-30", storageCondition: "Tủ hút ẩm", location: "B2-06", notes: "Điều pH LC", status: "Low Stock" },
  { code: "CHEM-0019", name: "Acetic acid glacial", chemicalGroup: "Acid", manufacturer: "Merck", casNumber: "64-19-7", productCode: "100063", lot: "HAc-2411", purity: "≥99.8%", unit: "L", quantity: 4, expiryDate: "2027-05-20", storageCondition: "Tủ acid", location: "B2-07", notes: "Mobile phase", status: "Available" },
  { code: "CHEM-0020", name: "Potassium chloride", chemicalGroup: "Muối", manufacturer: "Honeywell", casNumber: "7447-40-7", productCode: "P3911", lot: "KCl-2408", purity: "≥99%", unit: "g", quantity: 1000, expiryDate: "2028-01-01", storageCondition: "Khô", location: "C1-09", notes: "Chuẩn điện cực", status: "Available" },
  { code: "CHEM-0021", name: "Dichloromethane", chemicalGroup: "Dung môi", manufacturer: "Sigma-Aldrich", casNumber: "75-09-2", productCode: "270997", lot: "DCM-2410", purity: "≥99.9%", unit: "L", quantity: 5, expiryDate: "2026-09-15", storageCondition: "Tủ hút", location: "A2-08", notes: "Chiết pha chế", status: "Available" },
  { code: "CHEM-0022", name: "Trifluoroacetic acid", chemicalGroup: "Acid", manufacturer: "Merck", casNumber: "76-05-1", productCode: "108391", lot: "TFA-2409", purity: "≥99%", unit: "mL", quantity: 50, expiryDate: "2027-08-01", storageCondition: "Tủ acid", location: "B2-08", notes: "Ion pair LC-MS", status: "Available" },
  { code: "CHEM-0023", name: "Disodium hydrogen phosphate", chemicalGroup: "Muối", manufacturer: "Honeywell", casNumber: "7558-79-4", productCode: "S5136", lot: "Na2HPO4-2412", purity: "≥99%", unit: "g", quantity: 750, expiryDate: "2028-04-01", storageCondition: "Khô", location: "C1-10", notes: "PBS buffer", status: "Available" },
  { code: "CHEM-0024", name: "Potassium dihydrogen phosphate", chemicalGroup: "Muối", manufacturer: "Merck", casNumber: "7778-77-0", productCode: "104877", lot: "KH2PO4-2411", purity: "≥99%", unit: "g", quantity: 400, expiryDate: "2028-04-01", storageCondition: "Khô", location: "C1-11", notes: "PBS buffer", status: "Available" },
  { code: "CHEM-0025", name: "Ethanol absolute", chemicalGroup: "Dung môi", manufacturer: "Sigma-Aldrich", casNumber: "64-17-5", productCode: "459836", lot: "EtOH-2410", purity: "≥99.8%", unit: "L", quantity: 12, expiryDate: "2027-03-15", storageCondition: "15-25°C", location: "A1-06", notes: "Khử trùng + pha chế", status: "Available" },
  { code: "CHEM-0026", name: "Hydrogen peroxide 30%", chemicalGroup: "Oxy hóa", manufacturer: "Merck", casNumber: "7722-84-1", productCode: "107209", lot: "H2O2-2408", purity: "30%", unit: "mL", quantity: 500, expiryDate: "2026-08-01", storageCondition: "2-8°C, tối", location: "B3-03", notes: "Khử trùng bề mặt", status: "Available" },
  { code: "CHEM-0027", name: "Sodium azide", chemicalGroup: "Muối", manufacturer: "Sigma-Aldrich", casNumber: "26628-22-8", productCode: "71290", lot: "NaN3-2406", purity: "≥99.5%", unit: "g", quantity: 25, expiryDate: "2027-12-01", storageCondition: "Tủ độc", location: "B3-04", notes: "Bảo quản mẫu", status: "Available" },
  { code: "CHEM-0028", name: "Cyclohexane", chemicalGroup: "Dung môi", manufacturer: "Honeywell", casNumber: "110-82-7", productCode: "179191", lot: "C6H12-2411", purity: "≥99.5%", unit: "L", quantity: 8, expiryDate: "2027-02-28", storageCondition: "15-25°C", location: "A2-09", notes: "GC calibration", status: "Available" },
  { code: "CHEM-0029", name: "Ammonium formate", chemicalGroup: "Muối", manufacturer: "Merck", casNumber: "540-69-2", productCode: "70221", lot: "NH4HCO2-2412", purity: "≥99%", unit: "g", quantity: 250, expiryDate: "2027-07-01", storageCondition: "Khô", location: "C1-12", notes: "Mobile phase LC-MS", status: "Available" },
  { code: "CHEM-0030", name: "Nitric acid 65%", chemicalGroup: "Acid", manufacturer: "Merck", casNumber: "7697-37-2", productCode: "100441", lot: "HNO3-2412", purity: "≥65%, trace metal grade", unit: "L", quantity: 2, expiryDate: "2027-09-01", storageCondition: "Tủ acid", location: "B2-09", notes: "Acid hóa ICP-OES", status: "Available" },
];

export async function seedExtendedChemicals(prisma: PrismaClient) {
  for (let i = 0; i < EXTENDED_CHEMICALS.length; i++) {
    const item = EXTENDED_CHEMICALS[i]!;
    const expiryDate = parseDate(item.expiryDate);
    const coaPath = CHEMICAL_COA_PATHS[i % CHEMICAL_COA_PATHS.length] ?? null;

    const chemical = await prisma.chemical.create({
      data: {
        code: item.code,
        name: item.name,
        chemicalGroup: item.chemicalGroup,
        manufacturer: item.manufacturer,
        casNumber: item.casNumber,
        productCode: item.productCode,
        lot: item.lot,
        purity: item.purity,
        unit: item.unit,
        quantity: item.quantity,
        expiryDate,
        storageCondition: item.storageCondition,
        storageLocation: item.location,
        notes: item.notes,
        status: expiryStatus(item.expiryDate),
        coaPath,
        reorderLevel: 5,
      },
    });

    const status = computeContainerStatus({
      quantity: item.quantity,
      reorderLevel: 5,
      expiryDate,
      forcePendingDisposal: item.status === "Pending Disposal",
    });

    await prisma.container.create({
      data: {
        code: `CNT-${item.code}`,
        chemicalId: chemical.id,
        lot: item.lot,
        location: item.location,
        quantity: item.quantity,
        unit: item.unit,
        expiryDate,
        status: item.status === "Pending Disposal" ? ContainerStatus.PendingDisposal : status,
      },
    });
  }
  console.log(`  Extended chemicals: ${EXTENDED_CHEMICALS.length} rows`);
}
