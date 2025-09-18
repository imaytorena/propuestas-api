-- AlterTable
ALTER TABLE "actividades" ADD COLUMN     "comunidad_id" INTEGER;

-- AlterTable
ALTER TABLE "ideas" ADD COLUMN     "comunidad_id" INTEGER;

-- AlterTable
ALTER TABLE "propuestas" ADD COLUMN     "comunidad_id" INTEGER;

-- AddForeignKey
ALTER TABLE "propuestas" ADD CONSTRAINT "propuestas_comunidad_id_fkey" FOREIGN KEY ("comunidad_id") REFERENCES "comunidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_comunidad_id_fkey" FOREIGN KEY ("comunidad_id") REFERENCES "comunidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_comunidad_id_fkey" FOREIGN KEY ("comunidad_id") REFERENCES "comunidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;
