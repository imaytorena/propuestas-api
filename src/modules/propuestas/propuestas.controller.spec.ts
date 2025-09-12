import { Test, TestingModule } from '@nestjs/testing';
import { PropuestasController } from './propuestas.controller';
import { PropuestasService } from './propuestas.service';
import { PrismaService } from '../../services/prisma.service';

describe('PropuestasController', () => {
  let controller: PropuestasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropuestasController],
      providers: [PropuestasService, PrismaService],
    }).compile();

    controller = module.get<PropuestasController>(PropuestasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
