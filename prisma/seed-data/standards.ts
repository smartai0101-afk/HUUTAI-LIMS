import type { PrismaClient } from "@prisma/client";
import { computeContainerStatus } from "../../lib/container-status";
import { STANDARD_COA_PATHS } from "./assets";
import { expiryStatus, parseDate } from "./helpers";

type StdSeed = {
  code: string;
  name: string;
  standardGroup: string;
  manufacturer: string;
  casNumber: string;
  productCode: string;
  lot: string;
  purity: string;
  uncertainty: string;
  unit: string;
  quantity: number;
  certificateExpiry: string;
  afterOpenExpiry: string;
  storageCondition: string;
  storageLocation: string;
  notes: string;
};

export const EXTENDED_STANDARDS: StdSeed[] = [
  { code: "STD-0007", name: "Paracetamol CRM", standardGroup: "CRM", manufacturer: "Sigma-Aldrich", casNumber: "103-90-2", productCode: "A7085", lot: "PAR-2411", purity: "99.9%", uncertainty: "0.1%", unit: "g", quantity: 5, certificateExpiry: "2027-03-01", afterOpenExpiry: "2027-09-01", storageCondition: "2-8°C", storageLocation: "C2-06", notes: "Chuẩn HPLC paracetamol" },
  { code: "STD-0008", name: "Ibuprofen CRM", standardGroup: "CRM", manufacturer: "Merck", casNumber: "15687-27-1", productCode: "I5502", lot: "IBU-2410", purity: "99.8%", uncertainty: "0.2%", unit: "g", quantity: 3, certificateExpiry: "2027-05-15", afterOpenExpiry: "2027-11-15", storageCondition: "15-25°C", storageLocation: "C2-07", notes: "" },
  { code: "STD-0009", name: "Metformin CRM", standardGroup: "CRM", manufacturer: "USP", casNumber: "657-24-9", productCode: "M0600000", lot: "MET-2412", purity: "99.95%", uncertainty: "0.05%", unit: "g", quantity: 2, certificateExpiry: "2027-08-01", afterOpenExpiry: "2028-02-01", storageCondition: "2-8°C", storageLocation: "C2-08", notes: "" },
  { code: "STD-0010", name: "Aspirin RM", standardGroup: "RM", manufacturer: "Honeywell", casNumber: "50-78-2", productCode: "A5376", lot: "ASP-2409", purity: "99.5%", uncertainty: "0.3%", unit: "g", quantity: 10, certificateExpiry: "2027-01-20", afterOpenExpiry: "2027-07-20", storageCondition: "Khô", storageLocation: "C3-06", notes: "" },
  { code: "STD-0011", name: "Lead Standard 1000 mg/L", standardGroup: "Working", manufacturer: "Inorganic Ventures", casNumber: "7439-92-1", productCode: "PB-1000", lot: "PB-2411", purity: "99.9%", uncertainty: "0.5%", unit: "mL", quantity: 8, certificateExpiry: "2027-04-10", afterOpenExpiry: "2027-10-10", storageCondition: "2-8°C", storageLocation: "D1-04", notes: "ICP-OES" },
  { code: "STD-0012", name: "Arsenic Standard 10 mg/L", standardGroup: "Working", manufacturer: "Spex CertiPrep", casNumber: "7440-38-2", productCode: "AS-10", lot: "AS-2410", purity: "99.5%", uncertainty: "1%", unit: "mL", quantity: 5, certificateExpiry: "2027-06-01", afterOpenExpiry: "2027-12-01", storageCondition: "2-8°C", storageLocation: "D1-05", notes: "" },
  { code: "STD-0013", name: "Vitamin C CRM", standardGroup: "CRM", manufacturer: "Sigma-Aldrich", casNumber: "50-81-7", productCode: "A5960", lot: "VITC-2411", purity: "99.7%", uncertainty: "0.2%", unit: "g", quantity: 4, certificateExpiry: "2027-02-28", afterOpenExpiry: "2027-08-28", storageCondition: "2-8°C, tối", storageLocation: "C2-09", notes: "" },
  { code: "STD-0014", name: "Glucose CRM", standardGroup: "CRM", manufacturer: "Merck", casNumber: "50-99-7", productCode: "G8270", lot: "GLU-2412", purity: "99.9%", uncertainty: "0.1%", unit: "g", quantity: 6, certificateExpiry: "2027-09-01", afterOpenExpiry: "2028-03-01", storageCondition: "Khô", storageLocation: "C2-10", notes: "" },
  { code: "STD-0015", name: "Calcium Standard 1000 mg/L", standardGroup: "Working", manufacturer: "Inorganic Ventures", casNumber: "7440-70-2", productCode: "CA-1000", lot: "CA-2410", purity: "99.9%", uncertainty: "0.5%", unit: "mL", quantity: 7, certificateExpiry: "2027-05-01", afterOpenExpiry: "2027-11-01", storageCondition: "2-8°C", storageLocation: "D1-06", notes: "" },
  { code: "STD-0016", name: "Iron Standard 1000 mg/L", standardGroup: "Working", manufacturer: "Inorganic Ventures", casNumber: "7439-89-6", productCode: "FE-1000", lot: "FE-2411", purity: "99.9%", uncertainty: "0.5%", unit: "mL", quantity: 6, certificateExpiry: "2027-07-15", afterOpenExpiry: "2028-01-15", storageCondition: "2-8°C", storageLocation: "D1-07", notes: "" },
  { code: "STD-0017", name: "Atorvastatin CRM", standardGroup: "CRM", manufacturer: "LGC", casNumber: "134523-00-5", productCode: "ATV-CRM", lot: "ATV-2410", purity: "99.6%", uncertainty: "0.2%", unit: "mg", quantity: 100, certificateExpiry: "2027-10-01", afterOpenExpiry: "2028-04-01", storageCondition: "2-8°C", storageLocation: "C2-11", notes: "" },
  { code: "STD-0018", name: "Mercury Standard 10 mg/L", standardGroup: "Working", manufacturer: "Spex CertiPrep", casNumber: "7439-97-6", productCode: "HG-10", lot: "HG-2409", purity: "99.5%", uncertainty: "1%", unit: "mL", quantity: 4, certificateExpiry: "2027-03-20", afterOpenExpiry: "2027-09-20", storageCondition: "2-8°C", storageLocation: "D1-08", notes: "Tủ độc" },
  { code: "STD-0019", name: "Potassium nitrate RM", standardGroup: "RM", manufacturer: "Honeywell", casNumber: "7757-79-1", productCode: "P8394", lot: "KNO3-2411", purity: "99.0%", uncertainty: "0.2%", unit: "g", quantity: 500, certificateExpiry: "2028-01-01", afterOpenExpiry: "2028-07-01", storageCondition: "Khô", storageLocation: "C3-07", notes: "" },
  { code: "STD-0020", name: "Zinc Standard 1000 mg/L", standardGroup: "Working", manufacturer: "Inorganic Ventures", casNumber: "7440-66-6", productCode: "ZN-1000", lot: "ZN-2412", purity: "99.9%", uncertainty: "0.5%", unit: "mL", quantity: 8, certificateExpiry: "2027-08-20", afterOpenExpiry: "2028-02-20", storageCondition: "2-8°C", storageLocation: "D1-09", notes: "" },
  { code: "STD-0021", name: "Caffeine secondary CRM", standardGroup: "CRM", manufacturer: "Merck", casNumber: "58-08-2", productCode: "C0750-B", lot: "CAF-2412", purity: "99.97%", uncertainty: "0.02%", unit: "g", quantity: 5, certificateExpiry: "2027-11-01", afterOpenExpiry: "2028-05-01", storageCondition: "2-8°C", storageLocation: "C2-12", notes: "Lot dự phòng caffeine" },
  { code: "STD-0022", name: "Copper Standard 1000 mg/L", standardGroup: "Working", manufacturer: "Inorganic Ventures", casNumber: "7440-50-8", productCode: "CU-1000", lot: "CU-2410", purity: "99.9%", uncertainty: "0.5%", unit: "mL", quantity: 6, certificateExpiry: "2027-04-25", afterOpenExpiry: "2027-10-25", storageCondition: "2-8°C", storageLocation: "D1-10", notes: "" },
  { code: "STD-0023", name: "Lactic acid CRM", standardGroup: "CRM", manufacturer: "Sigma-Aldrich", casNumber: "50-21-5", productCode: "L1250", lot: "LAC-2411", purity: "99.5%", uncertainty: "0.3%", unit: "g", quantity: 3, certificateExpiry: "2027-06-15", afterOpenExpiry: "2027-12-15", storageCondition: "2-8°C", storageLocation: "C2-13", notes: "" },
  { code: "STD-0024", name: "Magnesium Standard 1000 mg/L", standardGroup: "Working", manufacturer: "Inorganic Ventures", casNumber: "7439-95-4", productCode: "MG-1000", lot: "MG-2412", purity: "99.9%", uncertainty: "0.5%", unit: "mL", quantity: 7, certificateExpiry: "2027-09-10", afterOpenExpiry: "2028-03-10", storageCondition: "2-8°C", storageLocation: "D1-11", notes: "" },
  { code: "STD-0025", name: "Citric acid RM", standardGroup: "RM", manufacturer: "Honeywell", casNumber: "77-92-9", productCode: "251275", lot: "CIT-2410", purity: "99.5%", uncertainty: "0.2%", unit: "g", quantity: 1000, certificateExpiry: "2028-02-01", afterOpenExpiry: "2028-08-01", storageCondition: "Khô", storageLocation: "C3-08", notes: "" },
  { code: "STD-0026", name: "Selenium Standard 10 mg/L", standardGroup: "Working", manufacturer: "Spex CertiPrep", casNumber: "7782-49-2", productCode: "SE-10", lot: "SE-2411", purity: "99.5%", uncertainty: "1%", unit: "mL", quantity: 4, certificateExpiry: "2027-05-30", afterOpenExpiry: "2027-11-30", storageCondition: "2-8°C", storageLocation: "D1-12", notes: "" },
  { code: "STD-0027", name: "Acetamiprid CRM 100 µg/mL", standardGroup: "CRM", manufacturer: "Dr. Ehrenstorfer", casNumber: "135410-20-7", productCode: "ACN-100", lot: "ACN-2412", purity: "99.5%", uncertainty: "2%", unit: "mL", quantity: 5, certificateExpiry: "2027-10-15", afterOpenExpiry: "2028-04-15", storageCondition: "2-8°C", storageLocation: "C2-14", notes: "Chuẩn LC-MS/MS thuốc BVTV" },
];

export async function seedExtendedStandards(prisma: PrismaClient) {
  for (let i = 0; i < EXTENDED_STANDARDS.length; i++) {
    const item = EXTENDED_STANDARDS[i]!;
    const expiryDate = parseDate(item.certificateExpiry);
    const coaPath = STANDARD_COA_PATHS[i % STANDARD_COA_PATHS.length] ?? null;

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
        afterOpenExpiry: parseDate(item.afterOpenExpiry),
        storageCondition: item.storageCondition,
        storageLocation: item.storageLocation,
        notes: item.notes,
        status: expiryStatus(item.certificateExpiry),
        coaPath,
      },
    });

    const status = computeContainerStatus({
      quantity: item.quantity,
      reorderLevel: 3,
      expiryDate,
    });

    await prisma.container.create({
      data: {
        code: `CNT-${item.code}`,
        standardId: standard.id,
        lot: item.lot,
        location: item.storageLocation,
        quantity: item.quantity,
        unit: item.unit,
        expiryDate,
        afterOpenExpiry: parseDate(item.afterOpenExpiry),
        status,
      },
    });
  }
  console.log(`  Extended standards: ${EXTENDED_STANDARDS.length} rows`);
}
