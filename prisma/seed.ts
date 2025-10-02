import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Estado ID for Jalisco (ZMG). Adjust if your DB uses a different convention.
const JALISCO_ESTADO_ID = 14;

// Chunk size for createMany to avoid exceeding parameter limits
const CHUNK_SIZE = 1000;

async function main() {
  const jsonPath = path.resolve(__dirname, 'zmg-colonias.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('zmg-colonias.json not found at', jsonPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw) as {
    type: string;
    features: Array<{
      type: string;
      properties: { municipio: string; nombre: string };
      geometry: unknown;
    }>;
  };

  // 1) Ensure a generic admin Cuenta + Usuario
  const adminIdentificador = 'admin_generico';
  const adminCorreo = 'admin@example.com';
  const adminPassword = 'admin1234'; // NOTE: plain text for seed/demo purposes

  // Create Cuenta first (usuarioId is optional)
  const adminCuenta = await prisma.cuenta.upsert({
    where: { identificador: adminIdentificador },
    update: { correo: adminCorreo },
    create: {
      identificador: adminIdentificador,
      correo: adminCorreo,
      password: adminPassword,
      codigo: 'ADMINGEN',
    },
  });

  // Ensure Usuario exists and links back to the Cuenta via usuario.cuentaId
  // Then update Cuenta.usuarioId to maintain both sides
  const existingUsuario = await prisma.usuario.findFirst({
    where: { cuentaId: adminCuenta.id },
  });
  let adminUsuario = existingUsuario;
  if (!adminUsuario) {
    adminUsuario = await prisma.usuario.create({
      data: {
        cuentaId: adminCuenta.id,
        nombre: 'Admin',
        primerApellido: 'Generico',
        segundoApellido: 'QCI',
        nombreCompleto: 'Admin Generico QCI',
        bio: 'Usuario administrador generico para comunidades por colonia',
        age: 0,
        isActive: true,
      },
    });
  }

  // Link back from Cuenta to Usuario if not already
  if (!adminCuenta.usuarioId || adminCuenta.usuarioId !== adminUsuario.id) {
    await prisma.cuenta.update({
      where: { id: adminCuenta.id },
      data: { usuarioId: adminUsuario.id },
    });
  }

  // 2) Seed Municipios/Colonias from the provided GeoJSON
  // Load municipios from DB and index by nombre (uppercased)
  const municipios = await prisma.municipio.findMany({
    select: { id: true, nombre: true, cve: true },
  });
  const muniByName = new Map<string, { id: number; cve: string | null }>();
  for (const m of municipios) {
    muniByName.set(m.nombre.trim().toUpperCase(), { id: m.id, cve: m.cve });
  }

  // Build a set of existing colonias (nombre + municipioId) to avoid duplicates
  const existingColonias = await prisma.colonia.findMany({
    select: { nombre: true, municipioId: true },
  });
  const existingKeys = new Set(
    existingColonias.map(
      (c) => `${c.nombre.trim().toUpperCase()}|${c.municipioId}`,
    ),
  );

  const pending: Array<{
    estadoId: number;
    municipioId: number;
    cveMunicipio?: string;
    cve: string;
    nombre: string;
    coordenadas: Prisma.InputJsonValue | null;
  }> = [];

  let createdMunicipios = 0;
  let deduped = 0;

  const seenKeys = new Set<string>();

  for (const f of data.features) {
    const nombre = (f.properties?.nombre ?? '').trim();
    const municipioName = (f.properties?.municipio ?? '').trim().toUpperCase();
    if (!nombre || !municipioName) continue;

    let muni = muniByName.get(municipioName);
    if (!muni) {
      const municipioOriginal = (f.properties?.municipio ?? '').trim();
      const created = await prisma.municipio.create({
        data: {
          nombre: municipioOriginal || municipioName,
          cve: '',
        },
        select: { id: true, cve: true },
      });
      muni = { id: created.id, cve: created.cve };
      muniByName.set(municipioName, muni);
      createdMunicipios++;
    }

    const key = `${nombre.toUpperCase()}|${muni.id}`;
    if (seenKeys.has(key) || existingKeys.has(key)) {
      deduped++;
      continue;
    }
    seenKeys.add(key);

    pending.push({
      estadoId: JALISCO_ESTADO_ID,
      municipioId: muni.id,
      cveMunicipio: muni.cve ?? undefined, // schema has default "", so can be omitted
      cve: '', // unknown in source; leave empty string
      nombre,
      coordenadas: f.geometry ?? null,
    });
  }

  console.log(`Prepared ${pending.length} colonias to insert.`);
  console.log(
    'Created missing municipios: ' +
      createdMunicipios +
      '. Deduped colonias: ' +
      deduped +
      '.',
  );

  // Insert in chunks
  let inserted = 0;
  for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
    const chunk = pending.slice(i, i + CHUNK_SIZE);
    if (chunk.length === 0) continue;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const res = await prisma.colonia.createMany({ data: chunk });
    inserted += res.count;
    console.log(`Inserted chunk ${i / CHUNK_SIZE + 1}: ${res.count}`);
  }

  console.log(`Done. Inserted total colonias: ${inserted}`);

  // 3) Seed Comunidades for current Colonias, linking them to the admin Cuenta
  const adminCuentaFinal = await prisma.cuenta.findUnique({
    where: { identificador: adminIdentificador },
  });
  if (!adminCuentaFinal) {
    throw new Error('No se pudo crear/obtener la cuenta admin');
  }

  // Gather existing comunidades per colonia to avoid duplicates
  const existingComus = await prisma.comunidad.findMany({
    select: { coloniaId: true },
  });
  const existingComuByColonia = new Set<number>(
    existingComus
      .map((c) => c.coloniaId!)
      .filter((id): id is number => id != null),
  );

  // Fetch colonias with municipio names for description
  const colonias = await prisma.colonia.findMany({
    include: { municipio: true },
  });

  const pendingComus: Array<{
    cuentaId: number;
    nombre: string;
    descripcion: string;
    coloniaId: number;
    creadorId: number;
  }> = [];

  for (const col of colonias) {
    if (!col.id || existingComuByColonia.has(col.id)) continue;
    const muniName = col.municipio?.nombre ?? '';
    const nombre = `${col.nombre}`;
    const descripcion = `${col.nombre}${muniName ? ', ' + muniName : ''}`;
    pendingComus.push({
      cuentaId: adminCuentaFinal.id,
      nombre,
      descripcion,
      coloniaId: col.id,
      creadorId: adminCuentaFinal.id,
    });
  }

  let insertedComus = 0;
  for (let i = 0; i < pendingComus.length; i += CHUNK_SIZE) {
    const chunk = pendingComus.slice(i, i + CHUNK_SIZE);
    if (chunk.length === 0) continue;
    const res = await prisma.comunidad.createMany({ data: chunk });
    insertedComus += res.count;
    console.log(
      `Inserted comunidades chunk ${i / CHUNK_SIZE + 1}: ${res.count}`,
    );
  }

  console.log(`Done. Inserted total comunidades: ${insertedComus}`);

  await prisma.idea.createMany({
    data: [
      {
        titulo: "Más áreas verdes",
        contenido: "Implementar parques pequeños en terrenos baldíos para dar oxígeno y espacios de recreación."
      },
      {
        titulo: "Iluminación pública eficiente",
        contenido: "Colocar luminarias LED que consuman menos y den mayor seguridad durante la noche."
      },
      {
        titulo: "Banquetas accesibles",
        contenido: "Adaptar las aceras para personas con discapacidad y adultos mayores."
      },
      {
        titulo: "Ciclovías seguras",
        contenido: "Diseñar ciclovías protegidas del tráfico para fomentar el uso de bicicleta."
      },
      {
        titulo: "Árboles en calles principales",
        contenido: "Plantar árboles nativos para sombra, frescura y mejora de la calidad del aire."
      },
      {
        titulo: "Mantenimiento de baches",
        contenido: "Implementar un programa de reparación rápida de baches para mejorar la circulación."
      },
      {
        titulo: "Zonas de juego infantil",
        contenido: "Construir pequeños espacios con juegos seguros para niñas y niños."
      },
      {
        titulo: "Basureros estratégicos",
        contenido: "Colocar contenedores de basura en puntos clave para evitar acumulación en las calles."
      },
      {
        titulo: "Pintura vial clara",
        contenido: "Renovar constantemente la pintura de pasos peatonales y señalización."
      },
      {
        titulo: "Cruces peatonales elevados",
        contenido: "Colocar cruces peatonales elevados en avenidas con alto tráfico para mayor seguridad."
      },
      {
        titulo: "Jardineras comunitarias",
        contenido: "Fomentar que vecinos adopten jardineras con plantas resistentes y decorativas."
      },
      {
        titulo: "Rutas de transporte limpias",
        contenido: "Exigir limpieza y mantenimiento en paradas y unidades de transporte público."
      },
      {
        titulo: "Calles peatonales",
        contenido: "Designar algunas calles del centro como exclusivas para peatones."
      },
      {
        titulo: "Mantenimiento de drenaje",
        contenido: "Evitar inundaciones con limpieza preventiva del alcantarillado."
      },
      {
        titulo: "Estaciones de reciclaje",
        contenido: "Colocar puntos de reciclaje en zonas concurridas para fomentar el cuidado ambiental."
      },
      {
        titulo: "Murales comunitarios",
        contenido: "Impulsar proyectos artísticos en bardas para embellecer y prevenir grafitis."
      },
      {
        titulo: "Rampas en esquinas",
        contenido: "Colocar rampas en cada esquina para accesibilidad universal."
      },
      {
        titulo: "Parquímetros inteligentes",
        contenido: "Instalar parquímetros digitales que fomenten la rotación de estacionamiento."
      },
      {
        titulo: "Cámaras de seguridad",
        contenido: "Incrementar la seguridad en puntos conflictivos con videovigilancia."
      },
      {
        titulo: "Campañas de limpieza",
        contenido: "Organizar jornadas vecinales de limpieza y pintura para fortalecer la comunidad."
      },
    ],
  });

  console.log("✅ Seed de ideas insertado correctamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
