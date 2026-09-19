"use client";

import { useState, useTransition } from "react";
import EmailSandboxBuilder from "@/components/EmailSandboxBuilder";
import EmailSettingsManager from "@/components/EmailSettingsManager";
import type { emailCampaigns, newsletterSubscribers, products, posts, EmailBlock } from "@/db/schema";
import { deleteEmailCampaign, duplicateEmailCampaign, deleteSubscriber, addSubscriberAdmin, type getEmailSettingsSafe } from "@/lib/email-actions";

type Campaign = typeof emailCampaigns.$inferSelect;
type Subscriber = typeof newsletterSubscribers.$inferSelect;
type Product = typeof products.$inferSelect;
type Post = typeof posts.$inferSelect;
type SafeSettings = Awaited<ReturnType<typeof getEmailSettingsSafe>>;

interface Props {
  campaigns: Campaign[];
  subscribers: Subscriber[];
  availableProducts: Product[];
  availablePosts: Post[];
  emailSettings: SafeSettings;
}

export default function NewsletterDashboardClient({
  campaigns,
  subscribers,
  availableProducts,
  availablePosts,
  emailSettings,
}: Props) {
  const [activeTab, setActiveTab] = useState<"builder" | "campaigns" | "subscribers" | "settings">("builder");
  const [selectedCampaignForEdit, setSelectedCampaignForEdit] = useState<Campaign | null>(null);
  const [newSubscriberEmail, setNewSubscriberEmail] = useState("");
  const [searchSubscriber, setSearchSubscriber] = useState("");
  const [isPending, startTransition] = useTransition();
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(searchSubscriber.trim().toLowerCase())
  );

  function handleEditCampaign(camp: Campaign) {
    setSelectedCampaignForEdit(camp);
    setActiveTab("builder");
  }

  function handleNewCampaign() {
    setSelectedCampaignForEdit(null);
    setActiveTab("builder");
  }

  function handleDeleteCampaign(id: number) {
    if (!window.confirm("هل أنت متأكد من حذف هذه الحملة؟")) return;
    startTransition(async () => {
      await deleteEmailCampaign(id);
      setAlertMsg("تم حذف الحملة بنجاح.");
      setTimeout(() => setAlertMsg(null), 3000);
    });
  }

  function handleDuplicateCampaign(id: number) {
    startTransition(async () => {
      await duplicateEmailCampaign(id);
      setAlertMsg("تم تكرار الحملة كمسودة جديدة!");
      setTimeout(() => setAlertMsg(null), 3000);
    });
  }

  function handleDeleteSub(id: number) {
    if (!window.confirm("هل أنت متأكد من حذف هذا المشترك؟")) return;
    startTransition(async () => {
      await deleteSubscriber(id);
      setAlertMsg("تم حذف المشترك.");
      setTimeout(() => setAlertMsg(null), 3000);
    });
  }

  function handleAddSub(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubscriberEmail.trim()) return;
    startTransition(async () => {
      try {
        await addSubscriberAdmin(newSubscriberEmail);
        setNewSubscriberEmail("");
        setAlertMsg("تمت إضافة المشترك بنجاح!");
        setTimeout(() => setAlertMsg(null), 3000);
      } catch (err) {
        alert(err instanceof Error ? err.message : "فشل في إضافة المشترك");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Top Tabs & Navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-border p-2.5 shadow-xs flex-wrap gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleNewCampaign}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "builder"
                ? "bg-purple-deep text-white shadow-xs"
                : "text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
            }`}
          >
            🎨 مُنشئ الرسائل (Sandbox)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("campaigns")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "campaigns"
                ? "bg-purple-deep text-white shadow-xs"
                : "text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
            }`}
          >
            📬 سجل الحملات ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("subscribers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "subscribers"
                ? "bg-purple-deep text-white shadow-xs"
                : "text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
            }`}
          >
            👥 قائمة المشتركين ({subscribers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-purple-deep text-white shadow-xs"
                : "text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
            }`}
          >
            ⚙️ إعدادات الـ SMTP والبريد
          </button>
        </div>

        {activeTab === "campaigns" && (
          <button
            type="button"
            onClick={handleNewCampaign}
            className="px-4 py-2 bg-rose text-white rounded-xl text-xs font-bold shadow-xs hover:bg-purple-deep transition-all cursor-pointer"
          >
            + تصميم حملة جديدة
          </button>
        )}
      </div>

      {alertMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold shadow-2xs">
          ✓ {alertMsg}
        </div>
      )}

      {/* Tab 1: Email Sandbox Visual Builder */}
      {activeTab === "builder" && (
        <EmailSandboxBuilder
          initialCampaign={
            selectedCampaignForEdit
              ? {
                  id: selectedCampaignForEdit.id,
                  title: selectedCampaignForEdit.title,
                  subject: selectedCampaignForEdit.subject,
                  previewText: selectedCampaignForEdit.previewText || undefined,
                  senderName: selectedCampaignForEdit.senderName,
                  blocks: selectedCampaignForEdit.blocks as EmailBlock[],
                  status: selectedCampaignForEdit.status,
                }
              : undefined
          }
          availableProducts={availableProducts}
          availablePosts={availablePosts}
          subscriberCount={subscribers.length}
        />
      )}

      {/* Tab 2: Campaigns History */}
      {activeTab === "campaigns" && (
        <div className="bg-white rounded-3xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-purple-deep">سجل الحملات البريدية المرسلة والمسودات</h2>
              <p className="text-xs text-tan-dark">جميع الرسائل التي تم إنشاؤها وإرسالها للمشتركين عبر لوحة التحكم.</p>
            </div>
            <span className="text-xs font-bold bg-mauve-100 text-purple-deep px-3 py-1 rounded-full">
              إجمالي الحملات: {campaigns.length}
            </span>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-4xl">📬</div>
              <div className="font-bold text-sm text-purple-deep">لا توجد حملات بريدية حتى الآن</div>
              <p className="text-xs text-tan-dark max-w-sm mx-auto">
                ابدأ بإنشاء أول نشرة بريدية باستخدام مُنشئ القوالب وأرسلها فوراً للمشتركين.
              </p>
              <button
                type="button"
                onClick={handleNewCampaign}
                className="px-5 py-2 bg-purple-deep hover:bg-lilac text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-block"
              >
                إنشاء أول حملة الآن
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-tan-dark">
                    <th className="py-3 px-3">عنوان الحملة</th>
                    <th className="py-3 px-3">عنوان الرسالة (Subject)</th>
                    <th className="py-3 px-3">الحالة</th>
                    <th className="py-3 px-3">المستلمون</th>
                    <th className="py-3 px-3">تاريخ الإنشاء / الإرسال</th>
                    <th className="py-3 px-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-mauve-50/50 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-purple-deep">
                        {camp.title}
                      </td>
                      <td className="py-3.5 px-3 text-tan-dark max-w-xs truncate font-medium">
                        {camp.subject}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            camp.status === "sent"
                              ? "bg-emerald-100 text-emerald-800"
                              : camp.status === "scheduled"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-mauve-100 text-purple-deep"
                          }`}
                        >
                          {camp.status === "sent" ? "تم الإرسال ✓" : camp.status === "scheduled" ? "مجدولة" : "مسودة (Draft)"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-tan-dark">
                        {camp.status === "sent" ? `${camp.recipientCount} مشترك` : "—"}
                      </td>
                      <td className="py-3.5 px-3 text-tan font-mono text-[11px]">
                        {camp.sentAt
                          ? new Date(camp.sentAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                          : new Date(camp.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditCampaign(camp)}
                            className="px-2.5 py-1 bg-mauve-50 hover:bg-mauve-100 text-purple-deep rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            تعديل / فتح
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateCampaign(camp.id)}
                            className="px-2 py-1 bg-cream-alt hover:bg-mauve-100 text-tan-dark hover:text-purple-deep rounded-lg text-[11px] transition-colors cursor-pointer"
                            title="تكرار كمسودة جديدة"
                          >
                            ⧉
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCampaign(camp.id)}
                            className="px-2 py-1 bg-rose/10 hover:bg-rose hover:text-white text-rose rounded-lg text-[11px] transition-colors cursor-pointer"
                            title="حذف"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Subscribers Management */}
      {activeTab === "subscribers" && (
        <div className="bg-white rounded-3xl border border-border p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-purple-deep">قائمة المشتركين في النشرة البريدية</h2>
              <p className="text-xs text-tan-dark">
                المستخدمون الذين سجلوا بريدهم الإلكتروني لتلقي التخفيضات ومقالات المدونة ({subscribers.length} مشترك).
              </p>
            </div>

            {/* Quick Add Subscriber Form */}
            <form onSubmit={handleAddSub} className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="subscriber@example.com"
                value={newSubscriberEmail}
                onChange={(e) => setNewSubscriberEmail(e.target.value)}
                className="bg-cream-alt border border-border rounded-xl px-3 py-1.5 text-xs text-purple-deep outline-none focus:border-lilac w-64"
                dir="ltr"
                required
              />
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 bg-purple-deep hover:bg-lilac text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                + إضافة مشترك
              </button>
            </form>
          </div>

          {/* Search Box */}
          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder="🔍 بحث في إيميلات المشتركين..."
              value={searchSubscriber}
              onChange={(e) => setSearchSubscriber(e.target.value)}
              className="bg-cream-alt border border-border rounded-xl px-3.5 py-2 text-xs text-purple-deep outline-none focus:border-lilac max-w-sm w-full"
            />
            <span className="text-xs text-tan-dark">
              يظهر {filteredSubscribers.length} من أصل {subscribers.length}
            </span>
          </div>

          {/* Subscribers Table */}
          {filteredSubscribers.length === 0 ? (
            <div className="text-center py-10 text-xs text-tan-dark">
              لا يوجد مشتركون يطابقون البحث.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-tan-dark">
                    <th className="py-2.5 px-3">البريد الإلكتروني</th>
                    <th className="py-2.5 px-3">المصدر</th>
                    <th className="py-2.5 px-3">تاريخ الاشتراك</th>
                    <th className="py-2.5 px-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredSubscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-mauve-50/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-purple-deep" dir="ltr">
                        {sub.email}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold bg-pink-50 text-rose px-2 py-0.5 rounded-md border border-rose/10 uppercase">
                          {sub.userId ? "عضو مسجل" : "مشترك عام"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-tan font-mono text-[11px]">
                        {new Date(sub.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteSub(sub.id)}
                          className="px-2.5 py-1 bg-rose/10 hover:bg-rose hover:text-white text-rose rounded-lg text-[11px] transition-colors cursor-pointer font-semibold"
                        >
                          إلغاء الاشتراك / حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Email & SMTP Settings */}
      {activeTab === "settings" && (
        <EmailSettingsManager initialSettings={emailSettings} />
      )}
    </div>
  );
}
