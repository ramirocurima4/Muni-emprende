-- AlterTable: agregar username obligatorio con backfill seguro y volver email opcional
ALTER TABLE "users" ADD COLUMN "username" VARCHAR(60);
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

WITH base AS (
  SELECT
    "id",
    COALESCE(
      NULLIF(
        LOWER(REGEXP_REPLACE(SPLIT_PART(COALESCE("email", ''), '@', 1), '[^a-zA-Z0-9._-]+', '', 'g')),
        ''
      ),
      'usuario_' || SUBSTRING("id"::text, 1, 8)
    ) AS raw_username
  FROM "users"
),
dedup AS (
  SELECT
    "id",
    raw_username,
    ROW_NUMBER() OVER (PARTITION BY raw_username ORDER BY "id") AS rn
  FROM base
)
UPDATE "users" u
SET "username" = CASE
  WHEN d.rn = 1 THEN d.raw_username
  ELSE d.raw_username || '_' || d.rn
END
FROM dedup d
WHERE u."id" = d."id" AND u."username" IS NULL;

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
