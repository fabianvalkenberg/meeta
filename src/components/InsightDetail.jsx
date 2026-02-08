const TYPE_PALETTES = {
  patroon: { bg: '#2D5DA1', text: '#ffffff' },
  spanning: { bg: '#D4573B', text: '#ffffff' },
  aanname: { bg: '#F2C94C', text: '#1a1a1a' },
  kans: { bg: '#4A7C59', text: '#ffffff' },
};

const FALLBACK = { bg: '#7AB8BF', text: '#1a1a1a' };

const TYPE_LABELS = {
  patroon: 'Patroon',
  spanning: 'Spanning',
  aanname: 'Aanname',
  kans: 'Kans',
};

export function InsightDetail({ block, onClose }) {
  if (!block) return null;

  const palette = TYPE_PALETTES[block.type] || FALLBACK;

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div
        className="detail-content"
        style={{ backgroundColor: palette.bg, color: palette.text }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="detail-close"
          onClick={onClose}
          style={{ color: palette.text }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="detail-header">
          <span className="detail-type">
            {TYPE_LABELS[block.type] || block.type}
          </span>
          <h1 className="detail-title">{block.title}</h1>
          <p className="detail-summary">{block.summary}</p>
        </div>

        {block.quote && (
          <blockquote className="detail-quote">
            {block.quote}
          </blockquote>
        )}

        {block.questions && block.questions.length > 0 && (
          <div className="detail-section">
            <h2 className="detail-section-title">Verdiepende vragen</h2>
            <ul className="detail-questions">
              {block.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        {block.inspirations && block.inspirations.length > 0 && (
          <div className="detail-section">
            <h2 className="detail-section-title">Wat anderen zeggen</h2>
            <div className="detail-inspirations">
              {block.inspirations.map((insp, i) => (
                <div key={i} className="detail-inspiration">
                  <blockquote className="inspiration-quote">
                    {insp.quote}
                  </blockquote>
                  <span className="inspiration-author">— {insp.author}</span>
                  <p className="inspiration-context">{insp.context}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
