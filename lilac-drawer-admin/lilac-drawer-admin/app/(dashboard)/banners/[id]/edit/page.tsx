import { notFound } from "next/navigation";
import { getBannerById } from "@/db/queries";
import { updateBanner } from "@/lib/actions";
import BannerForm from "../../BannerForm";

export const metadata = { title: "تعديل البانر" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBannerPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();

  const banner = await getBannerById(numId);
  if (!banner) notFound();

  return (
    <BannerForm
      title={`تعديل البانر — ${banner.title}`}
      submitLabel="حفظ التعديلات"
      initial={banner}
      action={updateBanner.bind(null, banner.id)}
    />
  );
}

