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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ComunidadesService } from './comunidades.service';
import {
  CreateComunidadDto,
  UpdateComunidadDto,
  ListComunidadesQuery,
} from './dto/comunidades.dto';

@ApiTags('comunidades')
@Controller('comunidades')
export class ComunidadesController {
  constructor(private readonly service: ComunidadesService) {}

  @Post()
  create(@Body() dto: CreateComunidadDto) {
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComunidadDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
