import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'email@email.com',
    required: true,
    type: String,
  })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'password123',
    required: true,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
