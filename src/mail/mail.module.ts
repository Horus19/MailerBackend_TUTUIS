import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { RabbitMqService } from './rabbit-mq/rabbit-mq.service';

@Module({
  providers: [MailService, RabbitMqService],
  exports: [MailService],
})
export class MailModule {}
