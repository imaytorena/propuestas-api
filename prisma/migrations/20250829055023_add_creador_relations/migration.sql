/*
  Warnings:

  - Added the required column `creador_id` to the `actividades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descripcion` to the `actividades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `actividades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creador_id` to the `propuestas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "actividades" ADD COLUMN     "creador_id" INTEGER NOT NULL,
ADD COLUMN     "descripcion" TEXT NOT NULL,
ADD COLUMN     "nombre" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "ideas" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "propuestas" ADD COLUMN     "creador_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "ediciones" (
    "id" SERIAL NOT NULL,
    "edited_id" INTEGER NOT NULL,
    "edited_table" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "old_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_by" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ediciones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "propuestas" ADD CONSTRAINT "propuestas_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
