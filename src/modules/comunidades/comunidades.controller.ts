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
} from './dto/comunidades.dto';
import { AuthGuard, RequestWithUser } from '../../auth/auth.guard';

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

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
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
