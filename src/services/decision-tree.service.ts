import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Umbrales configurables (bajar a 1 para pruebas)
const UMBRAL_CON_COMUNIDAD = 1;   // votos de miembros de la comunidad
const UMBRAL_SIN_COMUNIDAD = 1;   // votos totales si no tiene comunidad
const UMBRAL_EXTERNO = 1;         // votos totales aunque no sean de la comunidad

@Injectable()
export class DecisionTreeService {
  constructor(private prisma: PrismaService) {}

  async evaluar(ideaId: number): Promise<{ aprobada: boolean; razon: string }> {
    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
      include: { votos: true },
    });

    if (!idea) return { aprobada: false, razon: 'Idea no encontrada' };
    if (idea.aprobada) return { aprobada: true, razon: 'Ya aprobada' };

    const totalVotos = idea.votos.length;

    // Rama 1: sin comunidad → necesita UMBRAL_SIN_COMUNIDAD votos totales
    if (!idea.comunidadId) {
      if (totalVotos >= UMBRAL_SIN_COMUNIDAD) {
        return { aprobada: true, razon: `Alcanzó ${totalVotos} votos sin comunidad asignada` };
      }
      return { aprobada: false, razon: `Necesita ${UMBRAL_SIN_COMUNIDAD} votos, tiene ${totalVotos}` };
    }

    // Rama 2: con comunidad → contar votos de miembros de esa comunidad
    const miembroIds = await this.prisma.comunidadMiembro.findMany({
      where: { comunidadId: idea.comunidadId, isActive: true, deletedAt: null },
      select: { cuentaId: true },
    });
    const setMiembros = new Set(miembroIds.map((m) => m.cuentaId));
    const votosMiembros = idea.votos.filter((v) => setMiembros.has(v.cuentaId)).length;

    if (votosMiembros >= UMBRAL_CON_COMUNIDAD) {
      return { aprobada: true, razon: `${votosMiembros} miembros de la comunidad apoyaron la idea` };
    }

    // Rama 3: votos externos suficientes
    if (totalVotos >= UMBRAL_EXTERNO) {
      return { aprobada: true, razon: `Alcanzó ${totalVotos} votos en total` };
    }

    return {
      aprobada: false,
      razon: `${votosMiembros}/${UMBRAL_CON_COMUNIDAD} votos de miembros, ${totalVotos}/${UMBRAL_EXTERNO} totales`,
    };
  }
}
