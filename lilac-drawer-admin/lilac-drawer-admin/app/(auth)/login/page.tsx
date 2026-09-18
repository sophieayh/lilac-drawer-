import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-[360px]">
      <p className="font-heading text-lg text-center mb-1 text-purple-deep">
        خزانة ليلك <span className="text-rose">الإدارة</span>
      </p>
      <h1 className="text-sm text-center text-tan-dark mb-8">تسجيل الدخول إلى لوحة التحكم</h1>
      <LoginForm />
    </div>
  );
}
