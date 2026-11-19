-- AlterTable
ALTER TABLE "entrepreneurs"
ADD COLUMN "has_pickup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "has_delivery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "at_fair" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "products"
ADD COLUMN "is_combo" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "products_status_updated_at_idx" ON "products"("status", "updated_at" DESC);
