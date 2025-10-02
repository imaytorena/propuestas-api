import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Prisma, Usuario as UsuarioModel } from '@prisma/client';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async signupUser(
    @Body() data: Prisma.UsuarioCreateInput,
  ): Promise<UsuarioModel> {
    return this.usuariosService.create(data);
  }
}
