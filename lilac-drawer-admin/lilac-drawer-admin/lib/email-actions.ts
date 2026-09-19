"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { emailCampaigns, newsletterSubscribers, emailSettings, type EmailBlock } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { generateEmailHtml } from "@/lib/email-generator";
import nodemailer from "nodemailer";

export interface SaveCampaignInput {
  id?: number;
  title: string;
  subject: string;
  previewText?: string;
  senderName?: string;
  recipientType?: string;
  blocks: EmailBlock[];
  status?: string;
}

export interface SaveEmailSettingsInput {
  provider: "smtp" | "resend";
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  senderName?: string;
  senderEmail?: string;
  resendApiKey?: string;
}

/**
 * Get safe email settings (excluding plaintext passwords).
 */
export async function getEmailSettingsSafe() {
  await requireAdmin();

  const [settings] = await db.select().from(emailSettings).limit(1);

  if (!settings) {
    return {
      provider: "smtp" as const,
      smtpHost: "smtp.gmail.com",
      smtpPort: 465,
      smtpSecure: true,
      smtpUser: "",
      senderName: "Lilac Drawer",
      senderEmail: "newsletter@lilacdrawer.com",
      hasPassword: false,
      hasResendKey: false,
    };
  }

  return {
    id: settings.id,
    provider: (settings.provider as "smtp" | "resend") || "smtp",
    smtpHost: settings.smtpHost || "smtp.gmail.com",
    smtpPort: settings.smtpPort || 465,
    smtpSecure: settings.smtpSecure ?? true,
    smtpUser: settings.smtpUser || "",
    senderName: settings.senderName || "Lilac Drawer",
    senderEmail: settings.senderEmail || "newsletter@lilacdrawer.com",
    hasPassword: Boolean(settings.smtpPass && settings.smtpPass.trim().length > 0),
    hasResendKey: Boolean(settings.resendApiKey && settings.resendApiKey.trim().length > 0),
  };
}

/**
 * Save or update global email & SMTP settings.
 * If smtpPass is left empty, the existing password in DB is preserved.
 */
export async function saveEmailSettingsAction(input: SaveEmailSettingsInput) {
  await requireAdmin();

  const [existing] = await db.select().from(emailSettings).limit(1);

  const dataToSave: Record<string, any> = {
    provider: input.provider || "smtp",
    smtpHost: input.smtpHost?.trim() || "smtp.gmail.com",
    smtpPort: Number(input.smtpPort) || 465,
    smtpSecure: input.smtpSecure ?? true,
    smtpUser: input.smtpUser?.trim() || "",
    senderName: input.senderName?.trim() || "Lilac Drawer",
    senderEmail: input.senderEmail?.trim() || "newsletter@lilacdrawer.com",
    updatedAt: new Date(),
  };

  // Only update password if a new one was provided
  if (input.smtpPass && input.smtpPass.trim().length > 0) {
    dataToSave.smtpPass = input.smtpPass.trim();
  }

  // Only update Resend API key if provided
  if (input.resendApiKey && input.resendApiKey.trim().length > 0) {
    dataToSave.resendApiKey = input.resendApiKey.trim();
  }

  if (existing) {
    await db
      .update(emailSettings)
      .set(dataToSave)
      .where(eq(emailSettings.id, existing.id));
  } else {
    await db.insert(emailSettings).values({
      ...dataToSave,
      smtpPass: input.smtpPass?.trim() || null,
      resendApiKey: input.resendApiKey?.trim() || null,
    });
  }

  revalidatePath("/newsletter");
  return { success: true, message: "تم حفظ وتحديث إعدادات البريد بنجاح!" };
}

/**
 * Tests SMTP / Resend connection by sending a diagnostic test ping.
 */
