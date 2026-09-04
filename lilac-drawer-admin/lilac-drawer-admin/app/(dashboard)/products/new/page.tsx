import Link from "next/link";
import ProductForm from "../ProductForm";
import { createProduct } from "@/lib/actions";
import { getAllCategories } from "@/db/queries";

export const metadata = { title: "Add Product" };

export default async function NewProductPage() {
  const categories = await getAllCategories();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/products" className="text-xs font-semibold text-rose hover:underline">
          ← Products
        </Link>
        <h1 className="font-heading text-2xl text-purple-deep mt-1">Add a product</h1>
        <p className="text-sm text-tan-dark mt-1">Add a new affiliate product and its tracked link.</p>
      </div>
      <ProductForm availableCategories={categories} action={createProduct} />
    </div>
  );
}
