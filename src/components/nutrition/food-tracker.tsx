"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const MEAL_OPTIONS = [
  { value: "breakfast" as const, label: "Breakfast", icon: Coffee },
  { value: "lunch" as const, label: "Lunch", icon: Sun },
  { value: "dinner" as const, label: "Dinner", icon: Moon },
  { value: "snack" as const, label: "Snack", icon: Cookie },
];

const COMMON_FOODS = [
  { name: "Banana", calories: 105 },
  { name: "Apple", calories: 95 },
  { name: "Chicken Breast (6oz)", calories: 280 },
  { name: "Rice (1 cup)", calories: 206 },
  { name: "Eggs (2)", calories: 156 },
  { name: "Oatmeal (1 cup)", calories: 154 },
  { name: "Protein Shake", calories: 200 },
  { name: "Greek Yogurt", calories: 130 },
  { name: "Almonds (1oz)", calories: 164 },
  { name: "Avocado", calories: 234 },
  { name: "Sweet Potato", calories: 103 },
  { name: "Salmon (6oz)", calories: 350 },
  { name: "Bread (2 slices)", calories: 160 },
  { name: "Peanut Butter (2 tbsp)", calories: 188 },
  { name: "Coffee (black)", calories: 5 },
  { name: "Milk (1 cup)", calories: 149 },
];

interface FoodTrackerProps {
  compact?: boolean;
}

export function FoodTracker({ compact = false }: FoodTrackerProps) {
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const refreshLocal = () => {
    setTodayCalories(getTodayFoodCalories());
    setTodayEntries(getTodayFoodEntries());
  };

  const refresh = () => {
    refreshLocal();
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
      {/* Header */}
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

      {/* Today summary */}
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="pt-4 pb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{todayCalories}</div>
            <div className="text-xs text-muted-foreground">calories consumed today</div>
          </div>
        </CardContent>
      </Card>

      {/* Today entries */}
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
                    {entry.meal && (
                      <div className="text-[10px] text-muted-foreground capitalize">{entry.meal}</div>
                    )}
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

      {/* Add food form */}
      {showAddForm && <AddFoodForm onClose={() => setShowAddForm(false)} onAdded={refresh} />}
    </div>
  );
}

function AddFoodForm({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [meal, setMeal] = useState<FoodEntry["meal"]>("snack");
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleSubmit = () => {
    if (!name.trim() || !calories) return;

    const entry: FoodEntry = {
      id: `food-${Date.now()}`,
      name: name.trim(),
      calories: parseInt(calories) || 0,
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
      meal,
    };

    addFoodEntry(entry);
    onAdded();
    onClose();
  };

  const handleQuickAdd = (food: { name: string; calories: number }) => {
    setName(food.name);
    setCalories(food.calories.toString());
    setShowSuggestions(false);
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
        {/* Quick add suggestions */}
        {showSuggestions && (
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Quick Add</div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_FOODS.slice(0, 8).map((food) => (
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

        {/* Food name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Food item"
          className="w-full h-11 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />

        {/* Calories */}
        <input
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="Calories"
          min="0"
          className="w-full h-11 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />

        <Button onClick={handleSubmit} disabled={!name.trim() || !calories} className="w-full min-h-[44px]">
          <Plus className="h-4 w-4" />
          Add to Log
        </Button>
      </CardContent>
    </Card>
  );
}
