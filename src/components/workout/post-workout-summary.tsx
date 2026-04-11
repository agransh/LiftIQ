"use client";

import { useWorkoutStore } from "@/lib/store";
import { generateWorkoutFeedback } from "@/lib/ai/feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Target,
  Repeat,
  Flame,
  TrendingUp,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

export function PostWorkoutSummary() {
  const { lastSession, setLastSession } = useWorkoutStore();

  if (!lastSession) return null;

  const { reps, totalScore, caloriesBurned, exercise, startTime, endTime } =
    lastSession;
  const duration = endTime
    ? Math.floor((endTime - startTime) / 1000)
    : 0;
  const bestScore = reps.length > 0 ? Math.max(...reps.map((r) => r.score)) : 0;

  const allIssues = reps.flatMap((r) => r.issues);
  const issueCounts: Record<string, number> = {};
  for (const issue of allIssues) {
    if (issue.message) {
      issueCounts[issue.message] = (issueCounts[issue.message] || 0) + 1;
    }
  }
  const topMistakes = Object.entries(issueCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const chartData = reps.map((r, i) => ({
    rep: i + 1,
    score: r.score,
  }));

  const feedback = generateWorkoutFeedback({
    exercise,
    reps,
    avgScore: totalScore,
    duration,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="w-full md:max-w-2xl max-h-[92vh] md:max-h-[90vh] overflow-y-auto bg-card border-border rounded-t-2xl md:rounded-xl md:mx-4">
        <CardHeader className="flex flex-row items-start justify-between px-4 pt-5 md:px-6 md:pt-6">
          <div>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Workout Complete!
            </CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 flex items-center gap-2">
              {lastSession.exerciseName || exercise.charAt(0).toUpperCase() + exercise.slice(1).replace("-", " ")} session
              {lastSession.weight && <span>@ {lastSession.weight} lbs</span>}
              {lastSession.isRecorded && <Badge variant="outline" className="text-[8px] px-1.5 py-0">Recorded</Badge>}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLastSession(null)}
            className="min-h-[44px] min-w-[44px]"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-5 md:space-y-6 px-4 md:px-6 pb-8">
          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            <StatCard
              icon={<Repeat className="h-3.5 w-3.5" />}
              label="Reps"
              value={reps.length.toString()}
            />
            <StatCard
              icon={<Target className="h-3.5 w-3.5" />}
              label="Avg"
              value={`${totalScore}`}
              valueClass={
                totalScore >= 85
                  ? "text-emerald-400"
                  : totalScore >= 65
                  ? "text-yellow-400"
                  : "text-red-400"
              }
            />
            <StatCard
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label="Best"
              value={`${bestScore}`}
              valueClass="text-emerald-400"
            />
            <StatCard
              icon={<Flame className="h-3.5 w-3.5" />}
              label="Cal"
              value={`${caloriesBurned}`}
            />
          </div>

          {/* Score chart */}
          {chartData.length > 1 && (
            <div>
              <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-2 md:mb-3">
                Score per Rep
              </h4>
              <div className="h-32 md:h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="rep" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#71717a" fontSize={10} tickLine={false} width={28} />
                    <Tooltip
                      contentStyle={{
                        background: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#00e68a"
                      strokeWidth={2}
                      dot={{ fill: "#00e68a", r: 3 }}
                      activeDot={{ r: 5, fill: "#00e68a" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Common mistakes */}
          {topMistakes.length > 0 && (
            <div>
              <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-2 md:mb-3">
                Common Issues
              </h4>
              <div className="space-y-1.5 md:space-y-2">
                {topMistakes.map(([mistake, count]) => (
                  <div
                    key={mistake}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-xs md:text-sm min-w-0">
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                      <span className="truncate">{mistake}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] md:text-xs shrink-0 ml-2">{count}x</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Feedback */}
          <div>
            <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-2 md:mb-3">
              AI Coach Analysis
            </h4>
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 md:p-4 text-xs md:text-sm leading-relaxed whitespace-pre-line">
              {feedback}
            </div>
          </div>

          <Button
            onClick={() => setLastSession(null)}
            className="w-full min-h-[48px]"
            size="lg"
          >
            Done
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-secondary/50 p-2.5 md:p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] md:text-xs text-muted-foreground mb-0.5 md:mb-1">
        {icon}
        {label}
      </div>
      <div className={cn("text-lg md:text-2xl font-bold tabular-nums", valueClass)}>
        {value}
      </div>
    </div>
  );
}
