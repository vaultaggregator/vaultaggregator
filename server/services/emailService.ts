import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn('⚠️ SENDGRID_API_KEY not set - email functionality disabled');
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export class EmailService {
  private readonly fromEmail = 'noreply@vault-aggregator.com';
  private readonly toEmail = 'vaultaggregator@protonmail.com';

  async sendContactEmail(data: ContactFormData): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ Cannot send email: SENDGRID_API_KEY not configured');
      return false;
    }

    try {
      console.log(`📧 Sending contact email from ${data.email}`);
      
      const emailContent = {
        to: this.toEmail,
        from: this.fromEmail,
        subject: `Contact Form: Message from ${data.name}`,
        html: this.generateEmailTemplate(data),
        text: this.generatePlainTextEmail(data)
      };

      await mailService.send(emailContent);
      console.log('✅ Contact email sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send contact email:', error);
      return false;
    }
  }

  private generateEmailTemplate(data: ContactFormData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Contact Form Submission</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e293b;">Contact Details</h3>
              <p><strong>Name:</strong> ${this.escapeHtml(data.name)}</p>
              <p><strong>Email:</strong> ${this.escapeHtml(data.email)}</p>
            </div>
            
            <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #1e293b;">Message</h3>
              <p style="white-space: pre-line;">${this.escapeHtml(data.message)}</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
              <p>This email was sent from the Vault Aggregator contact form.</p>
              <p>Timestamp: ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generatePlainTextEmail(data: ContactFormData): string {
    return `
New Contact Form Submission

Contact Details:
Name: ${data.name}
Email: ${data.email}

Message:
${data.message}

---
This email was sent from the Vault Aggregator contact form.
Timestamp: ${new Date().toISOString()}
    `.trim();
  }

  private escapeHtml(text: string): string {
    const div = { innerHTML: text } as any;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}

export const emailService = new EmailService();