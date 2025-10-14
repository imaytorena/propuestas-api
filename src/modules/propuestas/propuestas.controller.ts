import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query, Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PropuestasService } from './propuestas.service';
import {
  CreatePropuestaDto,
  ListAllPropuestasQuery,
  UpdatePropuestaDto,
  CreateAsistenteDto,
  UpdateAsistenteDto,
} from './dto/propuestas.dto';
import { AuthGuard, RequestWithUser } from '../../auth/auth.guard';

@ApiTags('propuestas')
@Controller('propuestas')
export class PropuestasController {
  constructor(private readonly propuestasService: PropuestasService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  create(@Body() dto: CreatePropuestaDto, @Req() req: RequestWithUser) {
    dto.creadorId = req.user.id;

    return this.propuestasService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListAllPropuestasQuery) {
    return this.propuestasService.getAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.propuestasService.findOne(id, req.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePropuestaDto,
  ) {
    return this.propuestasService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.propuestasService.remove(id);
  }

  @Post(':id/asistencia')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  createAsistencia(
    @Param('id', ParseIntPipe) propuestaId: number,
    @Body() dto: CreateAsistenteDto,
    @Req() req: RequestWithUser,
  ) {
    return this.propuestasService.createAsistencia(propuestaId, req.user.id, dto);
  }

  @Put(':id/asistencia')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  updateAsistencia(
    @Param('id', ParseIntPipe) propuestaId: number,
    @Body() dto: UpdateAsistenteDto,
    @Req() req: RequestWithUser,
  ) {
    return this.propuestasService.updateAsistencia(propuestaId, req.user.id, dto);
  }
}
