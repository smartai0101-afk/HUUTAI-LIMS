import type {
  SampleConditionOnReceipt,
  SampleRequestStatus,
  SampleStatus,
  SampleTestStatus,
} from "@prisma/client";

export const DEMO_REQUEST_PREFIX = "PR-20260629-";
export const DEMO_SAMPLE_PREFIX = "SPL-20260629-";
export const STORED_BY = "Hữu Tài";

export const ANALYSTS = {
  metal: "Analyst 01 - Kim loại nặng",
  mycotoxin: "Analyst 02 - Độc tố nấm mốc",
  pesticide: "Analyst 03 - Dư lượng thuốc BVTV",
  micro: "Analyst 04 - Vi sinh",
  feed: "Analyst 05 - Dinh dưỡng thức ăn chăn nuôi",
} as const;

export type SampleTestDef = {
  parameterName: string;
  methodCode?: string;
  equipmentCode?: string;
  assignedTo: string;
  chemicalCodes?: string[];
  standardCodes?: string[];
  status: SampleTestStatus;
};

export type StorageDef = {
  storageLocation: string;
  preservationCondition: string;
  retentionUntil: string;
  storedBy: string;
  storedAt: string;
};

export type DisposeDef = {
  disposeReason: string;
  disposedBy: string;
  disposedAt: string;
};

export type SampleDemoDefinition = {
  requestCode: string;
  sampleCode: string;
  request: {
    requestDate: string;
    requesterName: string;
    customerName: string;
    department: string;
    purpose: string;
    sampleType: string;
    sampleCount: number;
    dueDate: string;
    status: SampleRequestStatus;
    note: string;
    requestedTests: string[];
    methodCodes: string[];
  };
  sample: {
    sampleName: string;
    sampleType: string;
    customerSampleCode: string;
    receivedAt: string;
    deliveredBy: string;
    receivedBy: string;
    conditionOnReceipt: SampleConditionOnReceipt;
    conditionNote: string;
    quantity: number;
    unit: string;
    containerType: string;
    preservationCondition: string;
    storageLocation: string;
    retentionUntil: string;
    status: SampleStatus;
    assignedTo: string;
    dueDate: string;
    primaryMethodCode: string;
    note: string;
  };
  tests?: SampleTestDef[];
  storage?: StorageDef;
  dispose?: DisposeDef;
};

