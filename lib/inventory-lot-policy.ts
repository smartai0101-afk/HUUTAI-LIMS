/**
 * FIFO chỉ được dùng khi không chọn lot cụ thể và biến môi trường cho phép.
 * Mặc định: false — bắt buộc chọn lot khi master có nhiều lot (UI).
 */
export function allowFifoWithoutLotSelection(): boolean {
  return process.env.ALLOW_FIFO_WITHOUT_LOT === "true";
}

export const LOT_SELECTION_REQUIRED_MESSAGE =
  "Vật tư có nhiều lot — vui lòng chọn lot cụ thể trước khi lưu.";

export const FIFO_NOT_ALLOWED_MESSAGE =
  "Không chọn lot cụ thể. Hệ thống không cho phép trừ tồn FIFO tự động.";
