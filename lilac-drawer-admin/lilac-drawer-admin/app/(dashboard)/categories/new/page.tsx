import { createCategory } from "@/lib/actions";
import CategoryForm from "../CategoryForm";

export const metadata = { title: "إضافة قسم جديد" };

export default function NewCategoryPage() {
  return (
    <CategoryForm
      title="إضافة قسم جديد"
      submitLabel="إنشاء القسم"
      action={createCategory}
    />
  );
}
