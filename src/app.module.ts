import { IdeasModule, PropuestasModule, UsuariosModule } from './modules';
import { Module } from '@nestjs/common';
import { PrismaModule } from './services/prisma.module';
import { ColoniasController } from './modules/colonias/colonias.controller';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsuariosModule,
    IdeasModule,
    PropuestasModule,
  ],
  controllers: [ColoniasController],
})
export class AppModule {}
