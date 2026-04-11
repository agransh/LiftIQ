"use client";

import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getAllRecordingsMeta,
  getRecordingBlob,
  deleteRecording,
  type RecordingMeta,
} from "@/lib/storage/recordings-db";
import {
  Video,
  Play,
  Trash2,
  X,
  Clock,
  Target,
  Repeat,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<RecordingMeta[]>([]);
  const [activeVideo, setActiveVideo] = useState<{
    meta: RecordingMeta;
    url: string;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadRecordings = async () => {
    const metas = await getAllRecordingsMeta();
    setRecordings(metas);
  };

  useEffect(() => {
    loadRecordings();
  }, []);

  const handlePlay = async (meta: RecordingMeta) => {
    if (activeVideo) URL.revokeObjectURL(activeVideo.url);
    const blob = await getRecordingBlob(meta.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      setActiveVideo({ meta, url });
    }
  };

  const handleClose = () => {
    if (activeVideo) {
      URL.revokeObjectURL(activeVideo.url);
      setActiveVideo(null);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRecording(id);
    if (activeVideo?.meta.id === id) handleClose();
    loadRecordings();
  };

  const handleDownload = async (meta: RecordingMeta) => {
    const blob = await getRecordingBlob(meta.id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LiftIQ-${meta.exerciseName}-${new Date(meta.createdAt).toISOString().slice(0, 10)}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-[100dvh] bg-background has-bottom-nav md:pb-0">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 md:py-6">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Video className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Recordings
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Review your recorded workout sessions
          </p>
        </div>

        {/* Video Player Modal */}
        {activeVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {activeVideo.meta.exerciseName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activeVideo.meta.createdAt).toLocaleString()} •{" "}
                    {activeVideo.meta.reps} reps • Score: {activeVideo.meta.score}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(activeVideo.meta)}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="min-h-[44px] min-w-[44px]"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <video
                ref={videoRef}
                src={activeVideo.url}
                controls
                autoPlay
                className="w-full rounded-xl bg-black aspect-video"
              />
            </div>
          </div>
        )}

        {recordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <Video className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg md:text-xl font-semibold mb-2">
              No Recordings Yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-md px-4">
              Use the <strong>Record</strong> button on the workout page to
              capture your sessions with form analysis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {recordings.map((rec) => (
              <Card
                key={rec.id}
                className="bg-card/50 border-border/50 hover:border-primary/20 transition-colors group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm md:text-base truncate">
                        {rec.exerciseName}
                      </h3>
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        {new Date(rec.createdAt).toLocaleDateString()} •{" "}
                        {new Date(rec.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={rec.score >= 85 ? "success" : rec.score >= 65 ? "warning" : "destructive"}
                      className="shrink-0 ml-2"
                    >
                      {rec.score}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Repeat className="h-3 w-3" />
                      {rec.reps} reps
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(rec.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {formatSize(rec.size)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex-1 min-h-[36px]"
                      onClick={() => handlePlay(rec)}
                    >
                      <Play className="h-3.5 w-3.5" />
                      Watch
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[36px]"
                      onClick={() => handleDownload(rec)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[36px] text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(rec.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
