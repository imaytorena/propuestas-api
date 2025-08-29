import { PartialType } from '@nestjs/swagger';

export class CreateIdeaDto {
  contenido: string;
}

export class UpdateIdeaDto extends PartialType(CreateIdeaDto) {}

export class ListAllEntities {
  limit: string;
}
