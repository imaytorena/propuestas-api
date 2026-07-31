import { Module } from '@nestjs/common';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { DecisionTreeService } from '../../services/decision-tree.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Module({
  controllers: [IdeasController],
  providers: [IdeasService, DecisionTreeService, NotificacionesService],
  exports: [IdeasService],
})
export class IdeasModule {}
