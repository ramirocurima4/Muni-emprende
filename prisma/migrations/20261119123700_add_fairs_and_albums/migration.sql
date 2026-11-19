-- CreateEnum
CREATE TYPE "fair_type" AS ENUM ('EXPO_EMPRENDEDORES', 'MERCADO_SANROQUENO');

-- CreateEnum
CREATE TYPE "fair_media_type" AS ENUM ('IMAGE', 'VIDEO');

-- AlterEnum
ALTER TYPE "audit_entity_type" ADD VALUE 'FAIR_CONFIG';
ALTER TYPE "audit_entity_type" ADD VALUE 'FAIR_ALBUM';

-- CreateTable
CREATE TABLE "fair_configs" (
    "id" UUID NOT NULL,
    "fair_type" "fair_type" NOT NULL,
    "next_date" DATE,
    "schedule" VARCHAR(80),
    "location" VARCHAR(150),
    "maps_url" VARCHAR(500),
    "whatsapp_number" VARCHAR(25) NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fair_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fair_albums" (
    "id" UUID NOT NULL,
    "fair_type" "fair_type" NOT NULL,
    "title" VARCHAR(140) NOT NULL,
    "event_date" DATE NOT NULL,
    "location" VARCHAR(120) NOT NULL,
    "description" VARCHAR(320),
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fair_albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fair_media" (
    "id" UUID NOT NULL,
    "album_id" UUID NOT NULL,
    "media_type" "fair_media_type" NOT NULL DEFAULT 'IMAGE',
    "relative_path" VARCHAR(500) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fair_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fair_configs_fair_type_key" ON "fair_configs"("fair_type");

-- CreateIndex
CREATE INDEX "fair_albums_fair_type_is_published_event_date_idx" ON "fair_albums"("fair_type", "is_published", "event_date" DESC);

-- CreateIndex
CREATE INDEX "fair_albums_is_published_event_date_idx" ON "fair_albums"("is_published", "event_date" DESC);

-- CreateIndex
CREATE INDEX "fair_albums_uploaded_by_idx" ON "fair_albums"("uploaded_by");

-- CreateIndex
CREATE INDEX "fair_media_album_id_sort_order_idx" ON "fair_media"("album_id", "sort_order");

-- AddForeignKey
ALTER TABLE "fair_configs" ADD CONSTRAINT "fair_configs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fair_albums" ADD CONSTRAINT "fair_albums_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fair_media" ADD CONSTRAINT "fair_media_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "fair_albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing expo_photos rows into fair_albums + fair_media before dropping expo_photos
INSERT INTO "fair_albums" (
    "id",
    "fair_type",
    "title",
    "event_date",
    "location",
    "description",
    "is_published",
    "uploaded_by",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    'EXPO_EMPRENDEDORES'::"fair_type",
    LEFT("caption", 140),
    "event_date",
    'San Roque',
    "caption",
    "is_published",
    "uploaded_by",
    "created_at",
    "updated_at"
FROM "expo_photos";

INSERT INTO "fair_media" (
    "id",
    "album_id",
    "media_type",
    "relative_path",
    "width",
    "height",
    "sort_order",
    "created_at"
)
SELECT
    gen_random_uuid(),
    "id",
    'IMAGE'::"fair_media_type",
    "relative_path",
    "width",
    "height",
    0,
    "created_at"
FROM "expo_photos";

-- Seed initial fair_configs defaults for both municipal fairs
INSERT INTO "fair_configs" (
    "id",
    "fair_type",
    "next_date",
    "schedule",
    "location",
    "maps_url",
    "whatsapp_number",
    "created_at",
    "updated_at"
)
VALUES
    (
        gen_random_uuid(),
        'EXPO_EMPRENDEDORES'::"fair_type",
        NULL,
        '17:00 a 21:00 hs',
        'Plaza Libertad',
        NULL,
        '5493794819378',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'MERCADO_SANROQUENO'::"fair_type",
        NULL,
        '08:00 a 13:00 hs',
        'Plaza Libertad',
        NULL,
        '5493794819378',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("fair_type") DO NOTHING;

-- DropForeignKey
ALTER TABLE "expo_photos" DROP CONSTRAINT "expo_photos_uploaded_by_fkey";

-- DropTable
DROP TABLE "expo_photos";
