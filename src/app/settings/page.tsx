"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkoutStore } from "@/lib/store";
import { getSettings, saveSettings, getUserProfile, saveUserProfile } from "@/lib/storage";
import { UserProfile, Gender, ActivityLevel, WeightGoal } from "@/types";
import { getActivityLabel, getGoalLabel, calculateRecommendedCalories } from "@/lib/calories";
import { createClient } from "@/utils/supabase/client";
import { Volume2, VolumeX, Camera, Gauge, Info, CheckCircle2, Shield, Monitor, User, Pencil, LogOut, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, setUserProfile } = useWorkoutStore();
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);

  const [pName, setPName] = useState(""); const [pAge, setPAge] = useState(""); const [pWeight, setPWeight] = useState("");
  const [pHFt, setPHFt] = useState(""); const [pHIn, setPHIn] = useState(""); const [pGender, setPGender] = useState<Gender>("male");
  const [pActivity, setPActivity] = useState<ActivityLevel>("moderate"); const [pDisabilities, setPDisabilities] = useState("");
  const [pGoal, setPGoal] = useState<WeightGoal>("maintain"); const [pUseRec, setPUseRec] = useState(true); const [pCustCal, setPCustCal] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      const s = getSettings();
      updateSettings(s);
      const p = getUserProfile();
      setProfile(p);
      if (p) {
        setPName(p.name);
        setPAge(p.age.toString());
        setPWeight(p.weight.toString());
        setPHFt(Math.floor(p.height / 12).toString());
        setPHIn((p.height % 12).toString());
        setPGender(p.gender || "male");
        setPActivity(p.activityLevel || "moderate");
        setPDisabilities(p.disabilities);
        setPGoal(p.weightGoal || "maintain");
        setPUseRec(p.useRecommendedCalories ?? true);
        setPCustCal(p.calorieGoal?.toString() || "");
      }
    });
  }, [updateSettings]);

  const handleSave = () => { saveSettings(settings); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleSaveProfile = () => {
    const ti = (parseInt(pHFt) || 0) * 12 + (parseInt(pHIn) || 0);
    const rc = calculateRecommendedCalories(parseFloat(pWeight) || 160, ti || 68, parseInt(pAge) || 25, pGender, pActivity, pGoal);
    const up: UserProfile = { name: pName.trim(), age: parseInt(pAge) || 0, weight: parseFloat(pWeight) || 0, height: ti, gender: pGender, activityLevel: pActivity, disabilities: pDisabilities.trim(), weightGoal: pGoal, calorieGoal: pUseRec ? rc : (parseInt(pCustCal) || rc), useRecommendedCalories: pUseRec, hasCompletedOnboarding: true, createdAt: profile?.createdAt || Date.now() };
    saveUserProfile(up); setProfile(up); setUserProfile(up); setEditing(false);
  };

  const handleLogout = async () => { const sb = createClient(); await sb.auth.signOut(); router.push("/login"); router.refresh(); };
  const fmtH = (i: number) => `${Math.floor(i / 12)}'${i % 12}"`;

  const inp = "w-full h-11 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-colors";
  const seg = "rounded-xl py-2.5 text-xs font-semibold border transition-all min-h-[44px]";
  const segA = "bg-cyan-500/10 text-cyan-300 border-cyan-500/15";
  const segI = "bg-white/[0.02] text-zinc-500 border-white/[0.06] hover:bg-white/[0.04]";

  return (
    <div className="min-h-[100dvh] has-bottom-nav md:pb-0">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-10 pb-28 md:pb-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em]">Settings</h1>
          <p className="text-zinc-500 mt-2">Profile & Preferences</p>
        </motion.div>

        <div className="space-y-5">
          {/* Profile */}
          <GlassCard className="overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-start justify-between">
              <div><h3 className="text-base font-bold flex items-center gap-2 text-zinc-200"><User className="h-4 w-4 text-cyan-400" />Profile</h3><p className="text-xs text-zinc-600 mt-0.5">Your personal info & goals</p></div>
              {profile && !editing && <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="border-white/[0.08] bg-white/[0.02]"><Pencil className="h-3.5 w-3.5" />Edit</Button>}
            </div>
            <div className="px-5 pb-5">
              {!editing && profile ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <PF label="Name" value={profile.name} /><PF label="Age" value={profile.age.toString()} />
                    <PF label="Weight" value={`${profile.weight} lbs`} /><PF label="Height" value={fmtH(profile.height)} />
                    <PF label="Gender" value={(profile.gender || "—").charAt(0).toUpperCase() + (profile.gender || "").slice(1)} />
                    <PF label="Activity" value={profile.activityLevel ? getActivityLabel(profile.activityLevel).split("(")[0].trim() : "—"} />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <PF label="Goal" value={profile.weightGoal ? getGoalLabel(profile.weightGoal) : "—"} />
                    <div className="glass-card rounded-xl border-cyan-500/10 px-4 py-3"><div className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-1 flex items-center gap-1"><Flame className="h-3 w-3 text-cyan-400" />Calorie Goal</div><div className="text-base font-bold tabular-nums text-cyan-400">{profile.calorieGoal || "—"} cal</div></div>
                  </div>
                  {profile.disabilities && profile.disabilities.toLowerCase() !== "none" && <PF label="Conditions" value={profile.disabilities} fw />}
                </div>
              ) : editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-1.5 block">Name</label><input type="text" value={pName} onChange={e => setPName(e.target.value)} className={inp} /></div>
                    <div><label className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-1.5 block">Age</label><input type="number" value={pAge} onChange={e => setPAge(e.target.value)} className={inp} /></div>
                    <div><label className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-1.5 block">Weight (lbs)</label><input type="number" value={pWeight} onChange={e => setPWeight(e.target.value)} className={inp} /></div>
                    <div><label className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-1.5 block">Height</label><div className="flex gap-2"><input type="number" value={pHFt} onChange={e => setPHFt(e.target.value)} placeholder="ft" className={inp} /><input type="number" value={pHIn} onChange={e => setPHIn(e.target.value)} placeholder="in" className={inp} /></div></div>
                  </div>
                  <div><label className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-1.5 block">Gender</label><div className="flex gap-2">{(["male","female","other"] as Gender[]).map(g => <button key={g} onClick={() => setPGender(g)} className={cn("flex-1",seg,pGender===g?segA:segI)}>{g.charAt(0).toUpperCase()+g.slice(1)}</button>)}</div></div>
                  <div><label className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-1.5 block">Activity Level</label><div className="space-y-1.5">{(["sedentary","light","moderate","active","very_active"] as ActivityLevel[]).map(l => <button key={l} onClick={() => setPActivity(l)} className={cn("w-full rounded-xl px-4 py-2.5 text-left text-xs border transition-all min-h-[44px]",pActivity===l?`${segA} font-medium`:segI)}>{getActivityLabel(l)}</button>)}</div></div>
                  <div><label className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-1.5 block">Weight Goal</label><div className="flex gap-2">{(["lose","maintain","gain"] as WeightGoal[]).map(g => <button key={g} onClick={() => setPGoal(g)} className={cn("flex-1",seg,pGoal===g?segA:segI)}>{getGoalLabel(g)}</button>)}</div></div>
                  <div><label className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-1.5 block">Calorie Goal</label><div className="flex gap-2"><button onClick={() => setPUseRec(true)} className={cn("flex-1",seg,pUseRec?segA:segI)}>Recommended</button><button onClick={() => setPUseRec(false)} className={cn("flex-1",seg,!pUseRec?segA:segI)}>Custom</button></div>{!pUseRec && <input type="number" value={pCustCal} onChange={e => setPCustCal(e.target.value)} placeholder="e.g. 2000" className={cn(inp,"mt-2")} />}</div>
                  <div><label className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-1.5 block">Conditions</label><input type="text" value={pDisabilities} onChange={e => setPDisabilities(e.target.value)} placeholder="none" className={inp} /></div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSaveProfile} className="min-h-[44px] flex-1 rounded-xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 text-white hover:brightness-110 transition-all">Save Profile</button>
                    <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="min-h-[44px] flex-1 rounded-xl border-white/[0.08] bg-white/[0.02]">Cancel</Button>
                  </div>
                </div>
              ) : <p className="text-sm text-zinc-600">No profile yet. Complete onboarding to get started.</p>}
            </div>
          </GlassCard>

          {/* Voice Coach */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-1">{settings.voiceEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4 text-zinc-600" />}<h3 className="text-base font-bold text-zinc-200">Voice Coach</h3></div>
            <p className="text-xs text-zinc-600 mb-4">Spoken coaching cues during workouts</p>
            <div className="flex items-center justify-between gap-4 glass-card rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-zinc-300">{settings.voiceEnabled ? "Enabled" : "Disabled"}</span>
              <button type="button" onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })} className={cn("relative inline-flex h-7 w-12 items-center rounded-full transition-all min-h-[28px] min-w-[48px]", settings.voiceEnabled ? "bg-cyan-500 shadow-[0_0_16px_-4px_rgba(6,182,212,0.5)]" : "bg-white/[0.08]")} aria-pressed={settings.voiceEnabled}>
                <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform", settings.voiceEnabled ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>
          </GlassCard>

          {/* Sensitivity */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-1"><Gauge className="h-4 w-4 text-cyan-400" /><h3 className="text-base font-bold text-zinc-200">Detection Sensitivity</h3></div>
            <p className="text-xs text-zinc-600 mb-4">Higher sensitivity flags more form issues</p>
            <div className="grid grid-cols-3 gap-2 glass-card rounded-xl p-1.5">
              {(["low","medium","high"] as const).map(l => <button key={l} onClick={() => updateSettings({ sensitivity: l })} className={cn("rounded-lg px-3 py-2.5 text-sm font-semibold transition-all min-h-[40px]", settings.sensitivity === l ? "bg-cyan-500/10 text-cyan-300" : "text-zinc-500 hover:text-zinc-300")}>{l.charAt(0).toUpperCase()+l.slice(1)}</button>)}
            </div>
          </GlassCard>

          {/* Camera */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4"><Camera className="h-4 w-4 text-cyan-400" /><h3 className="text-base font-bold text-zinc-200">Camera Setup</h3></div>
            <div className="space-y-2">{[{ icon: Monitor, text: "Position camera so your full body is visible" }, { icon: Shield, text: "Ensure good lighting — avoid backlight" }, { icon: Camera, text: "Stand 6-10 feet from the camera" }, { icon: Info, text: "Wear form-fitting clothes for accuracy" }, { icon: CheckCircle2, text: "Keep background uncluttered" }].map(({ icon: I, text }) => (
              <div key={text} className="flex items-start gap-3 glass-card rounded-xl px-3.5 py-2.5"><I className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" /><span className="text-xs text-zinc-400">{text}</span></div>
            ))}</div>
          </GlassCard>

          {/* Privacy */}
          <GlassCard className="p-5">
            <div className="flex items-start gap-3"><Shield className="h-5 w-5 text-cyan-400 mt-0.5 shrink-0" /><div><div className="flex items-center gap-2 mb-1.5"><p className="text-sm font-bold text-zinc-200">Data Privacy</p><Badge variant="outline" className="text-[10px] text-zinc-500">Local-first</Badge></div><p className="text-xs text-zinc-500 leading-relaxed">Your profile, workout history, and food logs are stored locally. Account credentials are handled securely by Supabase.</p></div></div>
          </GlassCard>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pb-2">
            <button onClick={handleSave} className="w-full sm:flex-1 min-h-[48px] rounded-2xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 text-white transition-all hover:shadow-[0_0_32px_-4px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2">
              {saved ? <><CheckCircle2 className="h-4 w-4" />Saved!</> : "Save Settings"}
            </button>
            <Button onClick={handleLogout} variant="outline" size="lg" className="w-full sm:w-auto sm:min-w-[140px] min-h-[48px] rounded-2xl border-white/[0.08] bg-white/[0.02]"><LogOut className="h-4 w-4" />Logout</Button>
          </div>
          {saved && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-400 block">Saved to local storage</motion.span>}
        </div>
      </div>
    </div>
  );
}

function PF({ label, value, fw }: { label: string; value: string; fw?: boolean }) {
  return <div className={cn("glass-card rounded-xl px-4 py-3", fw && "col-span-2")}><div className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-1">{label}</div><div className="text-sm font-medium text-zinc-200">{value}</div></div>;
}
