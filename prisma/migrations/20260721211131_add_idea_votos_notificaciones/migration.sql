-- AlterTable
ALTER TABLE "ideas" ADD COLUMN     "aprobada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "creador_id" INTEGER;

-- CreateTable
CREATE TABLE "idea_votos" (
    "id" SERIAL NOT NULL,
    "idea_id" INTEGER NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_votos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" SERIAL NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "idea_votos_idea_id_cuenta_id_key" ON "idea_votos"("idea_id", "cuenta_id");

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_votos" ADD CONSTRAINT "idea_votos_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_votos" ADD CONSTRAINT "idea_votos_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
