import { useState, useEffect, useRef } from 'react';

// Same color rotation as InsightCard
const COLOR_ROTATION = [
  { bg: '#FFD261', text: '#316956' },
  { bg: '#316956', text: '#FFD261' },
  { bg: '#CFEFF8', text: '#DA444E' },
  { bg: '#DA444E', text: '#CFEFF8' },
  { bg: '#FFE5E7', text: '#4568AA' },
  { bg: '#4568AA', text: '#FFE5E7' },
  { bg: '#DEFFE6', text: '#F88135' },
  { bg: '#F88135', text: '#DEFFE6' },
];

const TYPE_LABELS = {
  patroon: 'Patroon',
  spanning: 'Spanning',
  aanname: 'Aanname',
  kans: 'Kans',
};

export function InsightDetail({ block, cardRect, cardIndex = 0, onClose }) {
  const [phase, setPhase] = useState('morph'); // morph -> open -> closing
  const contentRef = useRef(null);

  useEffect(() => {
    if (!block) return;
    // Start morph, then transition to open
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPhase('open');
      });
    });
  }, [block]);

  function handleClose() {
    setPhase('closing');
    setTimeout(() => {
      onClose();
    }, 400);
  }

  if (!block) return null;

  const palette = COLOR_ROTATION[cardIndex % COLOR_ROTATION.length];

  // Calculate morph origin styles
  const morphStyle = cardRect && phase === 'morph' ? {
    position: 'fixed',
    top: cardRect.top,
    left: cardRect.left,
    width: cardRect.width,
    height: cardRect.height,
    borderRadius: '0px',
    backgroundColor: palette.bg,
    color: palette.text,
    zIndex: 200,
    overflow: 'hidden',
    transition: 'none',
  } : null;

  const openStyle = phase === 'open' ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    borderRadius: '0px',
    backgroundColor: palette.bg,
    color: palette.text,
    zIndex: 200,
    overflow: 'hidden',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  } : null;

  const closingStyle = phase === 'closing' && cardRect ? {
    position: 'fixed',
    top: cardRect.top,
    left: cardRect.left,
    width: cardRect.width,
    height: cardRect.height,
    borderRadius: '0px',
    backgroundColor: palette.bg,
    color: palette.text,
    zIndex: 200,
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  } : phase === 'closing' ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    borderRadius: '0px',
    backgroundColor: palette.bg,
    color: palette.text,
    zIndex: 200,
    overflow: 'hidden',
    opacity: 0,
    transform: 'scale(0.95)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  } : null;

  const containerStyle = morphStyle || openStyle || closingStyle || {};

  return (
    <>
      <div
        className={`detail-backdrop ${phase === 'open' ? 'detail-backdrop--visible' : ''} ${phase === 'closing' ? 'detail-backdrop--hidden' : ''}`}
        onClick={handleClose}
      />
      <div style={containerStyle}>
        <div
          ref={contentRef}
          className={`detail-inner ${phase === 'open' ? 'detail-inner--visible' : ''}`}
        >
          <button
            className="detail-close"
            onClick={handleClose}
            style={{ color: palette.text }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="detail-center">
            <div className="detail-header">
              <span className="detail-type">
                {TYPE_LABELS[block.type] || block.type}
              </span>
              <h1 className="detail-title">{block.title}</h1>
            </div>

            {block.questions && block.questions.length > 0 && (
              <div className="detail-section">
                <ul className="detail-questions">
                  {block.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="detail-summary">{block.summary}</p>

            {block.quote && (
              <blockquote className="detail-quote">
                {block.quote}
              </blockquote>
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
      </div>
    </>
  );
}
