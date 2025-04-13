import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './services/prisma.service';
import { PropuestasModule } from './propuestas/propuestas.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { IdeasModule } from './ideas/ideas.module';

@Module({
  imports: [UsuariosModule, IdeasModule, PropuestasModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
