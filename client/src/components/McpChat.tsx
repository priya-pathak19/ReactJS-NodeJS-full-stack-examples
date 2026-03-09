/**
 * McpChat.tsx
 * Drop this into your existing React app.
 * Calls POST /api/mcp-chat on your Node.js backend.
 */

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
}

export default function McpChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/mcp-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: updated
            .slice(-10)
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply ?? data.error ?? "Something went wrong.",
          toolsUsed: data.toolsUsed ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Could not reach server." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.title}>Store Assistant</span>
        <span style={s.dot} />
      </div>

      <div style={s.messages}>
        {messages.length === 0 && (
          <div style={s.empty}>Ask me about products or place an order.</div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={m.role === "user" ? s.userRow : s.botRow}>
            <div style={m.role === "user" ? s.userBubble : s.botBubble}>
              {m.content}
              {m.toolsUsed && m.toolsUsed.length > 0 && (
                <div style={s.tools}>
                  {m.toolsUsed.map((t) => (
                    <span key={t} style={s.tool}>
                      ⚙ {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={s.botRow}>
            <div style={s.botBubble}>
              <span style={s.dots}>···</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={s.inputRow}>
        <input
          style={s.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button
          style={s.btn}
          onClick={send}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    height: 500,
    width: "100%",
    maxWidth: 560,
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
    fontFamily: "inherit",
    background: "#fff",
  },
  header: {
    padding: "12px 16px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#fafafa",
  },
  title: { fontSize: 14, fontWeight: 600, color: "#111" },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "#22c55e" },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  empty: { color: "#94a3b8", fontSize: 13, textAlign: "center", marginTop: 40 },
  userRow: { display: "flex", justifyContent: "flex-end" },
  botRow: { display: "flex", justifyContent: "flex-start" },
  userBubble: {
    background: "#111",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "12px 12px 2px 12px",
    fontSize: 13,
    maxWidth: "75%",
    lineHeight: 1.5,
  },
  botBubble: {
    background: "#f1f5f9",
    color: "#111",
    padding: "8px 12px",
    borderRadius: "12px 12px 12px 2px",
    fontSize: 13,
    maxWidth: "75%",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  tools: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 },
  tool: {
    fontSize: 10,
    padding: "2px 6px",
    borderRadius: 4,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#15803d",
  },
  dots: { fontSize: 18, letterSpacing: 2, color: "#94a3b8" },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: 12,
    borderTop: "1px solid #e2e8f0",
    background: "#fafafa",
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
  },
  btn: {
    padding: "8px 16px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 600,
  },
};
