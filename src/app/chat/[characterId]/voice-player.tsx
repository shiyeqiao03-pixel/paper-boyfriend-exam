"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface VoicePlayerProps {
  src: string;
  duration?: number;
  isUser?: boolean;
}

export default function VoicePlayer({ src, duration = 0, isUser = false }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setAudioDuration(Math.round(audio.duration));
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      setPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [src]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {
        // 忽略自动播放限制错误
      });
      setPlaying(true);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
        isUser ? "bg-primary text-white" : "bg-cream-100 text-foreground"
      }`}
      style={{ minWidth: "180px", maxWidth: "260px" }}
    >
      <button
        onClick={toggle}
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-white/20" : "bg-white/60"
        }`}
      >
        {playing ? (
          <Pause size={14} className={isUser ? "text-white" : "text-foreground"} />
        ) : (
          <Play size={14} className={isUser ? "text-white" : "text-foreground"} />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1">
        {/* Progress bar */}
        <div className={`h-1 w-full rounded-full ${isUser ? "bg-white/30" : "bg-border"}`}>
          <div
            className={`h-1 rounded-full transition-all ${isUser ? "bg-white" : "bg-primary"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Time */}
        <span className={`text-[10px] ${isUser ? "text-white/80" : "text-foreground-muted"}`}>
          {playing ? formatTime(currentTime) : formatTime(audioDuration)}
        </span>
      </div>
    </div>
  );
}
