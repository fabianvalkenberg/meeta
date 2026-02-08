const SENTIMENT_CONFIG = {
  positief: { emoji: '\u2600\uFE0F', color: '#4A7C59', label: 'Positief' },
  neutraal: { emoji: '\u2696\uFE0F', color: '#7a7570', label: 'Neutraal' },
  gespannen: { emoji: '\u26A1', color: '#D4573B', label: 'Gespannen' },
  negatief: { emoji: '\u2601\uFE0F', color: '#8B4513', label: 'Negatief' },
};

const ENERGIE_CONFIG = {
  hoog: { width: '100%', color: '#4A7C59', label: 'Hoog' },
  gemiddeld: { width: '55%', color: '#F2C94C', label: 'Gemiddeld' },
  laag: { width: '25%', color: '#D4573B', label: 'Laag' },
};

export function MetaPanel({ meta, metaHistory, blocks }) {
  if (!meta) return null;

  const sentimentConf = SENTIMENT_CONFIG[meta.sentiment_overall] || SENTIMENT_CONFIG.neutraal;
  const energieConf = ENERGIE_CONFIG[meta.energie] || ENERGIE_CONFIG.gemiddeld;

  // Build timeline from blocks (each block has a type and was added at a certain time)
  const typeOrder = ['patroon', 'spanning', 'aanname', 'kans'];
  const typeColors = {
    patroon: '#2D5DA1',
    spanning: '#D4573B',
    aanname: '#F2C94C',
    kans: '#4A7C59',
  };

  // Count types for the flow bar
  const typeCounts = {};
  blocks.forEach(b => {
    typeCounts[b.type] = (typeCounts[b.type] || 0) + 1;
  });
  const totalBlocks = blocks.length || 1;

  return (
    <div className="meta-panel">
      {/* Nudge — real-time suggestion */}
      {meta.nudge && (
        <div className="meta-nudge">
          <span className="meta-nudge-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </span>
          <p className="meta-nudge-text">{meta.nudge}</p>
        </div>
      )}

      {/* Sentiment + Energy row */}
      <div className="meta-vitals">
        <div className="meta-vital">
          <span className="meta-vital-label">Sfeer</span>
          <span className="meta-vital-value" style={{ color: sentimentConf.color }}>
            {sentimentConf.label}
          </span>
        </div>
        <div className="meta-vital">
          <span className="meta-vital-label">Energie</span>
          <div className="meta-energy-bar">
            <div
              className="meta-energy-fill"
              style={{ width: energieConf.width, background: energieConf.color }}
            />
          </div>
          <span className="meta-vital-value" style={{ color: energieConf.color }}>
            {energieConf.label}
          </span>
        </div>
      </div>

      {/* Conversation flow — type distribution bar */}
      {blocks.length > 0 && (
        <div className="meta-flow">
          <span className="meta-section-label">Gespreksflow</span>
          <div className="meta-flow-bar">
            {typeOrder.map(type => {
              const count = typeCounts[type] || 0;
              if (count === 0) return null;
              const pct = (count / totalBlocks) * 100;
              return (
                <div
                  key={type}
                  className="meta-flow-segment"
                  style={{ width: `${pct}%`, background: typeColors[type] }}
                  title={`${type}: ${count}`}
                />
              );
            })}
          </div>
          <div className="meta-flow-legend">
            {typeOrder.map(type => {
              const count = typeCounts[type] || 0;
              if (count === 0) return null;
              return (
                <span key={type} className="meta-flow-legend-item">
                  <span className="meta-flow-dot" style={{ background: typeColors[type] }} />
                  {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Sentiment timeline dots */}
      {metaHistory.length > 1 && (
        <div className="meta-timeline">
          <span className="meta-section-label">Sentiment verloop</span>
          <div className="meta-timeline-track">
            {metaHistory.map((m, i) => {
              const conf = SENTIMENT_CONFIG[m.sentiment_overall] || SENTIMENT_CONFIG.neutraal;
              return (
                <div
                  key={i}
                  className="meta-timeline-dot"
                  style={{ background: conf.color }}
                  title={`${conf.label}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Language patterns */}
      {meta.taalpatronen && meta.taalpatronen.length > 0 && (
        <div className="meta-patterns">
          <span className="meta-section-label">Taalpatronen</span>
          {meta.taalpatronen.map((p, i) => (
            <div key={i} className="meta-pattern">
              <span className="meta-pattern-label">{p.label}</span>
              <span className="meta-pattern-meaning">{p.betekenis}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {meta.samenvatting && (
        <div className="meta-summary">
          <span className="meta-section-label">Samenvatting</span>
          <p className="meta-summary-text">{meta.samenvatting}</p>
        </div>
      )}

      {/* Action items & decisions */}
      {meta.acties && meta.acties.length > 0 && (
        <div className="meta-actions">
          <span className="meta-section-label">Acties & Beslissingen</span>
          <ul className="meta-actions-list">
            {meta.acties.map((a, i) => (
              <li key={i} className={`meta-action meta-action--${a.type}`}>
                <span className="meta-action-badge">
                  {a.type === 'beslissing' ? 'B' : 'A'}
                </span>
                {a.tekst}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
