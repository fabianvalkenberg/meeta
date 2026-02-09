import { useRef } from 'react';

// 8-card color rotation: 4 pairs, each light then dark variant
const COLOR_ROTATION = [
  { bg: '#FFD261', text: '#316956' },   // 1. Yellow bg, green text
  { bg: '#316956', text: '#FFD261' },   // 2. Green bg, yellow text
  { bg: '#CFEFF8', text: '#DA444E' },   // 3. Light blue bg, red text
  { bg: '#DA444E', text: '#CFEFF8' },   // 4. Red bg, light blue text
  { bg: '#FFE5E7', text: '#4568AA' },   // 5. Pink bg, blue text
  { bg: '#4568AA', text: '#FFE5E7' },   // 6. Blue bg, pink text
  { bg: '#DEFFE6', text: '#F88135' },   // 7. Light green bg, orange text
  { bg: '#F88135', text: '#DEFFE6' },   // 8. Orange bg, light green text
];

const TYPE_LABELS = {
  patroon: 'Patroon',
  spanning: 'Spanning',
  aanname: 'Aanname',
  kans: 'Kans',
};

export function InsightCard({ block, index, onClick }) {
  const cardRef = useRef(null);
  const palette = COLOR_ROTATION[index % COLOR_ROTATION.length];
  const hasInspirations = block.inspirations && block.inspirations.length > 0;
  const strength = block.strength || 1;

  function handleClick() {
    if (!hasInspirations) return;
    const rect = cardRef.current?.getBoundingClientRect();
    onClick(block, rect);
  }

  const cardClasses = [
    'insight-card',
    hasInspirations ? 'insight-card--clickable' : '',
    block._justAdded ? 'insight-card--new' : '',
    block._justUpdated ? 'insight-card--updated' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={cardRef}
      className={cardClasses}
      style={{
        backgroundColor: palette.bg,
        color: palette.text,
        animationDelay: block._justAdded ? `${index * 0.12}s` : '0s',
      }}
      onClick={handleClick}
    >
      <div className="insight-card-top">
        <div className="insight-card-header">
          <span className="insight-type">
            {TYPE_LABELS[block.type] || block.type}
          </span>
          <div className="insight-strength" title={`Sterkte: ${strength}/5`}>
            {[1, 2, 3, 4, 5].map((level) => (
              <span
                key={level}
                className={`strength-dot ${level <= strength ? 'strength-dot--active' : ''}`}
              />
            ))}
          </div>
        </div>
        <h3 className="insight-title">{block.title}</h3>
      </div>
      {block.questions && block.questions.length > 0 && (
        <ul className="insight-questions">
          {block.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      )}
      <p className="insight-summary">{block.summary}</p>
      {block.quote && (
        <blockquote className="insight-quote">
          {block.quote}
        </blockquote>
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
