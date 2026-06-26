/** Thông số kỹ thuật theo mã thiết bị — dùng cho seed và backfill. */
export const EQUIPMENT_SPECIFICATIONS: Record<string, string> = {
  "EQ-AUT-001": "Buồng hấp 85 L; 121–134°C; áp suất tối đa 2.4 bar.",
  "EQ-BAL-001": "220 g × 0.1 mg; chuẩn nội; màn hình LCD.",
  "EQ-BAL-002": "220 g × 0.1 mg; hiệu chuẩn nội; GLP.",
  "EQ-DIS-001": "Lực đo 15–500 N; màn hình số.",
  "EQ-DIS-002": "7 vị trí; 29–32 chu kỳ/phút; điều khiển vi xử lý.",
  "EQ-FRZ-001": "Dung tích 600 L; -50 đến -86°C.",
  "EQ-FTIR-001": "Dải 7800–350 cm⁻¹; độ phân giải 0.5 cm⁻¹.",
  "EQ-GC-001": "FID; EPC; autosampler.",
  "EQ-GC-002": "FID/TCD; EPC điện tử.",
  "EQ-HOOD-001": "Tốc độ gió 0.5 m/s; đèn LED; ổ cắm tích hợp.",
  "EQ-HPLC-001": "Áp suất tối đa 600 bar; UV Detector; Autosampler.",
  "EQ-HPLC-002": "Áp suất 5000 psi; PDA Detector.",
  "EQ-HPLC-003": "130 MPa; SIL-30AC; SPD-M30A.",
  "EQ-ICP-001": "Dual View; RF 1500 W.",
  "EQ-INC-001": "32–250°C; dung tích 400 L.",
  "EQ-KF-001": "Karl Fischer Volumetric; màn hình cảm ứng.",
  "EQ-LC-MS-001": "Triple Quad/Linear Ion Trap; ESI/APCI.",
  "EQ-MIC-001": "40×–1000×; LED; thị kính WF10×.",
  "EQ-PUMP-001": "16 m³/h; chân không 70 mbar.",
  "EQ-SPEC-001": "200–999 nm; 6–384 well.",
  "EQ-STIR-001": "1500 rpm; gia nhiệt đến 310°C.",
  "EQ-UV-001": "190–1100 nm; độ phân giải 1 nm; đèn halogen/deuterium.",
  "EQ-UV-002": "325–1100 nm; độ phân giải 1.8 nm; màn hình LCD.",
  "EQ-pH-001": "pH -2 đến 20; ±0.002 pH; nhiệt độ tự động bù.",
  "EQ-VORT-001": "300–3000 rpm; 3 mm orbit; 3 vị trí ống.",
  "EQ-WATER-001": "Type 1 ultrapure; resistivity 18.2 MΩ·cm; TOC < 5 ppb.",
  "EQ-TOC-001": "TOC 0.4 µg/L–4000 mg/L; ASI-L autosampler.",
};

export function equipmentSpecificationsForCode(code: string): string {
  return EQUIPMENT_SPECIFICATIONS[code] ?? "";
}
