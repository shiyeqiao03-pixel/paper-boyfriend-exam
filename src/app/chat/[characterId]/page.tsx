"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, MoreHorizontal, Send, ImagePlus, Trash2, Home, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatTime, shouldShowTimeDivider } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/character-avatars";

interface ChatMessage {
  id: string;
  senderType: "user" | "character" | "system";
  messageType: "text" | "image" | "voice";
  contentText: string | null;
  status: string;
  createdAt: string;
  replyGroupId: string | null;
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioContext = new AudioContext({ sampleRate: 16000 });
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          const resampledBuffer = audioContext.createBuffer(
            1,
            Math.floor(audioBuffer.length * (16000 / audioBuffer.sampleRate)),
            16000
          );
          const channelData = audioBuffer.getChannelData(0);
          const resampledData = resampledBuffer.getChannelData(0);
          const ratio = audioBuffer.sampleRate / 16000;

          for (let i = 0; i < resampledData.length; i++) {
            const idx = Math.floor(i * ratio);
            resampledData[i] = channelData[idx];
          }

          const pcmBuffer = new Int16Array(resampledData.length);
          for (let i = 0; i < resampledData.length; i++) {
            const s = Math.max(-1, Math.min(1, resampledData[i]));
            pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          const pcmBlob = new Blob([pcmBuffer], { type: "audio/pcm" });

          const formData = new FormData();
          formData.append("audio", pcmBlob, "audio.pcm");

          const res = await fetch("/api/stt/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (data.success && data.text) {
            setInputText(data.text);
            setTimeout(() => handleSend(), 100);
          } else {
            alert(data.error || "语音识别失败，请检查麦克风权限或稍后重试");
          }
        } catch (err: any) {
          console.error("语音识别失败:", err);
          alert("语音识别服务暂不可用，请直接输入文字");
        } finally {
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
                ) : (
                  <p className="text-sm leading-relaxed">{msg.contentText}</p>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const avatarUrl = getAvatarUrl(characterName);

  return (
    <main className="flex h-screen flex-col bg-background font-body">
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
            disabled={sending}
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
            placeholder="说点什么……"
            disabled={sending}
            className="flex-1 rounded-full border border-border bg-white px-4 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-charcoal-800 text-white transition-all hover:bg-charcoal-700 disabled:opacity-30"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}
