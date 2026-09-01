import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "../../ProductForm";
import { getProductById } from "@/db/queries";
import { updateProduct } from "@/lib/actions";

export const metadata = { title: "Edit Product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/products" className="text-xs font-semibold text-rose hover:underline">
          ← Products
        </Link>
        <h1 className="font-heading text-2xl text-purple-deep mt-1">Edit product</h1>
      </div>
      <ProductForm product={product} action={updateProduct.bind(null, product.id)} />
    </div>
  );
}
