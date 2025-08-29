-- CreateTable
CREATE TABLE "carreras" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "centro_universitario" VARCHAR(255) NOT NULL,

    CONSTRAINT "carreras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "primer_apellido" VARCHAR(255) NOT NULL,
    "segundo_apellido" VARCHAR(255) NOT NULL,
    "nombre_completo" VARCHAR(765) NOT NULL,
    "direccion_id" INTEGER,
    "carrera_id" INTEGER,
    "bio" TEXT,
    "age" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunidades" (
    "id" SERIAL NOT NULL,
    "cuenta_id" INTEGER,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoriaId" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "comunidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas" (
    "id" SERIAL NOT NULL,
    "comunidad_id" INTEGER,
    "usuario_id" INTEGER,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identificador" VARCHAR(32) NOT NULL,
    "correo" VARCHAR(255),
    "codigo" VARCHAR(9),
    "password" VARCHAR(255) NOT NULL,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Direccion" (
    "id" SERIAL NOT NULL,
    "calle" VARCHAR(255),
    "no_ext" VARCHAR(10),
    "no_int" VARCHAR(10),
    "cp" VARCHAR(10),
    "colonia_id" INTEGER,

    CONSTRAINT "Direccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipio" (
    "id" SERIAL NOT NULL,
    "cve" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,

    CONSTRAINT "municipio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colonia" (
    "id" SERIAL NOT NULL,
    "estado_id" INTEGER NOT NULL,
    "municipio_id" INTEGER NOT NULL,
    "cve_municipio" VARCHAR(10) NOT NULL DEFAULT '',
    "cve" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "coordenadas" JSONB,

    CONSTRAINT "colonia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propuestas" (
    "id" SERIAL NOT NULL,
    "categoriaId" INTEGER,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "propuestas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" SERIAL NOT NULL,
    "categoriaId" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ideas" (
    "id" SERIAL NOT NULL,
    "contenido" VARCHAR(255) NOT NULL,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cuenta_id_key" ON "usuarios"("cuenta_id");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_comunidad_id_key" ON "cuentas"("comunidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_usuario_id_key" ON "cuentas"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_identificador_key" ON "cuentas"("identificador");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_correo_key" ON "cuentas"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_codigo_key" ON "cuentas"("codigo");

-- CreateIndex
CREATE INDEX "municipio_cve_idx" ON "municipio"("cve");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_direccion_id_fkey" FOREIGN KEY ("direccion_id") REFERENCES "Direccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunidades" ADD CONSTRAINT "comunidades_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_comunidad_id_fkey" FOREIGN KEY ("comunidad_id") REFERENCES "comunidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Direccion" ADD CONSTRAINT "Direccion_colonia_id_fkey" FOREIGN KEY ("colonia_id") REFERENCES "colonia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colonia" ADD CONSTRAINT "colonia_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propuestas" ADD CONSTRAINT "propuestas_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
