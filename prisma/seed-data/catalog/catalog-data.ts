export const SEED_MATRIX_GROUPS = [
  { code: "FOOD", name: "Thực phẩm", sortOrder: 1 },
  { code: "FEED", name: "Thức ăn chăn nuôi", sortOrder: 2 },
  { code: "ENV", name: "Môi trường", sortOrder: 3 },
  { code: "AGRI", name: "Nông nghiệp", sortOrder: 4 },
  { code: "CHEM", name: "Hóa chất", sortOrder: 5 },
  { code: "PHARMA", name: "Dược phẩm", sortOrder: 6 },
  { code: "OTHER", name: "Khác", sortOrder: 99 },
] as const;

export const SEED_MATRICES = [
  { code: "FOOD-MEAT", name: "Thực phẩm - Thịt", groupCode: "FOOD", sortOrder: 1 },
  { code: "FOOD-VEG", name: "Thực phẩm - Rau củ", groupCode: "FOOD", sortOrder: 2 },
  { code: "FOOD-CEREAL", name: "Thực phẩm - Ngũ cốc", groupCode: "FOOD", sortOrder: 3 },
  { code: "FOOD-SEAFOOD", name: "Thực phẩm - Thủy sản", groupCode: "FOOD", sortOrder: 4 },
  { code: "FOOD-RAW", name: "Nguyên liệu thực phẩm", groupCode: "FOOD", sortOrder: 5 },
  { code: "OIL-FAT", name: "Thực phẩm - Dầu mỡ", groupCode: "FOOD", sortOrder: 6 },
  { code: "FEED", name: "Thức ăn chăn nuôi", groupCode: "FEED", sortOrder: 1 },
  { code: "FEED-RAW", name: "Nguyên liệu thức ăn chăn nuôi", groupCode: "FEED", sortOrder: 2 },
  { code: "FEED-ADD", name: "Phụ gia thức ăn chăn nuôi", groupCode: "FEED", sortOrder: 3 },
  { code: "WATER", name: "Nước", groupCode: "ENV", sortOrder: 1 },
  { code: "SOIL", name: "Đất", groupCode: "ENV", sortOrder: 2 },
  { code: "AIR", name: "Không khí", groupCode: "ENV", sortOrder: 3 },
  { code: "FERTILIZER", name: "Phân bón", groupCode: "AGRI", sortOrder: 1 },
] as const;

export const SEED_CATEGORIES = [
  { code: "CHEM", name: "Hóa lý", sortOrder: 1 },
  { code: "MICRO", name: "Vi sinh", sortOrder: 2 },
  { code: "METAL", name: "Kim loại nặng", sortOrder: 3 },
  { code: "PEST", name: "Dư lượng thuốc BVTV", sortOrder: 4 },
  { code: "NUTR", name: "Dinh dưỡng", sortOrder: 5 },
  { code: "TOX", name: "Độc tố", sortOrder: 6 },
  { code: "ADD", name: "Phụ gia", sortOrder: 7 },
] as const;

export type SeedTestMethod = {
  code: string;
  name: string;
  categoryCode: string;
  defaultUnit: string;
  resultType: "numeric" | "text" | "detected" | "pass_fail";
  lod?: string;
  loq?: string;
  estimatedMinutes?: number;
  matrixCodes?: string[];
};

export const SEED_TEST_METHODS: SeedTestMethod[] = [
  { code: "PROTEIN", name: "Protein", categoryCode: "NUTR", defaultUnit: "%", resultType: "numeric", estimatedMinutes: 120, matrixCodes: ["FOOD-MEAT", "FEED", "FOOD-RAW", "FOOD-CEREAL", "FOOD-SEAFOOD"] },
  { code: "MOISTURE", name: "Độ ẩm (Moisture)", categoryCode: "CHEM", defaultUnit: "%", resultType: "numeric", estimatedMinutes: 180, matrixCodes: ["FOOD-MEAT", "FEED", "FOOD-VEG", "FOOD-RAW", "OIL-FAT", "FOOD-CEREAL", "FEED-RAW"] },
  { code: "ASH", name: "Tro (Ash)", categoryCode: "CHEM", defaultUnit: "%", resultType: "numeric", estimatedMinutes: 240, matrixCodes: ["FOOD-MEAT", "FEED", "FOOD-RAW", "FEED-RAW"] },
  { code: "PB", name: "Chì (Pb)", categoryCode: "METAL", defaultUnit: "mg/kg", resultType: "numeric", lod: "0.01", loq: "0.03", estimatedMinutes: 360, matrixCodes: ["FOOD-MEAT", "FOOD-VEG", "FEED", "WATER", "SOIL", "FOOD-SEAFOOD"] },
  { code: "CD", name: "Cadimi (Cd)", categoryCode: "METAL", defaultUnit: "mg/kg", resultType: "numeric", lod: "0.005", loq: "0.01", estimatedMinutes: 360, matrixCodes: ["FOOD-VEG", "FEED", "SOIL", "FOOD-CEREAL"] },
  { code: "SALMONELLA", name: "Salmonella spp.", categoryCode: "MICRO", defaultUnit: "CFU/g", resultType: "detected", estimatedMinutes: 2880, matrixCodes: ["FOOD-MEAT", "FOOD-VEG", "FOOD-SEAFOOD"] },
  { code: "E-COLI", name: "E.coli", categoryCode: "MICRO", defaultUnit: "CFU/g", resultType: "numeric", estimatedMinutes: 1440, matrixCodes: ["WATER", "FOOD-VEG", "FOOD-SEAFOOD"] },
  { code: "AFLATOXIN-B1", name: "Aflatoxin B1", categoryCode: "TOX", defaultUnit: "µg/kg", resultType: "numeric", lod: "0.1", loq: "0.5", estimatedMinutes: 480, matrixCodes: ["FEED", "FOOD-RAW", "FEED-RAW", "FOOD-CEREAL"] },
  { code: "PH", name: "pH", categoryCode: "CHEM", defaultUnit: "-", resultType: "numeric", estimatedMinutes: 30, matrixCodes: ["WATER", "SOIL", "FERTILIZER", "AIR"] },
  { code: "PEST-LCMS", name: "Dư lượng thuốc BVTV (LC-MS)", categoryCode: "PEST", defaultUnit: "mg/kg", resultType: "numeric", estimatedMinutes: 720, matrixCodes: ["FOOD-VEG", "FOOD-RAW", "FOOD-CEREAL"] },
];

export const SEED_PACKAGES = [
  {
    code: "FEED-BASIC",
    name: "Thức ăn chăn nuôi - cơ bản",
    matrixCode: "FEED",
    testMethodCodes: ["PROTEIN", "MOISTURE", "ASH"],
  },
  {
    code: "VEG-METAL",
    name: "Rau củ - kim loại nặng",
    matrixCode: "FOOD-VEG",
    testMethodCodes: ["PB", "CD", "MOISTURE"],
  },
  {
    code: "MEAT-FULL",
    name: "Thịt - gói đầy đủ",
    matrixCode: "FOOD-MEAT",
    testMethodCodes: ["PROTEIN", "MOISTURE", "ASH", "PB", "SALMONELLA"],
  },
  {
    code: "SEAFOOD-BASIC",
    name: "Thủy sản - cơ bản",
    matrixCode: "FOOD-SEAFOOD",
    testMethodCodes: ["PROTEIN", "MOISTURE", "SALMONELLA", "E-COLI"],
  },
] as const;
