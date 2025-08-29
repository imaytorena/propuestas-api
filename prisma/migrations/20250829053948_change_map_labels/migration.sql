/*
  Warnings:

  - You are about to drop the column `categoriaId` on the `actividades` table. All the data in the column will be lost.
  - You are about to drop the column `categoriaId` on the `comunidades` table. All the data in the column will be lost.
  - You are about to drop the column `categoriaId` on the `propuestas` table. All the data in the column will be lost.
  - You are about to drop the `Direccion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `colonia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `municipio` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `cuenta_id` on table `comunidades` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Direccion" DROP CONSTRAINT "Direccion_colonia_id_fkey";

-- DropForeignKey
ALTER TABLE "actividades" DROP CONSTRAINT "actividades_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "colonia" DROP CONSTRAINT "colonia_municipio_id_fkey";

-- DropForeignKey
ALTER TABLE "comunidades" DROP CONSTRAINT "comunidades_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "propuestas" DROP CONSTRAINT "propuestas_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_direccion_id_fkey";

-- AlterTable
ALTER TABLE "actividades" DROP COLUMN "categoriaId";

-- AlterTable
ALTER TABLE "categorias" ADD COLUMN     "actividad_id" INTEGER,
ADD COLUMN     "comunidad_id" INTEGER,
ADD COLUMN     "propuesta_id" INTEGER;

-- AlterTable
ALTER TABLE "comunidades" DROP COLUMN "categoriaId",
ADD COLUMN     "max_representantes" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "min_colaboradores" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "ubicacion_id" INTEGER,
ALTER COLUMN "cuenta_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "propuestas" DROP COLUMN "categoriaId";

-- DropTable
DROP TABLE "Direccion";

-- DropTable
DROP TABLE "colonia";

-- DropTable
DROP TABLE "municipio";

-- CreateTable
CREATE TABLE "direcciones" (
    "id" SERIAL NOT NULL,
    "calle" VARCHAR(255),
    "no_ext" VARCHAR(10),
    "no_int" VARCHAR(10),
    "cp" VARCHAR(10),
    "colonia_id" INTEGER,

    CONSTRAINT "direcciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipios" (
    "id" SERIAL NOT NULL,
    "cve" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colonias" (
    "id" SERIAL NOT NULL,
    "estado_id" INTEGER NOT NULL,
    "municipio_id" INTEGER NOT NULL,
    "cve_municipio" VARCHAR(10) NOT NULL DEFAULT '',
    "cve" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "coordenadas" JSONB,

    CONSTRAINT "colonias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "municipios_cve_idx" ON "municipios"("cve");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_direccion_id_fkey" FOREIGN KEY ("direccion_id") REFERENCES "direcciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunidades" ADD CONSTRAINT "comunidades_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "colonias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcciones" ADD CONSTRAINT "direcciones_colonia_id_fkey" FOREIGN KEY ("colonia_id") REFERENCES "colonias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colonias" ADD CONSTRAINT "colonias_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_comunidad_id_fkey" FOREIGN KEY ("comunidad_id") REFERENCES "comunidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_propuesta_id_fkey" FOREIGN KEY ("propuesta_id") REFERENCES "propuestas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