export const SAMPLE_DEMO_DEFINITIONS: SampleDemoDefinition[] = [
  {
    requestCode: "PR-20260629-0001",
    sampleCode: "SPL-20260629-0001",
    request: {
      requestDate: "2026-06-26",
      requesterName: "Nguyễn Văn An",
      customerName: "Công ty Lương thực An Phát",
      department: "QA",
      purpose: "Gạo trắng",
      sampleType: "Thực phẩm - Ngũ cốc",
      sampleCount: 2,
      dueDate: "2026-05-07",
      status: "Received",
      note: "Mẫu lấy từ lô Gạo ST25, bao 5 kg\nBảo quản: Nhiệt độ phòng, khô ráo",
      requestedTests: ["Aflatoxin B1", "Pb", "Cd", "As", "Độ ẩm"],
      methodCodes: ["PP-ICP-WAT-001", "PP-LCMS-PST-001"],
    },
    sample: {
      sampleName: "Gạo trắng",
      sampleType: "Thực phẩm - Ngũ cốc",
      customerSampleCode: "RICE-ST25-0626",
      receivedAt: "2026-06-26T08:30:00.000Z",
      deliveredBy: "Nguyễn Văn An",
      receivedBy: "P. Huy",
      conditionOnReceipt: "Pass",
      conditionNote: "",
      quantity: 5,
      unit: "kg",
      containerType: "Bao PP 5 kg",
      preservationCondition: "Nhiệt độ phòng, khô ráo",
      storageLocation: "Kho mẫu / Kệ A1 / Hộp 01",
      retentionUntil: "2026-09-26",
      status: "Stored",
      assignedTo: ANALYSTS.mycotoxin,
      dueDate: "2026-05-07",
      primaryMethodCode: "PP-LCMS-PST-001",
      note: "Mẫu lấy từ lô Gạo ST25, bao 5 kg",
    },
    tests: [
      {
        parameterName: "Aflatoxin B1",
        methodCode: "PP-LCMS-PST-001",
        equipmentCode: "EQ-LC-MS-001",
        assignedTo: ANALYSTS.mycotoxin,
        standardCodes: ["STD-0027"],
        status: "Reviewed",
      },
      {
        parameterName: "Pb, Cd, As",
        methodCode: "PP-ICP-WAT-001",
        equipmentCode: "EQ-ICP-001",
        assignedTo: ANALYSTS.metal,
        chemicalCodes: ["CHEM-0030", "CHEM-0009"],
        standardCodes: ["STD-0011", "STD-0012"],
        status: "Reviewed",
      },
    ],
    storage: {
      storageLocation: "Kho mẫu / Kệ A1 / Hộp 01",
      preservationCondition: "Nhiệt độ phòng, khô ráo",
      retentionUntil: "2026-09-26",
      storedBy: STORED_BY,
      storedAt: "2026-06-28T10:00:00.000Z",
    },
  },
  {
    requestCode: "PR-20260629-0002",
    sampleCode: "SPL-20260629-0002",
    request: {
      requestDate: "2026-06-27",
      requesterName: "Trần Thị Bình",
      customerName: "Công ty Bánh kẹo Hòa Bình",
      department: "R&D",
      purpose: "Bột mì",
      sampleType: "Nguyên liệu thực phẩm",
      sampleCount: 1,
      dueDate: "2026-06-07",
      status: "Processing",
      note: "Mẫu bột mì nhập khẩu, bao 25 kg\nBảo quản: Nhiệt độ phòng, khô",
      requestedTests: ["Protein", "Gluten ướt", "Độ ẩm", "Tro", "Pb", "Cd"],
      methodCodes: ["PP-ICP-WAT-001"],
    },
    sample: {
      sampleName: "Bột mì",
      sampleType: "Nguyên liệu thực phẩm",
      customerSampleCode: "FLOUR-IMP-250626",
      receivedAt: "2026-06-27T09:00:00.000Z",
      deliveredBy: "Trần Thị Bình",
      receivedBy: "N. Anh",
      conditionOnReceipt: "Pass",
      conditionNote: "",
      quantity: 1,
      unit: "bao",
      containerType: "Bao 25 kg",
      preservationCondition: "Nhiệt độ phòng, khô",
      storageLocation: "Tủ mẫu / Kệ B2",
      retentionUntil: "2026-08-27",
      status: "WaitingAssignment",
      assignedTo: "",
      dueDate: "2026-06-07",
      primaryMethodCode: "PP-ICP-WAT-001",
      note: "Mẫu khô, không vón cục",
    },
  },
  {
    requestCode: "PR-20260629-0003",
    sampleCode: "SPL-20260629-0003",
    request: {
      requestDate: "2026-06-28",
      requesterName: "Lê Minh Châu",
      customerName: "Công ty Dầu thực vật Mekong",
      department: "QC",
      purpose: "Dầu ăn thực vật",
      sampleType: "Thực phẩm - Dầu mỡ",
      sampleCount: 3,
      dueDate: "2026-04-07",
      status: "Submitted",
      note: "Mẫu chai 1 L, lô sản xuất DTV-0626\nBảo quản: Nhiệt độ phòng, tránh ánh sáng",
      requestedTests: [
        "Chỉ số acid",
        "Chỉ số peroxide",
        "Pb",
        "As",
        "Dung môi tồn dư",
      ],
      methodCodes: ["PP-ICP-WAT-001"],
    },
    sample: {
      sampleName: "Dầu ăn thực vật",
      sampleType: "Thực phẩm - Dầu mỡ",
      customerSampleCode: "DTV-0626",
      receivedAt: "2026-06-28T07:45:00.000Z",
      deliveredBy: "Lê Minh Châu",
      receivedBy: "QC Analyst",
      conditionOnReceipt: "Pass",
      conditionNote: "",
      quantity: 3,
      unit: "chai",
      containerType: "Chai thủy tinh 1 L, niêm phong",
      preservationCondition: "Nhiệt độ phòng, tránh ánh sáng",
      storageLocation: "Tủ mẫu / Kệ C1",
      retentionUntil: "2026-09-28",
      status: "WaitingAssignment",
      assignedTo: "",
      dueDate: "2026-04-07",
      primaryMethodCode: "PP-ICP-WAT-001",
      note: "Chai nguyên niêm phong",
    },
  },
  {
    requestCode: "PR-20260629-0004",
    sampleCode: "SPL-20260629-0004",
    request: {
      requestDate: "2026-06-25",
      requesterName: "Phạm Quốc Dũng",
      customerName: "Công ty Thủy sản Biển Xanh",
      department: "QA Export",
      purpose: "Cá đông lạnh",
      sampleType: "Thực phẩm - Thủy sản",
      sampleCount: 4,
      dueDate: "2026-03-07",
      status: "Received",
      note: "Mẫu bảo quản đông lạnh\nBảo quản: -20°C",
      requestedTests: ["Histamine", "Hg", "Pb", "Cd", "Salmonella", "E. coli"],
      methodCodes: ["PP-ICP-WAT-001"],
    },
    sample: {
      sampleName: "Cá đông lạnh",
      sampleType: "Thực phẩm - Thủy sản",
      customerSampleCode: "FISH-FZ-0625",
      receivedAt: "2026-06-25T06:00:00.000Z",
      deliveredBy: "Phạm Quốc Dũng",
      receivedBy: "A. Minh",
      conditionOnReceipt: "Pass",
      conditionNote: "",
      quantity: 4,
      unit: "túi",
      containerType: "Túi PE đông lạnh",
      preservationCondition: "-20°C",
      storageLocation: "Kho mẫu / Tủ -20°C / Ngăn D1",
      retentionUntil: "2026-07-25",
      status: "Stored",
      assignedTo: ANALYSTS.micro,
      dueDate: "2026-03-07",
      primaryMethodCode: "PP-ICP-WAT-001",
      note: "Mẫu còn đông cứng khi nhận",
    },
    tests: [
      {
        parameterName: "Histamine",
        equipmentCode: "EQ-HPLC-001",
        assignedTo: ANALYSTS.micro,
        status: "Reviewed",
      },
      {
        parameterName: "Hg, Pb, Cd",
        methodCode: "PP-ICP-WAT-001",
        equipmentCode: "EQ-ICP-001",
        assignedTo: ANALYSTS.metal,
        standardCodes: ["STD-0018", "STD-0011"],
        status: "Reviewed",
      },
      {
        parameterName: "Salmonella, E. coli",
        equipmentCode: "EQ-HOOD-001",
        assignedTo: ANALYSTS.micro,
        status: "Reviewed",
      },
    ],
    storage: {
      storageLocation: "Kho mẫu / Tủ -20°C / Ngăn D1",
      preservationCondition: "-20°C",
      retentionUntil: "2026-07-25",
      storedBy: STORED_BY,
      storedAt: "2026-06-27T14:00:00.000Z",
    },
  },
  {
    requestCode: "PR-20260629-0005",
    sampleCode: "SPL-20260629-0005",
    request: {
      requestDate: "2026-06-27",
      requesterName: "Võ Thị Hạnh",
      customerName: "Hợp tác xã Rau sạch GreenFarm",
      department: "Kiểm soát chất lượng",
      purpose: "Rau cải xanh",
      sampleType: "Thực phẩm - Rau củ",
      sampleCount: 2,
      dueDate: "2026-02-07",
      status: "Processing",
      note: "Mẫu cần bảo quản mát 2-8°C\nBảo quản: 2-8°C",
      requestedTests: [
        "Dư lượng thuốc BVTV nhóm organophosphate",
        "Carbamate",
        "Nitrate",
        "Pb",
        "Cd",
      ],
      methodCodes: ["PP-LCMS-PST-001", "PP-ICP-WAT-001"],
    },
    sample: {
      sampleName: "Rau cải xanh",
      sampleType: "Thực phẩm - Rau củ",
      customerSampleCode: "VEG-GF-0627",
      receivedAt: "2026-06-27T11:00:00.000Z",
      deliveredBy: "Võ Thị Hạnh",
      receivedBy: "B. Quang",
      conditionOnReceipt: "NeedConfirmation",
      conditionNote: "Mẫu hơi dập nhẹ, cần xác nhận với khách hàng trước phân tích",
      quantity: 2,
      unit: "kg",
      containerType: "Túi PE có đá gel",
      preservationCondition: "2-8°C",
      storageLocation: "Tủ mẫu lạnh / Ngăn 2",
      retentionUntil: "2026-07-04",
      status: "Assigned",
      assignedTo: ANALYSTS.pesticide,
      dueDate: "2026-02-07",
      primaryMethodCode: "PP-LCMS-PST-001",
      note: "Mẫu hơi dập nhẹ",
    },
    tests: [
      {
        parameterName: "Dư lượng thuốc BVTV",
        methodCode: "PP-LCMS-PST-001",
        equipmentCode: "EQ-LC-MS-001",
        assignedTo: ANALYSTS.pesticide,
        chemicalCodes: ["CHEM-0002", "CHEM-0014"],
        standardCodes: ["STD-0027"],
        status: "Assigned",
      },
      {
        parameterName: "Pb, Cd",
        methodCode: "PP-ICP-WAT-001",
        equipmentCode: "EQ-ICP-001",
        assignedTo: ANALYSTS.metal,
        standardCodes: ["STD-0011"],
        status: "Assigned",
      },
    ],
  },
  {
    requestCode: "PR-20260629-0006",
    sampleCode: "SPL-20260629-0006",
    request: {
      requestDate: "2026-06-26",
      requesterName: "Đặng Minh Khôi",
      customerName: "Công ty Thực phẩm Sạch Việt",
      department: "QC",
      purpose: "Thịt gà tươi",
      sampleType: "Thực phẩm - Thịt",
      sampleCount: 3,
      dueDate: "2026-03-07",
      status: "Received",
      note: "Mẫu giao trong thùng lạnh\nBảo quản: 2-8°C",
      requestedTests: [
        "Chloramphenicol",
        "Tetracycline",
        "Salmonella",
        "E. coli",
        "Tổng số vi sinh vật hiếu khí",
      ],
      methodCodes: ["PP-LCMS-PST-001"],
    },
    sample: {
      sampleName: "Thịt gà tươi",
      sampleType: "Thực phẩm - Thịt",
      customerSampleCode: "CHK-FR-0626",
      receivedAt: "2026-06-26T05:30:00.000Z",
      deliveredBy: "Đặng Minh Khôi",
      receivedBy: "Q. Hoa",
      conditionOnReceipt: "Pass",
      conditionNote: "",
      quantity: 3,
      unit: "kg",
      containerType: "Thùng lạnh có đá",
      preservationCondition: "2-8°C",
      storageLocation: "Tủ mẫu lạnh / Ngăn 3",
      retentionUntil: "2026-07-03",
      status: "InAnalysis",
      assignedTo: ANALYSTS.micro,
      dueDate: "2026-03-07",
      primaryMethodCode: "PP-LCMS-PST-001",
      note: "Mẫu trong thùng lạnh",
    },
    tests: [
      {
        parameterName: "Chloramphenicol, Tetracycline",
        methodCode: "PP-LCMS-PST-001",
        equipmentCode: "EQ-LC-MS-001",
        assignedTo: ANALYSTS.pesticide,
        standardCodes: ["STD-0027"],
        status: "InProgress",
      },
      {
        parameterName: "Salmonella, E. coli",
        equipmentCode: "EQ-HOOD-001",
        assignedTo: ANALYSTS.micro,
        status: "InProgress",
      },
    ],
  },
  {
    requestCode: "PR-20260629-0007",
    sampleCode: "SPL-20260629-0007",
    request: {
      requestDate: "2026-06-27",
      requesterName: "Bùi Thanh Long",
      customerName: "Nhà máy Thức ăn chăn nuôi Đại Phát",
      department: "QA Feed",
      purpose: "Thức ăn viên cho heo",
      sampleType: "Thức ăn chăn nuôi",
      sampleCount: 2,
      dueDate: "2026-05-07",
      status: "Processing",
      note: "Mẫu thức ăn viên bao 25 kg\nBảo quản: Nhiệt độ phòng, khô",
      requestedTests: [
        "Protein thô",
        "Xơ thô",
        "Béo thô",
        "Độ ẩm",
        "Aflatoxin B1",
        "Pb",
        "Cd",
      ],
      methodCodes: ["PP-ICP-WAT-001", "PP-LCMS-PST-001"],
    },
    sample: {
      sampleName: "Thức ăn viên cho heo",
      sampleType: "Thức ăn chăn nuôi",
      customerSampleCode: "FEED-PIG-0627",
      receivedAt: "2026-06-27T13:00:00.000Z",
      deliveredBy: "Bùi Thanh Long",
      receivedBy: "V. Lam",
      conditionOnReceipt: "Pass",
      conditionNote: "",
      quantity: 2,
      unit: "bao",
      containerType: "Bao PP 25 kg",
      preservationCondition: "Nhiệt độ phòng, khô",
      storageLocation: "Kho mẫu / Kệ F1",
      retentionUntil: "2026-09-27",
      status: "InAnalysis",
      assignedTo: ANALYSTS.feed,
      dueDate: "2026-05-07",
      primaryMethodCode: "PP-ICP-WAT-001",
      note: "Bao bì nguyên vẹn",
    },
    tests: [
      {
        parameterName: "Protein thô, Xơ thô, Béo thô",
        equipmentCode: "EQ-BAL-001",
        assignedTo: ANALYSTS.feed,
        status: "InProgress",
      },
      {
        parameterName: "Aflatoxin B1",
        methodCode: "PP-LCMS-PST-001",
        equipmentCode: "EQ-LC-MS-001",
        assignedTo: ANALYSTS.mycotoxin,
        standardCodes: ["STD-0027"],
        status: "InProgress",
      },
      {
        parameterName: "Pb, Cd",
        methodCode: "PP-ICP-WAT-001",
        equipmentCode: "EQ-ICP-001",
        assignedTo: ANALYSTS.metal,
        standardCodes: ["STD-0011"],
        status: "InProgress",
      },
    ],
  },
  {
    requestCode: "PR-20260629-0008",
    sampleCode: "SPL-20260629-0008",
    request: {
      requestDate: "2026-06-25",
      requesterName: "Nguyễn Hoàng Minh",
      customerName: "Công ty FeedTech Việt Nam",
      department: "Nguyên liệu",
      purpose: "Bột cá nguyên liệu",
      sampleType: "Nguyên liệu thức ăn chăn nuôi",
      sampleCount: 1,
      dueDate: "2026-04-07",
      status: "Received",
      note: "Mẫu có mùi đặc trưng, cần lưu nơi khô thoáng\nBảo quản: Nhiệt độ phòng, thông gió",
      requestedTests: ["Protein thô", "Độ ẩm", "Tro", "Histamine", "Salmonella"],
      methodCodes: ["PP-ICP-WAT-001"],
    },
    sample: {
      sampleName: "Bột cá nguyên liệu",
      sampleType: "Nguyên liệu thức ăn chăn nuôi",
      customerSampleCode: "FISHMEAL-FT-0625",
      receivedAt: "2026-06-25T10:00:00.000Z",
      deliveredBy: "Nguyễn Hoàng Minh",
      receivedBy: "M. Kieu",
      conditionOnReceipt: "Pass",
      conditionNote: "",
      quantity: 1,
      unit: "kg",
      containerType: "Túi PE kín",
      preservationCondition: "Nhiệt độ phòng, thông gió",
      storageLocation: "Kho mẫu / Kệ F2 / Hộp 08",
      retentionUntil: "2026-08-25",
      status: "Stored",
      assignedTo: ANALYSTS.feed,
      dueDate: "2026-04-07",
      primaryMethodCode: "PP-ICP-WAT-001",
      note: "Có mùi đặc trưng bột cá",
    },
    tests: [
      {
        parameterName: "Protein thô",
        equipmentCode: "EQ-BAL-001",
        assignedTo: ANALYSTS.feed,
        status: "Reviewed",
      },
      {
        parameterName: "Histamine",
        equipmentCode: "EQ-HPLC-001",
        assignedTo: ANALYSTS.micro,
        status: "Reviewed",
      },
    ],
    storage: {
      storageLocation: "Kho mẫu / Kệ F2 / Hộp 08",
      preservationCondition: "Nhiệt độ phòng, thông gió",
      retentionUntil: "2026-08-25",
      storedBy: STORED_BY,
      storedAt: "2026-06-28T09:00:00.000Z",
    },
  },
  {
    requestCode: "PR-20260629-0009",
    sampleCode: "SPL-20260629-0009",
    request: {
      requestDate: "2026-06-24",
      requesterName: "Trương Thị Ngọc",
      customerName: "Công ty Dinh dưỡng vật nuôi Miền Nam",
      department: "QC Premix",
      purpose: "Premix khoáng cho gia cầm",
      sampleType: "Phụ gia thức ăn chăn nuôi",
      sampleCount: 2,
      dueDate: "2026-06-07",
      status: "Completed",
      note: "Mẫu dạng bột, tránh ẩm\nBảo quản: Nhiệt độ phòng, khô, tránh ẩm",
      requestedTests: ["Ca", "P", "Na", "Zn", "Cu", "Mn", "Fe", "Se"],
      methodCodes: ["PP-ICP-WAT-001"],
    },
    sample: {
      sampleName: "Premix khoáng cho gia cầm",
      sampleType: "Phụ gia thức ăn chăn nuôi",
      customerSampleCode: "PREMIX-GC-0624",
      receivedAt: "2026-06-24T08:00:00.000Z",
      deliveredBy: "Trương Thị Ngọc",
      receivedBy: "Q. Hoa",
      conditionOnReceipt: "Pass",
      conditionNote: "",
      quantity: 2,
      unit: "kg",
      containerType: "Túi nhôm chống ẩm",
      preservationCondition: "Nhiệt độ phòng, khô, tránh ẩm",
      storageLocation: "Kho mẫu / Kệ F3 / Hộp 09",
      retentionUntil: "2026-09-24",
      status: "Stored",
      assignedTo: ANALYSTS.metal,
      dueDate: "2026-06-07",
      primaryMethodCode: "PP-ICP-WAT-001",
      note: "Mẫu khô, tránh ẩm",
    },
    tests: [
      {
        parameterName: "Ca, P, Na, Zn, Cu, Mn, Fe, Se",
        methodCode: "PP-ICP-WAT-001",
        equipmentCode: "EQ-ICP-001",
        assignedTo: ANALYSTS.metal,
        chemicalCodes: ["CHEM-0030", "CHEM-0009"],
        standardCodes: ["STD-0004", "STD-0020", "STD-0022"],
        status: "Reviewed",
      },
    ],
    storage: {
      storageLocation: "Kho mẫu / Kệ F3 / Hộp 09",
      preservationCondition: "Nhiệt độ phòng, khô, tránh ẩm",
      retentionUntil: "2026-09-24",
      storedBy: STORED_BY,
      storedAt: "2026-06-28T11:30:00.000Z",
    },
  },
  {
    requestCode: "PR-20260629-0010",
    sampleCode: "SPL-20260629-0010",
    request: {
      requestDate: "2026-06-28",
      requesterName: "Phan Anh Tú",
      customerName: "Nhà máy Thức ăn chăn nuôi Bình Minh",
      department: "Kho nguyên liệu",
      purpose: "Bắp hạt nguyên liệu",
      sampleType: "Nguyên liệu thức ăn chăn nuôi",
      sampleCount: 3,
      dueDate: "2026-02-07",
      status: "Received",
      note: "Mẫu lấy từ xe hàng nhập kho\nBảo quản: Nhiệt độ phòng, khô",
      requestedTests: [
        "Aflatoxin B1",
        "DON",
        "Zearalenone",
        "Độ ẩm",
        "Tạp chất",
      ],
      methodCodes: ["PP-LCMS-PST-001"],
    },
    sample: {
      sampleName: "Bắp hạt nguyên liệu",
      sampleType: "Nguyên liệu thức ăn chăn nuôi",
      customerSampleCode: "CORN-BM-0628",
      receivedAt: "2026-06-28T12:00:00.000Z",
      deliveredBy: "Phan Anh Tú",
      receivedBy: "P. Huy",
      conditionOnReceipt: "NeedConfirmation",
      conditionNote: "Có dấu hiệu ẩm mốc nhẹ tại một góc bao; mẫu còn lại sau phân tích không đủ khối lượng lưu",
      quantity: 3,
      unit: "kg",
      containerType: "Bao jumbo từ xe hàng",
      preservationCondition: "Nhiệt độ phòng, khô",
      storageLocation: "",
      retentionUntil: "2026-08-28",
      status: "Disposed",
      assignedTo: ANALYSTS.mycotoxin,
      dueDate: "2026-02-07",
      primaryMethodCode: "PP-LCMS-PST-001",
      note: "Dấu hiệu ẩm mốc",
    },
    tests: [
      {
        parameterName: "Aflatoxin B1, DON, Zearalenone",
        methodCode: "PP-LCMS-PST-001",
        equipmentCode: "EQ-LC-MS-001",
        assignedTo: ANALYSTS.mycotoxin,
        standardCodes: ["STD-0027"],
        status: "Done",
      },
    ],
    dispose: {
      disposeReason:
        "Mẫu còn lại sau phân tích không đủ khối lượng lưu và có dấu hiệu ẩm mốc.",
      disposedBy: STORED_BY,
      disposedAt: "2026-06-29T08:00:00.000Z",
    },
  },
];

export const EXPECTED_SAMPLE_STATUS_COUNTS: Record<SampleStatus, number> = {
  Received: 0,
  WaitingAssignment: 1,
  Assigned: 2,
  InAnalysis: 2,
  WaitingReview: 0,
  Completed: 0,
  ResultIssued: 1,
  Stored: 3,
  Disposed: 1,
  Rejected: 0,
};
