import { useState } from "react";
import { MessageSquare, User } from "lucide-react";
import { useTenant } from "../../context/TenantContext";
import { useTenantChats } from "../../hooks/useTenantChats";
import { useLanguage } from "../../context/LanguageContext";
import ChatThread from "../../components/ChatThread";

export default function PortalInbox() {
  const { business, slug } = useTenant();
  const { chats, loading, error } = useTenantChats({ admin: true });
  const { t } = useLanguage();
  const [activeChatId, setActiveChatId] = useState(null);

  const active = activeChatId || chats[0]?.id || null;
  const activeChat = chats.find((c) => c.id === active);

  return (
    <div className="portal-inbox-page">
      <div className="portal-page-header">
        <div>
          <span className="eyebrow">{t("customerCRM", "Customer CRM")}</span>
          <h1>{t("conciergeInbox", "Concierge Inbox")}</h1>
          <p className="muted">{t("liveRealtimeConversations", "Live real-time conversations with clients browsing your showroom.")}</p>
        </div>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {chats.length === 0 && !loading ? (
        <div className="portal-panel center" style={{ padding: "48px 24px" }}>
          <MessageSquare size={36} color="var(--muted)" style={{ margin: "0 auto 12px" }} />
          <h3>{t("noCustomerConversationsYet", "No Customer Conversations Yet")}</h3>
          <p className="muted">
            {t("customerInquiriesDesc", "Customer inquiries appear here in realtime when visitors ask questions from your showroom.")}
          </p>
        </div>
      ) : (
        <div className="inbox-container">
          <aside className="inbox-threads-sidebar">
            <div className="inbox-sidebar-head">
              <strong>{t("allInquiries", "All Inquiries")} ({chats.length})</strong>
            </div>
            <ul className="threads-list">
              {chats.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`thread-item-btn ${active === c.id ? "active" : ""}`}
                    onClick={() => setActiveChatId(c.id)}
                  >
                    <div className="thread-avatar">
                      <User size={16} />
                    </div>
                    <div className="thread-content-col">
                      <div className="thread-top-line">
                        <strong>{c.customerName || "Customer"}</strong>
                        {c.unreadByBusiness && <span className="dot" aria-label="Unread message" />}
                      </div>
                      <span className="clip muted thread-last-msg">
                        {c.lastMessage || "Started a conversation"}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="inbox-chat-window">
            {active ? (
              <>
                <div className="inbox-active-header">
                  <div>
                    <strong>{activeChat?.customerName || "Customer"}</strong>
                    <span className="muted">{t("directConciergeInquiry", "Direct concierge inquiry")}</span>
                  </div>
                </div>
                <ChatThread
                  businessId={business.id}
                  chatId={active}
                  role="admin"
                  slug={slug}
                />
              </>
            ) : (
              <div className="empty-thread-placeholder">
                <p className="muted">Select a conversation thread.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