export async function testEmailConnectionAction(testRecipient: string) {
  await requireAdmin();

  const cleanRecipient = testRecipient.trim().toLowerCase();
  if (!cleanRecipient || !cleanRecipient.includes("@")) {
    throw new Error("يرجى كتابة عنوان بريد إلكتروني صالح لاستقبال رسالة الفحص.");
  }

  const [settings] = await db.select().from(emailSettings).limit(1);

  if (!settings) {
    throw new Error("لم يتم العثور على إعدادات بريد محفوظة. يرجى حفظ الإعدادات أولاً.");
  }

  const testSubject = "✨ [Lilac Drawer] فحص اتصال خادم البريد بنجاح";
  const testHtml = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #f7f1eb; padding: 30px; text-align: center;">
      <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 20px; padding: 30px; border: 1px solid #eadfd5; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <h2 style="color: #c9a3c6; font-size: 24px; margin-bottom: 10px;">Lilac Drawer</h2>
        <div style="display: inline-block; background-color: #e8f5e9; color: #2e7d32; font-weight: bold; font-size: 13px; padding: 6px 16px; border-radius: 20px; margin-bottom: 16px;">
          ✓ تم فحص وتأكيد الاتصال بنجاح
        </div>
        <p style="color: #4a3842; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          تهانينا! خادم البريد الخاص بك (${settings.provider === 'smtp' ? (settings.smtpHost || 'SMTP') : 'Resend'}) متصل ويعمل بشكل سليم تماماً مع لوحة تحكم خزانة ليلك.
        </p>
        <div style="background-color: #fdfaf7; border: 1px solid #eadfd5; border-radius: 12px; padding: 12px; font-size: 12px; color: #8e7a70; text-align: left;" dir="ltr">
          <strong>Provider:</strong> ${settings.provider}<br>
          <strong>Host:</strong> ${settings.smtpHost || 'N/A'}:${settings.smtpPort || 465}<br>
          <strong>From:</strong> ${settings.senderName} &lt;${settings.senderEmail || settings.smtpUser}&gt;<br>
          <strong>Timestamp:</strong> ${new Date().toISOString()}
        </div>
      </div>
    </div>
  `;

  if (settings.provider === "smtp") {
    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
      throw new Error("بيانات الـ SMTP غير مكتملة (Host, User, أو Password مفقودة).");
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 465,
      secure: settings.smtpSecure ?? (settings.smtpPort === 465),
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify SMTP connection
    await transporter.verify();

    // Send test email
    await transporter.sendMail({
      from: `"${settings.senderName}" <${settings.senderEmail || settings.smtpUser}>`,
      to: cleanRecipient,
      subject: testSubject,
      html: testHtml,
    });

    return {
      success: true,
      message: `تم إرسال رسالة الفحص بنجاح عبر خادم SMTP (${settings.smtpHost}) إلى: ${cleanRecipient}`,
    };
  } else {
    // Resend Provider
    const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("مفتاح Resend API Key غير محدد.");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${settings.senderName} <${settings.senderEmail || "newsletter@lilacdrawer.com"}>`,
        to: cleanRecipient,
        subject: testSubject,
        html: testHtml,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `خطأ في إرسال البريد عبر Resend (كود ${res.status})`);
    }

    return {
      success: true,
      message: `تم إرسال رسالة الفحص بنجاح عبر Resend إلى: ${cleanRecipient}`,
    };
  }
}

/**
 * Saves or updates an email campaign draft/template.
 */
export async function saveEmailCampaign(input: SaveCampaignInput) {
  await requireAdmin();

  const generatedHtml = generateEmailHtml(input.blocks, {
    subject: input.subject,
    previewText: input.previewText,
    siteUrl: process.env.PUBLIC_SITE_URL || "https://lilacdrawer.com",
  });

  if (input.id) {
    const [updated] = await db
      .update(emailCampaigns)
      .set({
        title: input.title || "Untitled Campaign",
        subject: input.subject || "No Subject",
        previewText: input.previewText || null,
        senderName: input.senderName || "Lilac Drawer",
        recipientType: input.recipientType || "all_subscribers",
        blocks: input.blocks,
        htmlContent: generatedHtml,
        status: input.status || "draft",
        updatedAt: new Date(),
      })
      .where(eq(emailCampaigns.id, input.id))
      .returning();

    revalidatePath("/newsletter");
    return { success: true, campaign: updated };
  } else {
    const [created] = await db
      .insert(emailCampaigns)
      .values({
        title: input.title || "Untitled Campaign",
        subject: input.subject || "No Subject",
        previewText: input.previewText || null,
        senderName: input.senderName || "Lilac Drawer",
        recipientType: input.recipientType || "all_subscribers",
        blocks: input.blocks,
        htmlContent: generatedHtml,
        status: input.status || "draft",
      })
      .returning();

    revalidatePath("/newsletter");
    return { success: true, campaign: created };
  }
}

/**
 * Sends a campaign either as a test or to all subscribers.
 * Uses the configured SMTP / Email provider from the database.
 */
