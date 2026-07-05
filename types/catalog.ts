import type { RequestPriority, RequestSampleLineStatus, TestResultType } from "@prisma/client";

export type SampleMatrixGroupView = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

export type SampleMatrixView = {
  id: string;
  code: string;
  name: string;
  groupId: string | null;
  groupName: string;
  sortOrder: number;
  active: boolean;
};

export type TestCategoryView = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

export type TestMethodMethodLink = {
  methodId: string;
  methodCode: string;
  methodName: string;
  unit: string;
  lod: string;
  loq: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type TestMethodView = {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  defaultUnit: string;
  resultType: TestResultType;
  lod: string;
  loq: string;
  estimatedMinutes: number | null;
  price: number | null;
  methodLinks: TestMethodMethodLink[];
  defaultMethodId: string | null;
  defaultMethodCode: string | null;
  defaultMethodName: string | null;
  responsibleDeptId: string | null;
  responsibleDeptName: string | null;
  active: boolean;
};

export type TestPackageView = {
  id: string;
  code: string;
  name: string;
  matrixId: string | null;
  matrixName: string | null;
  testMethodIds: string[];
  testMethodNames: string[];
  active: boolean;
};

export type RequestSampleLineTestView = {
  id: string;
  testMethodId: string;
  testMethodCode: string;
  testMethodName: string;
  categoryName: string;
  defaultUnit: string;
  methodId: string | null;
  methodCode: string | null;
  priority: RequestPriority;
  note: string;
};

export type RequestSampleLineView = {
  id: string;
  lineNo: number;
  tempCode: string;
  sampleName: string;
  matrixId: string | null;
  matrixCode: string | null;
  matrixName: string | null;
  sampleType: string;
  quantity: number | null;
  unit: string;
  conditionNote: string;
  status: RequestSampleLineStatus;
  sampleId: string | null;
  tests: RequestSampleLineTestView[];
};

export type SampleTestMatrixCell = {
  lineId: string;
  testMethodId: string;
  selected: boolean;
  valid: boolean;
};

export type SampleTestMatrixView = {
  lines: RequestSampleLineView[];
  testMethods: TestMethodView[];
  cells: SampleTestMatrixCell[];
};
