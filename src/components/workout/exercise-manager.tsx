"use client";

import { useState, useEffect } from "react";
import { UserExercise } from "@/types";
import { getUserExercises, saveUserExercise, deleteUserExercise } from "@/lib/storage";
import { exerciseList } from "@/lib/exercises";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Pencil, Trash2, Dumbbell, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const KNOWN_EXERCISES = [
  "Squat", "Push-Up", "Lunge", "Plank", "Sit-Up", "Jumping Jack",
  "Mountain Climber", "Shoulder Press", "Bicep Curl", "Burpee",
  "Deadlift", "Bench Press", "Overhead Press", "Barbell Row",
  "Pull-Up", "Chin-Up", "Dip", "Lat Pulldown", "Leg Press",
  "Leg Curl", "Leg Extension", "Calf Raise", "Romanian Deadlift",
  "Hip Thrust", "Cable Fly", "Tricep Pushdown", "Hammer Curl",
  "Lateral Raise", "Front Raise", "Face Pull", "Shrug",
  "Crunch", "Russian Twist", "Plank Hold", "Flutter Kick",
  "Box Jump", "Wall Sit", "Step-Up", "Farmer Walk",
];

// Map known exercise names to tracking IDs
const TRACKING_MAP: Record<string, string> = {
  "Squat": "squat",
  "Push-Up": "pushup",
  "Lunge": "lunge",
  "Plank": "plank",
  "Sit-Up": "situp",
  "Jumping Jack": "jumping-jack",
  "Mountain Climber": "mountain-climber",
  "Shoulder Press": "shoulder-press",
  "Bicep Curl": "bicep-curl",
  "Burpee": "burpee",
};

interface ExerciseManagerProps {
  onClose: () => void;
  onSelectExercise?: (exercise: UserExercise) => void;
}

