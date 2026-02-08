const SENTIMENT_CONFIG = {
  positief: { color: '#4A7C59', label: 'Positief', bg: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)' },
  neutraal: { color: '#7a7570', label: 'Neutraal', bg: 'linear-gradient(135deg, #F5F5F5, #EEEEEE)' },
  gespannen: { color: '#D4573B', label: 'Gespannen', bg: 'linear-gradient(135deg, #FBE9E7, #FFCCBC)' },
  negatief: { color: '#8B4513', label: 'Negatief', bg: 'linear-gradient(135deg, #EFEBE9, #D7CCC8)' },
};

const ENERGIE_CONFIG = {
  hoog: { width: '100%', color: '#4A7C59', label: 'Hoog' },
  gemiddeld: { width: '55%', color: '#F2C94C', label: 'Gemiddeld' },
  laag: { width: '25%', color: '#D4573B', label: 'Laag' },
};

const TYPE_LABELS = {
  patroon: 'Patroon',
  spanning: 'Spanning',
  aanname: 'Aanname',
  kans: 'Kans',
};

export function MetaPanel({ meta, metaHistory, blocks, isOpen, onToggle }) {
  if (!meta && !isOpen) return null;

  const sentimentConf = meta ? (SENTIMENT_CONFIG[meta.sentiment_overall] || SENTIMENT_CONFIG.neutraal) : SENTIMENT_CONFIG.neutraal;
  const energieConf = meta ? (ENERGIE_CONFIG[meta.energie] || ENERGIE_CONFIG.gemiddeld) : ENERGIE_CONFIG.gemiddeld;

  const typeOrder = ['patroon', 'spanning', 'aanname', 'kans'];
  const typeColors = {
    patroon: '#2D5DA1',
    spanning: '#D4573B',
    aanname: '#F2C94C',
    kans: '#4A7C59',
  };

  const typeCounts = {};
  blocks.forEach(b => {
    typeCounts[b.type] = (typeCounts[b.type] || 0) + 1;
  });
  const totalBlocks = blocks.length || 1;

  return (
    <aside className={`panel-right ${isOpen ? 'panel-right--open' : ''}`}>
      <div className="panel-right-inner">
        <div className="panel-right-header">
          <h2 className="panel-right-title">Gespreksoverzicht</h2>
          <button className="panel-close-btn" onClick={onToggle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!meta ? (
          <div className="panel-empty">
            <p>Start een gesprek of analyseer een transcript om hier het overzicht te zien.</p>
          </div>
        ) : (
          <div className="meta-cards">
            {/* Nudge card */}
            {meta.nudge && (
              <div className="meta-card meta-card--nudge">
                <div className="meta-card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="meta-card-text">{meta.nudge}</p>
              </div>
            )}

            {/* Sentiment + Energy cards */}
            <div className="meta-card-row">
              <div className="meta-card meta-card--compact" style={{ background: sentimentConf.bg }}>
                <span className="meta-card-label">Sfeer</span>
                <span className="meta-card-value" style={{ color: sentimentConf.color }}>
                  {sentimentConf.label}
                </span>
              </div>
              <div className="meta-card meta-card--compact">
                <span className="meta-card-label">Energie</span>
                <div className="meta-energy-bar">
                  <div
                    className="meta-energy-fill"
                    style={{ width: energieConf.width, background: energieConf.color }}
                  />
                </div>
                <span className="meta-card-value" style={{ color: energieConf.color }}>
                  {energieConf.label}
                </span>
              </div>
            </div>

            {/* Flow visualization */}
            {blocks.length > 0 && (
              <div className="meta-card">
                <span className="meta-card-label">Gespreksflow</span>
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
                        title={`${TYPE_LABELS[type]}: ${count}`}
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
                        <span className="meta-flow-type-label">{TYPE_LABELS[type]}</span>
                        <span className="meta-flow-count">{count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sentiment timeline */}
            {metaHistory.length > 1 && (
              <div className="meta-card">
                <span className="meta-card-label">Sentiment verloop</span>
                <div className="meta-timeline-track">
                  {metaHistory.map((m, i) => {
                    const conf = SENTIMENT_CONFIG[m.sentiment_overall] || SENTIMENT_CONFIG.neutraal;
                    return (
                      <div
                        key={i}
                        className="meta-timeline-dot"
                        style={{ background: conf.color }}
                        title={conf.label}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Language patterns */}
            {meta.taalpatronen && meta.taalpatronen.length > 0 && (
              <div className="meta-card">
                <span className="meta-card-label">Taalpatronen</span>
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
              <div className="meta-card">
                <span className="meta-card-label">Samenvatting</span>
                <p className="meta-card-text">{meta.samenvatting}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
