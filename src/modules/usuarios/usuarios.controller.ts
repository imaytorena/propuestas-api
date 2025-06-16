import { Body, Controller, Post } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Prisma, Usuario as UsuarioModel } from '@prisma/client';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  async signupUser(
    @Body() data: Prisma.UsuarioCreateInput,
  ): Promise<UsuarioModel> {
    return this.usuariosService.create(data);
  }
}
