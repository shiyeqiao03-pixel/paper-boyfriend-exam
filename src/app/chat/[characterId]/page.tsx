"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, MoreHorizontal, Send, ImagePlus, Trash2, Home, Users, Search, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatTime, shouldShowTimeDivider } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/character-avatars";
import VoicePlayer from "./voice-player";

interface ChatMessage {
  id: string;
  senderType: "user" | "character" | "system";
  messageType: "text" | "image" | "voice";
  contentText: string | null;
  sttText?: string | null;
  status: string;
  createdAt: string;
  replyGroupId: string | null;
  duration?: number;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const characterId = params.characterId as string;
  const [characterName, setCharacterName] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    fetch(`/api/characters/${characterId}`)
      .then((res) => res.json())
      .then((data) => {
        setCharacterName(data.character?.name || "");
      });
  }, [characterId]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/chat/messages?character_id=${characterId}`)
      .then((res) => {
        if (res.status === 401) {
          router.push("/auth");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setMessages(data.messages || []);
        }
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [characterId, scrollToBottom, router]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderType: "user",
      messageType: "text",
      contentText: text,
      status: "sent",
      createdAt: new Date().toISOString(),
      replyGroupId: null,
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          messageType: "text",
          contentText: text,
        }),
      });

      const data = await res.json();

      if (data.messages) {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [...filtered, ...data.messages];
        });
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error("发送失败:", error);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const sendVoiceMessage = async (audioUrl: string, duration: number, sttText?: string) => {
    if (sending) return;
    setSending(true);

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderType: "user",
      messageType: "voice",
      contentText: audioUrl,
      status: "sent",
      createdAt: new Date().toISOString(),
      replyGroupId: null,
      duration,
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          messageType: "voice",
          contentText: audioUrl,
          duration,
          sttText,
        }),
      });

      const data = await res.json();

      if (data.messages) {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [...filtered, ...data.messages];
        });
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error("发送语音失败:", error);
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async (file: File) => {
    if (sending) return;
    setSending(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          setSending(false);
          return;
        }

        const tempUserMsg: ChatMessage = {
          id: `temp-${Date.now()}`,
          senderType: "user",
          messageType: "image",
          contentText: dataUrl,
          status: "sent",
          createdAt: new Date().toISOString(),
          replyGroupId: null,
        };
        setMessages((prev) => [...prev, tempUserMsg]);
        setTimeout(scrollToBottom, 50);

        try {
          const res = await fetch("/api/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              characterId,
              messageType: "image",
              contentText: dataUrl,
            }),
          });

          const data = await res.json();

          if (data.messages) {
            setMessages((prev) => {
              const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
              return [...filtered, ...data.messages];
            });
            setTimeout(scrollToBottom, 100);
          }
        } catch (error) {
          console.error("发送图片失败:", error);
        } finally {
          setSending(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSendImage(file);
    }
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  async function convertWebmToPcm(webmBlob: Blob, targetSampleRate = 16000): Promise<Blob> {
    const arrayBuffer = await webmBlob.arrayBuffer();
    console.log("[PCM] webm size:", arrayBuffer.byteLength, "bytes");
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log("[PCM] decoded duration:", audioBuffer.duration, "s, sampleRate:", audioBuffer.sampleRate, "channels:", audioBuffer.numberOfChannels);

    const offlineCtx = new OfflineAudioContext(
      1,
      Math.ceil(audioBuffer.duration * targetSampleRate),
      targetSampleRate
    );
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start();

    const resampledBuffer = await offlineCtx.startRendering();
    const floatData = resampledBuffer.getChannelData(0);
    console.log("[PCM] pcm samples:", floatData.length, "=> bytes:", floatData.length * 2);

    const pcmBuffer = new ArrayBuffer(floatData.length * 2);
    const pcmView = new DataView(pcmBuffer);
    for (let i = 0; i < floatData.length; i++) {
      const sample = Math.max(-1, Math.min(1, floatData[i]));
      pcmView.setInt16(i * 2, Math.floor(sample * 32767), true);
    }

    return new Blob([pcmBuffer], { type: "audio/pcm" });
  }

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      setProcessingVoice(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        await new Promise((resolve) => setTimeout(resolve, 200));

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

          if (audioBlob.size === 0) {
            alert("录音为空，请重试");
            setProcessingVoice(false);
            return;
          }

          const realDuration = Math.max(1, Math.round((Date.now() - recordingStartTimeRef.current) / 1000));
          const pcmBlob = await convertWebmToPcm(audioBlob);

          const uploadForm = new FormData();
          uploadForm.append("audio", audioBlob, "voice.webm");
          uploadForm.append("duration", String(realDuration));

          // 并行：上传 R2 + STT 识别
          const uploadPromise = fetch("/api/chat/voice", {
            method: "POST",
            body: uploadForm,
          });

          const sttPromise = (async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);
            try {
              const sttForm = new FormData();
              sttForm.append("audio", pcmBlob, "voice.pcm");
              const sttRes = await fetch("/api/stt/transcribe", {
                method: "POST",
                body: sttForm,
                signal: controller.signal,
              });
              const sttData = await sttRes.json();
              return sttData.success && sttData.text ? sttData.text : "";
            } catch (e) {
              console.error("STT 识别失败:", e);
              return "";
            } finally {
              clearTimeout(timeoutId);
            }
          })();

          const [uploadRes, sttText] = await Promise.all([
            uploadPromise,
            sttPromise.catch(() => ""),
          ]);
          const uploadData = await uploadRes.json();

          if (!uploadData.success || !uploadData.audioUrl) {
            alert(uploadData.error || "语音上传失败");
            setProcessingVoice(false);
            return;
          }

          // 消息即将显示，标签立刻消失，不等后端返回
          setProcessingVoice(false);
          await sendVoiceMessage(uploadData.audioUrl, realDuration, sttText);
        } catch (err: any) {
          console.error("发送语音失败:", err);
          alert("发送语音失败，请重试");
          setProcessingVoice(false);
        }
      };

      mediaRecorder.start(100);
      setRecording(true);
    } catch (err) {
      console.error("无法访问麦克风:", err);
      alert("请允许麦克风权限以使用语音输入功能");
    }
  };

  const renderMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.senderType === "user";
    const showTime =
      index > 0 &&
      shouldShowTimeDivider(msg.createdAt, messages[index - 1]?.createdAt);

    return (
      <div key={msg.id}>
        {showTime && (
          <div className="my-6 text-center text-xs text-foreground-muted">
            {formatTime(msg.createdAt)}
          </div>
        )}

        <div
          id={`msg-${msg.id}`}
          className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[75%] ${isUser ? "text-right" : "text-left"}`}
          >
            {/* Character Avatar for non-user messages */}
            {!isUser && (
              <div className="mb-2 flex items-center gap-2">
                <div className="relative h-6 w-6 overflow-hidden rounded-full">
                  {getAvatarUrl(characterName) && (
                    <Image
                      src={getAvatarUrl(characterName)}
                      alt={characterName}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <span className="text-xs text-foreground-muted">
                  {characterName}
                </span>
              </div>
            )}

            <div
              className={`inline-block rounded-lg px-4 py-3 ${
                isUser
                  ? "bg-primary text-white"
                  : "bg-cream-100 text-foreground"
              }`}
            >
              {msg.status === "generating" && (
                <div className="flex items-center gap-2 py-1">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-foreground-muted" />
                  <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-foreground-muted [animation-delay:0.2s]" />
                  <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-foreground-muted [animation-delay:0.4s]" />
                </div>
              )}

              {msg.status === "failed" && (
                <p className="text-sm text-foreground-muted">
                  他刚刚没发出去，再试一次
                </p>
              )}

              {msg.status !== "generating" &&
                msg.status !== "failed" &&
                msg.contentText &&
                (msg.messageType === "image" ? (
                  <img
                    src={msg.contentText}
                    alt="图片"
                    className="max-w-full rounded"
                    loading="lazy"
                  />
                ) : msg.messageType === "voice" ? (
                  <VoicePlayer
                    src={msg.contentText}
                    duration={msg.duration}
                    isUser={isUser}
                  />
                ) : (
                  <p className="text-sm leading-relaxed">{msg.contentText}</p>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const scrollToMessage = (msgId: string) => {
    setShowHistory(false);
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-lg");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-lg");
      }, 2000);
    }
  };

  const getMessagePreview = (msg: ChatMessage) => {
    if (msg.messageType === "image") return "[图片]";
    if (msg.messageType === "voice") return msg.sttText || "[语音]";
    return msg.contentText || "";
  };

  const filteredMessages = historySearch.trim()
    ? messages.filter((m) => {
        const text = (m.contentText || "") + (m.sttText || "");
        return text.toLowerCase().includes(historySearch.trim().toLowerCase());
      })
    : messages;

  const avatarUrl = getAvatarUrl(characterName);

  return (
    <main className="relative flex h-screen flex-col bg-background font-body">
      {/* TopBar - Minimal */}
      <header className="flex h-14 flex-shrink-0 items-center border-b border-border px-4 lg:px-6">
        <Link
          href="/characters"
          className="mr-4 flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-cream-100"
        >
          <ArrowLeft size={18} />
        </Link>

        <div className="relative mr-3 h-8 w-8 overflow-hidden rounded-full">
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt={characterName}
              fill
              className="object-cover"
            />
          )}
        </div>

        <span className="flex-1 text-sm font-medium text-foreground">
          {characterName || "加载中……"}
        </span>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-cream-100"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-50 w-48 rounded-lg border border-border bg-white py-1 shadow-card">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/");
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-cream-100"
              >
                <Home size={16} />
                返回首页
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/characters");
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-cream-100"
              >
                <Users size={16} />
                切换角色
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setShowHistory(true);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-cream-100"
              >
                <Search size={16} />
                聊天记录
              </button>
              <div className="mx-4 my-1 h-px bg-border" />
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  if (confirm("确定要清空和" + characterName + "的聊天记录吗？")) {
                    try {
                      await fetch("/api/chat/clear", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ characterId }),
                      });
                      setMessages([]);
                    } catch {
                      alert("清空失败，请重试");
                    }
                  }
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-primary transition-colors hover:bg-cream-100"
              >
                <Trash2 size={16} />
                清空记录
              </button>
            </div>
          )}
        </div>
      </header>

      {/* History Panel */}
      {showHistory && (
        <div className="absolute inset-0 z-40 flex flex-col bg-background">
          {/* History Header */}
          <div className="flex h-14 flex-shrink-0 items-center border-b border-border px-4">
            <button
              onClick={() => setShowHistory(false)}
              className="mr-3 flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-cream-100"
            >
              <X size={18} />
            </button>
            <span className="flex-1 text-sm font-medium text-foreground">
              与 {characterName} 的聊天记录
            </span>
          </div>

          {/* Search Input */}
          <div className="flex-shrink-0 border-b border-border px-4 py-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="搜索聊天记录..."
                className="h-10 w-full rounded-lg border border-border bg-cream-50 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-primary"
                autoFocus
              />
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {filteredMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-foreground-muted">
                  {historySearch.trim() ? "没有找到匹配的消息" : "暂无聊天记录"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredMessages.map((msg) => {
                  const isUser = msg.senderType === "user";
                  const preview = getMessagePreview(msg);
                  const fullDateTime = new Date(msg.createdAt).toLocaleString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const keyword = historySearch.trim().toLowerCase();
                  const renderHighlight = (text: string) => {
                    if (!keyword) return text;
                    const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
                    return parts.map((part, i) =>
                      part.toLowerCase() === keyword ? (
                        <span key={i} className="font-medium text-primary">{part}</span>
                      ) : (
                        part
                      )
                    );
                  };
                  return (
                    <button
                      key={msg.id}
                      onClick={() => scrollToMessage(msg.id)}
                      className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-cream-100"
                    >
                      <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
                        {isUser ? (
                          <div className="flex h-full w-full items-center justify-center bg-primary text-[10px] font-medium text-white">
                            我
                          </div>
                        ) : (
                          avatarUrl && (
                            <Image
                              src={avatarUrl}
                              alt={characterName}
                              fill
                              className="object-cover"
                            />
                          )
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground-muted">
                            {isUser ? "我" : characterName}
                          </span>
                          <span className="text-[10px] text-foreground-muted">{fullDateTime}</span>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-foreground">
                          {renderHighlight(preview)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-px w-16 animate-pulse bg-border" />
              <p className="text-sm text-foreground-muted">加载中……</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="mb-2 font-display text-lg text-foreground-muted">
                先打个招呼吧
              </p>
              <p className="text-xs text-foreground-muted">
                输入文字开始聊天
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => renderMessage(msg, index))
        )}
        {sending && (
          <div className="mb-4 flex justify-start">
            <div className="rounded-lg bg-cream-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-foreground-muted" />
                <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-foreground-muted [animation-delay:0.2s]" />
                <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-foreground-muted [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-border bg-cream-50 px-4 py-3 safe-bottom">
        {recording && (
          <div className="mx-auto mb-2 flex max-w-2xl items-center gap-2 text-xs text-primary">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
            正在录音，点击麦克风按钮结束
          </div>
        )}
        {processingVoice && (
          <div className="mx-auto mb-2 flex max-w-2xl items-center gap-2 text-xs text-foreground-muted">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-foreground-muted border-t-transparent" />
            语音识别中...
          </div>
        )}
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <button
            onClick={toggleRecording}
            disabled={sending || processingVoice}
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
              recording
                ? "bg-primary text-white animate-pulse"
                : "text-foreground-muted hover:bg-cream-100"
            } disabled:opacity-30`}
          >
            {processingVoice ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            )}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || recording}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-cream-100 disabled:opacity-30"
          >
            <ImagePlus size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={recording ? "正在录音..." : processingVoice ? "语音识别中..." : "说点什么……"}
            disabled={sending || recording || processingVoice}
            className="flex-1 rounded-full border border-border bg-white px-4 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending || recording || processingVoice}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-charcoal-800 text-white transition-all hover:bg-charcoal-700 disabled:opacity-30"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}
