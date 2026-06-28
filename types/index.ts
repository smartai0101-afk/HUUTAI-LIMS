export type AlertSeverity = "Critical" | "Warning" | "Info";

export type AlertItem = {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  type: string;
  date: string;
  itemCode?: string;
  itemRoute?: "/chemicals" | "/standards" | "/solutions" | "/containers" | "/equipment/calibration-plans" | "/equipment/maintenance-plans" | "/prepared-chemicals" | "/prepared-standards" | "/prepared-strains" | "/preparation-history";
  reviewed?: boolean;
};

export type AuditLogView = {
  id: string;
  time: string;
  user: string;
  action: string;
  object: string;
  before: string;
  after: string;
};

export type ChemicalView = {
  id: string;
  code: string;
  name: string;
  chemicalGroup: string;
  manufacturer: string;
  casNumber: string;
  productCode: string;
  lot: string;
  purity: string;
  uncertainty: string;
  coaPath: string;
  unit: string;
  quantity: number;
  inventoryStatus: string;
  expiryDate: string;
  storageCondition: string;
  status: string;
  storageLocation: string;
  notes: string;
  stockLots: StockLotView[];
};

export type PreparationWorkflowView = {
  workflowStatus: string;
  workflowStatusLabel: string;
  version: number;
  amendmentReason: string;
  preparedByStaffId: string | null;
  checkedByStaffId: string | null;
  approvedByStaffId: string | null;
  preparedByStaffName: string;
  checkedByStaffName: string;
  approvedByStaffName: string;
};

export type PreparedChemicalIngredientView = {
  id: string;
  chemicalId: string;
  stockLotId: string | null;
  chemicalName: string;
  casProductCode: string;
  lotNumber: string;
  quantityUsed: number;
  unit: string;
  displayLine: string;
};

export type PreparationIsoFields = {
  formula: string;
  originalConcentration: string;
  finalConcentration: string;
  equipmentUsed: string;
  preparationCondition: string;
  attachmentUrl: string;
  equipmentId: string | null;
  equipmentCode: string;
  equipmentName: string;
};

export type PreparedChemicalView = {
  id: string;
  parentCode: string;
  batchNumber: number;
  code: string;
  name: string;
  concentration: string;
  concentrationUnit: string;
  preparedQuantity: number;
  unit: string;
  preparedDate: string;
  preparedBy: string;
  expiryDate: string;
  storageLocation: string;
  storageCondition: string;
  inventoryStatus: string;
  status: string;
  notes: string;
  ingredients: PreparedChemicalIngredientView[];
  ingredientsSummary: string;
} & PreparationWorkflowView & PreparationIsoFields;

export type PreparedStandardComponentView = {
  id: string;
  sourceType: "Standard" | "PreparedStandard";
  standardId: string | null;
  sourcePreparedStandardId: string | null;
  stockLotId: string | null;
  /** Cấp chuẩn nguồn — dùng cho Chuẩn làm việc (map từ levelSnapshot). */
  sourceLevel: string | null;
  standardCode: string;
  standardName: string;
  manufacturer: string;
  productCode: string;
  lotNumber: string;
  purity: string;
  concentration: string;
  concentrationUnit: string;
  levelLabel: string;
  preparedDate: string;
  expiryDate: string;
  quantityUsed: number;
  unit: string;
  displayLine: string;
};

export type PreparedStandardSolventView = {
  id: string;
  chemicalId: string;
  stockLotId: string | null;
  chemicalCode: string;
  chemicalName: string;
  casProductCode: string;
  lotNumber: string;
  quantityUsed: number;
  unit: string;
  displayLine: string;
};

export type PreparedStandardView = {
  id: string;
  parentCode: string;
  batchNumber: number;
  code: string;
  name: string;
  level: string;
  levelLabel: string;
  concentration: string;
  concentrationUnit: string;
  solventVolume: number;
  solventUnit: string;
  preparedDate: string;
  expiryDate: string;
  preparedBy: string;
  status: string;
  storageLocation: string;
  storageCondition: string;
  quantity: number;
  unit: string;
  inventoryStatus: string;
  notes: string;
  components: PreparedStandardComponentView[];
  solvents: PreparedStandardSolventView[];
  componentsSummary: string;
  solventsSummary: string;
} & PreparationWorkflowView & PreparationIsoFields;

