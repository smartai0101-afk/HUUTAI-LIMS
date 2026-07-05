-- Base LIMS catalog tables (missing on Turso prod — created via db push locally only)
CREATE TABLE IF NOT EXISTS "sample_matrices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupId" TEXT,
    "groupName" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sample_matrices_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "sample_matrix_groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "sample_matrices_code_key" ON "sample_matrices"("code");
CREATE INDEX IF NOT EXISTS "sample_matrices_groupId_active_idx" ON "sample_matrices"("groupId", "active");
CREATE INDEX IF NOT EXISTS "sample_matrices_groupName_active_idx" ON "sample_matrices"("groupName", "active");

CREATE TABLE IF NOT EXISTS "test_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "test_categories_code_key" ON "test_categories"("code");

CREATE TABLE IF NOT EXISTS "test_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "defaultUnit" TEXT NOT NULL DEFAULT '',
    "resultType" TEXT NOT NULL DEFAULT 'numeric',
    "lod" TEXT NOT NULL DEFAULT '',
    "loq" TEXT NOT NULL DEFAULT '',
    "estimatedMinutes" INTEGER,
    "price" REAL,
    "responsibleDeptId" TEXT,
    "defaultMethodId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "test_methods_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "test_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "test_methods_defaultMethodId_fkey" FOREIGN KEY ("defaultMethodId") REFERENCES "analytical_methods" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "test_methods_responsibleDeptId_fkey" FOREIGN KEY ("responsibleDeptId") REFERENCES "lab_departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "test_methods_code_key" ON "test_methods"("code");
CREATE INDEX IF NOT EXISTS "test_methods_categoryId_idx" ON "test_methods"("categoryId");
CREATE INDEX IF NOT EXISTS "test_methods_defaultMethodId_idx" ON "test_methods"("defaultMethodId");

CREATE TABLE IF NOT EXISTS "matrix_test_mappings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matrixId" TEXT NOT NULL,
    "testMethodId" TEXT NOT NULL,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "packageId" TEXT,
    CONSTRAINT "matrix_test_mappings_matrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "sample_matrices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "matrix_test_mappings_testMethodId_fkey" FOREIGN KEY ("testMethodId") REFERENCES "test_methods" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "matrix_test_mappings_matrixId_testMethodId_key" ON "matrix_test_mappings"("matrixId", "testMethodId");
CREATE INDEX IF NOT EXISTS "matrix_test_mappings_matrixId_idx" ON "matrix_test_mappings"("matrixId");
CREATE INDEX IF NOT EXISTS "matrix_test_mappings_testMethodId_idx" ON "matrix_test_mappings"("testMethodId");

CREATE TABLE IF NOT EXISTS "test_packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "matrixId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "test_packages_matrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "sample_matrices" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "test_packages_code_key" ON "test_packages"("code");
CREATE INDEX IF NOT EXISTS "test_packages_matrixId_idx" ON "test_packages"("matrixId");

CREATE TABLE IF NOT EXISTS "test_package_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "testMethodId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "test_package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "test_packages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_package_items_testMethodId_fkey" FOREIGN KEY ("testMethodId") REFERENCES "test_methods" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "test_package_items_packageId_testMethodId_key" ON "test_package_items"("packageId", "testMethodId");
CREATE INDEX IF NOT EXISTS "test_package_items_packageId_idx" ON "test_package_items"("packageId");
