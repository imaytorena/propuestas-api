import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './services/prisma.service';
import { UsuariosService } from './usuarios/usuarios.service';
import { IdeasService } from './ideas/ideas.service';
import { PropuestasController } from './propuestas/propuestas.controller';
import { UsuariosController } from './usuarios/usuarios.controller';
import { IdeasController } from './ideas/ideas.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
    PropuestasController,
    UsuariosController,
    IdeasController,
  ],
  providers: [AppService, PrismaService, UsuariosService, IdeasService],
})
export class AppModule {}
