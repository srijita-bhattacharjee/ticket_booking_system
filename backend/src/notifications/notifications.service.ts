import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private resend: Resend;
  private fromAddress: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY', '');
    this.resend = new Resend(apiKey);

    // Resend free tier: must use onboarding@resend.dev unless you've verified a custom domain
    this.fromAddress = this.configService.get<string>(
      'RESEND_FROM',
      'TicketVerse <onboarding@resend.dev>',
    );

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not set. Email sending will fail. Add it to your .env file.',
      );
    } else {
      this.logger.log(`Resend email service initialized. Sending from: ${this.fromAddress}`);
    }
  }

  async sendTicketEmail(
    toEmail: string,
    userName: string,
    bookingRef: string,
    eventTitle: string,
    eventDate: string,
    seatsList: string[],
    qrDataUrl: string,
  ) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: [toEmail],
        subject: `🎟️ Booking Confirmed: ${eventTitle} [Ref: ${bookingRef}]`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px;">
            <h2 style="color: #38bdf8; text-align: center;">🎟️ Your Booking is Confirmed!</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Your seats are confirmed! Here is your official e-ticket for <strong>${eventTitle}</strong>.</p>

            <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #38bdf8;">
              <p style="margin: 5px 0;"><strong>Booking Ref:</strong> <span style="font-family: monospace; color: #f59e0b;">${bookingRef}</span></p>
              <p style="margin: 5px 0;"><strong>Date &amp; Time:</strong> ${eventDate}</p>
              <p style="margin: 5px 0;"><strong>Seats:</strong> ${seatsList.join(', ')}</p>
            </div>

            <div style="text-align: center; margin: 30px 0; background: #ffffff; padding: 20px; border-radius: 8px;">
              <img src="${qrDataUrl}" alt="QR Ticket" style="width: 200px; height: 200px;" />
              <p style="color: #0f172a; font-size: 12px; margin-top: 10px;">Show this QR code at the venue gate for instant check-in</p>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center;">Thank you for booking with TicketVerse!</p>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send ticket email to ${toEmail}: ${error.message}`);
        return false;
      }

      this.logger.log(`Ticket confirmation email sent to ${toEmail}. MessageId: ${data?.id}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Exception sending ticket email to ${toEmail}: ${err.message}`);
      return false;
    }
  }

  async sendWaitlistOfferEmail(
    toEmail: string,
    userName: string,
    eventTitle: string,
    category: string,
    offerLink: string,
    expiresAt: Date,
  ) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: [toEmail],
        subject: `🎉 Waitlist Offer: A seat opened up for ${eventTitle}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px;">
            <h2 style="color: #a855f7; text-align: center;">🎉 Great News! A Seat is Available!</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <p>A seat has just become available in your requested category (<strong>${category}</strong>) for <strong>${eventTitle}</strong>!</p>

            <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #a855f7;">
              <p style="margin: 5px 0;"><strong>Offer Expires:</strong> ${expiresAt.toLocaleTimeString()} on ${expiresAt.toLocaleDateString()}</p>
              <p style="margin: 5px 0; color: #ef4444;">⏱️ You have 15 minutes to claim this seat before it moves to the next person in queue.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${offerLink}" style="background: #a855f7; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Claim Your Ticket Now</a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center;">This link expires in 15 minutes. Don't miss out!</p>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send waitlist email to ${toEmail}: ${error.message}`);
        return;
      }

      this.logger.log(`Waitlist offer email sent to ${toEmail}. MessageId: ${data?.id}`);
    } catch (err: any) {
      this.logger.error(`Exception sending waitlist email to ${toEmail}: ${err.message}`);
    }
  }

  async sendOtpEmail(toEmail: string, userName: string, otp: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: [toEmail],
        subject: `🔐 Your TicketVerse Verification Code: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px;">
            <h2 style="color: #38bdf8; text-align: center;">🔐 TicketVerse Email Verification</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Thank you for signing up on TicketVerse! Use the code below to verify your email and activate your account:</p>

            <div style="text-align: center; margin: 25px 0; background: #1e293b; padding: 24px; border-radius: 8px; border: 2px dashed #38bdf8;">
              <span style="font-family: monospace; font-size: 36px; font-weight: 900; color: #f59e0b; letter-spacing: 10px;">${otp}</span>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center;">
              This code is valid for <strong>10 minutes</strong>.<br/>
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send OTP email to ${toEmail}: ${error.message}`);
        return false;
      }

      this.logger.log(`OTP verification email sent to ${toEmail}. MessageId: ${data?.id}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Exception sending OTP email to ${toEmail}: ${err.message}`);
      return false;
    }
  }
}
