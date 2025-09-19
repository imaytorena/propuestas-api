import { Module } from '@nestjs/common';
import {
  IdeasModule,
  PropuestasModule,
  UsuariosModule,
  ComunidadesModule,
} from './modules';
import { PrismaModule } from './services/prisma.module';
import { ColoniasController } from './modules/colonias/colonias.controller';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsuariosModule,
    IdeasModule,
    PropuestasModule,
    ComunidadesModule,
  ],
  controllers: [ColoniasController],
})
export class AppModule {}
