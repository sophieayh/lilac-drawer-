import { createBanner } from "@/lib/actions";
import BannerForm from "../BannerForm";

export const metadata = { title: "New Banner" };

export default function NewBannerPage() {
  return (
    <BannerForm
      action={createBanner}
      title="Create Advertisement Banner"
      submitLabel="Publish Banner"
    />
  );
}
