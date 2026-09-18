import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "غير مصرح بالدخول",
};

export default function NotAuthorizedPage() {
  return (
    <div className="text-center max-w-sm">
      <p className="font-heading text-2xl text-purple-deep mb-2">غير مصرح بالدخول</p>
      <p className="text-sm text-tan-dark leading-relaxed">
        أنت مسجل الدخول، ولكن هذا الحساب لا يملك صلاحيات المشرف. اطلب من أحد المشرفين الحاليين ترقية حسابك من صفحة المستخدمين.
      </p>
    </div>
  );
}
