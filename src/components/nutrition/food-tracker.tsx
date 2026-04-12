"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FoodEntry } from "@/types";
import {
  addFoodEntry,
  deleteFoodEntry,
  getTodayFoodCalories,
  getTodayFoodEntries,
  fetchTodayFoodCalories,
  fetchTodayFoodEntries,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  Trash2,
  Apple,
  Coffee,
  Sun,
  Moon,
  Cookie,
  UtensilsCrossed,
  Search,
  Loader2,
  Zap,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodSearchItem {
  fdcId: number;
  name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number | null;
  servingSizeUnit: string | null;
}

const MEAL_OPTIONS = [
  { value: "breakfast" as const, label: "Breakfast", icon: Coffee },
  { value: "lunch" as const, label: "Lunch", icon: Sun },
  { value: "dinner" as const, label: "Dinner", icon: Moon },
  { value: "snack" as const, label: "Snack", icon: Cookie },
];

const QUICK_FOODS = [
  { name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingSize: 118, servingUnit: "g" },
  { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingSize: 182, servingUnit: "g" },
  { name: "Chicken Breast (6oz)", calories: 280, protein: 53, carbs: 0, fat: 6, servingSize: 170, servingUnit: "g" },
  { name: "Rice (1 cup)", calories: 206, protein: 4.3, carbs: 45, fat: 0.4, servingSize: 158, servingUnit: "g" },
  { name: "Eggs (2)", calories: 156, protein: 13, carbs: 1.1, fat: 11, servingSize: 100, servingUnit: "g" },
  { name: "Protein Shake", calories: 200, protein: 30, carbs: 10, fat: 3, servingSize: 350, servingUnit: "ml" },
  { name: "Greek Yogurt", calories: 130, protein: 17, carbs: 6, fat: 4, servingSize: 170, servingUnit: "g" },
  { name: "Oatmeal (1 cup)", calories: 154, protein: 5, carbs: 27, fat: 2.6, servingSize: 234, servingUnit: "g" },
];

interface FoodTrackerProps {
  compact?: boolean;
  onFoodChange?: () => void;
}

export function FoodTracker({ compact = false, onFoodChange }: FoodTrackerProps) {
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const refreshLocal = () => {
    setTodayCalories(getTodayFoodCalories());
    setTodayEntries(getTodayFoodEntries());
  };

  const refresh = () => {
    refreshLocal();
    onFoodChange?.();
    (async () => {
      const [cal, entries] = await Promise.all([fetchTodayFoodCalories(), fetchTodayFoodEntries()]);
      setTodayCalories(cal);
      setTodayEntries(entries);
    })();
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (compact) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-4 pb-4 md:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] md:text-sm text-muted-foreground mb-1">
                <Apple className="h-3.5 w-3.5 text-green-400" />
                Today&apos;s Food
              </div>
              <div className="text-xl md:text-3xl font-bold">
                {todayCalories}
                <span className="text-xs md:text-base text-muted-foreground ml-1">cal</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">{todayEntries.length} items</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 md:h-5 md:w-5 text-green-400" />
          Food Tracker
        </h3>
        <Button size="sm" onClick={() => setShowAddForm(true)} className="min-h-[36px]">
          <Plus className="h-3.5 w-3.5" />
          Add Food
        </Button>
      </div>

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="pt-4 pb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{todayCalories}</div>
            <div className="text-xs text-muted-foreground">calories consumed today</div>
          </div>
        </CardContent>
      </Card>

      {todayEntries.length > 0 && (
        <div className="space-y-1.5">
          {todayEntries.map((entry) => {
            const MealIcon = MEAL_OPTIONS.find((m) => m.value === entry.meal)?.icon || Apple;
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MealIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{entry.name}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      {entry.meal && <span className="capitalize">{entry.meal}</span>}
                      {entry.servings && entry.servings !== 1 && (
                        <span>· {entry.servings} serving{entry.servings !== 1 ? "s" : ""}</span>
                      )}
                      {entry.protein != null && (
                        <span className="hidden sm:inline">· P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-sm font-medium tabular-nums">{entry.calories} cal</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      deleteFoodEntry(entry.id);
                      refresh();
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {todayEntries.length === 0 && !showAddForm && (
        <div className="text-center py-6 text-muted-foreground">
          <Apple className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No food logged today.</p>
        </div>
      )}

      {showAddForm && <AddFoodForm onClose={() => setShowAddForm(false)} onAdded={refresh} />}

      <div className="text-center pt-1">
        <span className="text-[10px] text-muted-foreground/50">
          Food data from{" "}
          <a
            href="https://fdc.nal.usda.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-muted-foreground/70"
          >
            FoodData Central (USDA)
          </a>
        </span>
      </div>
    </div>
  );
}

function AddFoodForm({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [meal, setMeal] = useState<FoodEntry["meal"]>("snack");
  const [mode, setMode] = useState<"search" | "manual">("search");

  // Portion state
  const [servings, setServings] = useState("1");
  const [servingSize, setServingSize] = useState("");
  const [servingUnit, setServingUnit] = useState("g");
  // Base values per serving (search result or quick-add)
  const [baseCals, setBaseCals] = useState(0);
  const [baseProtein, setBaseProtein] = useState(0);
  const [baseCarbs, setBaseCarbs] = useState(0);
  const [baseFat, setBaseFat] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchItem | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const updatePortionValues = useCallback((numServings: number, bCals: number, bProt: number, bCarb: number, bFat: number) => {
    const s = Math.max(numServings, 0);
    setCalories(Math.round(bCals * s).toString());
    setProtein((Math.round(bProt * s * 10) / 10).toString());
    setCarbs((Math.round(bCarb * s * 10) / 10).toString());
    setFat((Math.round(bFat * s * 10) / 10).toString());
  }, []);

  const handleServingsChange = (val: string) => {
    setServings(val);
    const num = parseFloat(val) || 0;
    updatePortionValues(num, baseCals, baseProtein, baseCarbs, baseFat);
  };

  const searchFoodDatabase = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.foods ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    setSelectedFood(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchFoodDatabase(val), 350);
  };

  const selectFoodResult = (food: FoodSearchItem) => {
    setSelectedFood(food);
    setName(food.name);
    setBaseCals(food.calories);
    setBaseProtein(food.protein);
    setBaseCarbs(food.carbs);
    setBaseFat(food.fat);
    setServingSize(food.servingSize?.toString() || "100");
    setServingUnit(food.servingSizeUnit || "g");
    setServings("1");
    updatePortionValues(1, food.calories, food.protein, food.carbs, food.fat);
    setSearchResults([]);
    setSearchQuery(food.name);
  };

  const handleSubmit = () => {
    if (!name.trim() || !calories) return;
    const numServings = parseFloat(servings) || 1;
    const entry: FoodEntry = {
      id: `food-${Date.now()}`,
      name: name.trim(),
      calories: parseInt(calories) || 0,
      protein: protein ? parseFloat(protein) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      fat: fat ? parseFloat(fat) : undefined,
      servingSize: servingSize ? parseFloat(servingSize) : undefined,
      servingUnit: servingUnit || undefined,
      servings: numServings,
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
      meal,
    };
    addFoodEntry(entry);
    onAdded();
    onClose();
  };

  const handleQuickAdd = (food: typeof QUICK_FOODS[0]) => {
    setName(food.name);
    setBaseCals(food.calories);
    setBaseProtein(food.protein);
    setBaseCarbs(food.carbs);
    setBaseFat(food.fat);
    setServingSize(food.servingSize.toString());
    setServingUnit(food.servingUnit);
    setServings("1");
    updatePortionValues(1, food.calories, food.protein, food.carbs, food.fat);
    setMode("manual");
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Add Food</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Mode toggle */}
        <div className="flex rounded-lg bg-secondary/50 p-0.5">
          <button
            onClick={() => setMode("search")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5",
              mode === "search"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Search className="h-3 w-3" />
            Food Search
          </button>
          <button
            onClick={() => setMode("manual")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5",
              mode === "manual"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Plus className="h-3 w-3" />
            Manual
          </button>
        </div>

        {/* Meal type */}
        <div className="flex gap-1.5">
          {MEAL_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setMeal(value)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition-colors border min-h-[44px]",
                meal === value
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-secondary/30 text-muted-foreground border-transparent active:bg-secondary"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {mode === "search" ? (
          <>
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search foods..."
                autoFocus
                className="w-full h-11 rounded-xl bg-secondary border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Search results */}
            {searchResults.length > 0 && !selectedFood && (
              <div className="max-h-52 overflow-y-auto space-y-1 rounded-lg border border-border bg-secondary/30 p-1.5">
                {searchResults.map((food) => (
                  <button
                    key={food.fdcId}
                    onClick={() => selectFoodResult(food)}
                    className="w-full text-left rounded-md px-3 py-2.5 hover:bg-primary/10 active:bg-primary/15 transition-colors"
                  >
                    <div className="text-sm font-medium truncate capitalize">
                      {food.name.toLowerCase()}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-primary">{food.calories} cal</span>
                      <span className="text-[10px] text-muted-foreground">
                        P {food.protein}g · C {food.carbs}g · F {food.fat}g
                      </span>
                    </div>
                    {food.servingSize && (
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                        per {food.servingSize} {food.servingSizeUnit}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && !selectedFood && (
              <div className="text-center py-3 text-muted-foreground text-xs">
                No results found. Try a different term or switch to manual entry.
              </div>
            )}

            {/* Selected food with portion controls */}
            {selectedFood && (
              <PortionEditor
                name={selectedFood.name}
                servingSize={servingSize}
                servingUnit={servingUnit}
                servings={servings}
                calories={calories}
                protein={protein}
                carbs={carbs}
                fat={fat}
                baseCals={baseCals}
                baseProtein={baseProtein}
                baseCarbs={baseCarbs}
                baseFat={baseFat}
                onServingsChange={handleServingsChange}
                onCaloriesChange={setCalories}
                onClear={() => {
                  setSelectedFood(null);
                  setSearchQuery("");
                  setName("");
                  setCalories("");
                  setProtein("");
                  setCarbs("");
                  setFat("");
                  setServings("1");
                }}
              />
            )}

            {/* Quick-add fallback */}
            {!selectedFood && searchQuery.length < 2 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Quick Add
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FOODS.map((food) => (
                    <button
                      key={food.name}
                      onClick={() => handleQuickAdd(food)}
                      className="text-xs bg-secondary/50 hover:bg-secondary active:bg-secondary rounded-lg px-2.5 py-1.5 text-muted-foreground"
                    >
                      {food.name} ({food.calories})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Manual entry with portion */}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Food item"
              className="w-full h-11 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            {/* Serving size row */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1 flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  Serving Size
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    placeholder="100"
                    min="0"
                    className="flex-1 h-10 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <select
                    value={servingUnit}
                    onChange={(e) => setServingUnit(e.target.value)}
                    className="h-10 rounded-lg bg-secondary border border-border px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="oz">oz</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
              </div>
              <div className="w-20">
                <label className="text-[10px] text-muted-foreground block mb-1">Servings</label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => handleServingsChange(e.target.value)}
                  placeholder="1"
                  min="0.25"
                  step="0.25"
                  className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Nutrition inputs */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Calories</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-10 rounded-lg bg-secondary border border-border px-2 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-10 rounded-lg bg-secondary border border-border px-2 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-10 rounded-lg bg-secondary border border-border px-2 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Fat (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-10 rounded-lg bg-secondary border border-border px-2 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Quick-add in manual mode */}
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Quick Add
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_FOODS.map((food) => (
                  <button
                    key={food.name}
                    onClick={() => handleQuickAdd(food)}
                    className="text-xs bg-secondary/50 hover:bg-secondary active:bg-secondary rounded-lg px-2.5 py-1.5 text-muted-foreground"
                  >
                    {food.name} ({food.calories})
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <Button onClick={handleSubmit} disabled={!name.trim() || !calories} className="w-full min-h-[44px]">
          <Plus className="h-4 w-4" />
          Add to Log
        </Button>

        <div className="text-center">
          <span className="text-[9px] text-muted-foreground/50">
            Food data from FoodData Central (USDA)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PortionEditor({
  name,
  servingSize,
  servingUnit,
  servings,
  calories,
  protein,
  carbs,
  fat,
  baseCals,
  baseProtein,
  baseCarbs,
  baseFat,
  onServingsChange,
  onCaloriesChange,
  onClear,
}: {
  name: string;
  servingSize: string;
  servingUnit: string;
  servings: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  baseCals: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  onServingsChange: (val: string) => void;
  onCaloriesChange: (val: string) => void;
  onClear: () => void;
}) {
  const PORTION_PRESETS = [0.5, 1, 1.5, 2, 3];

  return (
    <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold capitalize">{name.toLowerCase()}</div>
          {servingSize && (
            <div className="text-[10px] text-muted-foreground">
              per {servingSize} {servingUnit} serving · {baseCals} cal base
            </div>
          )}
        </div>
        <button onClick={onClear} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Portion selector */}
      <div>
        <label className="text-[10px] text-muted-foreground block mb-1.5 flex items-center gap-1">
          <Scale className="h-3 w-3" />
          How many servings?
        </label>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 flex-wrap">
            {PORTION_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => onServingsChange(p.toString())}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors min-w-[36px]",
                  parseFloat(servings) === p
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={servings}
            onChange={(e) => onServingsChange(e.target.value)}
            min="0.25"
            step="0.25"
            className="w-16 h-8 rounded-lg bg-secondary border border-border px-2 text-xs text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Calculated macros */}
      <div className="grid grid-cols-4 gap-2">
        <MacroBadge label="Calories" value={calories} unit="kcal" highlight />
        <MacroBadge label="Protein" value={protein} unit="g" />
        <MacroBadge label="Carbs" value={carbs} unit="g" />
        <MacroBadge label="Fat" value={fat} unit="g" />
      </div>

      {/* Override calories */}
      <div>
        <label className="text-[10px] text-muted-foreground">
          Adjust calories if needed
        </label>
        <input
          type="number"
          value={calories}
          onChange={(e) => onCaloriesChange(e.target.value)}
          min="0"
          className="w-full h-9 mt-1 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
    </div>
  );
}

function MacroBadge({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "text-center rounded-lg py-1.5 px-1",
      highlight ? "bg-primary/10" : "bg-secondary/50"
    )}>
      <div className={cn("text-sm font-bold tabular-nums", highlight && "text-primary")}>{value || "0"}</div>
      <div className="text-[9px] text-muted-foreground">{unit}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}
