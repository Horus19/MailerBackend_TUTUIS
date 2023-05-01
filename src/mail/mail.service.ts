import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { BienvenidaDto } from './dto/bienvenida.dto';
import { RabbitMqService } from './rabbit-mq/rabbit-mq.service';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly rabbitMQService: RabbitMqService,
  ) {
    rabbitMQService.connectToRabbitMQ().then(() => {
      this.setupSubscribers();
    });
  }

  async sendSimpleEmail(sendMailOptions: ISendMailOptions) {
    await this.mailerService.sendMail(sendMailOptions);
  }

  async sendWelcomeEmail(bienvenidaDto: BienvenidaDto) {
    try {
      await this.mailerService.sendMail({
        from: process.env.MAIL_REMITENTE,
        to: bienvenidaDto.email,
        subject: 'Bienvenid@ a Tutuis',
        template: 'Bienvenida',
        context: {
          nombre: bienvenidaDto.fullName,
          url_confirmacion: bienvenidaDto.url_confirmacion,
        },
      });
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e);
    }
  }

  async setupSubscribers() {
    const channel = await this.rabbitMQService.getChannelRef();
    const exchange = 'user.exchange';
    const queue = 'send-welcome-email';
    const routingKey = 'send-welcome-email';

    await channel.assertExchange(exchange, 'direct', { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, routingKey);

    await channel.consume(queue, async (msg) => {
      const content = msg.content.toString();
      const { email, fullName, url_confirmacion } = JSON.parse(content);
      await this.sendWelcomeEmail({ email, fullName, url_confirmacion });
      channel.ack(msg);
    });
  }
}
