import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { Usuario, Prisma } from '@prisma/client';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async getById(
    userWhereUniqueInput: Prisma.UsuarioWhereUniqueInput,
  ): Promise<any> {
    console.log(userWhereUniqueInput.id);
    const cuenta = await this.prisma.cuenta.findUnique({
      where: { id: userWhereUniqueInput.id },
      include: {
        usuario: {
          include: {
            direccion: true,
            carrera: true,
          },
        },
        comunidad: true,
      },
    });

    const asistencias = await this.prisma.asistente.findMany({
      where: { 
        cuentaId: userWhereUniqueInput.id,
        estado: 'ASISTIRE'
      },
      select: { propuestaId: true },
    });

    const propuestaIds = asistencias.map(a => a.propuestaId);

    const propuestas = await this.prisma.propuesta.findMany({
      where: {
        id: { in: propuestaIds },
        isActive: true,
        deletedAt: null,
      },
      orderBy: { fechaActividad: 'asc' },
    });

    return { ...cuenta, propuestasSuscritas: propuestas };
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UsuarioWhereUniqueInput;
    where?: Prisma.UsuarioWhereInput;
    orderBy?: Prisma.UsuarioOrderByWithRelationInput;
  }): Promise<Usuario[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.usuario.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async create(data: Prisma.UsuarioCreateInput): Promise<Usuario> {
    return this.prisma.usuario.create({
      data,
    });
  }

  async update(params: {
    where: Prisma.UsuarioWhereUniqueInput;
    data: Prisma.UsuarioUpdateInput;
  }): Promise<Usuario> {
    const { where, data } = params;
    return this.prisma.usuario.update({
      data,
      where,
    });
  }

  async delete(where: Prisma.UsuarioWhereUniqueInput): Promise<Usuario> {
    return this.prisma.usuario.delete({
      where,
    });
  }

  async updateAccount(id: number, data: any): Promise<any> {
    const { usuario, ...cuentaData } = data;
    
    // Update cuenta
    const updatedCuenta = await this.prisma.cuenta.update({
      where: { id },
      data: cuentaData,
      include: {
        usuario: {
          include: {
            direccion: true,
            carrera: true,
          },
        },
        comunidad: true,
      },
    });

    // Update usuario if provided
    if (usuario && updatedCuenta.usuarioId) {
      await this.prisma.usuario.update({
        where: { id: updatedCuenta.usuarioId },
        data: usuario,
      });
    }

    const cuenta = await this.prisma.cuenta.findUnique({
      where: { id },
      include: {
        usuario: {
          include: {
            direccion: true,
            carrera: true,
          },
        },
        comunidad: true,
      },
    });

    const asistencias = await this.prisma.asistente.findMany({
      where: { 
        cuentaId: id,
        estado: 'ASISTIRE'
      },
      select: { propuestaId: true },
    });

    const propuestaIds = asistencias.map(a => a.propuestaId);

    const propuestas = await this.prisma.propuesta.findMany({
      where: {
        id: { in: propuestaIds },
        isActive: true,
        deletedAt: null,
      },
      orderBy: { fechaActividad: 'asc' },
    });

    return { ...cuenta, propuestasSuscritas: propuestas };
  }
}
