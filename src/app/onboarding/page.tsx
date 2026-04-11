"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ChevronLeft, Flame, Aperture, Shield } from "lucide-react";
import { saveUserProfile } from "@/lib/storage";
import { useWorkoutStore } from "@/lib/store";
import { UserProfile, WeightGoal, Gender, ActivityLevel } from "@/types";
import { calculateRecommendedCalories, getActivityLabel } from "@/lib/calories";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const { setUserProfile } = useWorkoutStore();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [weight, setWeight] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [disabilities, setDisabilities] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [weightGoal, setWeightGoal] = useState<WeightGoal>("maintain");
  const [useRecommended, setUseRecommended] = useState(true);
  const [customCalories, setCustomCalories] = useState("");
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
    return calculateRecommendedCalories(parseFloat(weight) || 160, totalInches || 68, parseInt(age) || 25, gender, activityLevel, weightGoal);
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
      name: name.trim(), age: parseInt(age) || 0, weight: parseFloat(weight) || 0,
      height: totalInches, gender, activityLevel, disabilities: disabilities.trim(),
      weightGoal, calorieGoal: useRecommended ? recommendedCalories : (parseInt(customCalories) || recommendedCalories),
      useRecommendedCalories: useRecommended, hasCompletedOnboarding: true, createdAt: Date.now(),
    };
    saveUserProfile(profile);
    setUserProfile(profile);
    router.push("/workout");
  };

  const inputClass = "w-full h-12 rounded-xl bg-zinc-800/50 border border-zinc-700 px-4 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-colors";
  const btnIdle = "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:bg-zinc-800";
  const btnActive = "bg-purple-500/10 text-purple-400 border-purple-500/20";

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-gradient-to-br from-purple-600/10 via-pink-500/5 to-transparent blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4 md:px-6 md:pt-6 relative" style={{ paddingTop: "max(1rem, var(--safe-top))" }}>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Aperture className="h-5 w-5 text-purple-400" />
          </div>
          <span className="text-lg font-bold tracking-tight">Lift<span className="text-purple-400">IQ</span></span>
        </div>
        <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs">Step {step + 1} of {steps.length}</Badge>
      </div>

      {/* Progress */}
      <div className="mt-5 px-4 md:px-6 relative">
        <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" initial={false} animate={{ width: `${((step + 1) / steps.length) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 24 }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8 relative">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.25 }}>
              <h1 className="text-3xl font-bold tracking-tight">{steps[step].title}</h1>
              <p className="mt-1.5 text-sm text-zinc-500">{steps[step].subtitle}</p>

              <div className="mt-8">
                {step === 0 && (
                  <div className="space-y-4">
                    <div><label className="mb-1.5 block text-sm text-zinc-500">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} /></div>
                    <div><label className="mb-1.5 block text-sm text-zinc-500">Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Your age" min="13" max="100" className={inputClass} /></div>
                    <div>
                      <label className="mb-1.5 block text-sm text-zinc-500">Gender</label>
                      <div className="flex gap-2">{(["male", "female", "other"] as Gender[]).map((g) => (<button key={g} type="button" onClick={() => setGender(g)} className={cn("flex-1 rounded-xl border py-3 text-sm font-medium min-h-[48px] transition-all", gender === g ? btnActive : btnIdle)}>{g.charAt(0).toUpperCase() + g.slice(1)}</button>))}</div>
                    </div>
                  </div>
                )}
                {step === 1 && (
                  <div className="space-y-4">
                    <div><label className="mb-1.5 block text-sm text-zinc-500">Weight (lbs)</label><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 160" min="50" max="500" className={inputClass} /></div>
                    <div><label className="mb-1.5 block text-sm text-zinc-500">Height</label><div className="flex gap-3"><input type="number" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} placeholder="ft" min="3" max="8" className={cn(inputClass, "flex-1")} /><input type="number" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} placeholder="in" min="0" max="11" className={cn(inputClass, "flex-1")} /></div></div>
                  </div>
                )}
                {step === 2 && (
                  <div>
                    <label className="mb-1.5 block text-sm text-zinc-500">Physical disabilities or conditions</label>
                    <textarea value={disabilities} onChange={(e) => setDisabilities(e.target.value)} placeholder="e.g. bad left knee, or 'none'" rows={4} className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                    <p className="mt-2 text-xs text-zinc-600">Helps us provide safer coaching. Leave blank if not applicable.</p>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm text-zinc-500">What&apos;s your goal?</label>
                      <div className="space-y-2">{([{ value: "lose" as const, label: "Lose Weight", desc: "Calorie deficit" }, { value: "maintain" as const, label: "Maintain Weight", desc: "Stay at current weight" }, { value: "gain" as const, label: "Gain Weight", desc: "Calorie surplus" }]).map((opt) => (<button key={opt.value} type="button" onClick={() => setWeightGoal(opt.value)} className={cn("flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all", weightGoal === opt.value ? btnActive : btnIdle)}><div><div className={cn("text-sm font-medium", weightGoal === opt.value && "text-purple-400")}>{opt.label}</div><div className="text-[11px] text-zinc-600">{opt.desc}</div></div><div className={cn("h-4 w-4 shrink-0 rounded-full border-2", weightGoal === opt.value ? "border-purple-400 bg-purple-400" : "border-zinc-600")} /></button>))}</div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-zinc-500">Activity Level</label>
                      <div className="space-y-1.5">{(["sedentary", "light", "moderate", "active", "very_active"] as ActivityLevel[]).map((level) => (<button key={level} type="button" onClick={() => setActivityLevel(level)} className={cn("w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-left text-sm transition-all", activityLevel === level ? `${btnActive} font-medium` : btnIdle)}>{getActivityLabel(level)}</button>))}</div>
                    </div>
                  </div>
                )}
                {step === 4 && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-purple-500/10 bg-purple-500/5 p-6 text-center">
                      <div className="text-xs text-zinc-500 mb-2 flex items-center justify-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-400" /> Recommended Daily Intake</div>
                      <div className="text-5xl font-bold tracking-tight text-purple-400">{recommendedCalories}<span className="ml-1.5 text-lg text-zinc-500">cal</span></div>
                      <p className="mt-3 text-[11px] text-zinc-600">{weight || "160"} lbs, {heightFt || "5"}&apos;{heightIn || "8"}&quot;, age {age || "25"}{weightGoal === "lose" ? " — deficit" : weightGoal === "gain" ? " — surplus" : ""}</p>
                    </div>
                    <div className="space-y-3">
                      <button type="button" onClick={() => setUseRecommended(true)} className={cn("flex min-h-[48px] w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all", useRecommended ? btnActive : btnIdle)}>
                        <div className={cn("h-4 w-4 shrink-0 rounded-full border-2", useRecommended ? "border-purple-400 bg-purple-400" : "border-zinc-600")} />
                        <div><div className={cn("text-sm font-medium", useRecommended && "text-purple-400")}>Use recommended ({recommendedCalories} cal)</div><div className="text-[11px] text-zinc-600">Calculated from your profile</div></div>
                      </button>
                      <button type="button" onClick={() => setUseRecommended(false)} className={cn("flex min-h-[48px] w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all", !useRecommended ? btnActive : btnIdle)}>
                        <div className={cn("h-4 w-4 shrink-0 rounded-full border-2", !useRecommended ? "border-purple-400 bg-purple-400" : "border-zinc-600")} />
                        <div className="flex-1"><div className={cn("text-sm font-medium", !useRecommended && "text-purple-400")}>Set my own goal</div>{!useRecommended && <input type="number" value={customCalories} onChange={(e) => setCustomCalories(e.target.value)} placeholder="e.g. 2000" min="800" max="8000" onClick={(e) => e.stopPropagation()} className={cn(inputClass, "mt-2 h-10 text-sm")} autoFocus />}</div>
                      </button>
                    </div>
                  </div>
                )}
                {step === 5 && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
                        <div className="space-y-2 text-sm text-zinc-500">
                          <p className="font-medium text-zinc-200">How we use your data</p>
                          <p>Profile data is used for personalized calorie recommendations and coaching.</p>
                          <p>Workout data and food logs are stored locally on your device.</p>
                          <p>Account credentials are handled securely by Supabase.</p>
                          <p>You can update or delete your data at any time from Settings.</p>
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setAgreed(!agreed)} className="flex w-full items-center gap-3 rounded-xl py-3 text-left hover:bg-zinc-900 transition-colors">
                      <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors", agreed ? "border-purple-400 bg-purple-400" : "border-zinc-600")}>
                        {agreed && <svg viewBox="0 0 12 12" className="h-3 w-3 text-white"><path d="M2 6l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <span className="text-sm text-zinc-300">I understand how my data is used and agree to continue</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 pb-6 md:px-6 relative" style={{ paddingBottom: "max(1.5rem, var(--safe-bottom))" }}>
        {step > 0 && (
          <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} className="min-h-[48px] shrink-0 gap-1 border-zinc-700 text-zinc-400">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button size="lg" onClick={() => setStep(step + 1)} disabled={!canProceed()} className="min-h-[48px] flex-1 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 font-bold">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="lg" onClick={handleFinish} disabled={!agreed} className="min-h-[48px] flex-1 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 font-bold">
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
