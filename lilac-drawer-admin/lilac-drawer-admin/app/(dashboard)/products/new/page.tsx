import Link from "next/link";
import ProductForm from "../ProductForm";
import { createProduct } from "@/lib/actions";
import { getAllCategories } from "@/db/queries";

export const metadata = { title: "إضافة منتج" };

export default async function NewProductPage() {
  const categories = await getAllCategories();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/products" className="text-xs font-semibold text-rose hover:underline">
          ← المنتجات
        </Link>
        <h1 className="font-heading text-2xl text-purple-deep mt-1">إضافة منتج جديد</h1>
        <p className="text-sm text-tan-dark mt-1">إضافة منتج أفلييت جديد بروابط التتبع والمتاجر المتعددة.</p>
      </div>
      <ProductForm availableCategories={categories} action={createProduct} />
    </div>
  );
}
