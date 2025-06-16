import { Module } from '@nestjs/common';
import { PropuestasController } from './propuestas.controller';

@Module({
  controllers: [PropuestasController],
  providers: [],
})
export class PropuestasModule {}
