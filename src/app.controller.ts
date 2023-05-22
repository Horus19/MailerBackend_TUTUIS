import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { MailService } from './mail/mail.service';
import { BienvenidaDto } from './mail/dto/bienvenida.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('send-welcome-email')
  async sendWelcomeEmail(@Body() bienvenida: BienvenidaDto): Promise<void> {
    await this.mailService.sendWelcomeEmail(bienvenida);
  }
}
