"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { sendEmail, isEmailConfigured } from "@/lib/notifications";

// In-memory verification cache for instantaneous OTP verification
interface PendingOtp {
  code: string;
  expiresAt: number;
  signupData?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

const otpStore = new Map<string, PendingOtp>();

// Helper to generate a random 6-digit numeric OTP code
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to generate a memorable but secure password
function generateSecurePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  let pwd = "Pest-";
  for (let i = 0; i < 7; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

// Helper to extract customer auth metadata from Customer.notes JSON
export interface CustomerAuthMeta {
  _isCustomerMeta: true;
  passwordHash?: string;
  isVerified?: boolean;
  verifiedAt?: string;
  otpCode?: string;
  otpExpiresAt?: number;
  customNotes?: string;
}

function parseCustomerNotes(rawNotes: string | null): {
  meta: Partial<CustomerAuthMeta>;
  textNotes: string;
} {
  if (!rawNotes) return { meta: {}, textNotes: "" };
  try {
    const parsed = JSON.parse(rawNotes);
    if (parsed && typeof parsed === "object" && (parsed._isCustomerMeta || parsed.passwordHash)) {
      return { meta: parsed, textNotes: parsed.customNotes || "" };
    }
  } catch {
    // Plain text notes
  }
  return { meta: {}, textNotes: rawNotes };
}

function serializeCustomerNotes(meta: Partial<CustomerAuthMeta>, textNotes?: string): string {
  return JSON.stringify({
    _isCustomerMeta: true,
    ...meta,
    customNotes: textNotes !== undefined ? textNotes : meta.customNotes || "",
  });
}

/**
 * 1. Request OTP Verification Code (For Sign Up OR Forgot/Instant Login)
 */
export async function requestCustomerOtpAction(params: {
  email: string;
  mode: "login" | "signup";
  signupData?: { firstName: string; lastName: string; phone: string };
}) {
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    if (params.mode === "signup") {
      if (!params.signupData?.firstName || !params.signupData?.lastName) {
        return { success: false, error: "Please provide both First Name and Last Name." };
      }
      if (!params.signupData?.phone) {
        return { success: false, error: "Please provide a valid contact phone number." };
      }
    }

    // Generate 6-digit OTP code (valid for 15 minutes)
    const code = generateOtpCode();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    otpStore.set(cleanEmail, {
      code,
      expiresAt,
      signupData: params.signupData,
    });

    // Also persist in DB if customer already exists
    const existing = await db.customer.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" }, deletedAt: null },
    });

    if (existing) {
      const { meta, textNotes } = parseCustomerNotes(existing.notes);
      meta.otpCode = code;
      meta.otpExpiresAt = expiresAt;
      await db.customer.update({
        where: { id: existing.id },
        data: { notes: serializeCustomerNotes(meta, textNotes) },
      });
    }

    // Check if live email sender is configured (SMTP / Gmail / Resend)
    const emailConfigured = isEmailConfigured();

    // Send Verification Email
    const emailResult = await sendEmail({
      to: cleanEmail,
      subject: `Your PestPilot Customer Verification Code: ${code}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #1b4332; color: #ffffff; padding: 12px 18px; border-radius: 12px; font-weight: 800; font-size: 20px;">
              🛡️ PestPilot
            </div>
            <h2 style="color: #0f172a; margin-top: 16px; font-size: 22px; font-weight: 800;">Verify Your Account</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">
              ${params.mode === "signup" ? "Complete your customer portal registration" : "Sign in securely to your PestPilot Customer Portal"}
            </p>
          </div>

          <div style="background: #f0fdf4; border: 1.5px dashed #22c55e; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #15803d; display: block; margin-bottom: 8px;">
              One-Time Verification Code
            </span>
            <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #166534; font-family: monospace;">
              ${code}
            </div>
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.6; text-align: center;">
            This security code will expire in <strong>15 minutes</strong>. If you did not request this verification code, please ignore this email.
          </p>

          <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
            PestPilot Technologies &bull; Field Service Management &bull; <a href="https://pestpilots.vercel.app" style="color: #1b4332; text-decoration: none; font-weight: 600;">pestpilots.vercel.app</a>
          </div>
        </div>
      `,
    });

