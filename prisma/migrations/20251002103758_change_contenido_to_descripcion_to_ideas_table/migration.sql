/*
  Warnings:

  - You are about to drop the column `contenido` on the `ideas` table. All the data in the column will be lost.
  - Added the required column `descripcion` to the `ideas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ideas" DROP COLUMN "contenido",
ADD COLUMN     "descripcion" VARCHAR(255) NOT NULL;