export type MicrobialStrainView = {
  id: string;
  code: string;
  name: string;
  strainGroup: string;
  manufacturer: string;
  atccProductCode: string;
  lot: string;
  purity: string;
  uncertainty: string;
  coaPath: string;
  unit: string;
  quantity: number;
  expiryDate: string;
  storageCondition: string;
  status: string;
  storageLocation: string;
  notes: string;
  stockLots: StockLotView[];
};

export type StandardView = {
  id: string;
  code: string;
  name: string;
  standardGroup: string;
  manufacturer: string;
  casNumber: string;
  productCode: string;
  lot: string;
  purity: string;
  uncertainty: string;
  coaPath: string;
  unit: string;
  quantity: number;
  inventoryStatus: string;
  expiryDate: string;
  afterOpenExpiry: string;
  storageCondition: string;
  status: string;
  storageLocation: string;
  notes: string;
  containerCount: number;
  stockLots: StockLotView[];
};

export type ContainerView = {
  id: string;
  code: string;
  itemType: "chemical" | "standard";
  itemCode: string;
  itemName: string;
  lot: string;
  location: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  afterOpenExpiry?: string;
  status: string;
  chemicalId?: string;
  standardId?: string;
};

export type InventoryStatSourceType = "chemical" | "standard" | "microbial";

export type InventoryStatRow = {
  id: string;
  sourceType: InventoryStatSourceType;
  sourceLabel: string;
  code: string;
  name: string;
  manufacturer: string;
  casOrProductNumber: string;
  lot: string;
  purity: string;
  coaPath: string;
  unit: string;
  quantity: number;
  storageLocation: string;
  status: string;
  notes: string;
  detailHref: "/chemicals" | "/standards" | "/microbial-strains";
  stockLots: StockLotView[];
};

export type StockLotView = {
  id: string;
  lot: string;
  quantity: number;
  /** Ledger-derived available; falls back to quantity when unset. */
  availableQuantity?: number;
  unit: string;
  purity: string;
  uncertainty: string;
  expiryDate: string;
  afterOpenExpiry: string;
  coaPath: string;
  storageLocation: string;
  status: string;
  notes: string;
};

export type EnvironmentalLogView = {
  id: string;
  loggedAt: string;
  location: string;
  temperature: number | null;
  humidity: number | null;
  recordedByStaffId: string | null;
  recordedByStaffName: string;
  notes: string;
  createdAt: string;
  snapshotText: string;
};

export type StockInLogView = {
  id: string;
  time: string;
  user: string;
  sourceType: string;
  sourceLabel: string;
  sourceCode: string;
  sourceName: string;
  lot: string;
  quantityIn: number;
  unit: string;
  notes: string;
  referenceId: string;
};

export type UsageLogView = {
  id: string;
  date: string;
  type: string;
  sourceType: string;
  sourceLabel: string;
  sourceId: string;
  itemCode: string;
  itemName: string;
  containerId?: string;
  containerCode?: string;
  quantity: number;
  unit: string;
  performedBy: string;
  performedByStaffId?: string;
  purpose: string;
  notes: string;
  referenceCode: string;
};

export type DashboardStats = {
  chemicalCount: number;
  standardCount: number;
  containerCount: number;
  microbialStrainCount: number;
  preparedChemicalCount: number;
  preparedStandardCount: number;
  preparedStrainCount: number;
  expiringSoon: number;
  lowStock: number;
  pendingDisposal: number;
};

/** Legacy mock/localStorage types (older MVP pages) */
export type ChemicalStatus = "Available" | "Low Stock" | "Expired" | "Pending Disposal";
export type StandardType = "CRM" | "RM" | "Working";
export type StandardStatus = "Approved" | "Expired" | "Pending Review" | "In Use";
export type SolutionStatus = "New" | "Pending Approval" | "In Use" | "Expired" | "Cancelled";
export type TransactionType = "IN" | "OUT" | "USE" | "DISPOSE";
export type InventoryStatus = "Matched" | "Missing" | "Over" | "Wrong Location" | "Expired";

export interface Chemical {
  id: string;
  code: string;
  name: string;
  cas: string;
  lot: string;
  grade: string;
  location: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  status: ChemicalStatus;
}

