import { db } from "@/db";
import { emailCampaigns, newsletterSubscribers, products, posts } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { getEmailSettingsSafe } from "@/lib/email-actions";
import NewsletterDashboardClient from "./NewsletterDashboardClient";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  await requireAdmin();

  const [campaignsList, subscribersList, availableProducts, availablePosts, emailSettingsData] = await Promise.all([
    db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt)),
    db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)),
    db.select().from(products).limit(40),
    db.select().from(posts).limit(40),
    getEmailSettingsSafe(),
  ]);

  return (
    <NewsletterDashboardClient
      campaigns={campaignsList}
      subscribers={subscribersList}
      availableProducts={availableProducts}
      availablePosts={availablePosts}
      emailSettings={emailSettingsData}
    />
  );
}

