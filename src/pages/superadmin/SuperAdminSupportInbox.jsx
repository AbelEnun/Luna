import { useEffect, useRef, useState } from "react";
import {
  collection, doc, onSnapshot, orderBy, query,
  serverTimestamp, writeBatch, setDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { Send, ImageIcon, X, Headphones, Building } from "lucide-react";

// Client-side image compression: converts to lightweight Base64 JPEG (no Firebase Storage needed!)
function compressImage(file, maxWidth = 800, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * SuperAdminSupportInbox
 * Shows a list of business support threads on the left;
 * clicking one opens the full chat on the right.
 * The super admin can reply with text or images.
 */
export default function SuperAdminSupportInbox() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  // Listen to all support threads
  useEffect(() => {
    setLoadingThreads(true);
    const unsub = onSnapshot(
      collection(db, "support_chats"),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.lastMessageAt?.toMillis?.() ?? 0) - (a.lastMessageAt?.toMillis?.() ?? 0));
        setThreads(list);
        setLoadingThreads(false);
      },
      (err) => { console.error("Support inbox error:", err); setLoadingThreads(false); }
    );
    return () => unsub();
  }, []);

  const selected = threads.find((t) => t.id === selectedId);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", minHeight: "500px", gap: 0, border: "1px solid var(--border, #e2e8f0)", borderRadius: "12px", overflow: "hidden" }}>
      {/* Left panel — thread list */}
      <div style={{ width: "280px", flexShrink: 0, borderRight: "1px solid var(--border, #e2e8f0)", display: "flex", flexDirection: "column", background: "var(--surface, #f8fafc)" }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border, #e2e8f0)" }}>
          <h3 style={{ margin: 0, fontSize: "15px" }}>Support Inbox</h3>
          <p className="muted" style={{ margin: "2px 0 0", fontSize: "12px" }}>Business owner messages</p>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingThreads && <p className="muted empty">Loading…</p>}
          {!loadingThreads && threads.length === 0 && (
            <p className="muted empty" style={{ padding: "24px 16px", textAlign: "center" }}>No support messages yet.</p>
          )}
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedId(thread.id)}
              style={{
                width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                padding: "12px 16px",
                background: selectedId === thread.id ? "rgba(24,57,47,0.08)" : "transparent",
                borderLeft: selectedId === thread.id ? "3px solid #18392f" : "3px solid transparent",
                transition: "background 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Building size={14} color="#18392f" />
                <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text, #111)" }}>
                  {thread.businessName || thread.id}
                </span>
                {thread.unreadByAdmin && (
                  <span style={{ marginLeft: "auto", width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626", flexShrink: 0 }} />
                )}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {thread.lastMessage || "No messages"}
              </p>
              <span style={{ fontSize: "10px", color: "var(--muted, #9ca3af)", marginTop: "2px", display: "block" }}>
                {thread.lastMessageAt?.toDate?.()?.toLocaleDateString() || ""}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel — thread view */}
      {selectedId && selected ? (
        <SupportThread key={selectedId} businessId={selectedId} businessName={selected.businessName} adminUser={user} />
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--muted, #9ca3af)" }}>
          <Headphones size={48} style={{ marginBottom: "16px", opacity: 0.4 }} />
          <p>Select a business to open their support thread.</p>
        </div>
      )}
    </div>
  );
}

// ─── Single thread view (admin side) ─────────────────────────────────────────
function SupportThread({ businessId, businessName, adminUser }) {
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const endRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setMsgs([]);
    const unsub = onSnapshot(
      query(collection(db, "support_chats", businessId, "messages"), orderBy("createdAt")),
      (snap) => {
        setMsgs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        // Mark read by admin
        setDoc(doc(db, "support_chats", businessId), { unreadByAdmin: false }, { merge: true }).catch(() => {});
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return () => unsub();
  }, [businessId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  function pickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !imageFile) return;
    if (!adminUser) return;

    setSending(true);
    setError("");
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await compressImage(imageFile, 800, 0.65);
      }

      const threadDoc = doc(db, "support_chats", businessId);
      const msgRef = doc(collection(db, "support_chats", businessId, "messages"));
      const batch = writeBatch(db);
      batch.set(threadDoc, {
        lastMessage: trimmed || "📷 Image",
        lastMessageAt: serverTimestamp(),
        unreadByOwner: true,
        unreadByAdmin: false,
      }, { merge: true });
      batch.set(msgRef, {
        senderId: adminUser.uid,
        senderRole: "superadmin",
        senderName: "Platform Admin",
        text: trimmed,
        imageUrl,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      setText("");
      clearImage();
    } catch (err) {
      console.error("Support reply error:", err);
      setError(err.message || "Could not send reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg, #fff)" }}>
      {/* Thread header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border, #e2e8f0)", display: "flex", alignItems: "center", gap: "10px" }}>
        <Building size={16} color="#18392f" />
        <strong style={{ fontSize: "14px" }}>{businessName || businessId}</strong>
        <span className="muted" style={{ fontSize: "12px" }}>Support Thread</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {loading && <p className="muted empty">Loading messages…</p>}
        {error && <p className="error empty">{error}</p>}
        {!loading && msgs.length === 0 && (
          <p className="muted empty" style={{ textAlign: "center", marginTop: "40px" }}>No messages in this thread yet.</p>
        )}
        {msgs.map((m) => {
          const isMine = m.senderRole === "superadmin";
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
              {!isMine && (
                <span style={{ fontSize: "11px", color: "var(--muted, #9ca3af)", marginBottom: "3px", paddingLeft: "4px" }}>
                  {businessName || "Business Owner"}
                </span>
              )}
              <div style={{
                maxWidth: "70%",
                background: isMine ? "#18392f" : "var(--surface, #f1f5f9)",
                color: isMine ? "#fff" : "var(--text, #111)",
                borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                padding: "10px 14px",
                border: isMine ? "none" : "1px solid var(--border, #e2e8f0)",
                fontSize: "14px", lineHeight: "1.5",
              }}>
                {m.imageUrl && (
                  <img
                    src={m.imageUrl} alt="attachment"
                    style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: m.text ? "8px" : 0, display: "block", cursor: "pointer" }}
                    onClick={() => window.open(m.imageUrl, "_blank")}
                  />
                )}
                {m.text && <p style={{ margin: 0 }}>{m.text}</p>}
              </div>
              <span style={{ fontSize: "10px", color: "var(--muted, #9ca3af)", marginTop: "3px", paddingRight: isMine ? "4px" : 0, paddingLeft: isMine ? 0 : "4px" }}>
                {m.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || ""}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div style={{ padding: "8px 20px", background: "var(--surface, #f8fafc)", borderTop: "1px solid var(--border, #e2e8f0)", display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={imagePreview} alt="preview" style={{ height: "48px", width: "48px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border, #e2e8f0)" }} />
          <span style={{ fontSize: "13px", color: "var(--muted, #6b7280)", flex: 1 }}>{imageFile?.name}</span>
          <button type="button" onClick={clearImage} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted, #6b7280)", display: "flex" }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Compose */}
      <form onSubmit={send} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderTop: "1px solid var(--border, #e2e8f0)", background: "var(--bg, #fff)" }}>
        <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={pickImage} />
        <button type="button" onClick={() => fileRef.current?.click()} title="Attach image"
          style={{ background: "var(--surface, #f1f5f9)", border: "none", borderRadius: "8px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--muted, #6b7280)", flexShrink: 0 }}>
          <ImageIcon size={17} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reply to business owner…"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) send(e); }}
          style={{ flex: 1, padding: "9px 14px", border: "1px solid var(--border, #e2e8f0)", borderRadius: "8px", fontSize: "14px", outline: "none", background: "var(--bg, #fff)", color: "var(--text, #111)" }}
        />
        <button type="submit" disabled={sending || (!text.trim() && !imageFile)}
          style={{ background: "#18392f", color: "#fff", border: "none", borderRadius: "8px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, opacity: (sending || (!text.trim() && !imageFile)) ? 0.5 : 1 }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

