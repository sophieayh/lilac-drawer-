import Link from "next/link";
import { getAllProducts, formatPrice } from "@/db/queries";
import { deleteProduct } from "@/lib/actions";
import DeleteButton from "@/components/DeleteButton";

export const metadata = { title: "Products & Affiliate Links" };

export default async function ProductsPage() {
  const items = await getAllProducts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl text-purple-deep">Products & Affiliate Links</h1>
          <p className="text-sm text-tan-dark mt-1">{items.length} products in the catalog.</p>
        </div>
        <Link href="/products/new" className="bg-lilac text-white rounded-full px-5 py-2.5 text-sm font-semibold">
          + Add product
        </Link>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-card)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-tan-dark">
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Affiliate link</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-b-0 align-top">
                <td className="px-4 py-3 font-medium text-purple-deep max-w-[220px]">
                  {p.name}
                  {p.subtitle && <p className="text-xs text-tan-dark font-normal">{p.subtitle}</p>}
                </td>
                <td className="px-4 py-3 text-tan-dark whitespace-nowrap">{p.category}</td>
                <td className="px-4 py-3 text-tan-dark whitespace-nowrap">
                  {formatPrice(p.priceCents)}
                  {p.compareAtPriceCents && (
                    <span className="line-through text-tan ml-1.5">{formatPrice(p.compareAtPriceCents)}</span>
                  )}
                </td>
                <td className="px-4 py-3 max-w-[220px]">
                  {p.affiliateUrl ? (
                    <a href={p.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-rose truncate block hover:underline">
                      {p.affiliateUrl}
                    </a>
                  ) : (
                    <span className="text-tan-dark">— none —</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${p.inStock ? "bg-sage/15 text-sage" : "bg-rose/15 text-rose"}`}>
                    {p.inStock ? "In stock" : "Out of stock"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Link href={`/products/${p.id}/edit`} className="text-xs font-semibold text-purple-deep hover:underline">
                      Edit
                    </Link>
                    <DeleteButton
                      action={deleteProduct.bind(null, p.id)}
                      confirmMessage={`Delete "${p.name}"? This can't be undone.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-tan-dark">
                  No products yet — add your first affiliate link.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
