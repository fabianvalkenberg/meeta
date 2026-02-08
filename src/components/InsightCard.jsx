const TYPE_CONFIG = {
  patroon: {
    label: 'Patroon',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.08)',
    border: 'rgba(168, 85, 247, 0.25)',
  },
  spanning: {
    label: 'Spanning',
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.08)',
    border: 'rgba(234, 179, 8, 0.25)',
  },
  aanname: {
    label: 'Aanname',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.25)',
  },
  kans: {
    label: 'Kans',
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.25)',
  },
};

export function InsightCard({ block }) {
  const config = TYPE_CONFIG[block.type] || TYPE_CONFIG.patroon;

  return (
    <div
      className="insight-card"
      style={{
        background: config.bg,
        borderColor: config.border,
      }}
    >
      <div className="insight-header">
        <span className="insight-badge" style={{ background: config.color }}>
          {config.label}
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
