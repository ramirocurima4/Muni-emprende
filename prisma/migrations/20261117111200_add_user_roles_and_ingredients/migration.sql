-- AlterEnum
ALTER TYPE "user_role" ADD VALUE 'USER_TRUSTED';
ALTER TYPE "user_role" ADD VALUE 'USER_NEW';

-- AlterTable
ALTER TABLE "entrepreneurs" ADD COLUMN     "is_trusted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "last_price_update_at",
DROP COLUMN "price_ars",
ADD COLUMN     "ingredients" TEXT;

-- CreateIndex
CREATE INDEX "entrepreneurs_status_is_trusted_idx" ON "entrepreneurs"("status", "is_trusted");
