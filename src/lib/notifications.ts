import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SmsPayload {
  to: string;
  message: string;
}

// ------------------------------------------------------------------------------
// 1. Nodemailer SMTP Adapter (Free - Works with Gmail App Passwords & standard SMTP)
// ------------------------------------------------------------------------------
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

let nodemailerTransporter: Transporter | null = null;

if (smtpUser && smtpPass) {
  if (process.env.GMAIL_USER || (smtpHost && smtpHost.includes("gmail"))) {
    // Zero-config Gmail transport
    nodemailerTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else if (smtpHost) {
    // Standard custom SMTP transport (Brevo, SendGrid, Amazon SES, Mailgun, etc.)
    nodemailerTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }
}

// ------------------------------------------------------------------------------
// 2. Resend API Adapter (Requires custom verified domain)
// ------------------------------------------------------------------------------
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail =
  process.env.EMAIL_FROM ||
  (smtpUser ? `PestPilot <${smtpUser}>` : "PestPilot <notifications@pestpilot.app>");

/**
 * Universal email sender:
 * 1. Checks Nodemailer (SMTP / Gmail) first (free, no domain verification needed)
 * 2. Fallbacks to Resend if configured
 * 3. Fallbacks to simulation logging in dev if neither is set
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  // Option 1: Nodemailer (SMTP / Gmail)
  if (nodemailerTransporter) {
    try {
      const info = await nodemailerTransporter.sendMail({
        from: fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        replyTo: payload.replyTo,
      });
      return { success: true, id: info.messageId };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send email via SMTP";
      console.error("[Nodemailer Error]:", err);
      return { success: false, error: message };
    }
  }

  // Option 2: Resend API
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        replyTo: payload.replyTo,
      });

      if (error) {
        console.error("[Resend Error]:", error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send email via Resend";
      console.error("[Resend Exception]:", err);
      return { success: false, error: message };
    }
  }

  // Fallback: Safe simulation in development logs
  console.info(`[Notification Adapter: Email Simulation (Set GMAIL_USER/GMAIL_PASS or SMTP_USER/SMTP_PASS in .env to send real emails)] To: ${payload.to} | Subject: ${payload.subject}`);
  return { success: true, id: "simulated-email-id" };
}

// ------------------------------------------------------------------------------
// 3. Twilio SMS Adapter (Behind an adapter interface, disabled if keys missing)
// ------------------------------------------------------------------------------
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

export async function sendSms(payload: SmsPayload): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.info(`[Notification Adapter: SMS Disabled] To: ${payload.to} | Message: ${payload.message}`);
    return { success: true, sid: "simulated-sms-id" };
  }

  try {
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const authHeader = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64");

    const formData = new URLSearchParams();
    formData.append("To", payload.to);
    formData.append("From", twilioPhoneNumber);
    formData.append("Body", payload.message);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[Twilio SMS Error]:", data);
      return { success: false, error: data.message || "Twilio request failed" };
    }

    return { success: true, sid: data.sid };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send SMS";
    console.error("[SMS Exception]:", err);
    return { success: false, error: message };
  }
}
