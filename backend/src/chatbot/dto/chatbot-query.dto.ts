import { IsNotEmpty, IsString } from 'class-validator';

export class ChatbotQueryDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
