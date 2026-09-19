import { NextRequest, NextResponse } from "next/server";
import { searchSuggestions } from "@/db/queries";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const results = await searchSuggestions(query);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search suggest error:", error);
    return NextResponse.json(
      { products: [], posts: [], totalCount: 0, error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
