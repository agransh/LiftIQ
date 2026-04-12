export interface Joint2D {
  x: number;
  y: number;
}

export type PoseFrame = Record<string, Joint2D>;

export interface ExerciseVisualGuide {
  id: string;
  name: string;
  description: string;
  muscles: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  connections: [string, string][];
  keyframes: PoseFrame[];
  frameDurations: number[];
  highlightJoints: string[];
  steps: { title: string; detail: string }[];
  commonMistakes: { mistake: string; fix: string }[];
  coachingCues: string[];
}

const SIDE_CONNECTIONS: [string, string][] = [
  ["head", "shoulder"],
  ["shoulder", "elbow"],
  ["elbow", "hand"],
  ["shoulder", "hip"],
  ["hip", "frontKnee"],
  ["frontKnee", "frontAnkle"],
  ["hip", "backKnee"],
  ["backKnee", "backAnkle"],
];

const STANDING: PoseFrame = {
  head: { x: 150, y: 30 },
  shoulder: { x: 148, y: 68 },
  elbow: { x: 134, y: 100 },
  hand: { x: 138, y: 128 },
  hip: { x: 150, y: 132 },
  frontKnee: { x: 152, y: 192 },
  frontAnkle: { x: 152, y: 252 },
  backKnee: { x: 148, y: 192 },
  backAnkle: { x: 148, y: 252 },
};

const squatGuide: ExerciseVisualGuide = {
  id: "squat",
  name: "Squat",
  description:
    "A foundational lower-body movement. Drive your hips back and down while keeping your chest up and knees tracking over your toes.",
  muscles: ["Quadriceps", "Glutes", "Hamstrings", "Core"],
  difficulty: "beginner",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["hip", "frontKnee", "backKnee"],
  frameDurations: [800, 600, 600, 800],
  keyframes: [
    STANDING,
    {
      head: { x: 142, y: 52 },
      shoulder: { x: 138, y: 88 },
      elbow: { x: 152, y: 108 },
      hand: { x: 162, y: 90 },
      hip: { x: 130, y: 150 },
      frontKnee: { x: 165, y: 198 },
      frontAnkle: { x: 150, y: 252 },
      backKnee: { x: 160, y: 198 },
      backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 135, y: 78 },
      shoulder: { x: 130, y: 110 },
      elbow: { x: 152, y: 126 },
      hand: { x: 165, y: 105 },
      hip: { x: 118, y: 170 },
      frontKnee: { x: 175, y: 202 },
      frontAnkle: { x: 148, y: 252 },
      backKnee: { x: 170, y: 202 },
      backAnkle: { x: 146, y: 252 },
    },
    {
      head: { x: 142, y: 52 },
      shoulder: { x: 138, y: 88 },
      elbow: { x: 152, y: 108 },
      hand: { x: 162, y: 90 },
      hip: { x: 130, y: 150 },
      frontKnee: { x: 165, y: 198 },
      frontAnkle: { x: 150, y: 252 },
      backKnee: { x: 160, y: 198 },
      backAnkle: { x: 148, y: 252 },
    },
  ],
  steps: [
    { title: "Set your stance", detail: "Feet shoulder-width apart, toes angled slightly outward." },
    { title: "Brace your core", detail: "Take a deep breath and tighten your midsection." },
    { title: "Hips back first", detail: "Initiate by pushing your hips back as if sitting into a chair." },
    { title: "Lower to depth", detail: "Descend until thighs are at least parallel to the floor." },
    { title: "Drive up", detail: "Push through your heels, squeeze glutes at the top." },
  ],
  commonMistakes: [
    { mistake: "Knees caving inward", fix: "Push knees out over your pinky toes throughout the movement." },
    { mistake: "Rising on toes", fix: "Keep weight distributed across your whole foot, especially the heels." },
    { mistake: "Excessive forward lean", fix: "Keep chest up and imagine a string pulling your sternum forward." },
    { mistake: "Not hitting depth", fix: "Work on ankle and hip mobility. Use a slight elevation under heels if needed." },
  ],
  coachingCues: [
    "Sit back, not down",
    "Chest proud, eyes forward",
    "Drive your knees out",
    "Push the earth away",
  ],
};

