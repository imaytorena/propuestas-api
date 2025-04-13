import { Body, Controller, Post } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Prisma } from '@prisma/client';
import { Usuario as UserModel } from '.prisma/client';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  async signupUser(
    @Body() data: Prisma.UsuarioCreateInput,
  ): Promise<UserModel> {
    return this.usuariosService.create(data);
  }
}
