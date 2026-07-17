import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@infnova.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}