    console.log(`[Customer Auth OTP] Sent to ${cleanEmail}: ${code} (Email success: ${emailResult.success})`);

    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error || "Failed to deliver verification code to your email. Please verify your email address.",
      };
    }

    return {
      success: true,
      email: cleanEmail,
      mode: params.mode,
      message: "Verification code sent to your email! Please check your inbox.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send verification code";
    return { success: false, error: msg };
  }
}

/**
 * 2. Verify OTP, Activate Account & Auto-Generate Password
 */
export async function verifyCustomerOtpAction(params: {
  email: string;
  code: string;
  mode: "login" | "signup";
  signupData?: { firstName: string; lastName: string; phone: string };
}) {
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanCode = params.code.trim();

    if (!cleanEmail || !cleanCode) {
      return { success: false, error: "Email and verification code are required." };
    }

    // 1. Check in-memory store
    const pending = otpStore.get(cleanEmail);
    let isValid = false;

    if (pending && pending.code === cleanCode && pending.expiresAt > Date.now()) {
      isValid = true;
    } else {
      // 2. Check DB fallback
      const existing = await db.customer.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" }, deletedAt: null },
      });
      if (existing) {
        const { meta } = parseCustomerNotes(existing.notes);
        if (meta.otpCode === cleanCode && meta.otpExpiresAt && meta.otpExpiresAt > Date.now()) {
          isValid = true;
        }
      }
    }

    if (!isValid) {
      return { success: false, error: "Invalid or expired verification code. Please request a new one." };
    }

    // Clear OTP
    otpStore.delete(cleanEmail);

    // Find default organization
    let defaultOrg = await db.organization.findFirst({ where: { deletedAt: null } });
    if (!defaultOrg) {
      defaultOrg = await db.organization.create({
        data: {
          name: "PestPilot Pro Services",
          slug: "pestpilot-pro",
          email: "support@pestpilot.app",
        },
      });
    }

    // Find or create customer
    let customer = await db.customer.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" }, deletedAt: null },
      include: { properties: true },
    });

    let autoPassword = "";
    let isNewSignup = false;

    if (!customer) {
      isNewSignup = true;
      autoPassword = generateSecurePassword();
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(autoPassword, salt);

      const sData = params.signupData || pending?.signupData || {
        firstName: "Customer",
        lastName: "Client",
        phone: "+1 (555) 000-0000",
      };

      const meta: Partial<CustomerAuthMeta> = {
        _isCustomerMeta: true,
        passwordHash,
        isVerified: true,
        verifiedAt: new Date().toISOString(),
      };

      customer = await db.customer.create({
        data: {
          organizationId: defaultOrg.id,
          firstName: sData.firstName,
          lastName: sData.lastName,
          email: cleanEmail,
          phone: sData.phone,
          notes: serializeCustomerNotes(meta),
        },
        include: { properties: true },
      });
    } else {
      // Existing customer: ensure verified and check if password exists
      const { meta, textNotes } = parseCustomerNotes(customer.notes);
      meta.isVerified = true;
      meta.verifiedAt = meta.verifiedAt || new Date().toISOString();

      // If customer has no password yet, auto-generate one
      if (!meta.passwordHash) {
        autoPassword = generateSecurePassword();
        const salt = await bcrypt.genSalt(10);
        meta.passwordHash = await bcrypt.hash(autoPassword, salt);
      }

      customer = await db.customer.update({
        where: { id: customer.id },
        data: { notes: serializeCustomerNotes(meta, textNotes) },
        include: { properties: true },
      });
    }

    // Send Welcome Email with Auto-Generated Password if one was created
    if (autoPassword) {
      await sendEmail({
        to: cleanEmail,
        subject: `Your PestPilot Login Password & Customer Account Details`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: #1b4332; color: #ffffff; padding: 12px 18px; border-radius: 12px; font-weight: 800; font-size: 20px;">
                🛡️ PestPilot
              </div>
              <h2 style="color: #0f172a; margin-top: 16px; font-size: 22px; font-weight: 800;">Welcome to Your Customer Portal</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">
                Hi ${customer.firstName}, your customer account is now verified and active!
              </p>
            </div>

            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #475569; display: block; margin-bottom: 6px;">
                Your Auto-Generated Login Password
              </span>
              <div style="font-size: 22px; font-weight: 800; color: #0f172a; font-family: monospace; background: #ffffff; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block;">
                ${autoPassword}
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
                You can use this password along with your email (<strong>${cleanEmail}</strong>) to sign in directly at any time.
              </p>
            </div>

            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #065f46;">
              💡 <strong>Tip:</strong> You can change this password or update your service address anytime in your <strong>Portal Settings &rarr; Personal Information</strong>.
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="https://pestpilots.vercel.app/portal" style="display: inline-block; background: #1b4332; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 24px; border-radius: 10px; font-size: 14px;">
                Open Customer Portal &rarr;
              </a>
            </div>

            <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
              PestPilot Technologies &bull; Field Service Management
            </div>
          </div>
        `,
      });
    }

    // Set persistent customer session cookie (30 days)
    const cookieStore = await cookies();
    cookieStore.set("pestpilot_customer_identifier", cleanEmail, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });

    revalidatePath("/portal");

    return {
      success: true,
      customer,
      autoPassword: autoPassword || undefined,
      message: autoPassword
        ? "Account verified! Your auto-generated login password has been sent to your email."
        : "Welcome back! Verification successful.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Verification failed";
    return { success: false, error: msg };
  }
}

/**
 * 3. Customer Sign In via Email & Password
 */
export async function loginCustomerWithPasswordAction(email: string, password: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: "Please enter both your email and password." };
    }

    const customer = await db.customer.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" }, deletedAt: null },
      include: { properties: true },
    });

    if (!customer) {
      return { success: false, error: "No customer account found with this email. Please sign up or request a one-time code." };
    }

    const { meta } = parseCustomerNotes(customer.notes);

    if (!meta.passwordHash) {
      return {
        success: false,
        error: "No password set for this account yet. Please sign in via 'One-Time Verification Code' first.",
      };
    }

    const isMatch = await bcrypt.compare(cleanPassword, meta.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Incorrect password. You can reset it using a One-Time Verification Code." };
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("pestpilot_customer_identifier", cleanEmail, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });

    revalidatePath("/portal");
    return { success: true, customer };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Login failed";
    return { success: false, error: msg };
  }
}

/**
 * 4. Update Customer Profile (Personal Information)
 */
export async function updateCustomerProfileAction(params: {
  customerId: string;
  firstName: string;
  lastName: string;
  phone: string;
}) {
  try {
    const { customerId, firstName, lastName, phone } = params;

    if (!firstName?.trim() || !lastName?.trim()) {
      return { success: false, error: "First Name and Last Name are required." };
    }
    if (!phone?.trim()) {
      return { success: false, error: "Phone number is required." };
    }

    if (!customerId.startsWith("demo-")) {
      await db.customer.update({
        where: { id: customerId },
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        },
      });
    }

    revalidatePath("/portal");
    return { success: true, message: "Profile updated successfully!" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update profile";
    return { success: false, error: msg };
  }
}

/**
 * 5. Update Customer Password
 */
export async function updateCustomerPasswordAction(params: {
  customerId: string;
  currentPassword?: string;
  newPassword: string;
}) {
  try {
    const { customerId, currentPassword, newPassword } = params;

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters long." };
    }

    if (!customerId.startsWith("demo-")) {
      const customer = await db.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        return { success: false, error: "Customer not found." };
      }

      const { meta, textNotes } = parseCustomerNotes(customer.notes);

      // If customer has an existing password, verify current password
      if (meta.passwordHash && currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword.trim(), meta.passwordHash);
        if (!isMatch) {
          return { success: false, error: "Current password is incorrect." };
        }
      }

      const salt = await bcrypt.genSalt(10);
      meta.passwordHash = await bcrypt.hash(newPassword.trim(), salt);

      await db.customer.update({
        where: { id: customerId },
        data: {
          notes: serializeCustomerNotes(meta, textNotes),
        },
      });
    }

    revalidatePath("/portal");
    return { success: true, message: "Password updated successfully!" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update password";
    return { success: false, error: msg };
  }
}

/**
 * 6. Save or Update Customer Address / Property
 */
export async function saveCustomerAddressAction(params: {
  customerId: string;
  propertyId?: string;
  address: string;
  unit?: string;
  city: string;
  state: string;
  postalCode: string;
  gateCode?: string;
}) {
  try {
    const { customerId, propertyId, address, unit, city, state, postalCode, gateCode } = params;

    if (!address?.trim() || !city?.trim() || !state?.trim() || !postalCode?.trim()) {
      return { success: false, error: "Street Address, City, State, and Zip/Postal Code are required." };
    }

    if (!customerId.startsWith("demo-")) {
      const customer = await db.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        return { success: false, error: "Customer not found." };
      }

      if (propertyId) {
        await db.property.update({
          where: { id: propertyId },
          data: {
            address: address.trim(),
            unit: unit?.trim() || null,
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            gateCode: gateCode?.trim() || null,
          },
        });
      } else {
        await db.property.create({
          data: {
            organizationId: customer.organizationId,
            customerId: customer.id,
            address: address.trim(),
            unit: unit?.trim() || null,
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            gateCode: gateCode?.trim() || null,
          },
        });
      }
    }

    revalidatePath("/portal");
    return { success: true, message: "Address saved to your profile successfully!" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save address";
    return { success: false, error: msg };
  }
}

/**
 * 7. One-Click Social Sign-In for Google & Apple
 */
export async function loginCustomerWithSocialAction(params: {
  provider: "google" | "apple";
  email: string;
  name?: string;
  phone?: string;
}) {
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    // Check if customer exists in DB
    let customer = await db.customer.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" }, deletedAt: null },
    });

    if (!customer) {
      // Find default organization to attach customer
      const org = await db.organization.findFirst({
        select: { id: true },
      });

      if (!org) {
        return { success: false, error: "System initialization pending: No company organization found." };
      }

      const rawName = params.name?.trim() || cleanEmail.split("@")[0].replace(/[._-]/g, " ");
      const nameParts = rawName.split(" ").filter(Boolean);
      const firstName = nameParts[0] || (params.provider === "google" ? "Google" : "Apple");
      const lastName = nameParts.slice(1).join(" ") || "User";

      const autoPassword = generateSecurePassword();
      const passwordHash = await bcrypt.hash(autoPassword, 10);

      customer = await db.customer.create({
        data: {
          organizationId: org.id,
          firstName,
          lastName,
          email: cleanEmail,
          phone: params.phone?.trim() || "+1 555-0199",
          notes: serializeCustomerNotes({
            passwordHash,
            isVerified: true,
            verifiedAt: new Date().toISOString(),
            customNotes: `Registered via 1-click ${params.provider.toUpperCase()} Sign-In`,
          }),
        },
      });
    } else {
      // Mark as verified if not already
      const { meta, textNotes } = parseCustomerNotes(customer.notes);
      if (!meta.isVerified) {
        meta.isVerified = true;
        meta.verifiedAt = new Date().toISOString();
        await db.customer.update({
          where: { id: customer.id },
          data: { notes: serializeCustomerNotes(meta, textNotes) },
        });
      }
    }

    // Set persistent customer session cookie (30 days)
    const cookieStore = await cookies();
    cookieStore.set("pestpilot_customer_identifier", cleanEmail, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    revalidatePath("/portal");

    return {
      success: true,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to sign in with social provider";
    return { success: false, error: msg };
  }
}
