export type ElementView = {
  id: string;
  symbol: string;
  name: string;
  nameVi: string;
  atomicNumber: number;
  atomicMass: number;
  group: number | null;
  groupIupac: number | null;
  groupTraditional: string | null;
  groupDisplay: string;
  period: number;
  block: string;
  classification: string;
  electronConfig: string;
  electronegativity: number | null;
  meltingPointC: number | null;
  boilingPointC: number | null;
  applications: string[];
  electronShell: number[];
  gridRow: number;
  gridColumn: number;
};

export type GhsStatement = {
  code: string;
  text: string;
};

export type GhsPictogramView = {
  code: string;
  label: string;
  imagePath: string;
  description: string;
};

export type SdsDocumentView = {
  id: string;
  title: string;
  supplier: string;
  revisionDate: string | null;
  filePath: string | null;
  externalUrl: string | null;
  isPrimary: boolean;
  uploadedBy: string;
  createdAt: string;
};

export type ChemicalSafetyView = {
  signalWord: string;
  hazardStatements: GhsStatement[];
  precautionaryStatements: GhsStatement[];
  pictograms: GhsPictogramView[];
  unNumber: string;
  hazardClass: string;
  packingGroup: string;
  updatedAt: string;
};

export type ChemicalReferenceSyncStatus = "local" | "synced" | "manual" | "needs_review";

export type ChemicalReferenceView = {
  id: string;
  casNumber: string;
  name: string;
  iupacName: string;
  molecularFormula: string;
  molecularWeight: number | null;
  synonyms: string[];
  pubchemCid: number | null;
  smiles: string;
  isomericSmiles: string;
  inchi: string;
  inchiKey: string;
  structure2dUrl: string | null;
  notes: string;
  source: string;
  syncStatus: ChemicalReferenceSyncStatus;
  lastSyncedAt: string | null;
  hazardCategories: string[];
  safety: ChemicalSafetyView | null;
  sdsDocuments: SdsDocumentView[];
  pubchemUrl: string | null;
};

export type PubChemSearchHitView = {
  cid: number;
  name: string;
  cas?: string;
  molecularFormula?: string;
  molecularWeight?: number | null;
  structure2dUrl: string;
};

export type PubChemSearchErrorCode =
  | "EMPTY_QUERY"
  | "NOT_FOUND"
  | "TIMEOUT"
  | "UNREACHABLE"
  | "PARSE_ERROR"
  | "INTERNAL"
  | "UNAUTHORIZED";

export type PubChemSearchOnlineResponse = {
  items?: PubChemSearchHitView[];
  error?: string;
  code?: PubChemSearchErrorCode;
  message?: string;
};

export type InventoryChemicalLink = {
  id: string;
  code: string;
  name: string;
  casNumber: string;
  quantity: number;
  unit: string;
};

export type CompatibilityRuleType = "CHEMICAL" | "GROUP" | "HAZARD";
export type CompatibilityOperandKind = "cas" | "group" | "hazard";

export type CompatibilitySubject = {
  casNumber?: string;
  groups: string[];
  hazards: string[];
};

export type CompatibilitySeverity = "critical" | "high" | "medium" | "low";

export type CompatibilityRuleView = {
  id: string;
  code: string;
  ruleType: CompatibilityRuleType;
  operandAKind: CompatibilityOperandKind;
  operandAValue: string;
  operandBKind: CompatibilityOperandKind;
  operandBValue: string;
  categoryA: string;
  categoryB: string;
  categoryALabel: string;
  categoryBLabel: string;
  severity: CompatibilitySeverity | string;
  title: string;
  message: string;
  storageGuidance: string;
  examples: string[];
};

export type CompatibilityEvaluation = {
  status: "conflict" | "unknown";
  rules: CompatibilityRuleView[];
  tier: CompatibilityRuleType | null;
};

export type CompatibilityCheckResult = {
  compatible: boolean;
  rules: CompatibilityRuleView[];
  status: "conflict" | "unknown";
  tier: CompatibilityRuleType | null;
};