const lungeGuide: ExerciseVisualGuide = {
  id: "lunge",
  name: "Lunge",
  description:
    "A unilateral exercise that builds leg strength and balance. Step forward, lower until both knees are at 90 degrees, then push back to standing.",
  muscles: ["Quadriceps", "Glutes", "Hamstrings", "Hip Flexors"],
  difficulty: "intermediate",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["hip", "frontKnee", "backKnee", "frontAnkle"],
  frameDurations: [700, 600, 500, 600, 700],
  keyframes: [
    STANDING,
    {
      head: { x: 150, y: 38 },
      shoulder: { x: 150, y: 76 },
      elbow: { x: 136, y: 108 },
      hand: { x: 140, y: 138 },
      hip: { x: 152, y: 140 },
      frontKnee: { x: 185, y: 194 },
      frontAnkle: { x: 198, y: 252 },
      backKnee: { x: 120, y: 210 },
      backAnkle: { x: 102, y: 252 },
    },
    {
      head: { x: 152, y: 55 },
      shoulder: { x: 152, y: 92 },
      elbow: { x: 138, y: 124 },
      hand: { x: 142, y: 155 },
      hip: { x: 155, y: 160 },
      frontKnee: { x: 200, y: 198 },
      frontAnkle: { x: 210, y: 252 },
      backKnee: { x: 110, y: 232 },
      backAnkle: { x: 92, y: 252 },
    },
    {
      head: { x: 150, y: 38 },
      shoulder: { x: 150, y: 76 },
      elbow: { x: 136, y: 108 },
      hand: { x: 140, y: 138 },
      hip: { x: 152, y: 140 },
      frontKnee: { x: 185, y: 194 },
      frontAnkle: { x: 198, y: 252 },
      backKnee: { x: 120, y: 210 },
      backAnkle: { x: 102, y: 252 },
    },
    STANDING,
  ],
  steps: [
    { title: "Stand tall", detail: "Feet hip-width apart, shoulders back, core engaged." },
    { title: "Step forward", detail: "Take a controlled step forward with one leg, landing heel first." },
    { title: "Lower down", detail: "Bend both knees to 90°. Front knee stacks directly over ankle." },
    { title: "Back knee drops", detail: "Lower until your back knee nearly touches the floor." },
    { title: "Push back", detail: "Drive through your front heel to return to the starting position." },
  ],
  commonMistakes: [
    { mistake: "Front knee past toes", fix: "Take a longer step so your knee stays stacked over your ankle." },
    { mistake: "Torso leaning forward", fix: "Stay upright. Engage your core and look straight ahead." },
    { mistake: "Losing balance", fix: "Keep a hip-width stance — don't step onto a tightrope." },
    { mistake: "Shallow depth", fix: "Lower until your back knee is 1–2 inches from the ground." },
  ],
  coachingCues: [
    "90-90: both knees at right angles",
    "Upright torso — crown of head to the ceiling",
    "Front knee over ankle, not past toes",
    "Push through the front heel",
  ],
};

const pushupGuide: ExerciseVisualGuide = {
  id: "pushup",
  name: "Push-Up",
  description:
    "The ultimate upper-body push exercise. Maintain a rigid plank while lowering your chest to the ground and pressing back up.",
  muscles: ["Chest", "Triceps", "Anterior Deltoids", "Core"],
  difficulty: "beginner",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["shoulder", "elbow", "hip"],
  frameDurations: [700, 600, 600, 700],
  keyframes: [
    {
      head: { x: 58, y: 172 },
      shoulder: { x: 82, y: 186 },
      elbow: { x: 80, y: 218 },
      hand: { x: 78, y: 248 },
      hip: { x: 162, y: 198 },
      frontKnee: { x: 215, y: 210 },
      frontAnkle: { x: 258, y: 222 },
      backKnee: { x: 215, y: 210 },
      backAnkle: { x: 258, y: 222 },
    },
    {
      head: { x: 58, y: 192 },
      shoulder: { x: 82, y: 205 },
      elbow: { x: 62, y: 228 },
      hand: { x: 78, y: 248 },
      hip: { x: 162, y: 216 },
      frontKnee: { x: 215, y: 225 },
      frontAnkle: { x: 258, y: 235 },
      backKnee: { x: 215, y: 225 },
      backAnkle: { x: 258, y: 235 },
    },
    {
      head: { x: 58, y: 208 },
      shoulder: { x: 82, y: 220 },
      elbow: { x: 55, y: 238 },
      hand: { x: 78, y: 248 },
      hip: { x: 162, y: 230 },
      frontKnee: { x: 215, y: 238 },
      frontAnkle: { x: 258, y: 246 },
      backKnee: { x: 215, y: 238 },
      backAnkle: { x: 258, y: 246 },
    },
    {
      head: { x: 58, y: 192 },
      shoulder: { x: 82, y: 205 },
      elbow: { x: 62, y: 228 },
      hand: { x: 78, y: 248 },
      hip: { x: 162, y: 216 },
      frontKnee: { x: 215, y: 225 },
      frontAnkle: { x: 258, y: 235 },
      backKnee: { x: 215, y: 225 },
      backAnkle: { x: 258, y: 235 },
    },
  ],
  steps: [
    { title: "Set your plank", detail: "Hands directly under shoulders, body in a straight line from head to heels." },
    { title: "Lower with control", detail: "Bend your elbows to 90°, keeping them at a 45° angle from your body." },
    { title: "Chest to floor", detail: "Lower until your chest is 1–2 inches from the ground." },
    { title: "Press up", detail: "Push through your palms, fully extending your arms at the top." },
  ],
  commonMistakes: [
    { mistake: "Hips sagging", fix: "Squeeze your glutes and brace your abs to maintain a flat back." },
    { mistake: "Elbows flaring out", fix: "Keep elbows at 45° — think arrow shape, not T-shape." },
    { mistake: "Head dropping", fix: "Look slightly ahead of your hands, keep your neck neutral." },
    { mistake: "Partial reps", fix: "Go full range: lock out at top, chest near floor at bottom." },
  ],
  coachingCues: [
    "Rigid plank — no sagging, no piking",
    "Elbows 45°, not 90°",
    "Squeeze glutes the entire time",
    "Full lockout at the top",
  ],
};

