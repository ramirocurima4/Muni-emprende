-- AlterEnum
ALTER TYPE "audit_entity_type" ADD VALUE 'EXPO_PHOTO';

-- CreateTable
CREATE TABLE "expo_photos" (
    "id" UUID NOT NULL,
    "relative_path" VARCHAR(255) NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "event_date" DATE NOT NULL,
    "caption" VARCHAR(200) NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expo_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expo_photos_is_published_event_date_idx" ON "expo_photos"("is_published", "event_date" DESC);

-- CreateIndex
CREATE INDEX "expo_photos_uploaded_by_idx" ON "expo_photos"("uploaded_by");

-- AddForeignKey
ALTER TABLE "expo_photos" ADD CONSTRAINT "expo_photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
