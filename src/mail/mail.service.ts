import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { BienvenidaDto } from './dto/bienvenida.dto';
import { RabbitMqService } from './rabbit-mq/rabbit-mq.service';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';

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

  async sendForgotPasswordEmail(forgotPasswordDto: ForgotPasswordDto) {
    try {
      await this.mailerService.sendMail({
        from: process.env.MAIL_REMITENTE,
        to: forgotPasswordDto.email,
        subject: 'Recuperación de contraseña',
        template: 'RecuperarPassword',
        context: {
          nombre: forgotPasswordDto.fullName,
          password: forgotPasswordDto.newPassword,
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

    // Subscriber for send-welcome-email queue
    const sendWelcomeEmailQueue = 'send-welcome-email';
    const sendWelcomeEmailRoutingKey = 'send-welcome-email';

    await channel.assertExchange(exchange, 'direct', { durable: true });
    await channel.assertQueue(sendWelcomeEmailQueue, { durable: true });
    await channel.bindQueue(
      sendWelcomeEmailQueue,
      exchange,
      sendWelcomeEmailRoutingKey,
    );

    await channel.consume(sendWelcomeEmailQueue, async (msg) => {
      const content = msg.content.toString();
      const { email, fullName, url_confirmacion } = JSON.parse(content);
      await this.sendWelcomeEmail({ email, fullName, url_confirmacion });
      channel.ack(msg);
    });

    // Subscriber for send-forgot-password-email queue
    const sendForgotPasswordEmailQueue = 'send-forgot-password-email';
    const sendForgotPasswordEmailRoutingKey = 'send-forgot-password-email';

    await channel.assertQueue(sendForgotPasswordEmailQueue, { durable: true });
    await channel.bindQueue(
      sendForgotPasswordEmailQueue,
      exchange,
      sendForgotPasswordEmailRoutingKey,
    );

    await channel.consume(sendForgotPasswordEmailQueue, async (msg) => {
      const content = msg.content.toString();
      const { email, fullName, newPassword } = JSON.parse(content);
      await this.sendForgotPasswordEmail({ email, fullName, newPassword });
      channel.ack(msg);
    });
  }
}
