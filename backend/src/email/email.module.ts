import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRoot({
      // Use a simple transport configuration that won't interfere with AWS SES
      transport: {
        jsonTransport: true, // This is a "no-op" transport for fallback
      },
      defaults: {
        from: `"${process.env.APP_NAME || 'Datizmo'}" <${process.env.MAIL_FROM || 'noreply@datizmo.com'}>`,
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {} 