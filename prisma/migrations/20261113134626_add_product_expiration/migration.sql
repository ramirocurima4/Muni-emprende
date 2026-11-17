-- AlterTable
ALTER TABLE "products" ADD COLUMN     "expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "products_status_expires_at_idx" ON "products"("status", "expires_at");
