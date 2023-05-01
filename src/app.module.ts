import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailService } from './mail/mail.service';
import { RabbitMqService } from './mail/rabbit-mq/rabbit-mq.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'email-smtp.us-east-2.amazonaws.com',
        port: 587,
        auth: {
          user: process.env.MAILGUN_USERNAME,
          pass: process.env.MAILGUN_PASSWORD,
        },
      },
      defaults: {
        from: '"NestJS" <sender@example.com>',
      },
      template: {
        dir: __dirname + '/mail/templates/',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, MailService, RabbitMqService],
})
export class AppModule {}
