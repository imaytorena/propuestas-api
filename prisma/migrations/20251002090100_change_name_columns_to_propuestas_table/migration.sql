/*
  Warnings:

  - You are about to drop the column `nombre` on the `propuestas` table. All the data in the column will be lost.
  - Added the required column `titulo` to the `propuestas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "propuestas" DROP COLUMN "nombre",
ADD COLUMN     "titulo" VARCHAR(255) NOT NULL;
