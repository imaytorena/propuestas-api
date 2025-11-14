import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { Comunidad, Prisma } from '@prisma/client';
import {
  CreateComunidadDto,
  ListComunidadesQuery,
  UpdateComunidadDto,
  RecommendComunidadesDto,
} from './dto/comunidades.dto';

@Injectable()
export class ComunidadesService {
  constructor(private prisma: PrismaService) {}

  async join(comunidadId: number, cuentaId: number) {
    // Validar comunidad
    const comunidad = await this.prisma.comunidad.findFirst({
      where: { id: comunidadId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!comunidad) {
      throw new HttpException('Comunidad no encontrada', HttpStatus.NOT_FOUND);
    }

    // Buscar si ya existe relación
    const existing = await this.prisma.comunidadMiembro.findFirst({
      where: { comunidadId, cuentaId },
    });

    if (existing) {
      if (existing.isActive && !existing.deletedAt) {
        throw new HttpException(
          'Ya eres miembro de esta comunidad',
          HttpStatus.CONFLICT,
        );
      }
      // Reactivar membresía
      const reactivated = await this.prisma.comunidadMiembro.update({
        where: { id: existing.id },
        data: { isActive: true, deletedAt: null },
      });
      return { status: 'reactivated', miembro: reactivated };
    }

    const miembro = await this.prisma.comunidadMiembro.create({
      data: { comunidadId, cuentaId },
    });
    return { status: 'created', miembro };
  }

  async getAll(
    q: ListComunidadesQuery,
  ): Promise<{ id: number; nombre: string }[]> {
    //const limit = Math.min(q.limit ?? 10, 100);

    const where: Prisma.ComunidadWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(typeof q.coloniaId === 'number' ? { coloniaId: q.coloniaId } : {}),
      ...(typeof q.creadorId === 'number' ? { creadorId: q.creadorId } : {}),
      ...(q.nombre && q.nombre.trim().length > 0
        ? { nombre: { contains: q.nombre.trim(), mode: 'insensitive' } }
        : {}),
    };

    return this.prisma.comunidad.findMany({
      where,
      //take: limit,
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllPaginated(q: ListComunidadesQuery): Promise<{
    data: { id: number; nombre: string }[];
    meta: { total: number; };
  }> {
    const pageParsed = Number(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion
      (q as unknown as { page?: unknown }).page as unknown as number,
    );

    const where: Prisma.ComunidadWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(typeof q.coloniaId === 'number' ? { coloniaId: q.coloniaId } : {}),
      ...(typeof q.creadorId === 'number' ? { creadorId: q.creadorId } : {}),
      ...(q.nombre && q.nombre.trim().length > 0
        ? { nombre: { contains: q.nombre.trim(), mode: 'insensitive' } }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.comunidad.count({ where }),
      this.prisma.comunidad.findMany({
        where,
        select: { id: true, nombre: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { data, meta: { total } };
  }

  async findOne(id: number, cuentaId?: number): Promise<any> {
    const comunidad = await this.prisma.comunidad.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: {
        miembros: {
          include: {
            cuenta: true,
          },
        },
        colonia: { include: { municipio: true } },
        propuestas: {
          where: { isActive: true, deletedAt: null },
          include: { categorias: true, actividades: true, creador: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!comunidad) {
      throw new HttpException('Comunidad no encontrada', HttpStatus.NOT_FOUND);
    }

    // Flags for UI
    const esCreador =
      typeof cuentaId === 'number' && comunidad.creadorId === cuentaId;
    let esMiembro = false;
    if (typeof cuentaId === 'number') {
      const relacion = await this.prisma.comunidadMiembro.findFirst({
        where: {
          comunidadId: comunidad.id,
          cuentaId,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });
      esMiembro = !!relacion;
    }

    return {
      ...comunidad,
      esCreador,
      esMiembro,
      puedeUnirse: !(esCreador || esMiembro),
      polygon: {
        type: 'Feature' as const,
        properties: {
          id: comunidad.id,
          nombre: comunidad.nombre,
          municipio: comunidad.colonia?.municipio?.nombre,
          coloniaId: comunidad.coloniaId ?? null,
        },
        geometry: {
          type: 'Polygon', // o MultiPolygon, LineString, etcomunidad.
          coordinates: comunidad.poligono as unknown,
        },
      },
    };
  }

  async create(data: CreateComunidadDto): Promise<Comunidad> {
    // Si no se envía explícitamente, usar la misma cuenta como creador
    if (typeof data.creadorId !== 'number' || Number.isNaN(data.creadorId)) {
      data.creadorId = data.cuentaId;
    }
    return this.prisma.comunidad.create({
      data,
    });
  }

  async update(id: number, data: UpdateComunidadDto): Promise<Comunidad> {
    const actual = await this.prisma.comunidad.findUnique({ where: { id } });
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Comunidad no encontrada', HttpStatus.NOT_FOUND);
    }

    if (Object.keys(data).length === 0) {
      return actual;
    }

    return this.prisma.comunidad.update({ where: { id }, data });
  }

  async remove(id: number): Promise<Comunidad> {
    const actual = await this.prisma.comunidad.findUnique({ where: { id } });
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Comunidad no encontrada', HttpStatus.NOT_FOUND);
    }

    return this.prisma.comunidad.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  async getMapGeo(params: {
    limit?: number;
    cursorId?: number;
    municipioId?: number;
    coloniaId?: number;
    creadorId?: number;
    nombre?: string;
    categorias?: string[];
    cuentaId?: number;
  }): Promise<{
    data: {
      type: 'Feature';
      properties: {
        id: number;
        nombre: string;
        municipio: string | undefined;
        coloniaId: number | null;
        categoria?: string | null;
        esCreador?: boolean;
        esMiembro?: boolean;
        puedeUnirse?: boolean;
      };
      geometry: unknown;
    }[];
    nextCursor: string | null;
    hasMore: boolean;
    count: number;
  }> {
    const takeNum = Math.min(Math.max(params.limit ?? 100, 1), 1000);
    const where: Prisma.ComunidadWhereInput = {
      isActive: true,
      deletedAt: null,
      poligono: { not: Prisma.DbNull },
      ...(typeof params.coloniaId === 'number'
        ? { coloniaId: params.coloniaId }
        : {}),
      ...(typeof params.creadorId === 'number'
        ? { creadorId: params.creadorId }
        : {}),
      ...(params.nombre && params.nombre.trim().length > 0
        ? { nombre: { contains: params.nombre.trim(), mode: 'insensitive' } }
        : {}),
      ...(typeof params.municipioId === 'number'
        ? { colonia: { municipioId: params.municipioId } }
        : {}),
      ...(Array.isArray(params.categorias) && params.categorias.length > 0
        ? {
            OR: params.categorias.flatMap((name) => [
              { categoria: { equals: name, mode: 'insensitive' as const } },
              {
                categorias: {
                  some: {
                    nombre: { equals: name, mode: 'insensitive' as const },
                  },
                },
              },
            ]),
          }
        : {}),
    };

    const comunidades = await this.prisma.comunidad.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        coloniaId: true,
        categoria: true,
        creadorId: true,
        poligono: true,
        colonia: { include: { municipio: true } },
      },
      orderBy: { id: 'asc' },
      take: takeNum + 1,
      skip: params.cursorId ? 1 : 0,
      cursor: params.cursorId ? { id: params.cursorId } : undefined,
    });

    const hasMore = comunidades.length > takeNum;
    const items = hasMore ? comunidades.slice(0, takeNum) : comunidades;
    const nextCursor = hasMore ? String(items[items.length - 1].id) : null;

    // Build membership set if cuentaId provided
    let memberSet: Set<number> | null = null;
    if (typeof params.cuentaId === 'number' && items.length > 0) {
      const memberships = await this.prisma.comunidadMiembro.findMany({
        where: {
          cuentaId: params.cuentaId,
          isActive: true,
          deletedAt: null,
          comunidadId: { in: items.map((c) => c.id) },
        },
        select: { comunidadId: true },
      });
      memberSet = new Set<number>(memberships.map((m) => m.comunidadId));
    }

    return {
      data: items.map((c) => {
        const esCreador =
          typeof params.cuentaId === 'number' &&
          c.creadorId === params.cuentaId;
        const esMiembro = memberSet ? memberSet.has(c.id) : false;
        const puedeUnirse =
          typeof params.cuentaId === 'number'
            ? !(esCreador || esMiembro)
            : undefined;
        return {
          type: 'Feature' as const,
          properties: {
            id: c.id,
            nombre: c.nombre,
            municipio: c.colonia?.municipio?.nombre,
            categoria: c.categoria ?? null,
            coloniaId: c.coloniaId ?? null,
            ...(typeof params.cuentaId === 'number'
              ? { esCreador, esMiembro, puedeUnirse }
              : {}),
          },
          geometry: {
            type: 'Polygon', // o MultiPolygon, LineString, etc.
            coordinates: c.poligono as unknown,
          },
        };
      }),
      nextCursor,
      hasMore,
      count: items.length,
    };
  }

  // Recomendaciones KNN por cercanía al centroide del geometry de entrada
  async recommendByKnn(params: RecommendComunidadesDto): Promise<
    {
      id: number;
      nombre: string;
      coloniaId: number | null;
      distKm: number;
      geometry: unknown;
    }[]
  > {
    const kRaw =
      typeof params.k === 'number' && !Number.isNaN(params.k)
        ? Math.floor(params.k)
        : 10;
    const k = Math.max(1, Math.min(kRaw, 100));

    const geometry = (params as any)?.geometry;
    if (!geometry || typeof geometry !== 'object' || !geometry.type) {
      throw new HttpException(
        'geometry (GeoJSON) es requerido',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Helpers locales para centroides y distancia
    type Position = [number, number]; // [lng, lat]

    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const haversineKm = (a: Position, b: Position) => {
      const R = 6371; // km
      const dLat = toRadians(b[1] - a[1]);
      const dLon = toRadians(b[0] - a[0]);
      const lat1 = toRadians(a[1]);
      const lat2 = toRadians(b[1]);
      const sinDLat = Math.sin(dLat / 2);
      const sinDLon = Math.sin(dLon / 2);
      const h =
        sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
      const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
      return R * c;
    };

    const polygonArea = (ring: Position[]): number => {
      // Shoelace formula (expects closed or open ring). Coordinates are [lng, lat].
      let area = 0;
      const n = ring.length;
      if (n < 3) return 0;
      for (let i = 0; i < n; i++) {
        const [x1, y1] = ring[i];
        const [x2, y2] = ring[(i + 1) % n];
        area += x1 * y2 - x2 * y1;
      }
      return Math.abs(area) / 2;
    };

    const centroidOfRing = (ring: Position[]): Position => {
      // Centroid of polygon ring (outer) using area-weighted method
      let x = 0;
      let y = 0;
      let a = 0;
      const n = ring.length;
      for (let i = 0; i < n; i++) {
        const [x1, y1] = ring[i];
        const [x2, y2] = ring[(i + 1) % n];
        const cross = x1 * y2 - x2 * y1;
        a += cross;
        x += (x1 + x2) * cross;
        y += (y1 + y2) * cross;
      }
      a = a / 2;
      if (a === 0) {
        // Fallback: average
        const sum = ring.reduce(
          (acc, p) => [acc[0] + p[0], acc[1] + p[1]] as Position,
          [0, 0] as Position,
        );
        return [sum[0] / n, sum[1] / n];
      }
      return [x / (6 * a), y / (6 * a)];
    };

    const centroidOfPolygon = (coordinates: Position[][]): Position => {
      // Use only the outer ring for centroid
      const outer = coordinates[0];
      return centroidOfRing(outer);
    };

    const centroidOfMultiPolygon = (coordinates: Position[][][]): Position => {
      // Pick the largest area polygon (outer rings only)
      let best: { area: number; c: Position } | null = null;
      for (const poly of coordinates) {
        const outer = poly[0];
        const a = polygonArea(outer);
        const c = centroidOfRing(outer);
        if (!best || a > best.area) {
          best = { area: a, c };
        }
      }
      return best ? best.c : centroidOfRing(coordinates[0][0]);
    };

    const computeCentroid = (geom: any): Position | null => {
      try {
        // Allow both proper GeoJSON objects and raw coordinates arrays
        const t = geom?.type;
        const coords = geom?.coordinates;

        // Case 1: Proper GeoJSON objects
        if (t === 'Point') {
          // GeoJSON point is [lng, lat]
          return Array.isArray(coords) && coords.length >= 2
            ? (coords as Position)
            : null;
        }
        if (t === 'Polygon') {
          return Array.isArray(coords) && Array.isArray(coords[0])
            ? centroidOfPolygon(coords as Position[][])
            : null;
        }
        if (t === 'MultiPolygon') {
          return Array.isArray(coords) && Array.isArray(coords[0])
            ? centroidOfMultiPolygon(coords as Position[][][])
            : null;
        }

        // Case 2: Stored as raw coordinates (no GeoJSON `type`)
        // Detect depth to distinguish Polygon vs MultiPolygon
        if (Array.isArray(geom)) {
          // MultiPolygon: Position[][][] (e.g., [ [ [ [lng,lat], ... ] ] , ...])
          if (
            Array.isArray(geom[0]) &&
            Array.isArray((geom as any)[0][0]) &&
            Array.isArray((geom as any)[0][0][0])
          ) {
            return centroidOfMultiPolygon(geom as Position[][][]);
          }
          // Polygon: Position[][] (e.g., [ [ [lng,lat], ... ] ])
          if (
            Array.isArray(geom[0]) &&
            Array.isArray((geom as any)[0][0]) &&
            typeof (geom as any)[0][0][0] === 'number'
          ) {
            return centroidOfPolygon(geom as Position[][]);
          }
          // Ring-only (rare): Position[] → treat as polygon with single ring
          if (
            Array.isArray(geom[0]) &&
            typeof (geom as any)[0][0] === 'number' &&
            typeof (geom as any)[0][1] === 'number'
          ) {
            return centroidOfRing(geom as Position[]);
          }
        }

        return null;
      } catch {
        return null;
      }
    };

    const inputCentroid = computeCentroid(geometry);
    if (!inputCentroid) {
      throw new HttpException(
        'geometry inválido o no soportado (use Point/Polygon/MultiPolygon)',
        HttpStatus.BAD_REQUEST,
      );
    }

    const where: Prisma.ComunidadWhereInput = {
      isActive: true,
      deletedAt: null,
      poligono: { not: Prisma.DbNull },
      ...(typeof params.coloniaId === 'number'
        ? { coloniaId: params.coloniaId }
        : {}),
      ...(typeof params.creadorId === 'number'
        ? { creadorId: params.creadorId }
        : {}),
      ...(params.categoria
        ? { categoria: { equals: params.categoria, mode: 'insensitive' } }
        : {}),
      ...(typeof params.municipioId === 'number'
        ? { colonia: { municipioId: params.municipioId } }
        : {}),
    };

    const comunidades = await this.prisma.comunidad.findMany({
      where,
      select: { id: true, nombre: true, coloniaId: true, poligono: true },
    });

    const scored = [] as {
      id: number;
      nombre: string;
      coloniaId: number | null;
      distKm: number;
      geometry: unknown;
    }[];
    for (const c of comunidades) {
      const geom = (c as any).poligono;
      if (!geom) continue;
      const cCentroid = computeCentroid(geom);
      if (!cCentroid) continue; // saltar geometrías inválidas
      const distKm = haversineKm(inputCentroid, cCentroid);
      if (!Number.isFinite(distKm)) continue;
      scored.push({
        id: c.id,
        nombre: c.nombre,
        coloniaId: c.coloniaId ?? null,
        distKm,
        geometry: c.poligono as unknown,
      });
    }

    scored.sort((a, b) => a.distKm - b.distKm);
    return scored.slice(0, k);
  }
}
