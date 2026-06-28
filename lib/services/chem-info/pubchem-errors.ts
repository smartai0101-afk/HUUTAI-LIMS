export type PubChemErrorCode =
  | "EMPTY_QUERY"
  | "NOT_FOUND"
  | "TIMEOUT"
  | "UNREACHABLE"
  | "PARSE_ERROR"
  | "INTERNAL"
  | "UNAUTHORIZED";

export class PubChemSearchError extends Error {
  code: PubChemErrorCode;

  constructor(code: PubChemErrorCode, message: string) {
    super(message);
    this.name = "PubChemSearchError";
    this.code = code;
  }
}

export function pubChemErrorMessage(code: PubChemErrorCode): string {
  switch (code) {
    case "EMPTY_QUERY":
      return "Vui lòng nhập từ khóa tra cứu";
    case "NOT_FOUND":
      return "Không tìm thấy kết quả trên PubChem";
    case "TIMEOUT":
      return "PubChem không phản hồi trong thời gian cho phép (timeout 15 giây). Vui lòng thử lại sau.";
    case "UNREACHABLE":
      return "Không thể kết nối tới PubChem. Kiểm tra kết nối mạng, firewall hoặc VPN rồi thử lại.";
    case "PARSE_ERROR":
      return "Lỗi parse dữ liệu từ PubChem. Dữ liệu trả về không đúng định dạng.";
    case "UNAUTHORIZED":
      return "Phiên đăng nhập hết hạn — vui lòng đăng nhập lại.";
    case "INTERNAL":
    default:
      return "Lỗi hệ thống khi tra cứu PubChem. Vui lòng thử lại sau.";
  }
}

export function httpStatusForPubChemError(code: PubChemErrorCode): number {
  switch (code) {
    case "EMPTY_QUERY":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "NOT_FOUND":
      return 200;
    case "TIMEOUT":
    case "UNREACHABLE":
    case "PARSE_ERROR":
      return 502;
    case "INTERNAL":
    default:
      return 500;
  }
}
