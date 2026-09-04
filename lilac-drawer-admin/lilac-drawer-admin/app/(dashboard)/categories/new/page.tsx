import { createCategory } from "@/lib/actions";
import CategoryForm from "../CategoryForm";

export const metadata = { title: "Add New Category" };

export default function NewCategoryPage() {
  return (
    <CategoryForm
      title="Add New Category"
      submitLabel="Create Category"
      action={createCategory}
    />
  );
}
