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

export function InsightCard({ block, index }) {
  const palette = TYPE_PALETTES[block.type] || FALLBACK;

  return (
    <div
      className="insight-card"
      style={{
        backgroundColor: palette.bg,
        color: palette.text,
        animationDelay: `${index * 0.08}s`,
      }}
    >
      <div className="insight-card-top">
        <span className="insight-type">
          {TYPE_LABELS[block.type] || block.type}
        </span>
        <h3 className="insight-title">{block.title}</h3>
      </div>
      <p className="insight-summary">{block.summary}</p>
      {block.questions && block.questions.length > 0 && (
        <ul className="insight-questions">
          {block.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
