-- CreateEnum
CREATE TYPE "EstadoAsistencia" AS ENUM ('ME_INTERESA', 'ASISTIRE', 'NO_ME_INTERESA');

-- CreateTable
CREATE TABLE "asistentes" (
    "id" SERIAL NOT NULL,
    "propuesta_id" INTEGER NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "estado" "EstadoAsistencia" NOT NULL DEFAULT 'ME_INTERESA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "asistentes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "asistentes" ADD CONSTRAINT "asistentes_propuesta_id_fkey" FOREIGN KEY ("propuesta_id") REFERENCES "propuestas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistentes" ADD CONSTRAINT "asistentes_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