export interface Standard {
  id: string;
  code: string;
  name: string;
  type: StandardType;
  lot: string;
  purity: string;
  uncertainty: string;
  certificateExpiry: string;
  afterOpenExpiry: string;
  location: string;
  status: StandardStatus;
}

export interface Solution {
  id: string;
  code: string;
  name: string;
  concentration: string;
  preparedFrom: string;
  preparedBy: string;
  preparedDate: string;
  expiryDate: string;
  status: SolutionStatus;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  performedBy: string;
  purpose: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  expectedQty: number;
  countedQty: number;
  difference: number;
  location: string;
  status: InventoryStatus;
}

export type AuditLog = AuditLogView;

export type EquipmentView = {
  id: string;
  code: string;
  name: string;
  model: string;
  serialNumber: string;
  specifications: string;
  manufacturer: string;
  countryOfOrigin: string;
  manufacturingYear: number | null;
  purchaseDate: string;
  commissioningDate: string;
  lastCalibrationDate: string;
  calibrator: string;
  calibrationExpiryDate: string;
  department: string;
  location: string;
  manager: string;
  status: string;
  installDate: string;
  iqOqPqNotes: string;
  userManualPath: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CalibrationPlanView = {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  name: string;
  cycleMonths: number;
  lastDate: string;
  nextDate: string;
  vendor: string;
  status: string;
  statusLabel: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

import type { CalibrationResultRow } from "@/lib/calibration-results";

export type { CalibrationResultRow };

export type CalibrationRecordView = {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  calibrationDate: string;
  certificateNo: string;
  result: string;
  resultLabel: string;
  deviation: string;
  calibrationResults: CalibrationResultRow[];
  calibrationResultsLabel: string;
  evaluationSummary: string;
  certificatePath: string;
  cost: number;
  vendor: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  hasEvaluation: boolean;
};

export type PostCalibrationEvaluationView = {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  calibrationRecordId: string;
  calibrationDate: string;
  certificateNo: string;
  impactAssessment: string;
  correctiveAction: string;
  status: string;
  statusLabel: string;
  approvedBy: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type MaintenancePlanView = {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  name: string;
  cycleMonths: number;
  lastDate: string;
  nextDate: string;
  vendor: string;
  status: string;
  statusLabel: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceLogView = {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  repairProposalId: string;
  repairTicketNo: string;
  issueDate: string;
  description: string;
  rootCause: string;
  action: string;
  vendor: string;
  cost: number;
  completedDate: string;
  attachmentPaths: string[];
  notes: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type RepairProposalView = {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  ticketNo: string;
  priority: string;
  priorityLabel: string;
  status: string;
  statusLabel: string;
  description: string;
  reportedBy: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type SparePartEquipmentLinkView = {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  notes: string;
};

export type SparePartView = {
  id: string;
  code: string;
  name: string;
  manufacturer: string;
  productCode: string;
  lotNumber: string;
  stockQty: number;
  minQty: number;
  unit: string;
  notes: string;
  isLowStock: boolean;
  equipmentLinks: SparePartEquipmentLinkView[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type EquipmentDisposalView = {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  disposalDate: string;
  residualValue: number;
  decision: string;
  approver: string;
  documentPath: string;
  status: string;
  statusLabel: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type HistoryEventMediaItem = {
  path: string;
  name: string;
  source: "source" | "history";
  attachmentId?: string;
};

export type HistoryEventFileItem = {
  path: string;
  name: string;
};

export type EquipmentHistoryEventView = {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  eventType: string;
  eventTypeLabel: string;
  eventDate: string;
  title: string;
  description: string;
  sourceType: string;
  sourceId: string;
  isAutoSynced: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  images: HistoryEventMediaItem[];
  otherFiles: HistoryEventFileItem[];
};

export type EquipmentDashboardStats = {
  totalCount: number;
  inUseCount: number;
  maintenanceCount: number;
  brokenCount: number;
  disposedCount: number;
  overdueCalibrationCount: number;
  upcomingCalibrationCount: number;
  overdueMaintenanceCount: number;
  upcomingMaintenanceCount: number;
  lowSparePartCount: number;
};

export type * from "./chem-info";
