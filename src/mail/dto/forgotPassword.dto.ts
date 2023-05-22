import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsString()
  newPassword: string;
}
