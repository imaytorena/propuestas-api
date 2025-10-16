import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../services/prisma.service';
import { jwtConstants } from './constants';
import * as argon2 from 'argon2';
import { AuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(data: AuthDto): Promise<{
    access_token: string;
    cuenta: {
      id: any;
      identificador: any;
      correo: any;
      usuarioId: any;
      comunidadId: any;
    };
  }> {
    // { identificador: identifier },
    const cuenta = await this.prisma.cuenta.findFirst({
      where: { correo: data.email },
      include: {
        usuario: true,
        comunidad: true,
      },
    });
    if (!cuenta) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const passwordMatches = await argon2.verify(cuenta.password, data.password);

    if (!passwordMatches) {
      throw new BadRequestException(`La contraseña no es válida`);
    }

    const access_token = await this.getTokens(cuenta.id, cuenta.correo ?? '');
    return {
      access_token,
      cuenta: {
        id: cuenta.id,
        identificador: cuenta.identificador,
        correo: cuenta.correo,
        usuarioId: cuenta.usuarioId,
        comunidadId: cuenta.comunidadId,
      },
    };
  }

  async register(data: {
    identificador: string;
    password: string;
    correo?: string | null;
    nombre?: string | null;
    apellido?: string | null;
    usuarioId?: number | null;
    comunidadId?: number | null;
  }) {
    const existing = await this.prisma.cuenta.findFirst({
      where: {
        OR: [
          { identificador: data.identificador },
          ...(data.correo ? [{ correo: data.correo }] : []),
        ],
      },
    });
    if (existing) {
      throw new BadRequestException('Cuenta already exists');
    }

    const cuenta = await this.prisma.cuenta.create({
      data: {
        identificador: data.identificador,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        password: await argon2.hash(data.password),
        correo: data.correo ?? null,
        nombre: data.nombre ?? null,
        apellido: data.apellido ?? null,
        usuario: data.usuarioId
          ? { connect: { id: data.usuarioId } }
          : undefined,
        comunidad: data.comunidadId
          ? { connect: { id: data.comunidadId } }
          : undefined,
      },
    });

    return {
      id: cuenta.id,
      identificador: cuenta.identificador,
      correo: cuenta.correo,
      usuarioId: cuenta.usuarioId,
      comunidadId: cuenta.comunidadId,
    };
  }

  async getTokens(userId: number, username: string) {
    return await this.jwtService.signAsync(
      {
        id: userId,
        username,
      },
      {
        secret: jwtConstants.jwt,
        expiresIn: jwtConstants.expiration,
      },
    );
  }
}
