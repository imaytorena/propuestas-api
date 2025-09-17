/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../services/prisma.service';
import * as bcrypt from 'bcryptjs';

export interface JwtPayload {
  sub: number; // cuenta id
  uuid: string;
  identificador: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateCredentials(identifierOrEmail: string, password: string) {
    const cuenta = await this.prisma.cuenta.findFirst({
      where: {
        OR: [
          { identificador: identifierOrEmail },
          { correo: identifierOrEmail },
        ],
      },
    });

    if (!cuenta) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const ok = await bcrypt.compare(password, cuenta.password);
    if (!ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return cuenta;
  }

  async login(identifierOrEmail: string, password: string) {
    const cuenta = await this.validateCredentials(identifierOrEmail, password);

    const payload: JwtPayload = {
      sub: cuenta.id,
      uuid: cuenta.uuid,
      identificador: cuenta.identificador,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      token_type: 'Bearer',
      expires_in: process.env.JWT_EXPIRES_IN || '1d',
      cuenta: {
        id: cuenta.id,
        uuid: cuenta.uuid,
        identificador: cuenta.identificador,
        correo: cuenta.correo,
        usuarioId: cuenta.usuarioId,
        comunidadId: cuenta.comunidadId,
      },
    };
  }
}