const bicepCurlGuide: ExerciseVisualGuide = {
  id: "bicep-curl",
  name: "Bicep Curl",
  description:
    "An isolation exercise for the biceps. Keep your elbows pinned and curl the weight up with a controlled tempo.",
  muscles: ["Biceps", "Brachialis", "Forearms"],
  difficulty: "beginner",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["elbow", "shoulder"],
  frameDurations: [700, 500, 500, 700],
  keyframes: [
    {
      head: { x: 150, y: 30 },
      shoulder: { x: 148, y: 68 },
      elbow: { x: 148, y: 105 },
      hand: { x: 148, y: 138 },
      hip: { x: 150, y: 132 },
      frontKnee: { x: 152, y: 192 },
      frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 },
      backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 150, y: 30 },
      shoulder: { x: 148, y: 68 },
      elbow: { x: 150, y: 105 },
      hand: { x: 165, y: 95 },
      hip: { x: 150, y: 132 },
      frontKnee: { x: 152, y: 192 },
      frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 },
      backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 150, y: 30 },
      shoulder: { x: 148, y: 68 },
      elbow: { x: 152, y: 105 },
      hand: { x: 168, y: 72 },
      hip: { x: 150, y: 132 },
      frontKnee: { x: 152, y: 192 },
      frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 },
      backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 150, y: 30 },
      shoulder: { x: 148, y: 68 },
      elbow: { x: 150, y: 105 },
      hand: { x: 165, y: 95 },
      hip: { x: 150, y: 132 },
      frontKnee: { x: 152, y: 192 },
      frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 },
      backAnkle: { x: 148, y: 252 },
    },
  ],
  steps: [
    { title: "Start position", detail: "Stand with arms fully extended, palms facing forward, elbows pinned to your sides." },
    { title: "Curl up", detail: "Contract your biceps to lift the weight in a smooth arc." },
    { title: "Squeeze at top", detail: "Pause briefly at the top with a strong bicep contraction." },
    { title: "Lower slowly", detail: "Control the weight back down — take 2–3 seconds on the way down." },
  ],
  commonMistakes: [
    { mistake: "Swinging the weight", fix: "Keep your torso still. If you need to swing, lower the weight." },
    { mistake: "Elbows drifting forward", fix: "Pin your elbows to your sides throughout the curl." },
    { mistake: "Rushing the negative", fix: "Lower the weight slowly for 2–3 seconds — that's where growth happens." },
  ],
  coachingCues: [
    "Pin your elbows — only the forearm moves",
    "Squeeze hard at the top",
    "Slow and controlled on the way down",
  ],
};

