import { Module } from '@nestjs/common';
import { ComunidadesController } from './comunidades.controller';
import { ComunidadesService } from './comunidades.service';
import { AuthGuard } from '../../auth/auth.guard';

@Module({
  controllers: [ComunidadesController],
  providers: [ComunidadesService, AuthGuard],
  exports: [ComunidadesService],
})
export class ComunidadesModule {}
