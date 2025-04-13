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
import { Idea as IdeaModel } from '.prisma/client';
import { IdeasService } from './ideas.service';
import { CreateIdeaDto, UpdateIdeaDto, ListAllEntities } from './dto/ideas.dto';

@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Get()
  async getIdeas(): Promise<IdeaModel[] | null> {
    return this.ideasService.getAll();
  }

  @Post()
  create(@Body() createIdeaDto: CreateIdeaDto) {
    console.log(createIdeaDto);
    return 'This action adds a new Idea called';
  }

  @Get()
  findAll(@Query() query: ListAllEntities) {
    console.log(query);
    return `This action returns all cats (limit: ${query.limit} items)`;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return `This action returns a #${id} cat`;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateIdeaDto: UpdateIdeaDto) {
    console.log(updateIdeaDto);
    return `This action updates a #${id} cat`;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return `This action removes a #${id} cat`;
  }
}
