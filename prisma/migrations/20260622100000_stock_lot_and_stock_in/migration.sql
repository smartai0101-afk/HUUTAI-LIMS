-- CreateTable StockLot
CREATE TABLE "StockLot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chemicalId" TEXT,
    "standardId" TEXT,
    "microbialStrainId" TEXT,
    "lot" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT '',
    "expiryDate" DATETIME,
    "afterOpenExpiry" DATETIME,
    "coaPath" TEXT,
    "storageLocation" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Ready',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockLot_chemicalId_fkey" FOREIGN KEY ("chemicalId") REFERENCES "Chemical" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockLot_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockLot_microbialStrainId_fkey" FOREIGN KEY ("microbialStrainId") REFERENCES "MicrobialStrain" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "StockLot_chemicalId_lot_key" ON "StockLot"("chemicalId", "lot");
CREATE UNIQUE INDEX "StockLot_standardId_lot_key" ON "StockLot"("standardId", "lot");
CREATE UNIQUE INDEX "StockLot_microbialStrainId_lot_key" ON "StockLot"("microbialStrainId", "lot");
CREATE INDEX "StockLot_chemicalId_idx" ON "StockLot"("chemicalId");
CREATE INDEX "StockLot_standardId_idx" ON "StockLot"("standardId");
CREATE INDEX "StockLot_microbialStrainId_idx" ON "StockLot"("microbialStrainId");
CREATE INDEX "StockLot_expiryDate_idx" ON "StockLot"("expiryDate");

-- CreateTable StockInLog
CREATE TABLE "StockInLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" TEXT NOT NULL DEFAULT '',
    "sourceType" TEXT NOT NULL,
    "stockLotId" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL DEFAULT '',
    "sourceName" TEXT NOT NULL DEFAULT '',
    "lot" TEXT NOT NULL DEFAULT '',
    "quantityBefore" REAL NOT NULL,
    "quantityIn" REAL NOT NULL,
    "quantityAfter" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "referenceId" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "StockInLog_stockLotId_fkey" FOREIGN KEY ("stockLotId") REFERENCES "StockLot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "StockInLog_stockLotId_idx" ON "StockInLog"("stockLotId");
CREATE INDEX "StockInLog_sourceType_idx" ON "StockInLog"("sourceType");
CREATE INDEX "StockInLog_time_idx" ON "StockInLog"("time");

-- Add stockLotId to InventoryTransaction
ALTER TABLE "InventoryTransaction" ADD COLUMN "stockLotId" TEXT;
CREATE INDEX "InventoryTransaction_stockLotId_idx" ON "InventoryTransaction"("stockLotId");

-- Backfill StockLot from Chemical
INSERT INTO "StockLot" (
    "id", "chemicalId", "lot", "quantity", "unit", "expiryDate",
    "coaPath", "storageLocation", "notes", "status", "createdAt", "updatedAt"
)
SELECT
    'sl-chem-' || "id",
    "id",
    CASE WHEN trim("lot") = '' THEN 'LEGACY-' || substr("id", 1, 8) ELSE "lot" END,
    "quantity",
    "unit",
    "expiryDate",
    "coaPath",
    "storageLocation",
    "notes",
    "status",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Chemical"
WHERE trim("lot") != '' OR "quantity" > 0;

-- Backfill StockLot from Standard
INSERT INTO "StockLot" (
    "id", "standardId", "lot", "quantity", "unit", "expiryDate", "afterOpenExpiry",
    "coaPath", "storageLocation", "notes", "status", "createdAt", "updatedAt"
)
SELECT
    'sl-std-' || "id",
    "id",
    CASE WHEN trim("lot") = '' THEN 'LEGACY-' || substr("id", 1, 8) ELSE "lot" END,
    "quantity",
    "unit",
    "expiryDate",
    "afterOpenExpiry",
    "coaPath",
    "storageLocation",
    "notes",
    "status",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Standard"
WHERE trim("lot") != '' OR "quantity" > 0;

-- Backfill StockLot from MicrobialStrain
INSERT INTO "StockLot" (
    "id", "microbialStrainId", "lot", "quantity", "unit", "expiryDate",
    "coaPath", "storageLocation", "notes", "status", "createdAt", "updatedAt"
)
SELECT
    'sl-str-' || "id",
    "id",
    CASE WHEN trim("lot") = '' THEN 'LEGACY-' || substr("id", 1, 8) ELSE "lot" END,
    "quantity",
    "unit",
    "expiryDate",
    "coaPath",
    "storageLocation",
    "notes",
    "status",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "MicrobialStrain"
WHERE trim("lot") != '' OR "quantity" > 0;
