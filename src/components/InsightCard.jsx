import { useRef } from 'react';

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

export function InsightCard({ block, index, onClick }) {
  const cardRef = useRef(null);
  const palette = TYPE_PALETTES[block.type] || FALLBACK;
  const hasInspirations = block.inspirations && block.inspirations.length > 0;

  function handleClick() {
    if (!hasInspirations) return;
    const rect = cardRef.current?.getBoundingClientRect();
    onClick(block, rect);
  }

  return (
    <div
      ref={cardRef}
      className={`insight-card ${hasInspirations ? 'insight-card--clickable' : ''}`}
      style={{
        backgroundColor: palette.bg,
        color: palette.text,
        animationDelay: `${index * 0.12}s`,
      }}
      onClick={handleClick}
    >
      <div className="insight-card-top">
        <span className="insight-type">
          {TYPE_LABELS[block.type] || block.type}
        </span>
        <h3 className="insight-title">{block.title}</h3>
      </div>
      <p className="insight-summary">{block.summary}</p>
      {block.quote && (
        <blockquote className="insight-quote">
          {block.quote}
        </blockquote>
      )}
      {block.questions && block.questions.length > 0 && (
        <ul className="insight-questions">
          {block.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      )}
      {hasInspirations && (
        <div className="insight-inspirations-hint">
          <span className="inspirations-hint-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </span>
          {block.inspirations.length} inspiratie{block.inspirations.length !== 1 ? 's' : ''} van anderen
        </div>
      )}
    </div>
  );
}
