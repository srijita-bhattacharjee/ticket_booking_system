import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initTransporter();
  }

  private async initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.ethereal.email');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER', '');
    const pass = this.configService.get<string>('SMTP_PASS', '');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        auth: { user, pass },
      });
    } else {
      // Ethereal test mailer fallback
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log(`Using Ethereal Mailer account: ${testAccount.user}`);
    }
  }

  async sendTicketEmail(toEmail: string, userName: string, bookingRef: string, eventTitle: string, eventDate: string, seatsList: string[], qrDataUrl: string) {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px;">
          <h2 style="color: #38bdf8; text-align: center;">🎟️ Your Booking Confirmation</h2>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your seats are confirmed! Here is your official e-ticket for <strong>${eventTitle}</strong>.</p>
          
          <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #38bdf8;">
            <p style="margin: 5px 0;"><strong>Booking Ref:</strong> <span style="font-family: monospace; color: #f59e0b;">${bookingRef}</span></p>
            <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${eventDate}</p>
            <p style="margin: 5px 0;"><strong>Seats:</strong> ${seatsList.join(', ')}</p>
          </div>

          <div style="text-align: center; margin: 30px 0; background: #ffffff; padding: 20px; border-radius: 8px;">
            <img src="${qrDataUrl}" alt="QR Ticket" style="width: 200px; height: 200px;" />
            <p style="color: #0f172a; font-size: 12px; margin-t: 10px;">Show this QR code at the venue gate for instant check-in</p>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Thank you for booking with Ticket Booking System!</p>
        </div>
      `;

      const info = await this.transporter.sendMail({
        from: '"Ticket Booking System" <no-reply@ticketbooking.com>',
        to: toEmail,
        subject: `Confirmed Ticket: ${eventTitle} [Ref: ${bookingRef}]`,
        html: htmlContent,
      });

      this.logger.log(`Ticket email sent to ${toEmail}. MessageId: ${info.messageId}`);
      if (nodemailer.getTestMessageUrl(info)) {
        this.logger.log(`Preview Email URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      return true;
    } catch (err) {
      this.logger.error(`Failed to send email to ${toEmail}: ${err.message}`);
      return false;
    }
  }

  async sendWaitlistOfferEmail(toEmail: string, userName: string, eventTitle: string, category: string, offerLink: string, expiresAt: Date) {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px;">
          <h2 style="color: #a855f7; text-align: center;">🎉 Great News! A Waitlist Seat is Available!</h2>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>A seat has just become available in your requested category (<strong>${category}</strong>) for <strong>${eventTitle}</strong>!</p>
          
          <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #a855f7;">
            <p style="margin: 5px 0;"><strong>Offer Expires At:</strong> ${expiresAt.toLocaleTimeString()} (${expiresAt.toLocaleDateString()})</p>
            <p style="margin: 5px 0; color: #ef4444;">⏱️ You have 15 minutes to claim this seat before it moves to the next customer in queue.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${offerLink}" style="background: #a855f7; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Claim Your Ticket Now</a>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: '"Ticket Booking System" <no-reply@ticketbooking.com>',
        to: toEmail,
        subject: `🎉 Waitlist Offer: Seat available for ${eventTitle}!`,
        html: htmlContent,
      });

      this.logger.log(`Waitlist offer email sent to ${toEmail}`);
    } catch (err) {
      this.logger.error(`Failed to send waitlist email: ${err.message}`);
    }
  }

  async sendOtpEmail(toEmail: string, userName: string, otp: string) {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px;">
          <h2 style="color: #38bdf8; text-align: center;">🔐 TicketVerse Email Verification</h2>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Thank you for signing up on TicketVerse! Please use the following 6-digit OTP code to verify your email address and activate your account:</p>
          
          <div style="text-align: center; margin: 25px 0; background: #1e293b; padding: 20px; border-radius: 8px; border: 2px dashed #38bdf8;">
            <span style="font-family: monospace; font-size: 32px; font-weight: font-black; color: #f59e0b; letter-spacing: 6px;">${otp}</span>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center;">This OTP is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
        </div>
      `;

      const info = await this.transporter.sendMail({
        from: '"TicketVerse Security" <no-reply@ticketbooking.com>',
        to: toEmail,
        subject: `🔐 TicketVerse Signup Verification OTP: ${otp}`,
        html: htmlContent,
      });

      this.logger.log(`Verification OTP email sent to ${toEmail}. MessageId: ${info.messageId}`);
      if (nodemailer.getTestMessageUrl(info)) {
        this.logger.log(`Preview OTP Email URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send OTP email to ${toEmail}: ${err.message}`);
      return false;
    }
  }
}
