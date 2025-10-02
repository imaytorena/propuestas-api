/*
  Warnings:

  - Added the required column `titulo` to the `ideas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ideas" ADD COLUMN     "titulo" VARCHAR(255) NOT NULL;
