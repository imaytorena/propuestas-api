import { Module } from '@nestjs/common';
import { PropuestasController } from './propuestas.controller';
import { PropuestasService } from './propuestas.service';
import { EmailService } from '../../services/email.service';

@Module({
  controllers: [PropuestasController],
  providers: [PropuestasService, EmailService],
  exports: [PropuestasService],
})
export class PropuestasModule {}
