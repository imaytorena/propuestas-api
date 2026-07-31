import { Controller, Get, Put, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { AuthGuard, RequestWithUser } from '../../auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('notificaciones')
@Controller('notificaciones')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Get()
  getMias(@Req() req: RequestWithUser) {
    return this.service.getMias(req.user.id);
  }

  @Put(':id/leer')
  marcarLeida(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.service.marcarLeida(id, req.user.id);
  }

  @Put('leer-todas')
  marcarTodasLeidas(@Req() req: RequestWithUser) {
    return this.service.marcarTodasLeidas(req.user.id);
  }
}
