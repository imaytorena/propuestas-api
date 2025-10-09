/*
  Warnings:

  - You are about to drop the column `comunidad_id` on the `actividades` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "actividades" DROP CONSTRAINT "actividades_comunidad_id_fkey";

-- AlterTable
ALTER TABLE "actividades" DROP COLUMN "comunidad_id",
ADD COLUMN     "idea_id" INTEGER;

-- AlterTable
ALTER TABLE "propuestas" ADD COLUMN     "fecha_actividad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
