"use client";

import { useState, useEffect } from "react";
import { WorkoutRoutine, RoutineExercise } from "@/types";
import { getRoutines, saveRoutine, deleteRoutine, fetchRoutines } from "@/lib/storage";
import { exerciseList } from "@/lib/exercises";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  Trash2,
  GripVertical,
  Pencil,
  Play,
  ChevronUp,
  ChevronDown,
  Clock,
  Dumbbell,
  LayoutList,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const ALL_EXERCISES = [
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

const REST_OPTIONS = [15, 30, 45, 60, 90, 120, 180];

interface RoutineBuilderProps {
  onClose: () => void;
  onStartRoutine?: (routine: WorkoutRoutine) => void;
}

export function RoutineBuilder({ onClose, onStartRoutine }: RoutineBuilderProps) {
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);

  // Edit form state
  const [routineName, setRoutineName] = useState("");
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");

  useEffect(() => {
    setRoutines(getRoutines());
    fetchRoutines().then(setRoutines);
  }, []);

  const refresh = () => {
    setRoutines(getRoutines());
    fetchRoutines().then(setRoutines);
  };

  const startNewRoutine = () => {
    setEditingRoutine(null);
    setRoutineName("");
    setExercises([]);
    setMode("edit");
  };

  const editExistingRoutine = (routine: WorkoutRoutine) => {
    setEditingRoutine(routine);
    setRoutineName(routine.name);
    setExercises([...routine.exercises]);
    setMode("edit");
  };

  const handleSave = () => {
    if (!routineName.trim() || exercises.length === 0) return;
    const routine: WorkoutRoutine = {
      id: editingRoutine?.id || `routine-${Date.now()}`,
      name: routineName.trim(),
      exercises,
      createdAt: editingRoutine?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    saveRoutine(routine);
    refresh();
    setMode("list");
  };

  const handleDelete = (id: string) => {
    deleteRoutine(id);
    refresh();
  };

  const addExercise = (name: string) => {
    const ex: RoutineExercise = {
      id: `rex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      trackingId: TRACKING_MAP[name] || "custom",
      targetSets: 3,
      targetReps: 10,
      restAfterSets: 60,
    };
    setExercises([...exercises, ex]);
    setShowAddExercise(false);
    setExerciseSearch("");
  };

  const updateExercise = (id: string, updates: Partial<RoutineExercise>) => {
    setExercises(exercises.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((e) => e.id !== id));
  };

  const moveExercise = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= exercises.length) return;
    const updated = [...exercises];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setExercises(updated);
  };

  const filteredExercises = ALL_EXERCISES.filter((name) =>
    name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="w-full md:max-w-lg max-h-[90vh] overflow-hidden bg-card border-border rounded-t-2xl md:rounded-xl md:mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 md:px-6 md:pt-6 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <LayoutList className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">
              {mode === "list" ? "My Routines" : editingRoutine ? "Edit Routine" : "New Routine"}
            </h2>
          </div>
          <div className="flex gap-1">
            {mode === "edit" && (
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
          {mode === "list" && (
            <div className="space-y-3">
              {routines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <LayoutList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No routines yet.</p>
                  <p className="text-xs mt-1">Create a routine to plan your workouts.</p>
                </div>
              ) : (
                routines.map((routine) => (
                  <div
                    key={routine.id}
                    className="rounded-xl bg-secondary/50 px-4 py-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{routine.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {routine.exercises.length} exercise{routine.exercises.length !== 1 ? "s" : ""}
                          {" · "}
                          {routine.exercises.reduce((s, e) => s + e.targetSets, 0)} total sets
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {onStartRoutine && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              onStartRoutine(routine);
                              onClose();
                            }}
                            className="min-h-[36px] gap-1"
                          >
                            <Play className="h-3 w-3" />
                            Start
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => editExistingRoutine(routine)} className="h-8 w-8">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(routine.id)} className="h-8 w-8 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {routine.exercises.map((ex) => (
                        <Badge key={ex.id} variant="secondary" className="text-[10px]">
                          {ex.name} {ex.targetSets}×{ex.targetReps}
                          {ex.weight ? ` @ ${ex.weight}lbs` : ""}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {mode === "edit" && (
            <div className="space-y-4">
              {/* Routine name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Routine Name</label>
                <input
                  type="text"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  placeholder="e.g. Push Day, Full Body, Leg Day"
                  autoFocus
                  className="w-full h-11 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Exercise list */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Dumbbell className="h-3 w-3" />
                  Exercises ({exercises.length})
                </div>
                {exercises.map((ex, idx) => (
                  <RoutineExerciseCard
                    key={ex.id}
                    exercise={ex}
                    index={idx}
                    total={exercises.length}
                    onUpdate={(updates) => updateExercise(ex.id, updates)}
                    onRemove={() => removeExercise(ex.id)}
                    onMove={(dir) => moveExercise(idx, dir)}
                  />
                ))}
              </div>

              {/* Add exercise */}
              {showAddExercise ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder="Search exercises..."
                    autoFocus
                    className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-border bg-secondary/30 p-1.5">
                    {filteredExercises.map((name) => (
                      <button
                        key={name}
                        onClick={() => addExercise(name)}
                        className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-primary/10 active:bg-primary/15 transition-colors flex items-center justify-between"
                      >
                        <span>{name}</span>
                        {TRACKING_MAP[name] && (
                          <Badge variant="success" className="text-[9px]">AI</Badge>
                        )}
                      </button>
                    ))}
                    {/* Custom entry */}
                    {exerciseSearch.trim() && !filteredExercises.some(
                      (n) => n.toLowerCase() === exerciseSearch.trim().toLowerCase()
                    ) && (
                      <button
                        onClick={() => addExercise(exerciseSearch.trim())}
                        className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-primary/10 text-primary font-medium"
                      >
                        + Add &ldquo;{exerciseSearch.trim()}&rdquo; as custom
                      </button>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setShowAddExercise(false); setExerciseSearch(""); }} className="w-full">
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setShowAddExercise(true)} className="w-full min-h-[44px]">
                  <Plus className="h-4 w-4" />
                  Add Exercise
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 md:px-6 border-t border-border/50 shrink-0" style={{ paddingBottom: "max(0.75rem, var(--safe-bottom))" }}>
          {mode === "list" && (
            <Button onClick={startNewRoutine} className="w-full min-h-[48px]">
              <Plus className="h-4 w-4" />
              Create Routine
            </Button>
          )}
          {mode === "edit" && (
            <Button onClick={handleSave} disabled={!routineName.trim() || exercises.length === 0} className="w-full min-h-[48px]">
              <Check className="h-4 w-4" />
              Save Routine
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function RoutineExerciseCard({
  exercise,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
}: {
  exercise: RoutineExercise;
  index: number;
  total: number;
  onUpdate: (updates: Partial<RoutineExercise>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl bg-secondary/50 border border-border/50 overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        <div className="flex flex-col gap-0.5 shrink-0">
          {index > 0 && (
            <button onClick={(e) => { e.stopPropagation(); onMove(-1); }} className="text-muted-foreground hover:text-foreground">
              <ChevronUp className="h-3 w-3" />
            </button>
          )}
          <GripVertical className="h-3 w-3 text-muted-foreground/50" />
          {index < total - 1 && (
            <button onClick={(e) => { e.stopPropagation(); onMove(1); }} className="text-muted-foreground hover:text-foreground">
              <ChevronDown className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{exercise.name}</div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-2">
            <span>{exercise.targetSets} × {exercise.targetReps}</span>
            {exercise.weight && <span>{exercise.weight} lbs</span>}
            <span className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {exercise.restAfterSets}s rest
            </span>
          </div>
        </div>
        {exercise.trackingId !== "custom" && (
          <Badge variant="success" className="text-[8px] shrink-0">AI</Badge>
        )}
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="h-7 w-7 shrink-0 text-destructive">
          <Trash2 className="h-3 w-3" />
        </Button>
      </button>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/30 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Sets</label>
              <input
                type="number"
                value={exercise.targetSets}
                onChange={(e) => onUpdate({ targetSets: parseInt(e.target.value) || 1 })}
                min="1"
                className="w-full h-9 rounded-lg bg-background border border-border px-2 text-sm text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Reps</label>
              <input
                type="number"
                value={exercise.targetReps}
                onChange={(e) => onUpdate({ targetReps: parseInt(e.target.value) || 1 })}
                min="1"
                className="w-full h-9 rounded-lg bg-background border border-border px-2 text-sm text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Weight (lbs)</label>
              <input
                type="number"
                value={exercise.weight || ""}
                onChange={(e) => onUpdate({ weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="—"
                min="0"
                className="w-full h-9 rounded-lg bg-background border border-border px-2 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Rest Between Sets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REST_OPTIONS.map((sec) => (
                <button
                  key={sec}
                  onClick={() => onUpdate({ restAfterSets: sec })}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    exercise.restAfterSets === sec
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-background text-muted-foreground border-transparent hover:bg-secondary"
                  )}
                >
                  {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                </button>
              ))}
              <input
                type="number"
                value={!REST_OPTIONS.includes(exercise.restAfterSets) ? exercise.restAfterSets : ""}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (v > 0) onUpdate({ restAfterSets: v });
                }}
                placeholder="Custom"
                min="5"
                className="w-20 h-8 rounded-lg bg-background border border-border px-2 text-xs text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
