/*
  Warnings:

  - You are about to drop the column `ubicacion_id` on the `comunidades` table. All the data in the column will be lost.
  - Added the required column `creador_id` to the `comunidades` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "comunidades" DROP CONSTRAINT "comunidades_ubicacion_id_fkey";

-- AlterTable
ALTER TABLE "comunidades" DROP COLUMN "ubicacion_id",
ADD COLUMN     "colonia_id" INTEGER,
ADD COLUMN     "creador_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "comunidades" ADD CONSTRAINT "comunidades_colonia_id_fkey" FOREIGN KEY ("colonia_id") REFERENCES "colonias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunidades" ADD CONSTRAINT "comunidades_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
