import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function ChatThread({
  businessId,
  chatId,
  role = "customer",
  customerName,
  attach,
  onClearAttach,
  slug,
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const endRef = useRef(null);

  const isDemo = businessId === "demo-atelier-22" || businessId === "sample-default";

  useEffect(() => {
    if (!chatId) return;

    if (isDemo) {
      setMsgs([
        {
          id: "m-1",
          senderId: "customer-demo",
          senderRole: "customer",
          text: "Hello! Is the Silk Organza Trench available in size M for a fitting tomorrow?",
          createdAt: { toMillis: () => Date.now() - 3600000 },
        },
        {
          id: "m-2",
          senderId: "admin-demo",
          senderRole: "admin",
          text: "Greetings! Yes, we have size M in our showroom. We would be delighted to reserve it for your private fitting.",
          createdAt: { toMillis: () => Date.now() - 1800000 },
        }
      ]);
      setLoading(false);
      return;
    }

    setMsgs([]);
    setLoading(true);
    setError("");

    const messagesCol = businessId
      ? collection(db, "businesses", businessId, "chats", chatId, "messages")
      : collection(db, "chats", chatId, "messages");

    const unsubscribe = onSnapshot(
      query(messagesCol, orderBy("createdAt")),
      (snapshot) => {
        setMsgs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Chat error:", err);
        setError(err.message || "Could not load messages.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [businessId, chatId, isDemo]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    const last = msgs[msgs.length - 1];
    if (!last || last.senderRole === role || isDemo || !businessId) return;

    const chatDocRef = doc(db, "businesses", businessId, "chats", chatId);
    setDoc(
      chatDocRef,
      { [role === "admin" ? "unreadByBusiness" : "unreadByCustomer"]: false },
      { merge: true }
    ).catch((markReadError) => {
      console.error("Could not mark chat messages as read:", markReadError);
      setError(markReadError.message || "Could not update message read status.");
    });
  }, [msgs, role, chatId, businessId, isDemo]);

  async function send(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t && !attach) return;

    if (isDemo) {
      const newMsg = {
        id: `m-${Date.now()}`,
        senderId: user?.uid || "guest",
        senderRole: role,
        text: t,
        createdAt: { toMillis: () => Date.now() },
      };
      if (attach) {
        newMsg.productId = attach.id;
        newMsg.productTitle = attach.title;
        newMsg.productImage = attach.image;
      }
      setMsgs((current) => [...current, newMsg]);
      setText("");
      onClearAttach?.();
      return;
    }

    if (!businessId || !user) return;

    const m = {
      senderId: user.uid,
      senderRole: role,
      text: t,
      createdAt: serverTimestamp(),
    };
    if (attach) {
      m.productId = attach.id;
      m.productTitle = attach.title;
      m.productImage = attach.image;
    }

    const chatDoc = doc(db, "businesses", businessId, "chats", chatId);
    const messageRef = doc(collection(db, "businesses", businessId, "chats", chatId, "messages"));
    const batch = writeBatch(db);
    batch.set(chatDoc, {
      customerId: chatId,
      ...(role === "customer"
        ? { customerName: customerName || user.displayName || user.email || "Customer", unreadByBusiness: true }
        : { unreadByCustomer: true, unreadByBusiness: false }),
      lastMessage: t || `Inquired about ${attach?.title || "item"}`,
      lastMessageAt: serverTimestamp(),
    }, { merge: true });
    batch.set(messageRef, m);

    try {
      await batch.commit();
      setText("");
      setError("");
      onClearAttach?.();
    } catch (sendError) {
      console.error("Could not send chat message:", sendError);
      setError(sendError.message || "Could not send your message.");
    }
  }

  return (
    <section className="chat" aria-label="Conversation">
      <div className="chat-log">
        {loading && <p className="muted empty">{t("loadingMessages", "Loading messages…")}</p>}
        {error && <p className="error empty" role="alert">{error}</p>}
        {!loading && msgs.length === 0 && (
          <p className="muted empty">
            {role === "customer"
              ? t("chatCustomerHelp", "Ask about sizes, materials, or availability. The boutique concierge replies here in realtime.")
              : t("chatNoMessages", "No customer messages in this thread yet.")}
          </p>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`bubble ${m.senderRole === role ? "mine" : "theirs"}`}>
            {m.productId && (
              <div className="attached-item-box">
                {m.productImage && <img src={m.productImage} alt="" />}
                <div>
                  <span className="eyebrow" style={{ fontSize: "10px", margin: 0 }}>{t("inquiryAbout", "Inquiry about")}</span>
                  {slug ? (
                    <Link to={`/store/${slug}/product/${m.productId}`} className="attached">
                      {m.productTitle}
                    </Link>
                  ) : (
                    <span className="attached-title">{m.productTitle}</span>
                  )}
                </div>
              </div>
            )}
            {m.text && <p>{m.text}</p>}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {attach && (
        <div className="attach-bar">
          {attach.image && <img src={attach.image} alt="" />}
          <span>{t("askingAbout", "Asking about:")} <strong>{attach.title}</strong></span>
          <button type="button" className="link" onClick={onClearAttach}>{t("remove", "Remove")}</button>
        </div>
      )}

      <form className="chat-form" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={role === "customer" ? t("chatPlaceholderCustomer", "Write a message to the boutique…") : t("chatPlaceholderAdmin", "Reply to customer…")}
          aria-label="Message"
        />
        <button className="btn" type="submit">{t("send", "Send")}</button>
      </form>
    </section>
  );
}
