"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, MoreHorizontal, Send, ImagePlus } from "lucide-react";
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
  const params = useParams();
  const characterId = params.characterId as string;
  const [characterName, setCharacterName] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processingVoice, setProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || []);
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [characterId, scrollToBottom]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    // 乐观更新：先显示用户消息
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

        // 乐观更新
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

  // 语音识别相关
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
            alert("语音识别失败，请重试");
          }
        } catch (err) {
          console.error("语音识别失败:", err);
          alert("语音识别失败，请重试");
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
          <div className="my-4 text-center text-xs text-foreground-muted">
            {formatTime(msg.createdAt)}
          </div>
        )}

        <div
          className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              isUser
                ? "rounded-br-sm bg-bubble-user text-foreground"
                : "rounded-bl-sm bg-bubble-character text-foreground"
            }`}
          >
            {msg.status === "generating" && (
              <div className="flex items-center gap-2 py-1">
                <span className="inline-block h-2 w-2 animate-pulse-soft rounded-full bg-accent" />
                <span className="inline-block h-2 w-2 animate-pulse-soft rounded-full bg-accent [animation-delay:0.2s]" />
                <span className="inline-block h-2 w-2 animate-pulse-soft rounded-full bg-accent [animation-delay:0.4s]" />
              </div>
            )}

            {msg.status === "failed" && (
              <div>
                <p className="text-sm text-foreground-secondary">
                  他刚刚没发出去，再试一次
                </p>
              </div>
            )}

            {msg.status !== "generating" &&
              msg.status !== "failed" &&
              msg.contentText &&
              (msg.messageType === "image" ? (
                <img
                  src={msg.contentText}
                  alt="图片"
                  className="max-w-full rounded-lg"
                  loading="lazy"
                />
              ) : (
                <p className="text-base">{msg.contentText}</p>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const avatarUrl = getAvatarUrl(characterName);

  return (
    <main className="flex h-screen flex-col bg-background">
      {/* TopBar */}
      <header className="flex h-14 flex-shrink-0 items-center border-b border-border bg-background px-4">
        <Link
          href="/characters"
          className="mr-3 flex h-8 w-8 items-center justify-center rounded-full text-foreground-secondary transition-colors hover:bg-background-secondary"
        >
          <ArrowLeft size={20} />
        </Link>

        <div className="mr-3 h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-muted">
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt={characterName}
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <span className="flex-1 text-base font-semibold text-foreground">
          {characterName || "加载中……"}
        </span>

        <button className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-secondary transition-colors hover:bg-background-secondary">
          <MoreHorizontal size={20} />
        </button>
      </header>

      {/* 聊天区 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse-soft rounded-full bg-accent" />
              <span className="inline-block h-2 w-2 animate-pulse-soft rounded-full bg-accent [animation-delay:0.2s]" />
              <span className="inline-block h-2 w-2 animate-pulse-soft rounded-full bg-accent [animation-delay:0.4s]" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-base text-foreground-muted">先打个招呼吧</p>
          </div>
        ) : (
          messages.map((msg, index) => renderMessage(msg, index))
        )}
        {sending && (
          <div className="mb-3 flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-bubble-character px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse-soft rounded-full bg-accent" />
                <span className="inline-block h-2 w-2 animate-pulse-soft rounded-full bg-accent [animation-delay:0.2s]" />
                <span className="inline-block h-2 w-2 animate-pulse-soft rounded-full bg-accent [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <div className="flex-shrink-0 border-t border-border bg-white px-4 py-3 safe-bottom">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleRecording}
            disabled={sending || processingVoice}
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
              recording
                ? "bg-red-500 text-white animate-pulse"
                : "text-foreground-secondary hover:bg-background-secondary"
            } disabled:opacity-30`}
          >
            {processingVoice ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            )}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-foreground-secondary transition-colors hover:bg-background-secondary disabled:opacity-30"
          >
            <ImagePlus size={20} />
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
            className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-base text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-subtle transition-all hover:bg-primary-hover disabled:opacity-30"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </main>
  );
}
