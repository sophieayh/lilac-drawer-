import { notFound } from "next/navigation";
import { getCategoryById } from "@/db/queries";
import { updateCategory } from "@/lib/actions";
import CategoryForm from "../../CategoryForm";

export const metadata = { title: "تعديل القسم" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();

  const category = await getCategoryById(numId);
  if (!category) notFound();

  return (
    <CategoryForm
      title={`تعديل القسم — ${category.label}`}
      submitLabel="حفظ التغييرات"
      initial={category}
      action={updateCategory.bind(null, category.id)}
    />
  );
}
