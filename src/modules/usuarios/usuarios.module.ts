import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { EmailService } from '../../services/email.service';

@Module({
  controllers: [UsuariosController],
  providers: [UsuariosService, EmailService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
