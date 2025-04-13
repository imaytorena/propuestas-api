import { Test, TestingModule } from '@nestjs/testing';
import { PropuestasController } from './propuestas.controller';

describe('PropuestasController', () => {
  let controller: PropuestasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropuestasController],
    }).compile();

    controller = module.get<PropuestasController>(PropuestasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
