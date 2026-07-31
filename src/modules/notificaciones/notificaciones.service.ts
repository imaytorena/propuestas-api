import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';

@Injectable()
export class NotificacionesService {
  constructor(private prisma: PrismaService) {}

  async getMias(cuentaId: number) {
    return this.prisma.notificacion.findMany({
      where: { cuentaId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async marcarLeida(id: number, cuentaId: number) {
    return this.prisma.notificacion.updateMany({
      where: { id, cuentaId },
      data: { leida: true },
    });
  }

  async marcarTodasLeidas(cuentaId: number) {
    return this.prisma.notificacion.updateMany({
      where: { cuentaId, leida: false },
      data: { leida: true },
    });
  }

  async crear(cuentaId: number, tipo: string, mensaje: string, payload?: object) {
    return this.prisma.notificacion.create({
      data: { cuentaId, tipo, mensaje, payload },
    });
  }
}
