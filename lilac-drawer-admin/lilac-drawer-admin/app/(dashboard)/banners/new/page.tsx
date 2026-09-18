import { createBanner } from "@/lib/actions";
import BannerForm from "../BannerForm";

export const metadata = { title: "إضافة بانر جديد" };

export default function NewBannerPage() {
  return (
    <BannerForm
      action={createBanner}
      title="إنشاء بانر إعلاني جديد"
      submitLabel="نشر البانر"
    />
  );
}

