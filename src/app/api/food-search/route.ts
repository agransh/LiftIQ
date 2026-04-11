import { NextRequest, NextResponse } from "next/server";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ foods: [] });
  }

  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "USDA API key not configured" }, { status: 500 });
  }

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      query: query.trim(),
      pageSize: "12",
      dataType: "Survey (FNDDS),SR Legacy,Foundation",
    });

    const res = await fetch(`${USDA_BASE}/foods/search?${params}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "USDA API error" }, { status: res.status });
    }

    const data = await res.json();

    const foods = (data.foods ?? []).map((f: Record<string, unknown>) => {
      const nutrients = (f.foodNutrients ?? []) as Array<{
        nutrientNumber?: string;
        nutrientName?: string;
        value?: number;
        unitName?: string;
      }>;

      const energyNutrient = nutrients.find(
        (n) => n.nutrientNumber === "208" || n.nutrientName === "Energy"
      );
      const proteinNutrient = nutrients.find(
        (n) => n.nutrientNumber === "203" || n.nutrientName === "Protein"
      );
      const carbNutrient = nutrients.find(
        (n) => n.nutrientNumber === "205" || n.nutrientName?.includes("Carbohydrate")
      );
      const fatNutrient = nutrients.find(
        (n) => n.nutrientNumber === "204" || n.nutrientName?.includes("Total lipid")
      );

      return {
        fdcId: f.fdcId,
        name: f.description,
        brand: f.brandOwner || null,
        calories: Math.round(energyNutrient?.value ?? 0),
        protein: Math.round((proteinNutrient?.value ?? 0) * 10) / 10,
        carbs: Math.round((carbNutrient?.value ?? 0) * 10) / 10,
        fat: Math.round((fatNutrient?.value ?? 0) * 10) / 10,
        servingSize: f.servingSize ?? null,
        servingSizeUnit: f.servingSizeUnit ?? null,
      };
    });

    return NextResponse.json({ foods });
  } catch {
    return NextResponse.json({ error: "Failed to fetch from USDA" }, { status: 500 });
  }
}
