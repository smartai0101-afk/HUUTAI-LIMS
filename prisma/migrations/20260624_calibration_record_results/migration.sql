-- Add JSON array of { result, error } pairs for calibration measurements
ALTER TABLE "CalibrationRecord" ADD COLUMN "calibrationResults" TEXT NOT NULL DEFAULT '[]';
