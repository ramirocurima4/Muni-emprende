-- AlterEnum
ALTER TYPE "audit_entity_type" ADD VALUE 'SYSTEM_CONFIG';

-- CreateTable
CREATE TABLE "system_configs" (
    "id" UUID NOT NULL,
    "key" VARCHAR(40) NOT NULL DEFAULT 'institutional',
    "employment_whatsapp" VARCHAR(25) NOT NULL DEFAULT '5493794819378',
    "production_whatsapp" VARCHAR(25) NOT NULL DEFAULT '5493794819378',
    "expo_next_date" DATE,
    "expo_schedule" VARCHAR(80) NOT NULL DEFAULT '17:00 a 21:00 hs',
    "expo_location" VARCHAR(150) NOT NULL DEFAULT 'Plaza Libertad',
    "expo_maps_url" VARCHAR(500),
    "mercado_next_date" DATE,
    "mercado_schedule" VARCHAR(80) NOT NULL DEFAULT '08:00 a 13:00 hs',
    "mercado_location" VARCHAR(150) NOT NULL DEFAULT 'Plaza Libertad',
    "mercado_maps_url" VARCHAR(500),
    "authority_name" VARCHAR(120) NOT NULL DEFAULT 'Cr. Raúl Pelozo',
    "authority_title" VARCHAR(120) NOT NULL DEFAULT 'Intendente de San Roque',
    "legal_disclaimer" TEXT NOT NULL DEFAULT 'La Municipalidad de San Roque brinda únicamente este espacio de difusión publicitaria y no interviene en precios, medios de pago, entregas ni garantías comerciales.',
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- AddForeignKey
ALTER TABLE "system_configs" ADD CONSTRAINT "system_configs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed initial institutional system_configs row (syncing existing fair_configs if any)
INSERT INTO "system_configs" (
    "id",
    "key",
    "employment_whatsapp",
    "production_whatsapp",
    "expo_next_date",
    "expo_schedule",
    "expo_location",
    "expo_maps_url",
    "mercado_next_date",
    "mercado_schedule",
    "mercado_location",
    "mercado_maps_url",
    "authority_name",
    "authority_title",
    "legal_disclaimer",
    "created_at",
    "updated_at"
)
VALUES (
    gen_random_uuid(),
    'institutional',
    COALESCE((SELECT "whatsapp_number" FROM "fair_configs" WHERE "fair_type" = 'EXPO_EMPRENDEDORES' LIMIT 1), '5493794819378'),
    COALESCE((SELECT "whatsapp_number" FROM "fair_configs" WHERE "fair_type" = 'MERCADO_SANROQUENO' LIMIT 1), '5493794819378'),
    (SELECT "next_date" FROM "fair_configs" WHERE "fair_type" = 'EXPO_EMPRENDEDORES' LIMIT 1),
    COALESCE((SELECT "schedule" FROM "fair_configs" WHERE "fair_type" = 'EXPO_EMPRENDEDORES' LIMIT 1), '17:00 a 21:00 hs'),
    COALESCE((SELECT "location" FROM "fair_configs" WHERE "fair_type" = 'EXPO_EMPRENDEDORES' LIMIT 1), 'Plaza Libertad'),
    (SELECT "maps_url" FROM "fair_configs" WHERE "fair_type" = 'EXPO_EMPRENDEDORES' LIMIT 1),
    (SELECT "next_date" FROM "fair_configs" WHERE "fair_type" = 'MERCADO_SANROQUENO' LIMIT 1),
    COALESCE((SELECT "schedule" FROM "fair_configs" WHERE "fair_type" = 'MERCADO_SANROQUENO' LIMIT 1), '08:00 a 13:00 hs'),
    COALESCE((SELECT "location" FROM "fair_configs" WHERE "fair_type" = 'MERCADO_SANROQUENO' LIMIT 1), 'Plaza Libertad'),
    (SELECT "maps_url" FROM "fair_configs" WHERE "fair_type" = 'MERCADO_SANROQUENO' LIMIT 1),
    'Cr. Raúl Pelozo',
    'Intendente de San Roque',
    'La Municipalidad de San Roque brinda únicamente este espacio de difusión publicitaria y no interviene en precios, medios de pago, entregas ni garantías comerciales.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