export async function sendEmailCampaign(
  campaignId: number,
  options: { testEmail?: string; sendToAll?: boolean } = {}
) {
  await requireAdmin();

  const [campaign] = await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  // Fetch active email settings from DB (or fallback to env)
  const [settings] = await db.select().from(emailSettings).limit(1);

  const provider = settings?.provider || (process.env.RESEND_API_KEY ? "resend" : "smtp");
  const senderName = campaign.senderName || settings?.senderName || "Lilac Drawer";
  const senderEmail = settings?.senderEmail || settings?.smtpUser || "newsletter@lilacdrawer.com";
  const fromHeader = `"${senderName}" <${senderEmail}>`;

  // Ensure HTML is fresh
  const html = campaign.htmlContent || generateEmailHtml(campaign.blocks as EmailBlock[], {
    subject: campaign.subject,
    previewText: campaign.previewText || "",
    siteUrl: process.env.PUBLIC_SITE_URL || "https://lilacdrawer.com",
  });

  // 1. Sending Single Test Email
  if (options.testEmail) {
    const cleanTest = options.testEmail.trim().toLowerCase();

    if (provider === "smtp" && settings?.smtpHost && settings?.smtpUser && settings?.smtpPass) {
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort || 465,
        secure: settings.smtpSecure ?? (settings.smtpPort === 465),
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass,
        },
        tls: { rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from: fromHeader,
        to: cleanTest,
        subject: `[TEST] ${campaign.subject}`,
        html,
      });
    } else if (settings?.resendApiKey || process.env.RESEND_API_KEY) {
      const key = settings?.resendApiKey || process.env.RESEND_API_KEY;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromHeader,
          to: cleanTest,
          subject: `[TEST] ${campaign.subject}`,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Resend test error (${res.status})`);
      }
    } else {
      throw new Error("لم يتم العثور على إعدادات SMTP أو Resend فعالة لإرسال الرسالة. يرجى إعداد بيانات البريد في تبويب الإعدادات.");
    }

    return {
      success: true,
      message: `تم إرسال البريد التجريبي بنجاح إلى: ${cleanTest}`,
      recipientCount: 1,
    };
  }

  // 2. Broadcast to all subscribers
  const subscribers = await db.select({ email: newsletterSubscribers.email }).from(newsletterSubscribers);
  const recipientCount = subscribers.length;

  if (recipientCount === 0) {
    throw new Error("لا يوجد مشتركون مسجلون حالياً لإرسال الحملة إليهم.");
  }

  if (provider === "smtp" && settings?.smtpHost && settings?.smtpUser && settings?.smtpPass) {
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 465,
      secure: settings.smtpSecure ?? (settings.smtpPort === 465),
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
      tls: { rejectUnauthorized: false },
    });

    const emailList = subscribers.map((s) => s.email);

    // Send in chunks of 10 to avoid overwhelming SMTP
    for (let i = 0; i < emailList.length; i += 10) {
      const chunk = emailList.slice(i, i + 10);
      await Promise.all(
        chunk.map((toEmail) =>
          transporter.sendMail({
            from: fromHeader,
            to: toEmail,
            subject: campaign.subject,
            html,
          })
        )
      );
    }
  } else if (settings?.resendApiKey || process.env.RESEND_API_KEY) {
    const key = settings?.resendApiKey || process.env.RESEND_API_KEY;
    const emailList = subscribers.map((s) => s.email);

    for (let i = 0; i < emailList.length; i += 50) {
      const chunk = emailList.slice(i, i + 50);
      await Promise.all(
        chunk.map((toEmail) =>
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromHeader,
              to: toEmail,
              subject: campaign.subject,
              html,
            }),
          })
        )
      );
    }
  } else {
    throw new Error("يرجى ضبط وحفظ بيانات خادم الـ SMTP من تبويب الإعدادات أولاً لتتمكن من إرسال الحملات.");
  }

  // Update campaign in DB as Sent
  await db
    .update(emailCampaigns)
    .set({
      status: "sent",
      sentAt: new Date(),
      recipientCount: recipientCount,
      updatedAt: new Date(),
    })
    .where(eq(emailCampaigns.id, campaignId));

  revalidatePath("/newsletter");

  return {
    success: true,
    message: `تم إرسال الحملة البريدية بنجاح إلى جميع المشتركين (${recipientCount} مشترك)!`,
    recipientCount,
  };
}

/**
 * Delete a campaign.
 */
export async function deleteEmailCampaign(campaignId: number) {
  await requireAdmin();
  await db.delete(emailCampaigns).where(eq(emailCampaigns.id, campaignId));
  revalidatePath("/newsletter");
  return { success: true };
}

/**
 * Duplicate a campaign as a new draft.
 */
export async function duplicateEmailCampaign(campaignId: number) {
  await requireAdmin();

  const [existing] = await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.id, campaignId))
    .limit(1);

  if (!existing) throw new Error("Campaign not found.");

  const [duplicated] = await db
    .insert(emailCampaigns)
    .values({
      title: `${existing.title} (Copy)`,
      subject: existing.subject,
      previewText: existing.previewText,
      senderName: existing.senderName,
      recipientType: existing.recipientType,
      blocks: existing.blocks,
      htmlContent: existing.htmlContent,
      status: "draft",
    })
    .returning();

  revalidatePath("/newsletter");
  return { success: true, campaign: duplicated };
}

/**
 * Delete a subscriber.
 */
export async function deleteSubscriber(id: number) {
  await requireAdmin();
  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
  revalidatePath("/newsletter");
  return { success: true };
}

/**
 * Add a subscriber manually from admin.
 */
export async function addSubscriberAdmin(email: string) {
  await requireAdmin();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Invalid email address.");
  }

  await db
    .insert(newsletterSubscribers)
    .values({
      email: cleanEmail,
    })
    .onConflictDoNothing();

  revalidatePath("/newsletter");
  return { success: true };
}
