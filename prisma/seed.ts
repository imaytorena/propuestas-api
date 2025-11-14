import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Estado ID for Jalisco (ZMG). Adjust if your DB uses a different convention.
const JALISCO_ESTADO_ID = 14;

// Chunk size for createMany to avoid exceeding parameter limits
const CHUNK_SIZE = 1000;

// Convert various geometry shapes to the expected [{ lat, lng }] array
// function toLatLngArray(
//   geometry: any,
// ): Array<{ lat: number; lng: number }> | null {
//   if (!geometry) return null;
//   try {
//     // If it's already an array of {lat,lng}
//     if (Array.isArray(geometry) && geometry.length > 0) {
//       const first = geometry[0];
//       if (
//         typeof first === 'object' && first != null &&
//         'lat' in first && 'lng' in first
//       ) {
//         return geometry as Array<{ lat: number; lng: number }>;
//       }
//       // If it's an array of [lng,lat]
//       if (Array.isArray(first) && first.length >= 2 &&
//           typeof first[0] === 'number' && typeof first[1] === 'number') {
//         const arr = (geometry as Array<[number, number]>).map((p) => ({
//           lng: p[0],
//           lat: p[1],
//         }));
//         return normalizeRing(arr);
//       }
//     }
//
//     // If it looks like GeoJSON
//     if (typeof geometry === 'object' && geometry.type && geometry.coordinates) {
//       const type = geometry.type;
//       const coords = geometry.coordinates;
//       if (type === 'Polygon' && Array.isArray(coords) && coords.length > 0) {
//         // coords: LinearRings[], take exterior ring
//         const ring = coords[0] as Array<[number, number]>;
//         const arr = ring.map((p) => ({ lng: p[0], lat: p[1] }));
//         return normalizeRing(arr);
//       }
//       if (
//         type === 'MultiPolygon' &&
//         Array.isArray(coords) &&
//         coords.length > 0 &&
//         Array.isArray(coords[0]) &&
//         (coords[0] as any[]).length > 0
//       ) {
//         const ring = (coords[0] as Array<Array<[number, number]>>)[0];
//         const arr = ring.map((p) => ({ lng: p[0], lat: p[1] }));
//         return normalizeRing(arr);
//       }
//     }
//   } catch (e) {
//     // fallthrough
//   }
//   return null;
// }

// function normalizeRing(
//   arr: Array<{ lat: number; lng: number }>,
// ): Array<{ lat: number; lng: number }> {
//   // Remove duplicated closing point if present
//   if (arr.length > 1) {
//     const first = arr[0];
//     const last = arr[arr.length - 1];
//     if (
//       typeof first.lat === 'number' &&
//       typeof first.lng === 'number' &&
//       first.lat === last.lat &&
//       first.lng === last.lng
//     ) {
//       arr = arr.slice(0, arr.length - 1);
//     }
//   }
//   // Basic sanity check for ranges
//   const filtered = arr.filter(
//     (p) =>
//       typeof p.lat === 'number' &&
//       typeof p.lng === 'number' &&
//       p.lat >= -90 &&
//       p.lat <= 90 &&
//       p.lng >= -180 &&
//       p.lng <= 180,
//   );
//   return filtered;
// }

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
  const adminPassword =
    '$2b$10$5bqkl582NrZ4kGo/k.4E.ejPGXpzPbs/KjATfTEjobNEg8DSpil2y'; // NOTE: plain text for seed/demo purposes

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

  // Geometry by key (NOMBRE|municipioId) stored as raw GeoJSON geometry
  const geomByKey = new Map<string, Prisma.InputJsonValue>();

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

    // Store raw GeoJSON geometry by key for Comunidad.poligono
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const rawGeometry = (f as any)['geometry']['coordinates'] ?? null;
    if (rawGeometry) {
      geomByKey.set(key, rawGeometry as unknown as Prisma.InputJsonValue);
    }

    pending.push({
      estadoId: JALISCO_ESTADO_ID,
      municipioId: muni.id,
      cveMunicipio: muni.cve ?? undefined, // schema has default "", so can be omitted
      cve: '', // unknown in source; leave empty string
      nombre,
      // Stop storing raw geometry in Colonia.coordenadas; leave null for migration
      coordenadas: null,
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
    poligono?: Prisma.InputJsonValue;
  }> = [];

  for (const col of colonias) {
    if (!col.id || existingComuByColonia.has(col.id)) continue;
    const muniName = col.municipio?.nombre ?? '';
    const nombre = `${col.nombre}`;
    const descripcion = `${col.nombre}${muniName ? ', ' + muniName : ''}`;
    const key = `${String(col.nombre).trim().toUpperCase()}|${col.municipioId}`;
    const poligono = geomByKey.get(key);
    pendingComus.push({
      cuentaId: adminCuentaFinal.id,
      nombre,
      descripcion,
      coloniaId: col.id,
      creadorId: adminCuentaFinal.id,
      ...(poligono !== undefined ? { poligono } : {}),
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

  // 3b) Backfill poligono for existing Comunidades where null
  let updatedExisting = 0;
  for (let i = 0; i < colonias.length; i += CHUNK_SIZE) {
    const chunk = colonias.slice(i, i + CHUNK_SIZE);
    for (const col of chunk) {
      const key = `${String(col.nombre).trim().toUpperCase()}|${col.municipioId}`;
      const poligono = geomByKey.get(key);
      if (!poligono) continue;
      const res = await prisma.comunidad.updateMany({
        where: { coloniaId: col.id, poligono: { equals: Prisma.DbNull } },
        data: { poligono },
      });
      updatedExisting += res.count;
    }
    console.log(
      `Updated existing comunidades poligono chunk ${i / CHUNK_SIZE + 1}`,
    );
  }
  console.log(
    `Backfilled poligono for existing comunidades: ${updatedExisting}`,
  );

  // 3c-a) Ensure simple string categoria default 'Vecinos' for ZMG comunidades (idempotent)
  const updatedSimpleCat = await prisma.comunidad.updateMany({
    where: { categoria: null, colonia: { estadoId: JALISCO_ESTADO_ID } },
    data: { categoria: 'Vecinos' },
  });
  console.log(
    `Updated comunidades.categoria to 'Vecinos' (simple field): ${updatedSimpleCat.count}`,
  );

  // 3c) Ensure default Categoria "Vecinos" for ZMG comunidades (idempotent)
  const zmgComunidades = await prisma.comunidad.findMany({
    where: {
      colonia: { estadoId: JALISCO_ESTADO_ID },
      categorias: {
        none: { nombre: { equals: 'Vecinos', mode: 'insensitive' } },
      },
    },
    select: { id: true },
  });

  console.log(
    `ZMG comunidades missing 'Vecinos' categoria: ${zmgComunidades.length}`,
  );

  const catData: { nombre: string; comunidadId: number }[] = zmgComunidades.map(
    (c) => ({
      nombre: 'Vecinos',
      comunidadId: c.id,
    }),
  );

  for (let i = 0; i < catData.length; i += CHUNK_SIZE) {
    const chunk = catData.slice(i, i + CHUNK_SIZE);
    if (chunk.length === 0) continue;
    const res = await prisma.categoria.createMany({ data: chunk });
    console.log(
      `Inserted default categorias chunk ${i / CHUNK_SIZE + 1}: ${res.count}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
