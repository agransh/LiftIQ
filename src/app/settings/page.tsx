"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkoutStore } from "@/lib/store";
import { getSettings, saveSettings, getUserProfile, saveUserProfile, fetchSettings, fetchUserProfile } from "@/lib/storage";
import { UserProfile, Gender, ActivityLevel, WeightGoal } from "@/types";
import { getActivityLabel, getGoalLabel, calculateRecommendedCalories } from "@/lib/calories";
import { createClient } from "@/utils/supabase/client";
import {
  Settings,
  Volume2,
  VolumeX,
  Camera,
  Gauge,
  Info,
  CheckCircle2,
  Shield,
  Monitor,
  User,
  Pencil,
  LogOut,
  Flame,
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
      setProfileName(p.name);
      setProfileAge(p.age.toString());
      setProfileWeight(p.weight.toString());
      setProfileHeightFt(Math.floor(p.height / 12).toString());
      setProfileHeightIn((p.height % 12).toString());
      setProfileGender(p.gender || "male");
      setProfileActivity(p.activityLevel || "moderate");
      setProfileDisabilities(p.disabilities);
      setProfileGoal(p.weightGoal || "maintain");
      setProfileUseRec(p.useRecommendedCalories ?? true);
      setProfileCustomCal(p.calorieGoal?.toString() || "");
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

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveProfile = () => {
    const totalInches = (parseInt(profileHeightFt) || 0) * 12 + (parseInt(profileHeightIn) || 0);
    const rec = calculateRecommendedCalories(
      parseFloat(profileWeight) || 160, totalInches || 68,
      parseInt(profileAge) || 25, profileGender, profileActivity, profileGoal
    );
    const updatedProfile: UserProfile = {
      name: profileName.trim(),
      age: parseInt(profileAge) || 0,
      weight: parseFloat(profileWeight) || 0,
      height: totalInches,
      gender: profileGender,
      activityLevel: profileActivity,
      disabilities: profileDisabilities.trim(),
      weightGoal: profileGoal,
      calorieGoal: profileUseRec ? rec : (parseInt(profileCustomCal) || rec),
      useRecommendedCalories: profileUseRec,
      hasCompletedOnboarding: true,
      createdAt: profile?.createdAt || Date.now(),
    };
    saveUserProfile(updatedProfile);
    setProfile(updatedProfile);
    setUserProfile(updatedProfile);
    setEditingProfile(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const formatHeight = (inches: number) => {
    const ft = Math.floor(inches / 12);
    const inc = inches % 12;
    return `${ft}'${inc}"`;
  };

  const inputClass = "w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="min-h-[100dvh] bg-background has-bottom-nav md:pb-0">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 md:py-6">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Settings
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Profile and preferences
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* User Profile */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="px-4 pt-4 pb-2 md:px-6 md:pt-6 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Profile
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Your personal information &amp; goals
                </CardDescription>
              </div>
              {profile && !editingProfile && (
                <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)} className="min-h-[36px]">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              {!editingProfile && profile ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ProfileField label="Name" value={profile.name} />
                    <ProfileField label="Age" value={profile.age.toString()} />
                    <ProfileField label="Weight" value={`${profile.weight} lbs`} />
                    <ProfileField label="Height" value={formatHeight(profile.height)} />
                    <ProfileField label="Gender" value={(profile.gender || "—").charAt(0).toUpperCase() + (profile.gender || "").slice(1)} />
                    <ProfileField label="Activity" value={profile.activityLevel ? getActivityLabel(profile.activityLevel).split("(")[0].trim() : "—"} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ProfileField label="Goal" value={profile.weightGoal ? getGoalLabel(profile.weightGoal) : "—"} />
                    <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Flame className="h-2.5 w-2.5 text-orange-400" />
                        Calorie Goal
                      </div>
                      <div className="text-sm font-medium text-primary">{profile.calorieGoal || "—"} cal</div>
                    </div>
                  </div>
                  {profile.disabilities && profile.disabilities.toLowerCase() !== "none" && (
                    <ProfileField label="Conditions" value={profile.disabilities} fullWidth />
                  )}
                </div>
              ) : editingProfile ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Name</label>
                      <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Age</label>
                      <input type="number" value={profileAge} onChange={(e) => setProfileAge(e.target.value)} min="13" max="100" className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Weight (lbs)</label>
                      <input type="number" value={profileWeight} onChange={(e) => setProfileWeight(e.target.value)} min="50" className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Height</label>
                      <div className="flex gap-2">
                        <input type="number" value={profileHeightFt} onChange={(e) => setProfileHeightFt(e.target.value)} placeholder="ft" min="3" max="8" className={inputClass} />
                        <input type="number" value={profileHeightIn} onChange={(e) => setProfileHeightIn(e.target.value)} placeholder="in" min="0" max="11" className={inputClass} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Gender</label>
                    <div className="flex gap-2">
                      {(["male", "female", "other"] as Gender[]).map((g) => (
                        <button key={g} onClick={() => setProfileGender(g)}
                          className={cn("flex-1 rounded-lg py-2 text-xs font-medium border transition-colors",
                            profileGender === g ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary/50 text-muted-foreground border-transparent")}>
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Activity Level</label>
                    <div className="space-y-1">
                      {(["sedentary", "light", "moderate", "active", "very_active"] as ActivityLevel[]).map((level) => (
                        <button key={level} onClick={() => setProfileActivity(level)}
                          className={cn("w-full rounded-lg px-3 py-2 text-left text-xs border transition-colors",
                            profileActivity === level ? "bg-primary/10 text-primary border-primary/30 font-medium" : "bg-secondary/20 text-muted-foreground border-transparent")}>
                          {getActivityLabel(level)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Weight Goal</label>
                    <div className="flex gap-2">
                      {(["lose", "maintain", "gain"] as WeightGoal[]).map((g) => (
                        <button key={g} onClick={() => setProfileGoal(g)}
                          className={cn("flex-1 rounded-lg py-2 text-xs font-medium border transition-colors",
                            profileGoal === g ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary/50 text-muted-foreground border-transparent")}>
                          {getGoalLabel(g)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Calorie Goal</label>
                    <div className="flex gap-2">
                      <button onClick={() => setProfileUseRec(true)}
                        className={cn("flex-1 rounded-lg py-2 text-xs font-medium border transition-colors",
                          profileUseRec ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary/50 text-muted-foreground border-transparent")}>
                        Recommended
                      </button>
                      <button onClick={() => setProfileUseRec(false)}
                        className={cn("flex-1 rounded-lg py-2 text-xs font-medium border transition-colors",
                          !profileUseRec ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary/50 text-muted-foreground border-transparent")}>
                        Custom
                      </button>
                    </div>
                    {!profileUseRec && (
                      <input type="number" value={profileCustomCal} onChange={(e) => setProfileCustomCal(e.target.value)} placeholder="e.g. 2000" min="800" className={cn(inputClass, "mt-2")} />
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Conditions</label>
                    <input type="text" value={profileDisabilities} onChange={(e) => setProfileDisabilities(e.target.value)} placeholder="none" className={inputClass} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSaveProfile} className="min-h-[40px]">Save Profile</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingProfile(false)} className="min-h-[40px]">Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No profile set up yet. Complete onboarding to get started.</p>
              )}
            </CardContent>
          </Card>

          {/* Voice Coach */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="px-4 pt-4 pb-2 md:px-6 md:pt-6">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                {settings.voiceEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                Voice Coach
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Enable spoken coaching cues during workouts
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
                  className={cn(
                    "relative inline-flex h-7 w-12 items-center rounded-full transition-colors min-h-[44px] min-w-[48px]",
                    settings.voiceEnabled ? "bg-primary" : "bg-secondary"
                  )}
                >
                  <span className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                    settings.voiceEnabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
                <span className="text-sm">
                  {settings.voiceEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Sensitivity */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="px-4 pt-4 pb-2 md:px-6 md:pt-6">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" />
                Detection Sensitivity
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Higher sensitivity flags more form issues
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <div className="flex gap-2 md:gap-3">
                {(["low", "medium", "high"] as const).map((level) => (
                  <button key={level} onClick={() => updateSettings({ sensitivity: level })}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-3 md:px-4 md:py-2.5 text-sm font-medium transition-all border min-h-[44px]",
                      settings.sensitivity === level
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary active:bg-secondary"
                    )}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Camera Help */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="px-4 pt-4 pb-2 md:px-6 md:pt-6">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                Camera Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <div className="space-y-2.5">
                {[
                  { icon: Monitor, text: "Position camera so your full body is visible" },
                  { icon: Shield, text: "Ensure good lighting — avoid backlight" },
                  { icon: Camera, text: "Stand 6-10 feet from the camera" },
                  { icon: Info, text: "Wear form-fitting clothes for accuracy" },
                  { icon: CheckCircle2, text: "Keep background uncluttered" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3 text-xs md:text-sm">
                    <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data disclaimer */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-4 pb-4 md:pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="text-foreground font-medium text-sm">Data Privacy</p>
                  <p>Your profile, workout history, and food logs are stored locally on this device. Account credentials are handled securely by Supabase.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save + Logout */}
          <div className="flex items-center gap-3 pb-4">
            <Button onClick={handleSave} size="lg" className="flex-1 md:flex-none min-h-[48px]">
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
            <Button onClick={handleLogout} variant="outline" size="lg" className="min-h-[48px]">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          {saved && (
            <span className="text-xs md:text-sm text-emerald-400 -mt-3 block">
              Saved to local storage
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={cn("rounded-lg bg-secondary/50 px-3 py-2.5", fullWidth && "col-span-2")}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
