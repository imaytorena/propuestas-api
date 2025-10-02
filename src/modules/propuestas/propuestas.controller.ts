import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PropuestasService } from './propuestas.service';
import {
  CreatePropuestaDto,
  ListAllPropuestasQuery,
  UpdatePropuestaDto,
} from './dto/propuestas.dto';
import { AuthGuard } from '../../auth/auth.guard';

@ApiTags('propuestas')
@Controller('propuestas')
export class PropuestasController {
  constructor(private readonly propuestasService: PropuestasService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  create(@Body() dto: CreatePropuestaDto) {
    return this.propuestasService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListAllPropuestasQuery) {
    return this.propuestasService.getAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.propuestasService.findOne(id);
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
}
