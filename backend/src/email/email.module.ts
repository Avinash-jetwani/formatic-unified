import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRoot({
      // In development, use a null transport that just logs emails
      transport: process.env.NODE_ENV === 'production' 
        ? {
            host: process.env.MAIL_HOST || 'smtp.example.com',
            port: parseInt(process.env.MAIL_PORT || '587', 10),
            auth: {
              user: process.env.MAIL_USER || 'user',
              pass: process.env.MAIL_PASSWORD || 'password',
            },
          }
        : {
            jsonTransport: true, // This is a "no-op" transport that doesn't actually send emails
          },
      defaults: {
        from: `"Formatic" <${process.env.MAIL_FROM || 'noreply@formatic.com'}>`,
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