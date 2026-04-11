"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowRight, Shield, ChevronLeft, Flame } from "lucide-react";
import { saveUserProfile } from "@/lib/storage";
import { useWorkoutStore } from "@/lib/store";
import { UserProfile, WeightGoal, Gender, ActivityLevel } from "@/types";
import { calculateRecommendedCalories, getActivityLabel } from "@/lib/calories";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const { setUserProfile } = useWorkoutStore();
  const [step, setStep] = useState(0);

  // Step 0 – basics
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");

  // Step 1 – body
  const [weight, setWeight] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");

  // Step 2 – health
  const [disabilities, setDisabilities] = useState("");

  // Step 3 – goals
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [weightGoal, setWeightGoal] = useState<WeightGoal>("maintain");

  // Step 4 – calorie goal
  const [useRecommended, setUseRecommended] = useState(true);
  const [customCalories, setCustomCalories] = useState("");

  // Step 5 – privacy
  const [agreed, setAgreed] = useState(false);

  const steps = [
    { title: "Welcome", subtitle: "Let's get to know you" },
    { title: "Your Body", subtitle: "Help us personalize your experience" },
    { title: "Health Info", subtitle: "Any conditions we should know about" },
    { title: "Your Goals", subtitle: "What are you training for?" },
    { title: "Calorie Target", subtitle: "Set your daily nutrition goal" },
    { title: "Data Privacy", subtitle: "How we use your information" },
  ];

  const totalInches = (parseInt(heightFt) || 0) * 12 + (parseInt(heightIn) || 0);

  const recommendedCalories = useMemo(() => {
    const w = parseFloat(weight) || 160;
    const h = totalInches || 68;
    const a = parseInt(age) || 25;
    return calculateRecommendedCalories(w, h, a, gender, activityLevel, weightGoal);
  }, [weight, totalInches, age, gender, activityLevel, weightGoal]);

  const canProceed = () => {
    switch (step) {
      case 0: return name.trim().length > 0 && age.trim().length > 0;
      case 1: return weight.trim().length > 0 && heightFt.trim().length > 0;
      case 2: return true;
      case 3: return true;
      case 4: return useRecommended || (customCalories && parseInt(customCalories) > 0);
      case 5: return agreed;
      default: return false;
    }
  };

  const handleFinish = () => {
    const profile: UserProfile = {
      name: name.trim(),
      age: parseInt(age) || 0,
      weight: parseFloat(weight) || 0,
      height: totalInches,
      gender,
      activityLevel,
      disabilities: disabilities.trim(),
      weightGoal,
      calorieGoal: useRecommended ? recommendedCalories : (parseInt(customCalories) || recommendedCalories),
      useRecommendedCalories: useRecommended,
      hasCompletedOnboarding: true,
      createdAt: Date.now(),
    };
    saveUserProfile(profile);
    setUserProfile(profile);
    router.push("/workout");
  };

  const inputClass = "w-full h-12 rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="min-h-[100dvh] bg-background gradient-mesh flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 md:px-6 md:pt-6"
        style={{ paddingTop: "max(1rem, var(--safe-top))" }}
      >
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold">
            Lift<span className="text-primary">IQ</span>
          </span>
        </div>
        <Badge variant="outline" className="text-xs">
          Step {step + 1} of {steps.length}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="px-4 mt-4 md:px-6">
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 overflow-y-auto">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{steps[step].title}</h1>
          <p className="text-sm text-muted-foreground mb-6">{steps[step].subtitle}</p>

          {/* Step 0: Name, Age, Gender */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
                  placeholder="Your age" min="13" max="100" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Gender</label>
                <div className="flex gap-2">
                  {(["male", "female", "other"] as Gender[]).map((g) => (
                    <button key={g} onClick={() => setGender(g)}
                      className={cn(
                        "flex-1 rounded-xl py-3 text-sm font-medium border transition-colors min-h-[48px]",
                        gender === g
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-secondary/50 text-muted-foreground border-transparent active:bg-secondary"
                      )}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Weight & Height */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Weight (lbs)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 160" min="50" max="500" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Height</label>
                <div className="flex gap-3">
                  <input type="number" value={heightFt} onChange={(e) => setHeightFt(e.target.value)}
                    placeholder="ft" min="3" max="8" className={cn(inputClass, "flex-1")} />
                  <input type="number" value={heightIn} onChange={(e) => setHeightIn(e.target.value)}
                    placeholder="in" min="0" max="11" className={cn(inputClass, "flex-1")} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Health */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Physical disabilities or conditions
                </label>
                <textarea value={disabilities} onChange={(e) => setDisabilities(e.target.value)}
                  placeholder="e.g. bad left knee, lower back issues, or 'none'" rows={4}
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                <p className="text-xs text-muted-foreground mt-2">
                  This helps us provide safer coaching recommendations. Leave blank or type &quot;none&quot; if not applicable.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Goals (activity + weight goal) */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  What&apos;s your goal?
                </label>
                <div className="space-y-2">
                  {([
                    { value: "lose" as const, label: "Lose Weight", desc: "Calorie deficit to shed fat" },
                    { value: "maintain" as const, label: "Maintain Weight", desc: "Stay at your current weight" },
                    { value: "gain" as const, label: "Gain Weight", desc: "Calorie surplus to build mass" },
                  ]).map((opt) => (
                    <button key={opt.value} onClick={() => setWeightGoal(opt.value)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl px-4 py-3.5 text-left border transition-colors min-h-[48px]",
                        weightGoal === opt.value
                          ? "bg-primary/10 border-primary/30"
                          : "bg-secondary/30 border-transparent active:bg-secondary"
                      )}>
                      <div>
                        <div className={cn("text-sm font-medium", weightGoal === opt.value && "text-primary")}>
                          {opt.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{opt.desc}</div>
                      </div>
                      <div className={cn(
                        "h-4 w-4 rounded-full border-2 shrink-0",
                        weightGoal === opt.value ? "border-primary bg-primary" : "border-muted-foreground"
                      )} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Activity Level
                </label>
                <div className="space-y-1.5">
                  {(["sedentary", "light", "moderate", "active", "very_active"] as ActivityLevel[]).map((level) => (
                    <button key={level} onClick={() => setActivityLevel(level)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2.5 text-left text-sm border transition-colors min-h-[44px]",
                        activityLevel === level
                          ? "bg-primary/10 text-primary border-primary/30 font-medium"
                          : "bg-secondary/20 text-muted-foreground border-transparent active:bg-secondary"
                      )}>
                      {getActivityLabel(level)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Calorie Goal */}
          {step === 4 && (
            <div className="space-y-5">
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="pt-5 pb-5">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-2">
                      <Flame className="h-3.5 w-3.5 text-orange-400" />
                      Recommended Daily Intake
                    </div>
                    <div className="text-4xl font-bold text-primary">
                      {recommendedCalories}
                      <span className="text-base text-muted-foreground ml-1">cal</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Based on your stats ({weight || "160"} lbs, {heightFt || "5"}&apos;{heightIn || "8"}&quot;, age {age || "25"}, {activityLevel.replace("_", " ")})
                      {weightGoal === "lose" && " — 500 cal deficit"}
                      {weightGoal === "gain" && " — 400 cal surplus"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <button onClick={() => { setUseRecommended(true); }}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left border transition-colors min-h-[48px]",
                    useRecommended ? "bg-primary/10 border-primary/30" : "bg-secondary/30 border-transparent active:bg-secondary"
                  )}>
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 shrink-0",
                    useRecommended ? "border-primary bg-primary" : "border-muted-foreground"
                  )} />
                  <div>
                    <div className={cn("text-sm font-medium", useRecommended && "text-primary")}>
                      Use recommended ({recommendedCalories} cal)
                    </div>
                    <div className="text-[11px] text-muted-foreground">Calculated from your profile</div>
                  </div>
                </button>

                <button onClick={() => { setUseRecommended(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left border transition-colors min-h-[48px]",
                    !useRecommended ? "bg-primary/10 border-primary/30" : "bg-secondary/30 border-transparent active:bg-secondary"
                  )}>
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 shrink-0",
                    !useRecommended ? "border-primary bg-primary" : "border-muted-foreground"
                  )} />
                  <div className="flex-1">
                    <div className={cn("text-sm font-medium", !useRecommended && "text-primary")}>
                      Set my own goal
                    </div>
                    {!useRecommended && (
                      <input type="number" value={customCalories} onChange={(e) => setCustomCalories(e.target.value)}
                        placeholder="e.g. 2000" min="800" max="8000"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        autoFocus />
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Privacy */}
          {step === 5 && (
            <div className="space-y-5">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p className="text-foreground font-medium">How we use your data</p>
                      <p>Your profile data is used to provide personalized calorie recommendations and coaching cues.</p>
                      <p>Workout data, food logs, and preferences are stored locally on your device.</p>
                      <p>Your account credentials are handled securely by Supabase authentication.</p>
                      <p>You can update or delete your data at any time from Settings.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <button onClick={() => setAgreed(!agreed)} className="flex items-center gap-3 w-full text-left py-2">
                <div className={cn(
                  "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                  agreed ? "bg-primary border-primary" : "border-muted-foreground"
                )}>
                  {agreed && (
                    <svg viewBox="0 0 12 12" className="w-3 h-3 text-primary-foreground">
                      <path d="M2 6l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-sm">
                  I understand how my data is used and agree to continue
                </span>
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="px-4 pb-6 md:px-6 flex items-center gap-3 max-w-md mx-auto w-full"
        style={{ paddingBottom: "max(1.5rem, var(--safe-bottom))" }}
      >
        {step > 0 && (
          <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} className="min-h-[48px]">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button size="lg" onClick={() => setStep(step + 1)} disabled={!canProceed()} className="flex-1 min-h-[48px]">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="lg" onClick={handleFinish} disabled={!agreed} className="flex-1 min-h-[48px]">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
