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
import { IdeasService } from './ideas.service';
import {
  CreateIdeaDto,
  UpdateIdeaDto,
  ListAllEntities,
  GeneratePropuestaFromIdeaDto,
} from './dto/ideas.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard, RequestWithUser } from '../../auth/auth.guard';

@ApiTags('ideas')
@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  create(@Body() createIdeaDto: CreateIdeaDto, @Req() req: RequestWithUser) {
    createIdeaDto.creadorId = req.user.id;
    return this.ideasService.create(createIdeaDto);
  }

  @Get()
  findAll(@Query() query: ListAllEntities) {
    return this.ideasService.getAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ideasService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIdeaDto: UpdateIdeaDto,
  ) {
    return this.ideasService.update(id, updateIdeaDto);
  }

  @Post(':id/generar-propuesta')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async generarPropuesta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GeneratePropuestaFromIdeaDto,
    @Req() req: RequestWithUser,
  ) {
    dto.creadorId = req.user.id;
    return this.ideasService.generarPropuesta(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ideasService.remove(id);
  }

  @Post(':id/votar')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  votar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.ideasService.votar(id, req.user.id);
  }

  @Delete(':id/votar')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  desvotar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.ideasService.desvotar(id, req.user.id);
  }

  @Put(':id/archivar')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  archivar(@Param('id', ParseIntPipe) id: number) {
    return this.ideasService.remove(id);
  }
}
