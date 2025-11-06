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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ComunidadesService } from './comunidades.service';
import {
  CreateComunidadDto,
  UpdateComunidadDto,
  ListComunidadesQuery,
  RecommendComunidadesDto,
} from './dto/comunidades.dto';
import { AuthGuard, RequestWithUser } from '../../auth/auth.guard';
import {
  OptionalAuthGuard,
  RequestMaybeUser,
} from '../../auth/optional-auth.guard';

@ApiTags('comunidades')
@Controller('comunidades')
export class ComunidadesController {
  constructor(private readonly service: ComunidadesService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  create(@Body() dto: CreateComunidadDto, @Req() req: RequestWithUser) {
    // Establecer cuentaId desde el token (el payload.id es el id de la cuenta)
    dto.cuentaId = req.user.id;
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: ListComunidadesQuery) {
    return this.service.getAll(query);
  }

  @Get('paginadas')
  findAllPaginated(@Query() query: ListComunidadesQuery) {
    return this.service.getAllPaginated(query);
  }

  // Public Geo endpoint: GET /comunidades/map
  @Get('map')
  @UseGuards(OptionalAuthGuard)
  getMap(
    @Query('municipioId') municipioId?: string,
    @Query('coloniaId') coloniaId?: string,
    @Query('creadorId') creadorId?: string,
    @Query('nombre') nombre?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('categorias') categorias?: string,
    @Req() req?: RequestMaybeUser,
  ) {
    const parsed = {
      municipioId: municipioId ? parseInt(municipioId, 10) : undefined,
      coloniaId: coloniaId ? parseInt(coloniaId, 10) : undefined,
      creadorId: creadorId ? parseInt(creadorId, 10) : undefined,
      nombre: nombre?.trim() || undefined,
      limit: Math.min(Math.max(parseInt(limit ?? '', 10) || 100, 1), 1000),
      cursorId: cursor ? parseInt(cursor, 10) : undefined,
      categorias: categorias
        ? categorias
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : undefined,
      cuentaId: req?.user?.id,
    } as const;
    return this.service.getMapGeo(parsed);
  }

  @Post('recomendar')
  recommend(@Body() dto: RecommendComunidadesDto) {
    return this.service.recommendByKnn(dto);
  }

  // Unirse a una comunidad
  @Post(':id/unirse')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  join(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.service.join(id, req.user.id);
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req?: RequestMaybeUser,
  ) {
    return this.service.findOne(id, req?.user?.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComunidadDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
