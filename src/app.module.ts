import { Module } from '@nestjs/common';
import {
  IdeasModule,
  PropuestasModule,
  UsuariosModule,
  ComunidadesModule,
  ActividadesModule,
} from './modules';
import { PrismaModule } from './services/prisma.module';
import { ColoniasController } from './modules/colonias/colonias.controller';
import { AuthModule } from './auth/auth.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsuariosModule,
    IdeasModule,
    PropuestasModule,
    ComunidadesModule,
    ActividadesModule,
    NotificacionesModule,
  ],
  controllers: [ColoniasController],
})
export class AppModule {}
