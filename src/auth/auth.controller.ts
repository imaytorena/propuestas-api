import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        identifier: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['identifier', 'password'],
    },
  })
  async login(@Body() body): Promise<any> {
    return await this.authService.login(body);
  }

  @Post('register')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        identificador: { type: 'string' },
        password: { type: 'string' },
        correo: { type: 'string', nullable: true },
        usuarioId: { type: 'number', nullable: true },
        comunidadId: { type: 'number', nullable: true },
      },
      required: ['identificador', 'password'],
    },
  })
  async register(
    @Body()
    body: {
      identificador: string;
      password: string;
      correo?: string | null;
      usuarioId?: number | null;
      comunidadId?: number | null;
    },
  ): Promise<any> {
    return await this.authService.register(body);
  }
}
