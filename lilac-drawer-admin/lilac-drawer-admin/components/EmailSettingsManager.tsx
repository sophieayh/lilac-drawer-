"use client";

import { useState, useTransition } from "react";
import { saveEmailSettingsAction, testEmailConnectionAction, type SaveEmailSettingsInput } from "@/lib/email-actions";

interface Props {
  initialSettings: {
    id?: number;
    provider: "smtp" | "resend";
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    senderName: string;
    senderEmail: string;
    hasPassword: boolean;
    hasResendKey: boolean;
  };
}

export default function EmailSettingsManager({ initialSettings }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isTesting, startTestTransition] = useTransition();

  const [provider, setProvider] = useState<"smtp" | "resend">(initialSettings.provider || "smtp");
  const [smtpHost, setSmtpHost] = useState(initialSettings.smtpHost || "smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(initialSettings.smtpPort || 465);
  const [smtpSecure, setSmtpSecure] = useState(initialSettings.smtpSecure ?? true);
  const [smtpUser, setSmtpUser] = useState(initialSettings.smtpUser || "");
  const [smtpPass, setSmtpPass] = useState("");
  const [hasPassword, setHasPassword] = useState(initialSettings.hasPassword);

  const [senderName, setSenderName] = useState(initialSettings.senderName || "Lilac Drawer");
  const [senderEmail, setSenderEmail] = useState(initialSettings.senderEmail || "newsletter@lilacdrawer.com");
  const [resendApiKey, setResendApiKey] = useState("");
  const [hasResendKey, setHasResendKey] = useState(initialSettings.hasResendKey);

  const [testRecipient, setTestRecipient] = useState("");
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testStatus, setTestStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Quick Preset Handlers
  function applyPreset(type: "gmail" | "outlook" | "custom") {
    if (type === "gmail") {
      setSmtpHost("smtp.gmail.com");
      setSmtpPort(465);
      setSmtpSecure(true);
    } else if (type === "outlook") {
      setSmtpHost("smtp.office365.com");
      setSmtpPort(587);
      setSmtpSecure(false);
    } else {
      setSmtpHost("mail.lilacdrawer.com");
      setSmtpPort(465);
      setSmtpSecure(true);
    }
  }

  // Save Settings
  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus(null);

    startTransition(async () => {
      try {
        const payload: SaveEmailSettingsInput = {
          provider,
          smtpHost,
          smtpPort: Number(smtpPort),
          smtpSecure,
          smtpUser,
          smtpPass: smtpPass.trim() || undefined,
          senderName,
          senderEmail,
          resendApiKey: resendApiKey.trim() || undefined,
        };

        const res = await saveEmailSettingsAction(payload);
        if (res.success) {
          if (smtpPass.trim()) {
            setHasPassword(true);
            setSmtpPass(""); // Clear password field from DOM after save
          }
          if (resendApiKey.trim()) {
            setHasResendKey(true);
            setResendApiKey("");
          }
          setSaveStatus({ type: "success", text: res.message });
          setTimeout(() => setSaveStatus(null), 4000);
        }
      } catch (err) {
        setSaveStatus({
          type: "error",
          text: err instanceof Error ? err.message : "فشل في حفظ الإعدادات",
        });
      }
    });
  }

  // Test Connection
  function handleTestConnection(e: React.FormEvent) {
    e.preventDefault();
    if (!testRecipient || !testRecipient.includes("@")) {
      setTestStatus({ type: "error", text: "يرجى إدخال عنوان بريد إلكتروني صحيح لتلقي رسالة الفحص." });
      return;
    }

    setTestStatus(null);
    startTestTransition(async () => {
      try {
        const res = await testEmailConnectionAction(testRecipient);
        setTestStatus({ type: "success", text: res.message });
      } catch (err) {
        setTestStatus({
          type: "error",
          text: err instanceof Error ? err.message : "فشل في فحص الاتصال بخادم البريد",
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-border p-5 md:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              SMTP & Email Dispatch Settings
            </span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-purple-deep">
            إعدادات خادم البريد الإلكتروني (SMTP)
          </h2>
          <p className="text-xs text-tan-dark">
            قم بضبط خادم البريد (Gmail أو أي بريد مخصص) لإرسال النشرات البريدية وحملات العروض للمشتركين بأمان تام.
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {saveStatus && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between font-semibold text-xs shadow-sm animate-in fade-in duration-200 ${
            saveStatus.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose/10 border border-rose/30 text-rose"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{saveStatus.type === "success" ? "✓" : "⚠️"}</span>
            <span>{saveStatus.text}</span>
          </div>
          <button type="button" onClick={() => setSaveStatus(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Main Grid (Settings Form + Testing & Guides) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left/Main Column: Settings Form (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-border p-6 shadow-xs space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* 1. Provider Choice */}
            <div>
              <label className="block text-xs font-bold text-purple-deep mb-2">
                مزود خدمة الإرسال (Provider):
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProvider("smtp")}
                  className={`p-3.5 rounded-2xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                    provider === "smtp"
                      ? "border-lilac bg-mauve-50/50 shadow-2xs text-purple-deep ring-2 ring-lilac/30"
                      : "border-border hover:bg-cream-alt text-tan-dark"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">خادم SMTP مخصص / Gmail</div>
                    <div className="text-[11px] text-tan-dark mt-0.5">مناسب لبريد Google Workspace و Gmail و cPanel</div>
                  </div>
                  <span className="text-lg">📧</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider("resend")}
                  className={`p-3.5 rounded-2xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                    provider === "resend"
                      ? "border-lilac bg-mauve-50/50 shadow-2xs text-purple-deep ring-2 ring-lilac/30"
                      : "border-border hover:bg-cream-alt text-tan-dark"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">Resend API</div>
                    <div className="text-[11px] text-tan-dark mt-0.5">عبر مفتاح API Key السحابي (resend.com)</div>
                  </div>
                  <span className="text-lg">⚡</span>
                </button>
              </div>
            </div>

            {/* 2. SMTP Settings Fields (If SMTP Provider) */}
            {provider === "smtp" ? (
              <div className="space-y-4 pt-2 border-t border-border/70">
                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-purple-deep">قوالب خوادم جاهزة:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset("gmail")}
                    className="px-2.5 py-1 bg-mauve-50 hover:bg-mauve-100 text-purple-deep rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Google / Gmail
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("outlook")}
                    className="px-2.5 py-1 bg-mauve-50 hover:bg-mauve-100 text-purple-deep rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Outlook / Office 365
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("custom")}
                    className="px-2.5 py-1 bg-mauve-50 hover:bg-mauve-100 text-purple-deep rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    نطاق خاص (Custom Domain)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* SMTP Host */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-purple-deep mb-1">
                      عنوان خادم الـ SMTP (Host):
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="e.g. smtp.gmail.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full bg-cream-alt border border-border rounded-xl px-3.5 py-2.5 text-xs text-purple-deep font-mono outline-none focus:border-lilac"
                      required
                    />
                  </div>

                  {/* SMTP Port */}
                  <div>
                    <label className="block text-xs font-bold text-purple-deep mb-1">
                      المنفذ (Port):
                    </label>
                    <input
                      type="number"
                      dir="ltr"
                      placeholder="465"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      className="w-full bg-cream-alt border border-border rounded-xl px-3.5 py-2.5 text-xs text-purple-deep font-mono outline-none focus:border-lilac"
                      required
                    />
                  </div>
                </div>

                {/* Encryption / Security Toggle */}
                <div className="p-3 bg-mauve-50/40 rounded-xl border border-border/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-deep">نوع الاتصال والتشفير (SSL/TLS):</div>
                    <div className="text-[11px] text-tan-dark">موصى به (تفعيل مع منفذ 465، وإلغاء التفعيل مع منفذ 587 STARTTLS)</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSmtpSecure(!smtpSecure)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      smtpSecure
                        ? "bg-purple-deep text-white shadow-2xs"
                        : "bg-white text-tan-dark border border-border"
                    }`}
                  >
                    {smtpSecure ? "SSL مشفر (Secure)" : "STARTTLS"}
                  </button>
                </div>

                {/* SMTP Username / Email */}
                <div>
                  <label className="block text-xs font-bold text-purple-deep mb-1">
                    اسم المستخدم / البريد الإلكتروني (Username / Email):
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="your-account@gmail.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full bg-cream-alt border border-border rounded-xl px-3.5 py-2.5 text-xs text-purple-deep font-mono outline-none focus:border-lilac"
                    required
                  />
                </div>

                {/* SMTP Password (SECURE: WRITE-ONLY, NEVER DISPLAYED) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-deep">
                      كلمة مرور البريد / كلمة مرور التطبيق (App Password):
                    </label>
                    {hasPassword && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        🔒 كلمة المرور محفوظة ومحمية
                      </span>
                    )}
                  </div>
                  
                  <input
                    type="password"
                    dir="ltr"
                    placeholder={
                      hasPassword
                        ? "•••••••••••••••• (اترك هذا الحقل فارغاً للاحتفاظ بكلمة المرور الحالية)"
                        : "أدخل كلمة مرور التطبيق (16 حرفاً بدون مسافات)"
                    }
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full bg-cream-alt border border-border rounded-xl px-3.5 py-2.5 text-xs text-purple-deep font-mono outline-none focus:border-lilac tracking-wider"
                  />
                  <p className="text-[11px] text-tan-dark">
                    🛡️ <strong className="text-purple-deep">حماية وأمان:</strong> كلمة المرور يتم تشفيرها وحفظها في قاعدة البيانات ولا يتم إرسالها أو عرضها إطلاقاً في المتصفح.
                  </p>
                </div>
              </div>
            ) : (
              /* Resend API Key Field */
              <div className="space-y-3 pt-2 border-t border-border/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-deep">
                    مفتاح Resend API Key:
                  </label>
                  {hasResendKey && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      🔒 المفتاح محفوظ
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  dir="ltr"
                  placeholder={
                    hasResendKey
                      ? "•••••••••••••••••••• (اترك فارغاً للاحتفاظ بالمفتاح الحالي)"
                      : "re_123456789abcdef..."
                  }
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  className="w-full bg-cream-alt border border-border rounded-xl px-3.5 py-2.5 text-xs text-purple-deep font-mono outline-none focus:border-lilac"
                />
              </div>
            )}

            {/* 3. Sender Information */}
            <div className="pt-4 border-t border-border/70 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-purple-deep">
                بيانات المرسل الافتراضية (Sender Profile)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-purple-deep mb-1">
                    اسم المرسل الذي يظهر للمشترك:
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full bg-cream-alt border border-border rounded-xl px-3.5 py-2.5 text-xs text-purple-deep outline-none focus:border-lilac"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-deep mb-1">
                    بريد الإرسال (From Email):
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full bg-cream-alt border border-border rounded-xl px-3.5 py-2.5 text-xs text-purple-deep outline-none focus:border-lilac"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Save Button */}
            <div className="pt-3 flex items-center justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 bg-rose hover:bg-purple-deep text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? (
                  <span>جاري حفظ وتحديث الإعدادات...</span>
                ) : (
                  <>
                    <span>💾 حفظ وتفعيل الإعدادات</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Connection Tester & Gmail Helper Guide (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Connection Test Card */}
          <div className="bg-white rounded-3xl border border-border p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-purple-deep">
                فحص الاتصال الفوري (Live Test)
              </h3>
            </div>
            
            <p className="text-[11px] text-tan-dark leading-relaxed">
              أدخل بريدك الإلكتروني الشخصي للتحقق من أن بيانات الـ SMTP تعمل بنجاح وقادرة على إرسال البريد.
            </p>

            <form onSubmit={handleTestConnection} className="space-y-3">
              <div>
                <input
                  type="email"
                  dir="ltr"
                  placeholder="your-personal@email.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full bg-cream-alt border border-border rounded-xl px-3.5 py-2 text-xs text-purple-deep outline-none focus:border-lilac"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isTesting}
                className="w-full py-2.5 bg-purple-deep hover:bg-lilac text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isTesting ? "جاري الاتصال وإرسال الفحص..." : "🚀 فحص الاتصال وإرسال تجربة"}
              </button>
            </form>

            {/* Test Result Message */}
            {testStatus && (
              <div
                className={`p-3 rounded-xl text-[11px] font-semibold leading-relaxed animate-in fade-in ${
                  testStatus.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-rose/10 border border-rose/30 text-rose"
                }`}
              >
                <div className="flex items-start gap-1.5">
                  <span>{testStatus.type === "success" ? "✓" : "✕"}</span>
                  <span>{testStatus.text}</span>
                </div>
              </div>
            )}
          </div>

          {/* Guide Card: How to get Gmail App Password */}
          <div className="bg-pink-50/50 rounded-3xl border border-rose/20 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">💡</span>
                <h4 className="font-bold text-xs text-purple-deep">كيفية استخراج كلمة مرور Gmail؟</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-xs font-bold text-rose hover:underline cursor-pointer"
              >
                {showGuide ? "إخفاء" : "عرض الشرح"}
              </button>
            </div>

            <p className="text-[11px] text-tan-dark leading-relaxed">
              لحسابات Gmail، جوجل لا تقبل كلمة مرور حسابك العادية وإنما تتطلب <strong>كلمة مرور للتطبيقات (App Password)</strong> مكونة من 16 حرفاً.
            </p>

            {showGuide && (
              <div className="text-[11px] text-purple-deep space-y-2 pt-2 border-t border-rose/15 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-rose">1.</span>
                  <span>ادخل إلى <strong>Google Account</strong> ثم اختر <strong>الأمان (Security)</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-rose">2.</span>
                  <span>تأكد من تفعيل <strong>التحقق بخطوتين (2-Step Verification)</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-rose">3.</span>
                  <span>ابحث في صفحة الأمان عن <strong>كلمات مرور التطبيقات (App Passwords)</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-rose">4.</span>
                  <span>أنشئ كلمة مرور جديدة باسم <code>Lilac Drawer</code> وانسخ الـ 16 حرفاً الناتجة وضعها في خانة كلمة المرور أعلاه.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
