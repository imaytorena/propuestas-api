import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ActividadesService } from './actividades.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard, RequestWithUser } from '../../auth/auth.guard';

export class CreateActividadDto {
  nombre: string;
  descripcion: string;
  creadorId: number;
  fecha: Date;
  horario?: string;
}

export class UpdateActividadDto {
  nombre?: string;
  descripcion?: string;
  propuestaId?: number;
}

export class ListAllEntities {
  limit?: number;
  page?: number;
  propuestaId?: number;
}

@ApiTags('actividades')
@Controller('actividades')
export class ActividadesController {
  constructor(private readonly actividadesService: ActividadesService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  create(
    @Body() createActividadDto: CreateActividadDto,
    @Req() req: RequestWithUser,
  ) {
    createActividadDto.creadorId = req.user.id;
    return this.actividadesService.create(createActividadDto);
  }

  @Get()
  findAll(@Query() query: ListAllEntities) {
    return this.actividadesService.getAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.actividadesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateActividadDto: UpdateActividadDto,
  ) {
    return this.actividadesService.update(id, updateActividadDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.actividadesService.remove(id);
  }
}
