import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { Idea } from '@prisma/client';
import { CreateIdeaDto, ListAllEntities, UpdateIdeaDto } from './dto/ideas.dto';

@Injectable()
export class IdeasService {
  constructor(private prisma: PrismaService) {}

  async getAll(q: ListAllEntities): Promise<Idea[] | null> {
    return this.prisma.idea.findMany({
      take: parseInt(q.limit),
    });
  }

  async create(idea: CreateIdeaDto): Promise<Idea> {
    return this.prisma.idea.create({
      data: idea,
    });
  }

  async update(id: number, nuevaIdea: UpdateIdeaDto): Promise<Idea> {
    {
      const idea = await this.prisma.idea.findUnique({
        where: {
          id,
        },
      });
      if (!idea) {
        throw new HttpException('Idea no encontrada', HttpStatus.NOT_FOUND);
      }

      if (idea.contenido === nuevaIdea.contenido) {
        throw new HttpException(
          'El contenido no puede ser igual al actual',
          HttpStatus.BAD_REQUEST,
        );
      }

      const ideaCreated = await this.prisma.idea.update({
        where: {
          id,
        },
        data: {
          contenido: nuevaIdea.contenido,
        },
      });

      // await this.prisma.edicion.create({
      //   data: {
      //     ideaId: id,
      //     contenido: nuevaIdea.contenido,
      //   },
      // });

      return ideaCreated;
    }
  }
}
