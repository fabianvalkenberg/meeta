import { useState, useEffect } from 'react';

export function ConversationHistory({ isOpen, onClose, onLoadConversation }) {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  async function fetchConversations() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLoad(id) {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        onLoadConversation(data.conversation);
        onClose();
      }
    } catch (err) {
      console.error('Load conversation error:', err);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Vandaag, ${time}`;
    if (isYesterday) return `Gisteren, ${time}`;
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${time}`;
  }

  return (
    <div className={`panel-right ${isOpen ? 'panel-right--open' : ''}`} style={{ zIndex: 110 }}>
      <div className="panel-right-header">
        <h2 className="panel-right-title">Geschiedenis</h2>
        <button className="panel-close-btn" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="history-list">
        {isLoading ? (
          <div className="panel-empty">Laden...</div>
        ) : conversations.length === 0 ? (
          <div className="panel-empty">Nog geen gesprekken opgeslagen</div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              className="history-item"
              onClick={() => handleLoad(conv.id)}
            >
              <span className="history-title">{conv.title || 'Zonder titel'}</span>
              <span className="history-date">{formatDate(conv.started_at)}</span>
              {conv.block_count > 0 && (
                <span className="history-badge">{conv.block_count} inzichten</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
