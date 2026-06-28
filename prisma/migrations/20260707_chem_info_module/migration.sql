-- Chem Info Module

CREATE TABLE "elements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL DEFAULT '',
    "atomicNumber" INTEGER NOT NULL,
    "atomicMass" REAL NOT NULL,
    "group" INTEGER,
    "period" INTEGER NOT NULL,
    "block" TEXT NOT NULL DEFAULT '',
    "classification" TEXT NOT NULL DEFAULT '',
    "electronConfig" TEXT NOT NULL DEFAULT '',
    "electronegativity" REAL,
    "meltingPointC" REAL,
    "boilingPointC" REAL,
    "gridRow" INTEGER NOT NULL DEFAULT 0,
    "gridColumn" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "elements_symbol_key" ON "elements"("symbol");
CREATE UNIQUE INDEX "elements_atomicNumber_key" ON "elements"("atomicNumber");
CREATE INDEX "elements_name_idx" ON "elements"("name");
CREATE INDEX "elements_atomicNumber_idx" ON "elements"("atomicNumber");

CREATE TABLE "chemical_references" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "casNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "molecularFormula" TEXT NOT NULL DEFAULT '',
    "molecularWeight" REAL,
    "synonyms" TEXT NOT NULL DEFAULT '[]',
    "pubchemCid" INTEGER,
    "smiles" TEXT NOT NULL DEFAULT '',
    "inchi" TEXT NOT NULL DEFAULT '',
    "inchiKey" TEXT NOT NULL DEFAULT '',
    "structure2dUrl" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'seed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "chemical_references_casNumber_key" ON "chemical_references"("casNumber");
CREATE INDEX "chemical_references_name_idx" ON "chemical_references"("name");
CREATE INDEX "chemical_references_molecularFormula_idx" ON "chemical_references"("molecularFormula");
CREATE INDEX "chemical_references_pubchemCid_idx" ON "chemical_references"("pubchemCid");

CREATE TABLE "ghs_pictograms" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT ''
);

CREATE TABLE "chemical_safety_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chemicalReferenceId" TEXT NOT NULL,
    "signalWord" TEXT NOT NULL DEFAULT '',
    "hazardStatements" TEXT NOT NULL DEFAULT '[]',
    "precautionaryStatements" TEXT NOT NULL DEFAULT '[]',
    "pictogramCodes" TEXT NOT NULL DEFAULT '[]',
    "unNumber" TEXT NOT NULL DEFAULT '',
    "hazardClass" TEXT NOT NULL DEFAULT '',
    "packingGroup" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chemical_safety_profiles_chemicalReferenceId_fkey" FOREIGN KEY ("chemicalReferenceId") REFERENCES "chemical_references" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "chemical_safety_profiles_chemicalReferenceId_key" ON "chemical_safety_profiles"("chemicalReferenceId");

CREATE TABLE "sds_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chemicalReferenceId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "supplier" TEXT NOT NULL DEFAULT '',
    "revisionDate" DATETIME,
    "filePath" TEXT,
    "externalUrl" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "uploadedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sds_documents_chemicalReferenceId_fkey" FOREIGN KEY ("chemicalReferenceId") REFERENCES "chemical_references" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "sds_documents_chemicalReferenceId_idx" ON "sds_documents"("chemicalReferenceId");

CREATE TABLE "compatibility_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "categoryA" TEXT NOT NULL,
    "categoryB" TEXT NOT NULL,
    "categoryALabel" TEXT NOT NULL,
    "categoryBLabel" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'high',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "storageGuidance" TEXT NOT NULL DEFAULT '',
    "examples" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX "compatibility_rules_code_key" ON "compatibility_rules"("code");
CREATE INDEX "compatibility_rules_categoryA_categoryB_idx" ON "compatibility_rules"("categoryA", "categoryB");

CREATE TABLE "chemical_hazard_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chemicalReferenceId" TEXT NOT NULL,
    "categories" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "chemical_hazard_categories_chemicalReferenceId_fkey" FOREIGN KEY ("chemicalReferenceId") REFERENCES "chemical_references" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "chemical_hazard_categories_chemicalReferenceId_key" ON "chemical_hazard_categories"("chemicalReferenceId");

CREATE TABLE "pubchem_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "pubchem_cache_cacheKey_key" ON "pubchem_cache"("cacheKey");
CREATE INDEX "pubchem_cache_expiresAt_idx" ON "pubchem_cache"("expiresAt");
