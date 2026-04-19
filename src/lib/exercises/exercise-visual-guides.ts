export interface Joint2D {
  x: number;
  y: number;
}

export type PoseFrame = Record<string, Joint2D>;

export interface FocusArea {
  joint: string;
  label: string;
}

export interface ExerciseVisualGuide {
  id: string;
  name: string;
  description: string;
  muscles: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  recommendedView: "side" | "front";
  connections: [string, string][];
  keyframes: PoseFrame[];
  frameDurations: number[];
  highlightJoints: string[];
  focusAreas: FocusArea[];
  steps: { title: string; detail: string }[];
  commonMistakes: { mistake: string; fix: string }[];
  coachingCues: string[];
  /**
   * Optional front-facing variant. When the user is detected to be facing the
   * camera, the live ghost coach uses this set instead of the default
   * (side-facing) keyframes. Exercises where front-view doesn't communicate
   * form (anything horizontal — push-ups, planks, etc.) leave this undefined
   * and the ghost falls back to the side view.
   */
  frontConnections?: [string, string][];
  frontKeyframes?: PoseFrame[];
  frontHighlightJoints?: string[];
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

const FRONT_CONNECTIONS: [string, string][] = [
  ["head", "leftShoulder"],
  ["head", "rightShoulder"],
  ["leftShoulder", "rightShoulder"],
  ["leftShoulder", "leftElbow"],
  ["leftElbow", "leftHand"],
  ["rightShoulder", "rightElbow"],
  ["rightElbow", "rightHand"],
  ["leftShoulder", "leftHip"],
  ["rightShoulder", "rightHip"],
  ["leftHip", "rightHip"],
  ["leftHip", "leftKnee"],
  ["leftKnee", "leftAnkle"],
  ["rightHip", "rightKnee"],
  ["rightKnee", "rightAnkle"],
];

const FRONT_STANDING: PoseFrame = {
  head:          { x: 150, y: 30 },
  leftShoulder:  { x: 128, y: 72 },
  rightShoulder: { x: 172, y: 72 },
  leftElbow:     { x: 118, y: 108 },
  rightElbow:    { x: 182, y: 108 },
  leftHand:      { x: 116, y: 142 },
  rightHand:     { x: 184, y: 142 },
  leftHip:       { x: 136, y: 142 },
  rightHip:      { x: 164, y: 142 },
  leftKnee:      { x: 134, y: 200 },
  rightKnee:     { x: 166, y: 200 },
  leftAnkle:     { x: 134, y: 252 },
  rightAnkle:    { x: 166, y: 252 },
};

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

const PLANK_TOP: PoseFrame = {
  head: { x: 58, y: 172 },
  shoulder: { x: 82, y: 186 },
  elbow: { x: 80, y: 218 },
  hand: { x: 78, y: 248 },
  hip: { x: 162, y: 198 },
  frontKnee: { x: 215, y: 210 },
  frontAnkle: { x: 258, y: 222 },
  backKnee: { x: 215, y: 210 },
  backAnkle: { x: 258, y: 222 },
};

// ── SQUAT ────────────────────────────────────────────────────

const squatGuide: ExerciseVisualGuide = {
  id: "squat",
  name: "Squat",
  description: "A foundational lower-body movement. Drive your hips back and down while keeping your chest up and knees tracking over your toes.",
  muscles: ["Quadriceps", "Glutes", "Hamstrings", "Core"],
  difficulty: "beginner",
  recommendedView: "side",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["hip", "frontKnee", "backKnee"],
  focusAreas: [
    { joint: "hip", label: "Hips" },
    { joint: "frontKnee", label: "Knees" },
    { joint: "frontAnkle", label: "Ankles" },
    { joint: "shoulder", label: "Torso" },
  ],
  frameDurations: [800, 600, 600, 800],
  keyframes: [
    STANDING,
    {
      head: { x: 142, y: 52 }, shoulder: { x: 138, y: 88 }, elbow: { x: 152, y: 108 }, hand: { x: 162, y: 90 },
      hip: { x: 130, y: 150 }, frontKnee: { x: 165, y: 198 }, frontAnkle: { x: 150, y: 252 },
      backKnee: { x: 160, y: 198 }, backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 135, y: 78 }, shoulder: { x: 130, y: 110 }, elbow: { x: 152, y: 126 }, hand: { x: 165, y: 105 },
      hip: { x: 118, y: 170 }, frontKnee: { x: 175, y: 202 }, frontAnkle: { x: 148, y: 252 },
      backKnee: { x: 170, y: 202 }, backAnkle: { x: 146, y: 252 },
    },
    {
      head: { x: 142, y: 52 }, shoulder: { x: 138, y: 88 }, elbow: { x: 152, y: 108 }, hand: { x: 162, y: 90 },
      hip: { x: 130, y: 150 }, frontKnee: { x: 165, y: 198 }, frontAnkle: { x: 150, y: 252 },
      backKnee: { x: 160, y: 198 }, backAnkle: { x: 148, y: 252 },
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
  coachingCues: ["Sit back, not down", "Chest proud, eyes forward", "Drive your knees out", "Push the earth away"],

  // Front-facing variant — used when the user faces the camera.
  frontConnections: FRONT_CONNECTIONS,
  frontHighlightJoints: ["leftHip", "rightHip", "leftKnee", "rightKnee"],
  frontKeyframes: [
    FRONT_STANDING,
    {
      head:          { x: 150, y: 50 },
      leftShoulder:  { x: 124, y: 92 },
      rightShoulder: { x: 176, y: 92 },
      leftElbow:     { x: 108, y: 124 },
      rightElbow:    { x: 192, y: 124 },
      leftHand:      { x: 118, y: 148 },
      rightHand:     { x: 182, y: 148 },
      leftHip:       { x: 132, y: 162 },
      rightHip:      { x: 168, y: 162 },
      leftKnee:      { x: 118, y: 200 },
      rightKnee:     { x: 182, y: 200 },
      leftAnkle:     { x: 130, y: 252 },
      rightAnkle:    { x: 170, y: 252 },
    },
    {
      head:          { x: 150, y: 78 },
      leftShoulder:  { x: 120, y: 118 },
      rightShoulder: { x: 180, y: 118 },
      leftElbow:     { x: 105, y: 140 },
      rightElbow:    { x: 195, y: 140 },
      leftHand:      { x: 130, y: 154 },
      rightHand:     { x: 170, y: 154 },
      leftHip:       { x: 130, y: 188 },
      rightHip:      { x: 170, y: 188 },
      leftKnee:      { x: 102, y: 208 },
      rightKnee:     { x: 198, y: 208 },
      leftAnkle:     { x: 128, y: 252 },
      rightAnkle:    { x: 172, y: 252 },
    },
    {
      head:          { x: 150, y: 50 },
      leftShoulder:  { x: 124, y: 92 },
      rightShoulder: { x: 176, y: 92 },
      leftElbow:     { x: 108, y: 124 },
      rightElbow:    { x: 192, y: 124 },
      leftHand:      { x: 118, y: 148 },
      rightHand:     { x: 182, y: 148 },
      leftHip:       { x: 132, y: 162 },
      rightHip:      { x: 168, y: 162 },
      leftKnee:      { x: 118, y: 200 },
      rightKnee:     { x: 182, y: 200 },
      leftAnkle:     { x: 130, y: 252 },
      rightAnkle:    { x: 170, y: 252 },
    },
  ],
};

// ── LUNGE ────────────────────────────────────────────────────

const lungeGuide: ExerciseVisualGuide = {
  id: "lunge",
  name: "Lunge",
  description: "A unilateral exercise that builds leg strength and balance. Step forward, lower until both knees are at 90 degrees, then push back to standing.",
  muscles: ["Quadriceps", "Glutes", "Hamstrings", "Hip Flexors"],
  difficulty: "intermediate",
  recommendedView: "side",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["hip", "frontKnee", "backKnee", "frontAnkle"],
  focusAreas: [
    { joint: "hip", label: "Hips" },
    { joint: "frontKnee", label: "Front Knee" },
    { joint: "backKnee", label: "Back Knee" },
    { joint: "frontAnkle", label: "Front Ankle" },
    { joint: "shoulder", label: "Torso" },
  ],
  frameDurations: [700, 600, 500, 600, 700],
  keyframes: [
    STANDING,
    {
      head: { x: 150, y: 38 }, shoulder: { x: 150, y: 76 }, elbow: { x: 136, y: 108 }, hand: { x: 140, y: 138 },
      hip: { x: 152, y: 140 }, frontKnee: { x: 185, y: 194 }, frontAnkle: { x: 198, y: 252 },
      backKnee: { x: 120, y: 210 }, backAnkle: { x: 102, y: 252 },
    },
    {
      head: { x: 152, y: 55 }, shoulder: { x: 152, y: 92 }, elbow: { x: 138, y: 124 }, hand: { x: 142, y: 155 },
      hip: { x: 155, y: 160 }, frontKnee: { x: 200, y: 198 }, frontAnkle: { x: 210, y: 252 },
      backKnee: { x: 110, y: 232 }, backAnkle: { x: 92, y: 252 },
    },
    {
      head: { x: 150, y: 38 }, shoulder: { x: 150, y: 76 }, elbow: { x: 136, y: 108 }, hand: { x: 140, y: 138 },
      hip: { x: 152, y: 140 }, frontKnee: { x: 185, y: 194 }, frontAnkle: { x: 198, y: 252 },
      backKnee: { x: 120, y: 210 }, backAnkle: { x: 102, y: 252 },
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
  coachingCues: ["90-90: both knees at right angles", "Upright torso — crown of head to the ceiling", "Front knee over ankle, not past toes", "Push through the front heel"],
};

// ── PUSH-UP ──────────────────────────────────────────────────

const pushupGuide: ExerciseVisualGuide = {
  id: "pushup",
  name: "Push-Up",
  description: "The ultimate upper-body push exercise. Maintain a rigid plank while lowering your chest to the ground and pressing back up.",
  muscles: ["Chest", "Triceps", "Anterior Deltoids", "Core"],
  difficulty: "beginner",
  recommendedView: "side",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["shoulder", "elbow", "hip"],
  focusAreas: [
    { joint: "shoulder", label: "Shoulders" },
    { joint: "elbow", label: "Elbows" },
    { joint: "hip", label: "Hips" },
    { joint: "hand", label: "Wrists" },
  ],
  frameDurations: [700, 600, 600, 700],
  keyframes: [
    PLANK_TOP,
    {
      head: { x: 58, y: 192 }, shoulder: { x: 82, y: 205 }, elbow: { x: 62, y: 228 }, hand: { x: 78, y: 248 },
      hip: { x: 162, y: 216 }, frontKnee: { x: 215, y: 225 }, frontAnkle: { x: 258, y: 235 },
      backKnee: { x: 215, y: 225 }, backAnkle: { x: 258, y: 235 },
    },
    {
      head: { x: 58, y: 208 }, shoulder: { x: 82, y: 220 }, elbow: { x: 55, y: 238 }, hand: { x: 78, y: 248 },
      hip: { x: 162, y: 230 }, frontKnee: { x: 215, y: 238 }, frontAnkle: { x: 258, y: 246 },
      backKnee: { x: 215, y: 238 }, backAnkle: { x: 258, y: 246 },
    },
    {
      head: { x: 58, y: 192 }, shoulder: { x: 82, y: 205 }, elbow: { x: 62, y: 228 }, hand: { x: 78, y: 248 },
      hip: { x: 162, y: 216 }, frontKnee: { x: 215, y: 225 }, frontAnkle: { x: 258, y: 235 },
      backKnee: { x: 215, y: 225 }, backAnkle: { x: 258, y: 235 },
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
  coachingCues: ["Rigid plank — no sagging, no piking", "Elbows 45°, not 90°", "Squeeze glutes the entire time", "Full lockout at the top"],
};

// ── PLANK ────────────────────────────────────────────────────

const plankGuide: ExerciseVisualGuide = {
  id: "plank",
  name: "Plank",
  description: "An isometric core exercise. Hold a straight body line from head to heels, bracing your entire midsection.",
  muscles: ["Core", "Shoulders", "Glutes", "Quads"],
  difficulty: "beginner",
  recommendedView: "side",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["shoulder", "hip"],
  focusAreas: [
    { joint: "shoulder", label: "Shoulders" },
    { joint: "hip", label: "Hips" },
    { joint: "head", label: "Neck" },
  ],
  frameDurations: [900, 1200, 1200, 900],
  keyframes: [
    PLANK_TOP,
    {
      head: { x: 58, y: 174 }, shoulder: { x: 82, y: 188 }, elbow: { x: 80, y: 220 }, hand: { x: 78, y: 248 },
      hip: { x: 162, y: 200 }, frontKnee: { x: 215, y: 212 }, frontAnkle: { x: 258, y: 222 },
      backKnee: { x: 215, y: 212 }, backAnkle: { x: 258, y: 222 },
    },
    PLANK_TOP,
    {
      head: { x: 58, y: 170 }, shoulder: { x: 82, y: 184 }, elbow: { x: 80, y: 216 }, hand: { x: 78, y: 248 },
      hip: { x: 162, y: 196 }, frontKnee: { x: 215, y: 208 }, frontAnkle: { x: 258, y: 222 },
      backKnee: { x: 215, y: 208 }, backAnkle: { x: 258, y: 222 },
    },
  ],
  steps: [
    { title: "Set your base", detail: "Forearms or hands on the floor, elbows directly under shoulders." },
    { title: "Extend to plank", detail: "Straighten your body into one long line from head to heels." },
    { title: "Brace everything", detail: "Squeeze glutes, tighten abs, push the floor away with your arms." },
    { title: "Hold and breathe", detail: "Maintain the position. Breathe steadily — don't hold your breath." },
  ],
  commonMistakes: [
    { mistake: "Hips too high", fix: "Flatten your body — imagine a broomstick along your spine." },
    { mistake: "Hips sagging", fix: "Squeeze your glutes and brace your abs harder." },
    { mistake: "Head dropping", fix: "Keep your neck neutral — look at the floor just ahead of your hands." },
  ],
  coachingCues: ["Straight line — head to heels", "Squeeze glutes, brace abs", "Push the floor away", "Breathe steadily"],
};

// ── SIT-UP ───────────────────────────────────────────────────

const situpGuide: ExerciseVisualGuide = {
  id: "situp",
  name: "Sit-Up",
  description: "A core-strengthening exercise. Curl your torso from lying flat to an upright seated position.",
  muscles: ["Rectus Abdominis", "Hip Flexors", "Obliques"],
  difficulty: "beginner",
  recommendedView: "side",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["hip", "shoulder"],
  focusAreas: [
    { joint: "hip", label: "Hips" },
    { joint: "shoulder", label: "Torso" },
    { joint: "frontKnee", label: "Knees" },
  ],
  frameDurations: [700, 600, 600, 700],
  keyframes: [
    {
      head: { x: 60, y: 188 }, shoulder: { x: 95, y: 200 }, elbow: { x: 78, y: 182 }, hand: { x: 68, y: 178 },
      hip: { x: 155, y: 218 }, frontKnee: { x: 200, y: 188 }, frontAnkle: { x: 235, y: 218 },
      backKnee: { x: 200, y: 188 }, backAnkle: { x: 235, y: 218 },
    },
    {
      head: { x: 100, y: 158 }, shoulder: { x: 120, y: 180 }, elbow: { x: 105, y: 155 }, hand: { x: 95, y: 148 },
      hip: { x: 155, y: 218 }, frontKnee: { x: 200, y: 188 }, frontAnkle: { x: 235, y: 218 },
      backKnee: { x: 200, y: 188 }, backAnkle: { x: 235, y: 218 },
    },
    {
      head: { x: 140, y: 132 }, shoulder: { x: 148, y: 162 }, elbow: { x: 135, y: 130 }, hand: { x: 128, y: 122 },
      hip: { x: 155, y: 218 }, frontKnee: { x: 195, y: 185 }, frontAnkle: { x: 232, y: 218 },
      backKnee: { x: 195, y: 185 }, backAnkle: { x: 232, y: 218 },
    },
    {
      head: { x: 100, y: 158 }, shoulder: { x: 120, y: 180 }, elbow: { x: 105, y: 155 }, hand: { x: 95, y: 148 },
      hip: { x: 155, y: 218 }, frontKnee: { x: 200, y: 188 }, frontAnkle: { x: 235, y: 218 },
      backKnee: { x: 200, y: 188 }, backAnkle: { x: 235, y: 218 },
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
  coachingCues: ["Curl, don't jerk", "Exhale on the way up", "Control the descent — no flopping"],
};

// ── JUMPING JACK ─────────────────────────────────────────────

const jumpingJackGuide: ExerciseVisualGuide = {
  id: "jumping-jack",
  name: "Jumping Jack",
  description: "A full-body cardio exercise. Jump your feet apart while raising your arms overhead, then return to center.",
  muscles: ["Deltoids", "Calves", "Hip Abductors", "Core"],
  difficulty: "beginner",
  recommendedView: "side",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["shoulder", "hand", "frontAnkle", "backAnkle"],
  focusAreas: [
    { joint: "shoulder", label: "Shoulders" },
    { joint: "hip", label: "Hips" },
    { joint: "frontKnee", label: "Knees" },
  ],
  frameDurations: [400, 400, 400, 400],
  keyframes: [
    STANDING,
    {
      head: { x: 150, y: 26 }, shoulder: { x: 148, y: 64 }, elbow: { x: 158, y: 38 }, hand: { x: 155, y: 10 },
      hip: { x: 150, y: 128 }, frontKnee: { x: 172, y: 190 }, frontAnkle: { x: 180, y: 252 },
      backKnee: { x: 128, y: 190 }, backAnkle: { x: 120, y: 252 },
    },
    STANDING,
    {
      head: { x: 150, y: 26 }, shoulder: { x: 148, y: 64 }, elbow: { x: 158, y: 38 }, hand: { x: 155, y: 10 },
      hip: { x: 150, y: 128 }, frontKnee: { x: 172, y: 190 }, frontAnkle: { x: 180, y: 252 },
      backKnee: { x: 128, y: 190 }, backAnkle: { x: 120, y: 252 },
    },
  ],
  steps: [
    { title: "Start neutral", detail: "Stand with feet together, arms relaxed at your sides." },
    { title: "Jump out", detail: "Jump your feet apart while sweeping your arms overhead." },
    { title: "Return", detail: "Jump feet back together, arms return to sides." },
    { title: "Maintain rhythm", detail: "Keep a steady, controlled tempo throughout." },
  ],
  commonMistakes: [
    { mistake: "Poor coordination", fix: "Start slow — arms and legs move together, not separately." },
    { mistake: "Shallow arm range", fix: "Fully extend arms overhead — hands should nearly touch." },
    { mistake: "Heavy landings", fix: "Land softly on the balls of your feet, knees slightly bent." },
  ],
  coachingCues: ["Arms and legs in sync", "Land softly — bend your knees", "Full arm sweep overhead", "Stay light on your feet"],

  // Front-facing variant — the natural view for jumping jacks.
  frontConnections: FRONT_CONNECTIONS,
  frontHighlightJoints: ["leftHand", "rightHand", "leftAnkle", "rightAnkle"],
  frontKeyframes: [
    {
      head:          { x: 150, y: 30 },
      leftShoulder:  { x: 132, y: 72 },
      rightShoulder: { x: 168, y: 72 },
      leftElbow:     { x: 124, y: 108 },
      rightElbow:    { x: 176, y: 108 },
      leftHand:      { x: 122, y: 142 },
      rightHand:     { x: 178, y: 142 },
      leftHip:       { x: 140, y: 142 },
      rightHip:      { x: 160, y: 142 },
      leftKnee:      { x: 142, y: 200 },
      rightKnee:     { x: 158, y: 200 },
      leftAnkle:     { x: 144, y: 252 },
      rightAnkle:    { x: 156, y: 252 },
    },
    {
      head:          { x: 150, y: 28 },
      leftShoulder:  { x: 130, y: 70 },
      rightShoulder: { x: 170, y: 70 },
      leftElbow:     { x: 100, y: 50 },
      rightElbow:    { x: 200, y: 50 },
      leftHand:      { x: 78,  y: 18 },
      rightHand:     { x: 222, y: 18 },
      leftHip:       { x: 138, y: 142 },
      rightHip:      { x: 162, y: 142 },
      leftKnee:      { x: 108, y: 198 },
      rightKnee:     { x: 192, y: 198 },
      leftAnkle:     { x: 92,  y: 252 },
      rightAnkle:    { x: 208, y: 252 },
    },
    {
      head:          { x: 150, y: 30 },
      leftShoulder:  { x: 132, y: 72 },
      rightShoulder: { x: 168, y: 72 },
      leftElbow:     { x: 124, y: 108 },
      rightElbow:    { x: 176, y: 108 },
      leftHand:      { x: 122, y: 142 },
      rightHand:     { x: 178, y: 142 },
      leftHip:       { x: 140, y: 142 },
      rightHip:      { x: 160, y: 142 },
      leftKnee:      { x: 142, y: 200 },
      rightKnee:     { x: 158, y: 200 },
      leftAnkle:     { x: 144, y: 252 },
      rightAnkle:    { x: 156, y: 252 },
    },
    {
      head:          { x: 150, y: 28 },
      leftShoulder:  { x: 130, y: 70 },
      rightShoulder: { x: 170, y: 70 },
      leftElbow:     { x: 100, y: 50 },
      rightElbow:    { x: 200, y: 50 },
      leftHand:      { x: 78,  y: 18 },
      rightHand:     { x: 222, y: 18 },
      leftHip:       { x: 138, y: 142 },
      rightHip:      { x: 162, y: 142 },
      leftKnee:      { x: 108, y: 198 },
      rightKnee:     { x: 192, y: 198 },
      leftAnkle:     { x: 92,  y: 252 },
      rightAnkle:    { x: 208, y: 252 },
    },
  ],
};

// ── MOUNTAIN CLIMBER ─────────────────────────────────────────

const mountainClimberGuide: ExerciseVisualGuide = {
  id: "mountain-climber",
  name: "Mountain Climber",
  description: "A dynamic core and cardio exercise. From a plank position, drive your knees toward your chest in an alternating running motion.",
  muscles: ["Core", "Hip Flexors", "Shoulders", "Quads"],
  difficulty: "intermediate",
  recommendedView: "side",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["shoulder", "hip", "frontKnee", "backKnee"],
  focusAreas: [
    { joint: "shoulder", label: "Shoulders" },
    { joint: "hip", label: "Hips" },
    { joint: "frontKnee", label: "Knees" },
  ],
  frameDurations: [450, 350, 450, 350],
  keyframes: [
    PLANK_TOP,
    {
      head: { x: 58, y: 172 }, shoulder: { x: 82, y: 186 }, elbow: { x: 80, y: 218 }, hand: { x: 78, y: 248 },
      hip: { x: 155, y: 195 }, frontKnee: { x: 120, y: 212 }, frontAnkle: { x: 132, y: 235 },
      backKnee: { x: 215, y: 210 }, backAnkle: { x: 258, y: 222 },
    },
    PLANK_TOP,
    {
      head: { x: 58, y: 172 }, shoulder: { x: 82, y: 186 }, elbow: { x: 80, y: 218 }, hand: { x: 78, y: 248 },
      hip: { x: 155, y: 195 }, frontKnee: { x: 215, y: 210 }, frontAnkle: { x: 258, y: 222 },
      backKnee: { x: 120, y: 212 }, backAnkle: { x: 132, y: 235 },
    },
  ],
  steps: [
    { title: "Start in plank", detail: "Hands under shoulders, body in a straight line, core braced." },
    { title: "Drive one knee", detail: "Pull one knee toward your chest as fast as you can with control." },
    { title: "Switch legs", detail: "Extend the leg back and immediately drive the other knee forward." },
    { title: "Keep hips stable", detail: "Your hips should stay level — don't bounce them up and down." },
  ],
  commonMistakes: [
    { mistake: "Hips bouncing high", fix: "Lock your hips in place — only the legs should move." },
    { mistake: "Poor core control", fix: "Brace your abs as if someone might punch you in the stomach." },
    { mistake: "Short knee drive", fix: "Drive your knee all the way to your chest, not just halfway." },
  ],
  coachingCues: ["Flat back — hips don't bounce", "Knee to chest, full drive", "Shoulders stacked over wrists", "Stay controlled at speed"],
};

// ── SHOULDER PRESS ───────────────────────────────────────────

const shoulderPressGuide: ExerciseVisualGuide = {
  id: "shoulder-press",
  name: "Shoulder Press",
  description: "An overhead pressing movement that builds shoulder strength and stability. Press from shoulder level to full lockout overhead.",
  muscles: ["Deltoids", "Triceps", "Upper Chest", "Core"],
  difficulty: "intermediate",
  recommendedView: "side",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["shoulder", "elbow"],
  focusAreas: [
    { joint: "shoulder", label: "Shoulders" },
    { joint: "elbow", label: "Elbows" },
    { joint: "hand", label: "Wrists" },
  ],
  frameDurations: [700, 500, 500, 700],
  keyframes: [
    {
      head: { x: 150, y: 30 }, shoulder: { x: 148, y: 68 }, elbow: { x: 165, y: 68 }, hand: { x: 168, y: 38 },
      hip: { x: 150, y: 132 }, frontKnee: { x: 152, y: 192 }, frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 }, backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 150, y: 30 }, shoulder: { x: 148, y: 68 }, elbow: { x: 160, y: 52 }, hand: { x: 162, y: 22 },
      hip: { x: 150, y: 132 }, frontKnee: { x: 152, y: 192 }, frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 }, backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 150, y: 32 }, shoulder: { x: 148, y: 68 }, elbow: { x: 155, y: 42 }, hand: { x: 155, y: 10 },
      hip: { x: 150, y: 132 }, frontKnee: { x: 152, y: 192 }, frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 }, backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 150, y: 30 }, shoulder: { x: 148, y: 68 }, elbow: { x: 160, y: 52 }, hand: { x: 162, y: 22 },
      hip: { x: 150, y: 132 }, frontKnee: { x: 152, y: 192 }, frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 }, backAnkle: { x: 148, y: 252 },
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
    { mistake: "Incomplete lockout", fix: "Fully extend your arms at the top for maximum shoulder engagement." },
  ],
  coachingCues: ["Straight up, not forward", "Core tight — no rib flare", "Lock out fully at the top"],

  // Front-facing variant.
  frontConnections: FRONT_CONNECTIONS,
  frontHighlightJoints: ["leftShoulder", "rightShoulder", "leftElbow", "rightElbow"],
  frontKeyframes: [
    {
      head:          { x: 150, y: 30 },
      leftShoulder:  { x: 124, y: 72 },
      rightShoulder: { x: 176, y: 72 },
      leftElbow:     { x: 102, y: 92 },
      rightElbow:    { x: 198, y: 92 },
      leftHand:      { x: 110, y: 60 },
      rightHand:     { x: 190, y: 60 },
      leftHip:       { x: 134, y: 142 },
      rightHip:      { x: 166, y: 142 },
      leftKnee:      { x: 134, y: 200 },
      rightKnee:     { x: 166, y: 200 },
      leftAnkle:     { x: 134, y: 252 },
      rightAnkle:    { x: 166, y: 252 },
    },
    {
      head:          { x: 150, y: 30 },
      leftShoulder:  { x: 124, y: 72 },
      rightShoulder: { x: 176, y: 72 },
      leftElbow:     { x: 110, y: 60 },
      rightElbow:    { x: 190, y: 60 },
      leftHand:      { x: 122, y: 28 },
      rightHand:     { x: 178, y: 28 },
      leftHip:       { x: 134, y: 142 },
      rightHip:      { x: 166, y: 142 },
      leftKnee:      { x: 134, y: 200 },
      rightKnee:     { x: 166, y: 200 },
      leftAnkle:     { x: 134, y: 252 },
      rightAnkle:    { x: 166, y: 252 },
    },
    {
      head:          { x: 150, y: 32 },
      leftShoulder:  { x: 124, y: 72 },
      rightShoulder: { x: 176, y: 72 },
      leftElbow:     { x: 124, y: 40 },
      rightElbow:    { x: 176, y: 40 },
      leftHand:      { x: 138, y: 8 },
      rightHand:     { x: 162, y: 8 },
      leftHip:       { x: 134, y: 142 },
      rightHip:      { x: 166, y: 142 },
      leftKnee:      { x: 134, y: 200 },
      rightKnee:     { x: 166, y: 200 },
      leftAnkle:     { x: 134, y: 252 },
      rightAnkle:    { x: 166, y: 252 },
    },
    {
      head:          { x: 150, y: 30 },
      leftShoulder:  { x: 124, y: 72 },
      rightShoulder: { x: 176, y: 72 },
      leftElbow:     { x: 110, y: 60 },
      rightElbow:    { x: 190, y: 60 },
      leftHand:      { x: 122, y: 28 },
      rightHand:     { x: 178, y: 28 },
      leftHip:       { x: 134, y: 142 },
      rightHip:      { x: 166, y: 142 },
      leftKnee:      { x: 134, y: 200 },
      rightKnee:     { x: 166, y: 200 },
      leftAnkle:     { x: 134, y: 252 },
      rightAnkle:    { x: 166, y: 252 },
    },
  ],
};

// ── BICEP CURL ───────────────────────────────────────────────

const bicepCurlGuide: ExerciseVisualGuide = {
  id: "bicep-curl",
  name: "Bicep Curl",
  description: "An isolation exercise for the biceps. Keep your elbows pinned and curl the weight up with a controlled tempo.",
  muscles: ["Biceps", "Brachialis", "Forearms"],
  difficulty: "beginner",
  recommendedView: "side",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["elbow", "shoulder"],
  focusAreas: [
    { joint: "elbow", label: "Elbows" },
    { joint: "hand", label: "Wrists" },
    { joint: "shoulder", label: "Shoulders" },
  ],
  frameDurations: [700, 500, 500, 700],
  keyframes: [
    {
      head: { x: 150, y: 30 }, shoulder: { x: 148, y: 68 }, elbow: { x: 148, y: 105 }, hand: { x: 148, y: 138 },
      hip: { x: 150, y: 132 }, frontKnee: { x: 152, y: 192 }, frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 }, backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 150, y: 30 }, shoulder: { x: 148, y: 68 }, elbow: { x: 150, y: 105 }, hand: { x: 165, y: 95 },
      hip: { x: 150, y: 132 }, frontKnee: { x: 152, y: 192 }, frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 }, backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 150, y: 30 }, shoulder: { x: 148, y: 68 }, elbow: { x: 152, y: 105 }, hand: { x: 168, y: 72 },
      hip: { x: 150, y: 132 }, frontKnee: { x: 152, y: 192 }, frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 }, backAnkle: { x: 148, y: 252 },
    },
    {
      head: { x: 150, y: 30 }, shoulder: { x: 148, y: 68 }, elbow: { x: 150, y: 105 }, hand: { x: 165, y: 95 },
      hip: { x: 150, y: 132 }, frontKnee: { x: 152, y: 192 }, frontAnkle: { x: 152, y: 252 },
      backKnee: { x: 148, y: 192 }, backAnkle: { x: 148, y: 252 },
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
  coachingCues: ["Pin your elbows — only the forearm moves", "Squeeze hard at the top", "Slow and controlled on the way down"],

  // Front-facing variant.
  frontConnections: FRONT_CONNECTIONS,
  frontHighlightJoints: ["leftElbow", "rightElbow", "leftShoulder", "rightShoulder"],
  frontKeyframes: [
    {
      head:          { x: 150, y: 30 },
      leftShoulder:  { x: 124, y: 72 },
      rightShoulder: { x: 176, y: 72 },
      leftElbow:     { x: 122, y: 108 },
      rightElbow:    { x: 178, y: 108 },
      leftHand:      { x: 120, y: 142 },
      rightHand:     { x: 180, y: 142 },
      leftHip:       { x: 134, y: 142 },
      rightHip:      { x: 166, y: 142 },
      leftKnee:      { x: 134, y: 200 },
      rightKnee:     { x: 166, y: 200 },
      leftAnkle:     { x: 134, y: 252 },
      rightAnkle:    { x: 166, y: 252 },
    },
    {
      head:          { x: 150, y: 30 },
      leftShoulder:  { x: 124, y: 72 },
      rightShoulder: { x: 176, y: 72 },
      leftElbow:     { x: 122, y: 108 },
      rightElbow:    { x: 178, y: 108 },
      leftHand:      { x: 132, y: 92 },
      rightHand:     { x: 168, y: 92 },
      leftHip:       { x: 134, y: 142 },
      rightHip:      { x: 166, y: 142 },
      leftKnee:      { x: 134, y: 200 },
      rightKnee:     { x: 166, y: 200 },
      leftAnkle:     { x: 134, y: 252 },
      rightAnkle:    { x: 166, y: 252 },
    },
    {
      head:          { x: 150, y: 30 },
      leftShoulder:  { x: 124, y: 72 },
      rightShoulder: { x: 176, y: 72 },
      leftElbow:     { x: 122, y: 108 },
      rightElbow:    { x: 178, y: 108 },
      leftHand:      { x: 138, y: 72 },
      rightHand:     { x: 162, y: 72 },
      leftHip:       { x: 134, y: 142 },
      rightHip:      { x: 166, y: 142 },
      leftKnee:      { x: 134, y: 200 },
      rightKnee:     { x: 166, y: 200 },
      leftAnkle:     { x: 134, y: 252 },
      rightAnkle:    { x: 166, y: 252 },
    },
    {
      head:          { x: 150, y: 30 },
      leftShoulder:  { x: 124, y: 72 },
      rightShoulder: { x: 176, y: 72 },
      leftElbow:     { x: 122, y: 108 },
      rightElbow:    { x: 178, y: 108 },
      leftHand:      { x: 132, y: 92 },
      rightHand:     { x: 168, y: 92 },
      leftHip:       { x: 134, y: 142 },
      rightHip:      { x: 166, y: 142 },
      leftKnee:      { x: 134, y: 200 },
      rightKnee:     { x: 166, y: 200 },
      leftAnkle:     { x: 134, y: 252 },
      rightAnkle:    { x: 166, y: 252 },
    },
  ],
};

