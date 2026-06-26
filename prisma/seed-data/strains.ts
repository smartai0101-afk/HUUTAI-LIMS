import type { PrismaClient } from "@prisma/client";
import { STRAIN_COA_PATHS } from "./assets";
import { expiryStatus, parseDate } from "./helpers";

type StrainSeed = {
  code: string;
  name: string;
  strainGroup: string;
  manufacturer: string;
  atccProductCode: string;
  speciesStrain: string;
  lot: string;
  unit: string;
  quantity: number;
  expiryDate: string;
  storageCondition: string;
  storageLocation: string;
  passage: number;
  responsiblePerson: string;
  notes: string;
};

export const EXTENDED_STRAINS: StrainSeed[] = [
  { code: "MS-0003", name: "Salmonella enterica ATCC 14028", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "14028", speciesStrain: "Salmonella enterica", lot: "SAL-2411", unit: "vial", quantity: 2, expiryDate: "2027-06-01", storageCondition: "-80°C glycerol", storageLocation: "Freezer A2", passage: 1, responsiblePerson: "D. Tran", notes: "Chủng kiểm soát vi sinh" },
  { code: "MS-0004", name: "Candida albicans ATCC 10231", strainGroup: "Nấm", manufacturer: "ATCC", atccProductCode: "10231", speciesStrain: "Candida albicans", lot: "CAN-2410", unit: "vial", quantity: 1, expiryDate: "2027-04-15", storageCondition: "2-8°C", storageLocation: "Fridge B3", passage: 2, responsiblePerson: "N. Pham", notes: "" },
  { code: "MS-0005", name: "Pseudomonas aeruginosa ATCC 9027", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "9027", speciesStrain: "Pseudomonas aeruginosa", lot: "PA-2411", unit: "vial", quantity: 2, expiryDate: "2027-08-01", storageCondition: "-80°C glycerol", storageLocation: "Freezer A2", passage: 1, responsiblePerson: "D. Tran", notes: "" },
  { code: "MS-0006", name: "Bacillus subtilis ATCC 6633", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "6633", speciesStrain: "Bacillus subtilis", lot: "BS-2410", unit: "vial", quantity: 1, expiryDate: "2027-05-20", storageCondition: "2-8°C", storageLocation: "Fridge B2", passage: 1, responsiblePerson: "K. Hoa", notes: "Chủng spore" },
  { code: "MS-0007", name: "Aspergillus brasiliensis ATCC 16404", strainGroup: "Nấm", manufacturer: "ATCC", atccProductCode: "16404", speciesStrain: "Aspergillus brasiliensis", lot: "ASP-2411", unit: "vial", quantity: 1, expiryDate: "2027-07-01", storageCondition: "2-8°C", storageLocation: "Fridge B3", passage: 2, responsiblePerson: "N. Pham", notes: "" },
  { code: "MS-0008", name: "Listeria monocytogenes ATCC 19115", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "19115", speciesStrain: "Listeria monocytogenes", lot: "LM-2410", unit: "vial", quantity: 1, expiryDate: "2027-03-10", storageCondition: "-80°C glycerol", storageLocation: "Freezer A3", passage: 1, responsiblePerson: "D. Tran", notes: "Tủ BSL-2" },
  { code: "MS-0009", name: "Clostridium sporogenes ATCC 19404", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "19404", speciesStrain: "Clostridium sporogenes", lot: "CS-2411", unit: "vial", quantity: 1, expiryDate: "2027-09-01", storageCondition: "Anaerobic jar", storageLocation: "Cabinet V1", passage: 1, responsiblePerson: "K. Hoa", notes: "" },
  { code: "MS-0010", name: "Enterococcus faecalis ATCC 29212", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "29212", speciesStrain: "Enterococcus faecalis", lot: "EF-2412", unit: "vial", quantity: 2, expiryDate: "2027-10-15", storageCondition: "-80°C glycerol", storageLocation: "Freezer A2", passage: 2, responsiblePerson: "D. Tran", notes: "" },
  { code: "MS-0011", name: "Klebsiella pneumoniae ATCC 13883", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "13883", speciesStrain: "Klebsiella pneumoniae", lot: "KP-2410", unit: "vial", quantity: 1, expiryDate: "2027-02-28", storageCondition: "-80°C glycerol", storageLocation: "Freezer A3", passage: 1, responsiblePerson: "N. Pham", notes: "" },
  { code: "MS-0012", name: "Penicillium rubens ATCC 10108", strainGroup: "Nấm", manufacturer: "ATCC", atccProductCode: "10108", speciesStrain: "Penicillium rubens", lot: "PR-2411", unit: "vial", quantity: 1, expiryDate: "2027-06-20", storageCondition: "2-8°C", storageLocation: "Fridge B3", passage: 3, responsiblePerson: "K. Hoa", notes: "" },
  { code: "MS-0013", name: "Proteus mirabilis ATCC 12453", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "12453", speciesStrain: "Proteus mirabilis", lot: "PM-2411", unit: "vial", quantity: 1, expiryDate: "2027-05-01", storageCondition: "2-8°C", storageLocation: "Fridge B2", passage: 1, responsiblePerson: "D. Tran", notes: "" },
  { code: "MS-0014", name: "Saccharomyces cerevisiae ATCC 9763", strainGroup: "Nấm", manufacturer: "ATCC", atccProductCode: "9763", speciesStrain: "Saccharomyces cerevisiae", lot: "SC-2410", unit: "vial", quantity: 2, expiryDate: "2027-08-15", storageCondition: "2-8°C", storageLocation: "Fridge B3", passage: 2, responsiblePerson: "N. Pham", notes: "" },
  { code: "MS-0015", name: "Burkholderia cepacia ATCC 25416", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "25416", speciesStrain: "Burkholderia cepacia", lot: "BC-2412", unit: "vial", quantity: 1, expiryDate: "2027-11-01", storageCondition: "-80°C glycerol", storageLocation: "Freezer A2", passage: 1, responsiblePerson: "K. Hoa", notes: "" },
  { code: "MS-0016", name: "Staphylococcus epidermidis ATCC 12228", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "12228", speciesStrain: "Staphylococcus epidermidis", lot: "SE-2411", unit: "vial", quantity: 1, expiryDate: "2027-04-01", storageCondition: "2-8°C", storageLocation: "Fridge B2", passage: 1, responsiblePerson: "D. Tran", notes: "" },
  { code: "MS-0017", name: "Escherichia coli O157:H7 ATCC 43895", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "43895", speciesStrain: "E. coli O157:H7", lot: "ECO-2410", unit: "vial", quantity: 1, expiryDate: "2027-07-20", storageCondition: "-80°C glycerol", storageLocation: "Freezer A3", passage: 1, responsiblePerson: "D. Tran", notes: "BSL-2" },
  { code: "MS-0018", name: "Rhodotorula mucilaginosa ATCC 66034", strainGroup: "Nấm", manufacturer: "ATCC", atccProductCode: "66034", speciesStrain: "Rhodotorula mucilaginosa", lot: "RM-2411", unit: "vial", quantity: 1, expiryDate: "2027-09-10", storageCondition: "2-8°C", storageLocation: "Fridge B3", passage: 2, responsiblePerson: "N. Pham", notes: "" },
  { code: "MS-0019", name: "Acinetobacter baumannii ATCC 19606", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "19606", speciesStrain: "Acinetobacter baumannii", lot: "AB-2412", unit: "vial", quantity: 1, expiryDate: "2027-12-01", storageCondition: "-80°C glycerol", storageLocation: "Freezer A2", passage: 1, responsiblePerson: "K. Hoa", notes: "" },
  { code: "MS-0020", name: "Micrococcus luteus ATCC 9341", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "9341", speciesStrain: "Micrococcus luteus", lot: "ML-2410", unit: "vial", quantity: 2, expiryDate: "2027-03-15", storageCondition: "2-8°C", storageLocation: "Fridge B2", passage: 1, responsiblePerson: "D. Tran", notes: "Chủng kiểm sterility" },
  { code: "MS-0021", name: "Geobacillus stearothermophilus ATCC 7953", strainGroup: "Vi khuẩn", manufacturer: "ATCC", atccProductCode: "7953", speciesStrain: "Geobacillus stearothermophilus", lot: "GS-2411", unit: "vial", quantity: 1, expiryDate: "2027-10-01", storageCondition: "2-8°C", storageLocation: "Fridge B4", passage: 1, responsiblePerson: "N. Pham", notes: "Chủng validation autoclave" },
  { code: "MS-0022", name: "Candida tropicalis ATCC 750", strainGroup: "Nấm", manufacturer: "ATCC", atccProductCode: "750", speciesStrain: "Candida tropicalis", lot: "CT-2412", unit: "vial", quantity: 1, expiryDate: "2027-08-30", storageCondition: "2-8°C", storageLocation: "Fridge B3", passage: 2, responsiblePerson: "K. Hoa", notes: "" },
];

export async function seedExtendedStrains(prisma: PrismaClient) {
  for (let i = 0; i < EXTENDED_STRAINS.length; i++) {
    const item = EXTENDED_STRAINS[i]!;
    const coaPath = STRAIN_COA_PATHS[i % STRAIN_COA_PATHS.length] ?? null;

    await prisma.microbialStrain.create({
      data: {
        code: item.code,
        name: item.name,
        strainGroup: item.strainGroup,
        manufacturer: item.manufacturer,
        atccProductCode: item.atccProductCode,
        speciesStrain: item.speciesStrain,
        lot: item.lot,
        unit: item.unit,
        quantity: item.quantity,
        expiryDate: parseDate(item.expiryDate),
        storageCondition: item.storageCondition,
        storageLocation: item.storageLocation,
        passage: item.passage,
        responsiblePerson: item.responsiblePerson,
        notes: item.notes,
        status: expiryStatus(item.expiryDate),
        coaPath,
      },
    });
  }
  console.log(`  Extended strains: ${EXTENDED_STRAINS.length} rows`);
}
