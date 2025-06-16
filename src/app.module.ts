import { Module } from '@nestjs/common';
import { IdeasModule, PropuestasModule, UsuariosModule } from './modules';
import { PrismaModule } from './services/prisma.module';
import { ColoniasController } from './modules/colonias/colonias.controller';

@Module({
  imports: [PrismaModule, UsuariosModule, IdeasModule, PropuestasModule],
  controllers: [ColoniasController],
})
export class AppModule {}
