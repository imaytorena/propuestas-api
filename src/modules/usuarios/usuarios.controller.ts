import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Prisma, Usuario as UsuarioModel } from '@prisma/client';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard, RequestWithUser } from '../../auth/auth.guard';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async getMe(@Req() req: RequestWithUser): Promise<any> {
    const usuario = await this.usuariosService.getById({ id: req.user.id });
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }
    return usuario;
  }

  @Put('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async updateMe(@Req() req: RequestWithUser, @Body() data: any): Promise<any> {
    return this.usuariosService.updateAccount(req.user.id, data);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async signupUser(
    @Body() data: Prisma.UsuarioCreateInput,
  ): Promise<UsuarioModel> {
    return this.usuariosService.create(data);
  }

  @Get('validate/identificador')
  async validateIdentificador(@Query('identificador') identificador: string) {
    return this.usuariosService.validateIdentificador(identificador);
  }
}
