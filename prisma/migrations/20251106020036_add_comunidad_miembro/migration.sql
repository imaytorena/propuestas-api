-- CreateTable
CREATE TABLE "comunidad_miembros" (
    "id" SERIAL NOT NULL,
    "comunidad_id" INTEGER NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "comunidad_miembros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comunidad_miembros_comunidad_id_cuenta_id_key" ON "comunidad_miembros"("comunidad_id", "cuenta_id");

-- AddForeignKey
ALTER TABLE "comunidad_miembros" ADD CONSTRAINT "comunidad_miembros_comunidad_id_fkey" FOREIGN KEY ("comunidad_id") REFERENCES "comunidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunidad_miembros" ADD CONSTRAINT "comunidad_miembros_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
