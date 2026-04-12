import { redirect } from "next/navigation";

/** Shortcut to Workout Studio with Push-Up selected for rep-count testing */
export default function TestPushupPage() {
  redirect("/workout?exercise=pushup");
}
