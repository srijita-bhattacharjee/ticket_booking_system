import { Controller, Post, Body, Req, Headers } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotQueryDto } from './dto/chatbot-query.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('api/chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('query')
  async handleQuery(
    @Body() dto: ChatbotQueryDto,
    @Headers('authorization') authHeader?: string,
  ) {
    let userId: string | undefined = undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = this.jwtService.decode(token) as { sub?: string; id?: string };
        userId = decoded?.sub || decoded?.id;
      } catch (e) {
        // Ignore invalid token, treat as guest
      }
    }

    return this.chatbotService.handleQuery(dto.message, userId);
  }
}