// ── BURPEE ───────────────────────────────────────────────────

const burpeeGuide: ExerciseVisualGuide = {
  id: "burpee",
  name: "Burpee",
  description: "A high-intensity full-body exercise. Squat down, kick back to plank, return, and explode upward into a jump.",
  muscles: ["Full Body", "Core", "Chest", "Quads", "Shoulders"],
  difficulty: "advanced",
  recommendedView: "side",
  connections: SIDE_CONNECTIONS,
  highlightJoints: ["shoulder", "hip", "frontKnee"],
  focusAreas: [
    { joint: "shoulder", label: "Shoulders" },
    { joint: "hip", label: "Hips" },
    { joint: "frontKnee", label: "Knees" },
  ],
  frameDurations: [500, 450, 500, 450, 500, 500],
  keyframes: [
    STANDING,
    {
      head: { x: 132, y: 90 }, shoulder: { x: 125, y: 118 }, elbow: { x: 115, y: 150 }, hand: { x: 108, y: 180 },
      hip: { x: 118, y: 172 }, frontKnee: { x: 162, y: 205 }, frontAnkle: { x: 148, y: 252 },
      backKnee: { x: 158, y: 205 }, backAnkle: { x: 146, y: 252 },
    },
    PLANK_TOP,
    {
      head: { x: 132, y: 90 }, shoulder: { x: 125, y: 118 }, elbow: { x: 115, y: 150 }, hand: { x: 108, y: 180 },
      hip: { x: 118, y: 172 }, frontKnee: { x: 162, y: 205 }, frontAnkle: { x: 148, y: 252 },
      backKnee: { x: 158, y: 205 }, backAnkle: { x: 146, y: 252 },
    },
    {
      head: { x: 150, y: 15 }, shoulder: { x: 148, y: 52 }, elbow: { x: 155, y: 28 }, hand: { x: 152, y: 2 },
      hip: { x: 150, y: 116 }, frontKnee: { x: 152, y: 172 }, frontAnkle: { x: 152, y: 232 },
      backKnee: { x: 148, y: 172 }, backAnkle: { x: 148, y: 232 },
    },
    STANDING,
  ],
  steps: [
    { title: "Start standing", detail: "Feet shoulder-width apart, arms at your sides." },
    { title: "Squat down", detail: "Drop your hips and place your hands on the floor in front of you." },
    { title: "Kick back", detail: "Jump your feet back into a plank position — body in a straight line." },
    { title: "Jump forward", detail: "Jump your feet back toward your hands into the squat position." },
    { title: "Explode up", detail: "Drive through your legs and jump into the air, arms overhead." },
    { title: "Land soft", detail: "Land with soft knees and immediately flow into the next rep." },
  ],
  commonMistakes: [
    { mistake: "Rushed transitions", fix: "Each phase should be distinct — don't collapse through the plank." },
    { mistake: "Weak plank position", fix: "When you kick back, make sure your hips don't sag." },
    { mistake: "Incomplete finish", fix: "Fully extend your hips and arms at the top of the jump." },
    { mistake: "Hard landings", fix: "Land on the balls of your feet with knees slightly bent." },
  ],
  coachingCues: ["Hands down, feet back, feet in, jump up", "Solid plank — even if brief", "Explode out of the bottom", "Land soft, flow smooth"],
};

// ── REGISTRY ─────────────────────────────────────────────────

export const exerciseVisualGuides: Record<string, ExerciseVisualGuide> = {
  squat: squatGuide,
  lunge: lungeGuide,
  pushup: pushupGuide,
  plank: plankGuide,
  situp: situpGuide,
  "jumping-jack": jumpingJackGuide,
  "mountain-climber": mountainClimberGuide,
  "shoulder-press": shoulderPressGuide,
  "bicep-curl": bicepCurlGuide,
  burpee: burpeeGuide,
};

export function getExerciseGuide(id: string): ExerciseVisualGuide | undefined {
  return exerciseVisualGuides[id];
}
