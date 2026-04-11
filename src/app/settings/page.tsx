"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkoutStore } from "@/lib/store";
import { getSettings, saveSettings, getUserProfile, saveUserProfile, fetchSettings, fetchUserProfile } from "@/lib/storage";
import { UserProfile, Gender, ActivityLevel, WeightGoal } from "@/types";
import { getActivityLabel, getGoalLabel, calculateRecommendedCalories } from "@/lib/calories";
import { createClient } from "@/utils/supabase/client";
import {
  Settings, Volume2, VolumeX, Camera, Gauge, Info, CheckCircle2, Shield, Monitor, User, Pencil, LogOut, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, setUserProfile } = useWorkoutStore();
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [profileAge, setProfileAge] = useState("");
  const [profileWeight, setProfileWeight] = useState("");
  const [profileHeightFt, setProfileHeightFt] = useState("");
  const [profileHeightIn, setProfileHeightIn] = useState("");
  const [profileGender, setProfileGender] = useState<Gender>("male");
  const [profileActivity, setProfileActivity] = useState<ActivityLevel>("moderate");
  const [profileDisabilities, setProfileDisabilities] = useState("");
  const [profileGoal, setProfileGoal] = useState<WeightGoal>("maintain");
  const [profileUseRec, setProfileUseRec] = useState(true);
  const [profileCustomCal, setProfileCustomCal] = useState("");

  const applyProfile = (p: UserProfile | null) => {
    setProfile(p);
    if (p) {
      setProfileName(p.name); setProfileAge(p.age.toString()); setProfileWeight(p.weight.toString());
      setProfileHeightFt(Math.floor(p.height / 12).toString()); setProfileHeightIn((p.height % 12).toString());
      setProfileGender(p.gender || "male"); setProfileActivity(p.activityLevel || "moderate");
      setProfileDisabilities(p.disabilities); setProfileGoal(p.weightGoal || "maintain");
      setProfileUseRec(p.useRecommendedCalories ?? true); setProfileCustomCal(p.calorieGoal?.toString() || "");
    }
  };

  useEffect(() => {
    updateSettings(getSettings());
    applyProfile(getUserProfile());
    // Fetch from Supabase
    (async () => {
      const [s, p] = await Promise.all([fetchSettings(), fetchUserProfile()]);
      updateSettings(s);
      applyProfile(p);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => { saveSettings(settings); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleSaveProfile = () => {
    const totalInches = (parseInt(profileHeightFt) || 0) * 12 + (parseInt(profileHeightIn) || 0);
    const rec = calculateRecommendedCalories(parseFloat(profileWeight) || 160, totalInches || 68, parseInt(profileAge) || 25, profileGender, profileActivity, profileGoal);
    const updatedProfile: UserProfile = {
      name: profileName.trim(), age: parseInt(profileAge) || 0, weight: parseFloat(profileWeight) || 0,
      height: totalInches, gender: profileGender, activityLevel: profileActivity,
      disabilities: profileDisabilities.trim(), weightGoal: profileGoal,
      calorieGoal: profileUseRec ? rec : (parseInt(profileCustomCal) || rec),
      useRecommendedCalories: profileUseRec, hasCompletedOnboarding: true, createdAt: profile?.createdAt || Date.now(),
    };
    saveUserProfile(updatedProfile); setProfile(updatedProfile); setUserProfile(updatedProfile); setEditingProfile(false);
  };

  const handleLogout = async () => { const supabase = createClient(); await supabase.auth.signOut(); router.push("/login"); router.refresh(); };
  const formatHeight = (inches: number) => `${Math.floor(inches / 12)}'${inches % 12}"`;

  const inputClass = "w-full h-11 rounded-xl bg-zinc-800/50 border border-zinc-700 px-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-colors";
  const segBtn = "rounded-xl py-2.5 text-xs font-medium border transition-all min-h-[44px]";
  const segActive = "bg-purple-500/10 text-purple-400 border-purple-500/20";
  const segIdle = "bg-zinc-800/50 text-zinc-500 border-zinc-700 hover:bg-zinc-800";

  return (
    <div className="min-h-[100dvh] bg-zinc-950 has-bottom-nav md:pb-0">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-10 pb-28 md:pb-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Profile & Preferences</p>
        </motion.div>

        <div className="space-y-5">
          {/* Profile */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="px-5 pt-5 pb-3 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2"><User className="h-4 w-4 text-purple-400" /> Profile</h3>
                <p className="text-xs text-zinc-600 mt-0.5">Your personal info & goals</p>
              </div>
              {profile && !editingProfile && (
                <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)} className="border-zinc-700 text-zinc-400">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
            </div>
            <div className="px-5 pb-5">
              {!editingProfile && profile ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <ProfileField label="Name" value={profile.name} />
                    <ProfileField label="Age" value={profile.age.toString()} />
                    <ProfileField label="Weight" value={`${profile.weight} lbs`} />
                    <ProfileField label="Height" value={formatHeight(profile.height)} />
                    <ProfileField label="Gender" value={(profile.gender || "—").charAt(0).toUpperCase() + (profile.gender || "").slice(1)} />
                    <ProfileField label="Activity" value={profile.activityLevel ? getActivityLabel(profile.activityLevel).split("(")[0].trim() : "—"} />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <ProfileField label="Goal" value={profile.weightGoal ? getGoalLabel(profile.weightGoal) : "—"} />
                    <div className="rounded-xl bg-purple-500/5 border border-purple-500/10 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1 flex items-center gap-1"><Flame className="h-3 w-3 text-purple-400" />Calorie Goal</div>
                      <div className="text-base font-semibold tabular-nums text-purple-400">{profile.calorieGoal || "—"} cal</div>
                    </div>
                  </div>
                  {profile.disabilities && profile.disabilities.toLowerCase() !== "none" && (
                    <ProfileField label="Conditions" value={profile.disabilities} fullWidth />
                  )}
                </div>
              ) : editingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5 block">Name</label><input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className={inputClass} /></div>
                    <div><label className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5 block">Age</label><input type="number" value={profileAge} onChange={(e) => setProfileAge(e.target.value)} min="13" max="100" className={inputClass} /></div>
                    <div><label className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5 block">Weight (lbs)</label><input type="number" value={profileWeight} onChange={(e) => setProfileWeight(e.target.value)} min="50" className={inputClass} /></div>
                    <div><label className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5 block">Height</label><div className="flex gap-2"><input type="number" value={profileHeightFt} onChange={(e) => setProfileHeightFt(e.target.value)} placeholder="ft" min="3" max="8" className={inputClass} /><input type="number" value={profileHeightIn} onChange={(e) => setProfileHeightIn(e.target.value)} placeholder="in" min="0" max="11" className={inputClass} /></div></div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5 block">Gender</label>
                    <div className="flex gap-2">{(["male", "female", "other"] as Gender[]).map((g) => (<button key={g} onClick={() => setProfileGender(g)} className={cn("flex-1", segBtn, profileGender === g ? segActive : segIdle)}>{g.charAt(0).toUpperCase() + g.slice(1)}</button>))}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5 block">Activity Level</label>
                    <div className="space-y-1.5">{(["sedentary", "light", "moderate", "active", "very_active"] as ActivityLevel[]).map((level) => (<button key={level} onClick={() => setProfileActivity(level)} className={cn("w-full rounded-xl px-4 py-2.5 text-left text-xs border transition-all min-h-[44px]", profileActivity === level ? `${segActive} font-medium` : segIdle)}>{getActivityLabel(level)}</button>))}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5 block">Weight Goal</label>
                    <div className="flex gap-2">{(["lose", "maintain", "gain"] as WeightGoal[]).map((g) => (<button key={g} onClick={() => setProfileGoal(g)} className={cn("flex-1", segBtn, profileGoal === g ? segActive : segIdle)}>{getGoalLabel(g)}</button>))}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5 block">Calorie Goal</label>
                    <div className="flex gap-2">
                      <button onClick={() => setProfileUseRec(true)} className={cn("flex-1", segBtn, profileUseRec ? segActive : segIdle)}>Recommended</button>
                      <button onClick={() => setProfileUseRec(false)} className={cn("flex-1", segBtn, !profileUseRec ? segActive : segIdle)}>Custom</button>
                    </div>
                    {!profileUseRec && <input type="number" value={profileCustomCal} onChange={(e) => setProfileCustomCal(e.target.value)} placeholder="e.g. 2000" min="800" className={cn(inputClass, "mt-2")} />}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5 block">Conditions</label>
                    <input type="text" value={profileDisabilities} onChange={(e) => setProfileDisabilities(e.target.value)} placeholder="none" className={inputClass} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSaveProfile} className="min-h-[44px] flex-1 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0">Save Profile</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingProfile(false)} className="min-h-[44px] flex-1 rounded-xl border-zinc-700 text-zinc-400">Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-600">No profile yet. Complete onboarding to get started.</p>
              )}
            </div>
          </div>

          {/* Voice Coach */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center gap-2 mb-1">
              {settings.voiceEnabled ? <Volume2 className="h-4 w-4 text-purple-400" /> : <VolumeX className="h-4 w-4 text-zinc-600" />}
              <h3 className="text-base font-semibold">Voice Coach</h3>
            </div>
            <p className="text-xs text-zinc-600 mb-4">Enable spoken coaching cues during workouts</p>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3">
              <span className="text-sm font-medium">{settings.voiceEnabled ? "Enabled" : "Disabled"}</span>
              <button type="button" onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
                className={cn("relative inline-flex h-7 w-12 items-center rounded-full transition-all min-h-[28px] min-w-[48px]", settings.voiceEnabled ? "bg-purple-500" : "bg-zinc-700")}
                aria-pressed={settings.voiceEnabled}>
                <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform", settings.voiceEnabled ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>
          </div>

          {/* Sensitivity */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center gap-2 mb-1"><Gauge className="h-4 w-4 text-purple-400" /><h3 className="text-base font-semibold">Detection Sensitivity</h3></div>
            <p className="text-xs text-zinc-600 mb-4">Higher sensitivity flags more form issues</p>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-950 border border-zinc-800 p-1.5">
              {(["low", "medium", "high"] as const).map((level) => (
                <button key={level} type="button" onClick={() => updateSettings({ sensitivity: level })}
                  className={cn("rounded-lg px-3 py-2.5 text-sm font-medium transition-all min-h-[40px]", settings.sensitivity === level ? "bg-purple-500/10 text-purple-400" : "text-zinc-500 hover:text-zinc-300")}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Help */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center gap-2 mb-4"><Camera className="h-4 w-4 text-purple-400" /><h3 className="text-base font-semibold">Camera Setup</h3></div>
            <div className="space-y-2">
              {[
                { icon: Monitor, text: "Position camera so your full body is visible" },
                { icon: Shield, text: "Ensure good lighting — avoid backlight" },
                { icon: Camera, text: "Stand 6-10 feet from the camera" },
                { icon: Info, text: "Wear form-fitting clothes for accuracy" },
                { icon: CheckCircle2, text: "Keep background uncluttered" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5">
                  <Icon className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-zinc-400">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data privacy */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-sm font-semibold">Data Privacy</p>
                  <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">Local-first</Badge>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">Your profile, workout history, and food logs are stored locally. Account credentials are handled securely by Supabase.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pb-2">
            <Button onClick={handleSave} size="lg" className="w-full sm:flex-1 min-h-[48px] rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0">
              {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> : "Save Settings"}
            </Button>
            <Button onClick={handleLogout} variant="outline" size="lg" className="w-full sm:w-auto sm:min-w-[140px] min-h-[48px] rounded-xl border-zinc-700 text-zinc-400">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
          {saved && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-green-400 -mt-1 block">Saved to local storage</motion.span>}
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={cn("rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3", fullWidth && "col-span-2")}>
      <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
