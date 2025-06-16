import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
} from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { CreateIdeaDto, UpdateIdeaDto, ListAllEntities } from './dto/ideas.dto';

@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post()
  create(@Body() createIdeaDto: CreateIdeaDto) {
    return this.ideasService.create(createIdeaDto);
  }

  @Get()
  findAll(@Query() query: ListAllEntities) {
    query.limit = query.limit ?? 10;
    return this.ideasService.getAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return `This action returns a #${id} idea`;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateIdeaDto: UpdateIdeaDto) {
    return this.ideasService.update(parseInt(id), updateIdeaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return `This action removes a #${id} idea`;
  }
}
