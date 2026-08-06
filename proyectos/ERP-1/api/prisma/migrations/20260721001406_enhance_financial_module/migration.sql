-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_accounts_chart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nature" TEXT NOT NULL DEFAULT 'debit',
    "level" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    CONSTRAINT "accounts_chart_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accounts_chart_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "accounts_chart" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_accounts_chart" ("code", "company_id", "created_at", "created_by", "deleted_at", "deleted_by", "id", "is_active", "name", "type", "updated_at", "updated_by") SELECT "code", "company_id", "created_at", "created_by", "deleted_at", "deleted_by", "id", "is_active", "name", "type", "updated_at", "updated_by" FROM "accounts_chart";
DROP TABLE "accounts_chart";
ALTER TABLE "new_accounts_chart" RENAME TO "accounts_chart";
CREATE UNIQUE INDEX "accounts_chart_company_id_code_key" ON "accounts_chart"("company_id", "code");
CREATE TABLE "new_journal_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_id" TEXT NOT NULL,
    "entry_number" TEXT NOT NULL,
    "description" TEXT,
    "entry_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_debit" DECIMAL NOT NULL DEFAULT 0,
    "total_credit" DECIMAL NOT NULL DEFAULT 0,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    CONSTRAINT "journal_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_journal_entries" ("company_id", "created_at", "created_by", "deleted_at", "deleted_by", "description", "entry_date", "entry_number", "id", "reference_id", "reference_type", "status", "updated_at", "updated_by") SELECT "company_id", "created_at", "created_by", "deleted_at", "deleted_by", "description", "entry_date", "entry_number", "id", "reference_id", "reference_type", "status", "updated_at", "updated_by" FROM "journal_entries";
DROP TABLE "journal_entries";
ALTER TABLE "new_journal_entries" RENAME TO "journal_entries";
CREATE UNIQUE INDEX "journal_entries_entry_number_key" ON "journal_entries"("entry_number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