export function ExerciseManager({ onClose, onSelectExercise }: ExerciseManagerProps) {
  const [exercises, setExercises] = useState<UserExercise[]>([]);
  const [mode, setMode] = useState<"list" | "add-known" | "add-custom" | "edit">("list");
  const [editingExercise, setEditingExercise] = useState<UserExercise | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form fields
  const [formName, setFormName] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formReps, setFormReps] = useState("");
  const [formSets, setFormSets] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    setExercises(getUserExercises());
  }, []);

  const refresh = () => setExercises(getUserExercises());

  const handleAddKnown = (name: string) => {
    const trackingId = TRACKING_MAP[name] || "custom";
    const exercise: UserExercise = {
      id: `ex-${Date.now()}`,
      name,
      trackingId,
      isCustom: false,
      createdAt: Date.now(),
    };
    setEditingExercise(exercise);
    setFormName(name);
    setFormWeight("");
    setFormReps("");
    setFormSets("");
    setFormNotes("");
    setMode("edit");
  };

  const handleAddCustom = () => {
    setEditingExercise(null);
    setFormName("");
    setFormWeight("");
    setFormReps("");
    setFormSets("");
    setFormNotes("");
    setMode("add-custom");
  };

  const handleEdit = (ex: UserExercise) => {
    setEditingExercise(ex);
    setFormName(ex.name);
    setFormWeight(ex.weight?.toString() || "");
    setFormReps(ex.targetReps?.toString() || "");
    setFormSets(ex.targetSets?.toString() || "");
    setFormNotes(ex.notes || "");
    setMode("edit");
  };

  const handleSave = () => {
    const exercise: UserExercise = {
      id: editingExercise?.id || `ex-${Date.now()}`,
      name: formName.trim(),
      trackingId: editingExercise?.trackingId || TRACKING_MAP[formName.trim()] || "custom",
      weight: formWeight ? parseFloat(formWeight) : undefined,
      targetReps: formReps ? parseInt(formReps) : undefined,
      targetSets: formSets ? parseInt(formSets) : undefined,
      notes: formNotes.trim() || undefined,
      isCustom: editingExercise?.isCustom ?? !TRACKING_MAP[formName.trim()],
      createdAt: editingExercise?.createdAt || Date.now(),
    };

    if (!exercise.name) return;

    saveUserExercise(exercise);
    refresh();
    setMode("list");
  };

  const handleDelete = (id: string) => {
    deleteUserExercise(id);
    refresh();
  };

  const filteredKnown = KNOWN_EXERCISES.filter((name) => {
    const alreadyAdded = exercises.some((e) => e.name.toLowerCase() === name.toLowerCase());
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    return !alreadyAdded && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="w-full md:max-w-lg max-h-[88vh] overflow-hidden bg-card border-border rounded-t-2xl md:rounded-xl md:mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 md:px-6 md:pt-6 border-b border-border/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold">
              {mode === "list" && "My Exercises"}
              {mode === "add-known" && "Add Exercise"}
              {mode === "add-custom" && "Create Exercise"}
              {mode === "edit" && (editingExercise?.id.startsWith("ex-") ? "Edit Exercise" : "Add Exercise")}
            </h2>
          </div>
          <div className="flex gap-2">
            {mode !== "list" && (
              <Button variant="ghost" size="icon" onClick={() => setMode("list")} className="min-h-[44px] min-w-[44px]">
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="min-h-[44px] min-w-[44px]">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 md:px-6">
          {/* LIST MODE */}
          {mode === "list" && (
            <div className="space-y-3">
              {exercises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No exercises added yet.</p>
                  <p className="text-xs mt-1">Add from the list or create your own.</p>
                </div>
              ) : (
                exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-3 group"
                  >
                    <button
                      onClick={() => {
                        onSelectExercise?.(ex);
                        onClose();
                      }}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{ex.name}</span>
                        {ex.trackingId !== "custom" && (
                          <Badge variant="success" className="text-[9px] shrink-0">AI Tracked</Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex gap-2">
                        {ex.weight && <span>{ex.weight} lbs</span>}
                        {ex.targetSets && ex.targetReps && (
                          <span>{ex.targetSets} × {ex.targetReps}</span>
                        )}
                        {ex.notes && <span className="truncate">• {ex.notes}</span>}
                      </div>
                    </button>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(ex)} className="h-8 w-8">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ex.id)} className="h-8 w-8 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ADD KNOWN MODE */}
          {mode === "add-known" && (
            <div className="space-y-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises..."
                className="w-full h-11 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                {filteredKnown.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleAddKnown(name)}
                    className="w-full flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2.5 text-sm hover:bg-secondary active:bg-secondary text-left"
                  >
                    <span>{name}</span>
                    {TRACKING_MAP[name] && (
                      <Badge variant="success" className="text-[9px]">AI Tracked</Badge>
                    )}
                  </button>
                ))}
                {filteredKnown.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No matches. Try creating a custom exercise.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ADD CUSTOM / EDIT MODE */}
          {(mode === "add-custom" || mode === "edit") && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Exercise Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Incline Bench Press"
                  disabled={mode === "edit" && !editingExercise?.isCustom && !!editingExercise?.name}
                  className="w-full h-11 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  autoFocus={mode === "add-custom"}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Weight (lbs)</label>
                  <input
                    type="number"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full h-11 rounded-xl bg-secondary border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Reps</label>
                  <input
                    type="number"
                    value={formReps}
                    onChange={(e) => setFormReps(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full h-11 rounded-xl bg-secondary border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Sets</label>
                  <input
                    type="number"
                    value={formSets}
                    onChange={(e) => setFormSets(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full h-11 rounded-xl bg-secondary border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. use slow negative, pause at bottom"
                  rows={2}
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 md:px-6 border-t border-border/50 shrink-0"
          style={{ paddingBottom: "max(0.75rem, var(--safe-bottom))" }}
        >
          {mode === "list" && (
            <div className="flex gap-2">
              <Button onClick={() => { setSearchQuery(""); setMode("add-known"); }} className="flex-1 min-h-[48px]">
                <Plus className="h-4 w-4" />
                From List
              </Button>
              <Button onClick={handleAddCustom} variant="outline" className="flex-1 min-h-[48px]">
                <Plus className="h-4 w-4" />
                Custom
              </Button>
            </div>
          )}
          {(mode === "add-custom" || mode === "edit") && (
            <Button onClick={handleSave} disabled={!formName.trim()} className="w-full min-h-[48px]">
              <Check className="h-4 w-4" />
              Save Exercise
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
