import { notFound } from "next/navigation";
import { getBannerById } from "@/db/queries";
import { updateBanner } from "@/lib/actions";
import BannerForm from "../../BannerForm";

export const metadata = { title: "Edit Banner" };

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
      title={`Edit Banner — ${banner.title}`}
      submitLabel="Save Changes"
      initial={banner}
      action={updateBanner.bind(null, banner.id)}
    />
  );
}
