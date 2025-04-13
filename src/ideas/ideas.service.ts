import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { Idea } from '@prisma/client';

@Injectable()
export class IdeasService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<Idea[] | null> {
    return this.prisma.idea.findMany();
  }
}