const shoulderPressGuide: ExerciseVisualGuide = {
  id: "shoulder-press",
  name: "Shoulder Press",
  description:
    "An overhead pressing movement that builds shoulder strength and stability. Press from shoulder level to full lockout overhead.",
  muscles: ["Deltoids", "Triceps", "Upper Chest", "Core"],
  difficulty: "intermediate",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["shoulder", "elbow"],
  frameDurations: [700, 500, 500, 700],
  keyframes: [
    {
      head: { x: 150, y: 30 },
      shoulder: { x: 148, y: 68 },
      elbow: { x: 165, y: 68 },
      hand: { x: 168, y: 38 },
      hip: { x: 150, y: 132 },
      frontKnee: { x: 152, y: 192 },
      frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 },
      backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 150, y: 30 },
      shoulder: { x: 148, y: 68 },
      elbow: { x: 160, y: 52 },
      hand: { x: 162, y: 22 },
      hip: { x: 150, y: 132 },
      frontKnee: { x: 152, y: 192 },
      frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 },
      backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 150, y: 32 },
      shoulder: { x: 148, y: 68 },
      elbow: { x: 155, y: 42 },
      hand: { x: 155, y: 10 },
      hip: { x: 150, y: 132 },
      frontKnee: { x: 152, y: 192 },
      frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 },
      backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 150, y: 30 },
      shoulder: { x: 148, y: 68 },
      elbow: { x: 160, y: 52 },
      hand: { x: 162, y: 22 },
      hip: { x: 150, y: 132 },
      frontKnee: { x: 152, y: 192 },
      frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 },
      backAnkle: { x: 148, y: 252 },
    },
  ],
  steps: [
    { title: "Rack position", detail: "Hands at shoulder height, elbows below wrists, core braced." },
    { title: "Press overhead", detail: "Drive the weight straight up, moving your head out of the bar path." },
    { title: "Lock out", detail: "Fully extend your arms overhead with biceps near your ears." },
    { title: "Lower controlled", detail: "Bring the weight back to shoulder level with control." },
  ],
  commonMistakes: [
    { mistake: "Arching the lower back", fix: "Brace your core and squeeze your glutes to keep a neutral spine." },
    { mistake: "Pressing forward", fix: "Press straight up — the bar should end directly over your midfoot." },
    { mistake: "Flaring elbows", fix: "Keep elbows slightly in front of the bar at the start." },
  ],
  coachingCues: [
    "Straight up, not forward",
    "Core tight — no rib flare",
    "Lock out fully at the top",
  ],
};

const situpGuide: ExerciseVisualGuide = {
  id: "situp",
  name: "Sit-Up",
  description:
    "A core-strengthening exercise. Curl your torso from lying flat to an upright seated position.",
  muscles: ["Rectus Abdominis", "Hip Flexors", "Obliques"],
  difficulty: "beginner",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["hip", "shoulder"],
  frameDurations: [700, 600, 600, 700],
  keyframes: [
    {
      head: { x: 60, y: 188 },
      shoulder: { x: 95, y: 200 },
      elbow: { x: 78, y: 182 },
      hand: { x: 68, y: 178 },
      hip: { x: 155, y: 218 },
      frontKnee: { x: 200, y: 188 },
      frontAnkle: { x: 235, y: 218 },
      backKnee: { x: 200, y: 188 },
      backAnkle: { x: 235, y: 218 },
    },
    {
      head: { x: 100, y: 158 },
      shoulder: { x: 120, y: 180 },
      elbow: { x: 105, y: 155 },
      hand: { x: 95, y: 148 },
      hip: { x: 155, y: 218 },
      frontKnee: { x: 200, y: 188 },
      frontAnkle: { x: 235, y: 218 },
      backKnee: { x: 200, y: 188 },
      backAnkle: { x: 235, y: 218 },
    },
    {
      head: { x: 140, y: 132 },
      shoulder: { x: 148, y: 162 },
      elbow: { x: 135, y: 130 },
      hand: { x: 128, y: 122 },
      hip: { x: 155, y: 218 },
      frontKnee: { x: 195, y: 185 },
      frontAnkle: { x: 232, y: 218 },
      backKnee: { x: 195, y: 185 },
      backAnkle: { x: 232, y: 218 },
    },
    {
      head: { x: 100, y: 158 },
      shoulder: { x: 120, y: 180 },
      elbow: { x: 105, y: 155 },
      hand: { x: 95, y: 148 },
      hip: { x: 155, y: 218 },
      frontKnee: { x: 200, y: 188 },
      frontAnkle: { x: 235, y: 218 },
      backKnee: { x: 200, y: 188 },
      backAnkle: { x: 235, y: 218 },
    },
  ],
  steps: [
    { title: "Lie flat", detail: "Back on the floor, knees bent, feet flat. Hands behind your head or crossed on chest." },
    { title: "Curl up", detail: "Use your abs to curl your torso up — don't yank your neck." },
    { title: "Sit fully", detail: "Continue until your torso is roughly upright." },
    { title: "Lower with control", detail: "Reverse the curl slowly, keeping tension on your abs." },
  ],
  commonMistakes: [
    { mistake: "Pulling on neck", fix: "Keep your hands light — let your abs do the work." },
    { mistake: "Using momentum", fix: "Slow the movement down and focus on the contraction." },
    { mistake: "Feet lifting", fix: "Anchor your feet or have a partner hold them." },
  ],
  coachingCues: [
    "Curl, don't jerk",
    "Exhale on the way up",
    "Control the descent — no flopping",
  ],
};

export const exerciseVisualGuides: Record<string, ExerciseVisualGuide> = {
  squat: squatGuide,
  lunge: lungeGuide,
  pushup: pushupGuide,
  "bicep-curl": bicepCurlGuide,
  "shoulder-press": shoulderPressGuide,
  situp: situpGuide,
};

export function getExerciseGuide(id: string): ExerciseVisualGuide | undefined {
  return exerciseVisualGuides[id];
}
