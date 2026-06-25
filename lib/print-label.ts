import { formatDate } from "@/lib/utils";
import type { PreparedChemicalView, PreparedStandardView } from "@/types";

export type LabelTemplate = "prepared-standard" | "prepared-chemical";

export type PrintLabelData = {
  name: string;
  code: string;
  concentration: string;
  preparedDate: string;
  expiryDate: string;
  preparedBy: string;
  storageCondition: string;
};

export type BulkPrintItem = {
  data: PrintLabelData;
  defaultQuantity: number;
};

export type BulkPrintOptions = {
  useDefaultQuantity: boolean;
  copiesPerSample: number;
};

export type PrintLabelResult =
  | { ok: true }
  | { ok: false; reason: "popup-blocked" | "write-failed" | "empty" };

const LABEL_TITLE = "SCI-TECH";

const POPUP_BLOCKED_MESSAGE =
  "Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup để in tem nhãn.";

export { POPUP_BLOCKED_MESSAGE };

const TEMPLATE_CONFIG = {
  "prepared-standard": {
    nameLabel: "Tên chất chuẩn",
    codeLabel: "Mã chất chuẩn",
    widthCm: 2.5,
    heightCm: 1.5,
    fontSizePt: 3.8,
    titleSizePt: 4.5,
    paddingMm: 0.5,
    borderMm: 0.12,
  },
  "prepared-chemical": {
    nameLabel: "Tên hóa chất",
    codeLabel: "Mã hóa chất",
    widthCm: 3,
    heightCm: 2,
    fontSizePt: 4.5,
    titleSizePt: 5.5,
    paddingMm: 0.6,
    borderMm: 0.15,
  },
} as const;

type TemplateConfig = (typeof TEMPLATE_CONFIG)[LabelTemplate];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayValue(value: string): string {
  const trimmed = value.trim();
  return trimmed ? escapeHtml(trimmed) : "-";
}

function formatLabelDate(value: string): string {
  if (!value.trim()) return "-";
  try {
    return formatDate(value);
  } catch {
    return value.trim() || "-";
  }
}

function formatConcentration(concentration: string, unit: string): string {
  const combined = [concentration, unit].filter((part) => part.trim()).join(" ").trim();
  return combined || "-";
}

export function preparedStandardToLabelData(item: PreparedStandardView): PrintLabelData {
  return {
    name: item.name,
    code: item.code,
    concentration: formatConcentration(item.concentration, item.concentrationUnit),
    preparedDate: formatLabelDate(item.preparedDate),
    expiryDate: formatLabelDate(item.expiryDate),
    preparedBy: item.preparedBy,
    storageCondition: item.storageCondition,
  };
}

export function preparedChemicalToLabelData(item: PreparedChemicalView): PrintLabelData {
  return {
    name: item.name,
    code: item.code,
    concentration: formatConcentration(item.concentration, item.concentrationUnit),
    preparedDate: formatLabelDate(item.preparedDate),
    expiryDate: formatLabelDate(item.expiryDate),
    preparedBy: item.preparedBy,
    storageCondition: item.storageCondition,
  };
}

export function getPreparedStandardDefaultLabelCount(_item: PreparedStandardView): number {
  return 1;
}

export function getPreparedChemicalDefaultLabelCount(_item: PreparedChemicalView): number {
  return 1;
}

function buildLabelRow(label: string, value: string): string {
  return `<div class="row"><span class="lbl">${label}:</span><span class="val">${value}</span></div>`;
}

function buildLabelHtml(template: LabelTemplate, data: PrintLabelData): string {
  const cfg = TEMPLATE_CONFIG[template];
  const rows = [
    buildLabelRow(cfg.nameLabel, displayValue(data.name)),
    buildLabelRow(cfg.codeLabel, displayValue(data.code)),
    buildLabelRow("Nồng độ", displayValue(data.concentration)),
    buildLabelRow("Ngày pha", displayValue(data.preparedDate)),
    buildLabelRow("Hạn sử dụng", displayValue(data.expiryDate)),
    buildLabelRow("Người pha", displayValue(data.preparedBy)),
    buildLabelRow("Điều kiện bảo quản", displayValue(data.storageCondition)),
  ].join("");

  return `<div class="label">
  <div class="logo-watermark" aria-hidden="true"></div>
  <div class="label-content">
    <div class="header">
      <div class="title">${LABEL_TITLE}</div>
      <div class="divider"></div>
    </div>
    <div class="content">${rows}</div>
  </div>
</div>`;
}

function buildLabelCss(cfg: TemplateConfig, logoUrl: string): string {
  const pageWidth = `${cfg.widthCm}cm`;
  const pageHeight = `${cfg.heightCm}cm`;

  return `
    .label {
      position: relative;
      width: ${pageWidth};
      height: ${pageHeight};
      max-width: ${pageWidth};
      max-height: ${pageHeight};
      padding: ${cfg.paddingMm}mm;
      border: ${cfg.borderMm}mm solid #000;
      overflow: hidden;
      text-align: left;
      flex: 0 0 auto;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .logo-watermark {
      position: absolute;
      inset: 0;
      background-image: url('${logoUrl}');
      background-repeat: no-repeat;
      background-position: center;
      background-size: 80%;
      opacity: 0.1;
      z-index: 0;
      pointer-events: none;
    }
    .label-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .header {
      flex-shrink: 0;
      text-align: center;
      margin-bottom: 0.15mm;
    }
    .title {
      font-size: ${cfg.titleSizePt}pt;
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0.04em;
    }
    .divider {
      margin-top: 0.2mm;
      border-bottom: ${cfg.borderMm}mm solid #000;
    }
    .content {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 0.05mm;
      overflow: hidden;
      padding-top: 0.15mm;
    }
    .row {
      display: block;
      font-size: ${cfg.fontSizePt}pt;
      line-height: 1.08;
      white-space: normal;
      overflow: hidden;
    }
    .lbl {
      font-weight: 700;
    }
    .val {
      font-weight: 400;
      word-break: break-word;
      overflow-wrap: anywhere;
    }`;
}

function resolveLogoUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/sci-tech-logo.png`;
  }
  return "/sci-tech-logo.png";
}

export function expandBulkLabelData(items: BulkPrintItem[], options: BulkPrintOptions): PrintLabelData[] {
  const expanded: PrintLabelData[] = [];

  for (const item of items) {
    const count = options.useDefaultQuantity
      ? Math.max(1, Math.round(item.defaultQuantity))
      : Math.max(1, Math.floor(options.copiesPerSample) || 1);

    for (let i = 0; i < count; i += 1) {
      expanded.push(item.data);
    }
  }

  return expanded;
}

export function countBulkLabelTotal(items: BulkPrintItem[], options: BulkPrintOptions): number {
  return expandBulkLabelData(items, options).length;
}

export function buildPrintDocument(
  template: LabelTemplate,
  data: PrintLabelData,
  logoUrl: string = "/sci-tech-logo.png",
): string {
  const cfg = TEMPLATE_CONFIG[template];
  const labelHtml = buildLabelHtml(template, data);
  const pageWidth = `${cfg.widthCm}cm`;
  const pageHeight = `${cfg.heightCm}cm`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=${cfg.widthCm}cm, initial-scale=1" />
  <title>In tem nhãn ${LABEL_TITLE}</title>
  <style>
    @page {
      size: ${pageWidth} ${pageHeight};
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: ${pageWidth};
      height: ${pageHeight};
      max-width: ${pageWidth};
      max-height: ${pageHeight};
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    ${buildLabelCss(cfg, logoUrl)}
    @media print {
      html, body {
        width: ${pageWidth} !important;
        height: ${pageHeight} !important;
        max-width: ${pageWidth} !important;
        max-height: ${pageHeight} !important;
        overflow: hidden !important;
      }
      .label {
        width: ${pageWidth} !important;
        height: ${pageHeight} !important;
      }
      .logo-watermark {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>${labelHtml}</body>
</html>`;
}

export function buildBulkPrintDocument(
  template: LabelTemplate,
  dataList: PrintLabelData[],
  logoUrl: string = "/sci-tech-logo.png",
): string {
  const cfg = TEMPLATE_CONFIG[template];
  const pageWidth = `${cfg.widthCm}cm`;
  const pageHeight = `${cfg.heightCm}cm`;
  const labelsHtml = dataList.map((data) => buildLabelHtml(template, data)).join("");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>In tem nhãn ${LABEL_TITLE}</title>
  <style>
    @page {
      size: A4;
      margin: 5mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .label-sheet {
      display: flex;
      flex-wrap: wrap;
      gap: 2mm;
      align-content: flex-start;
      width: 100%;
    }
    ${buildLabelCss(cfg, logoUrl)}
    @media print {
      .label {
        width: ${pageWidth} !important;
        height: ${pageHeight} !important;
        max-width: ${pageWidth} !important;
        max-height: ${pageHeight} !important;
      }
      .logo-watermark {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body><div class="label-sheet">${labelsHtml}</div></body>
</html>`;
}

function schedulePrint(printWindow: Window, logoUrl: string): void {
  const runPrint = () => {
    if (printWindow.closed) return;
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };

  const waitForAssets = () => {
    const img = new Image();
    img.onload = () => window.setTimeout(runPrint, 100);
    img.onerror = () => window.setTimeout(runPrint, 100);
    img.src = logoUrl;
  };

  const doc = printWindow.document;
  if (doc.readyState === "complete") {
    waitForAssets();
    return;
  }

  printWindow.addEventListener(
    "load",
    () => {
      waitForAssets();
    },
    { once: true },
  );
}

function writePrintDocument(printWindow: Window, documentHtml: string): boolean {
  try {
    const doc = printWindow.document;
    doc.open();
    doc.write(documentHtml);
    doc.close();
    return Boolean(doc.body?.querySelector(".label"));
  } catch {
    return false;
  }
}

function isPopupBlocked(printWindow: Window | null): boolean {
  if (!printWindow) return true;
  try {
    void printWindow.document;
    return false;
  } catch {
    return true;
  }
}

function openPrintWindow(documentHtml: string, logoUrl: string): PrintLabelResult {
  const printWindow = window.open("about:blank", "_blank");
  if (isPopupBlocked(printWindow)) {
    return { ok: false, reason: "popup-blocked" };
  }

  const win = printWindow as Window;
  const written = writePrintDocument(win, documentHtml);
  if (!written) {
    win.close();
    return { ok: false, reason: "write-failed" };
  }

  schedulePrint(win, logoUrl);
  return { ok: true };
}

export function printPreparedLabel(
  template: LabelTemplate,
  data: PrintLabelData,
): PrintLabelResult {
  const logoUrl = resolveLogoUrl();
  const documentHtml = buildPrintDocument(template, data, logoUrl);
  return openPrintWindow(documentHtml, logoUrl);
}

export function printPreparedLabelsBulk(
  template: LabelTemplate,
  items: BulkPrintItem[],
  options: BulkPrintOptions,
): PrintLabelResult {
  const expanded = expandBulkLabelData(items, options);
  if (!expanded.length) {
    return { ok: false, reason: "empty" };
  }

  const logoUrl = resolveLogoUrl();
  const documentHtml = buildBulkPrintDocument(template, expanded, logoUrl);
  return openPrintWindow(documentHtml, logoUrl);
}
