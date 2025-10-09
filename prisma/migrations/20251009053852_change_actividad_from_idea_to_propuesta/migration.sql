/*
  Warnings:

  - You are about to drop the column `idea_id` on the `actividades` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "actividades" DROP CONSTRAINT "actividades_idea_id_fkey";

-- AlterTable
ALTER TABLE "actividades" DROP COLUMN "idea_id",
ADD COLUMN     "propuesta_id" INTEGER;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_propuesta_id_fkey" FOREIGN KEY ("propuesta_id") REFERENCES "propuestas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
