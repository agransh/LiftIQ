import { NextRequest, NextResponse } from "next/server";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

/** Energy (kcal) can appear as nutrient #208 (SR legacy) or nutrientId 1008 / 2047 in FDC. */
function findEnergyKcal(
  nutrients: Array<Record<string, unknown>>
): number | undefined {
  for (const n of nutrients) {
    const num = n.nutrientNumber != null ? String(n.nutrientNumber) : "";
    const id = typeof n.nutrientId === "number" ? n.nutrientId : Number(n.nutrientId);
    const name = typeof n.nutrientName === "string" ? n.nutrientName.toLowerCase() : "";
    const unit = typeof n.unitName === "string" ? n.unitName.toUpperCase() : "";

    const isEnergy =
      num === "208" ||
      id === 1008 ||
      id === 2047 ||
      id === 1062 ||
      name === "energy" ||
      (name.includes("energy") && (unit === "KCAL" || unit === "CAL"));

    if (isEnergy && typeof n.value === "number" && !Number.isNaN(n.value)) {
      return n.value;
    }
  }
  return undefined;
}

function findMacro(
  nutrients: Array<Record<string, unknown>>,
  nutrientNumber: string,
  nameIncludes: string
): number | undefined {
  for (const n of nutrients) {
    const num = n.nutrientNumber != null ? String(n.nutrientNumber) : "";
    const name = typeof n.nutrientName === "string" ? n.nutrientName.toLowerCase() : "";
    if (
      num === nutrientNumber ||
      (name && name.includes(nameIncludes.toLowerCase()))
    ) {
      if (typeof n.value === "number" && !Number.isNaN(n.value)) {
        return n.value;
      }
    }
  }
  return undefined;
}

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
      pageSize: "25",
      dataType: "Branded,Survey (FNDDS),Foundation,SR Legacy",
    });

    const res = await fetch(`${USDA_BASE}/foods/search?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("USDA foods/search error:", res.status, errText.slice(0, 500));
      return NextResponse.json({ error: "USDA API error" }, { status: res.status });
    }

    const data = (await res.json()) as { foods?: Record<string, unknown>[] };

    const foods = (data.foods ?? []).map((f) => {
      const nutrients = (f.foodNutrients ?? []) as Array<Record<string, unknown>>;

      const energy = findEnergyKcal(nutrients);
      const protein = findMacro(nutrients, "203", "protein");
      const carbs = findMacro(nutrients, "205", "carbohydrate");
      const fat = findMacro(nutrients, "204", "total lipid");

      return {
        fdcId: f.fdcId,
        name: f.description,
        brand: f.brandOwner || null,
        calories: Math.round(energy ?? 0),
        protein: Math.round((protein ?? 0) * 10) / 10,
        carbs: Math.round((carbs ?? 0) * 10) / 10,
        fat: Math.round((fat ?? 0) * 10) / 10,
        servingSize: f.servingSize ?? null,
        servingSizeUnit: f.servingSizeUnit ?? null,
      };
    });

    return NextResponse.json({ foods });
  } catch (e) {
    console.error("food-search:", e);
    return NextResponse.json({ error: "Failed to fetch from USDA" }, { status: 500 });
  }
}
