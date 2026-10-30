import { useEffect, useRef, useState } from "react";
import {
  collection, doc, onSnapshot, orderBy, query,
  serverTimestamp, writeBatch, setDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { useLanguage } from "../../context/LanguageContext";
import { Send, X, Headphones, ImageIcon } from "lucide-react";

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

export default function PortalSupport() {
  const { user } = useAuth();
  const { business, businessId } = useTenant();
  const { t } = useLanguage();

  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const endRef = useRef(null);
  const fileRef = useRef(null);

  // Listen to messages in this business's support thread
  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    const msgsCol = collection(db, "support_chats", businessId, "messages");
    const unsub = onSnapshot(
      query(msgsCol, orderBy("createdAt")),
      (snap) => {
        setMsgs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        // Mark as read by owner
        setDoc(
          doc(db, "support_chats", businessId),
          { unreadByOwner: false },
          { merge: true }
        ).catch(() => {});
      },
      (err) => {
        setError(err.message || t("supportLoadError", "Could not load support messages."));
        setLoading(false);
      }
    );
    return () => unsub();
  }, [businessId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  function pickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("supportImageOnly", "Please select an image file."));
      return;
    }
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
    if (!businessId || !user) return;

    setSending(true);
    setError("");

    try {
      let imageUrl = null;
      if (imageFile) {
        // Compress in browser and save directly to Firestore as lightweight data URL
        imageUrl = await compressImage(imageFile, 800, 0.65);
      }

      const threadDoc = doc(db, "support_chats", businessId);
      const msgRef = doc(collection(db, "support_chats", businessId, "messages"));
      const batch = writeBatch(db);

      batch.set(
        threadDoc,
        {
          businessId,
          businessName: business?.name || "",
          lastMessage: trimmed || "📷 Image",
          lastMessageAt: serverTimestamp(),
          unreadByAdmin: true,
          unreadByOwner: false,
        },
        { merge: true }
      );

      batch.set(msgRef, {
        senderId: user.uid,
        senderRole: "owner",
        senderName: business?.name || user.email || "Owner",
        text: trimmed,
        imageUrl,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      setText("");
      clearImage();
    } catch (err) {
      console.error("Support send error:", err);
      setError(err.message || t("supportSendError", "Could not send message."));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="portal-panel" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: "500px" }}>
      {/* Header */}
      <div className="panel-header" style={{ borderBottom: "1px solid var(--border, #e2e8f0)", paddingBottom: "14px", marginBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ background: "#18392f", borderRadius: "8px", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Headphones size={18} color="#fff" />
          </span>
          <div>
            <h3 style={{ margin: 0 }}>{t("platformSupport", "Platform Support")}</h3>
            <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
              {t("platformSupportDesc", "Chat directly with the platform admin. Share questions, issues, or images.")}
            </p>
          </div>
        </div>
      </div>

      {/* Message log */}
      <div
        style={{
          flex: 1, overflowY: "auto", padding: "20px 16px",
          display: "flex", flexDirection: "column", gap: "10px",
        }}
      >
        {loading && <p className="muted empty">{t("loadingMessages", "Loading messages…")}</p>}
        {!loading && msgs.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <Headphones size={40} color="#cbd5e1" style={{ marginBottom: "12px" }} />
            <p className="muted">{t("supportNoMessages", "No messages yet. Send a message to reach the platform admin.")}</p>
          </div>
        )}
        {error && <p className="error empty" role="alert">{error}</p>}

        {msgs.map((m) => {
          const isMine = m.senderRole === "owner";
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMine ? "flex-end" : "flex-start",
              }}
            >
              {!isMine && (
                <span style={{ fontSize: "11px", color: "var(--muted, #9ca3af)", marginBottom: "3px", paddingLeft: "4px" }}>
                  {t("platformAdmin", "Platform Admin")}
                </span>
              )}
              <div
                style={{
                  maxWidth: "72%",
                  background: isMine ? "#18392f" : "var(--surface, #f8fafc)",
                  color: isMine ? "#fff" : "var(--text, #111)",
                  borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "10px 14px",
                  border: isMine ? "none" : "1px solid var(--border, #e2e8f0)",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                {m.imageUrl && (
                  <img
                    src={m.imageUrl}
                    alt="attachment"
                    style={{
                      maxWidth: "100%", borderRadius: "8px", marginBottom: m.text ? "8px" : 0,
                      display: "block", cursor: "pointer",
                    }}
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

      {/* Image preview bar */}
      {imagePreview && (
        <div style={{ padding: "8px 16px", background: "var(--surface, #f8fafc)", borderTop: "1px solid var(--border, #e2e8f0)", display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={imagePreview} alt="preview" style={{ height: "48px", width: "48px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border, #e2e8f0)" }} />
          <span style={{ fontSize: "13px", color: "var(--muted, #6b7280)", flex: 1 }}>{imageFile?.name}</span>
          <button type="button" onClick={clearImage} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted, #6b7280)", display: "flex" }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Compose form */}
      <form
        onSubmit={send}
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "12px 16px", borderTop: "1px solid var(--border, #e2e8f0)",
          background: "var(--bg, #fff)",
        }}
      >
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          style={{ display: "none" }}
          onChange={pickImage}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title={t("attachImage", "Attach image")}
          style={{
            background: "var(--surface, #f1f5f9)", border: "none", borderRadius: "8px",
            width: "38px", height: "38px", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", color: "var(--muted, #6b7280)",
            flexShrink: 0,
          }}
        >
          <ImageIcon size={17} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("supportPlaceholder", "Message platform admin…")}
          style={{
            flex: 1, padding: "9px 14px", border: "1px solid var(--border, #e2e8f0)",
            borderRadius: "8px", fontSize: "14px", outline: "none",
            background: "var(--bg, #fff)", color: "var(--text, #111)",
          }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) send(e); }}
        />
        <button
          type="submit"
          disabled={sending || (!text.trim() && !imageFile)}
          style={{
            background: "#18392f", color: "#fff", border: "none", borderRadius: "8px",
            width: "38px", height: "38px", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", flexShrink: 0,
            opacity: (sending || (!text.trim() && !imageFile)) ? 0.5 : 1,
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </section>
  );
}

