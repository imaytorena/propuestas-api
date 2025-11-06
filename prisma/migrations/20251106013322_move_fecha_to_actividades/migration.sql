/*
  Warnings:

  - You are about to drop the column `fecha_actividad` on the `propuestas` table. All the data in the column will be lost.
  - You are about to drop the column `hora_actividad` on the `propuestas` table. All the data in the column will be lost.
  - Added the required column `fecha` to the `actividades` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "actividades" ADD COLUMN     "fecha" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "horario" VARCHAR(255);

-- AlterTable
ALTER TABLE "propuestas" DROP COLUMN "fecha_actividad",
DROP COLUMN "hora_actividad";
