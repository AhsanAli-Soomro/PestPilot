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

// Resend Email Adapter
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.EMAIL_FROM || "PestPilot <notifications@pestpilot.app>";

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.info(`[Notification Adapter: Email Disabled] To: ${payload.to} | Subject: ${payload.subject}`);
    return { success: true, id: "simulated-email-id" };
  }

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
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[Email Exception]:", err);
    return { success: false, error: message };
  }
}

// Twilio SMS Adapter (Behind an adapter interface, disabled if keys missing)
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

