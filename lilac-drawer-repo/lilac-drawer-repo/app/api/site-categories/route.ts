import { NextResponse } from "next/server";
import { getHeaderCategories } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getHeaderCategories();
    return NextResponse.json(categories);
  } catch (err) {
    console.error("Failed to fetch header categories", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
