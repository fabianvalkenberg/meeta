export function Controls({
  isListening,
  isAnalyzing,
  language,
  onStart,
  onStop,
  onAnalyze,
  onSwitchLanguage,
  onClear,
  hasTranscript,
}) {
  return (
    <div className="controls">
      <div className="controls-left">
        {isListening ? (
          <button className="btn btn-stop" onClick={onStop}>
            <StopIcon /> Stop
          </button>
        ) : (
          <button className="btn btn-start" onClick={onStart}>
            <MicIcon /> Start
          </button>
        )}

        <button
          className="btn btn-analyze"
          onClick={onAnalyze}
          disabled={isAnalyzing || !hasTranscript}
        >
          {isAnalyzing ? <Spinner /> : <AnalyzeIcon />}
          {isAnalyzing ? 'Analyseren...' : 'Analyseer'}
        </button>

        <button
          className="btn btn-clear"
          onClick={onClear}
          disabled={!hasTranscript && !isListening}
        >
          Reset
        </button>
      </div>

      <div className="controls-right">
        <div className="lang-switch">
          <button
            className={`lang-btn ${language === 'nl-NL' ? 'active' : ''}`}
            onClick={() => onSwitchLanguage('nl-NL')}
          >
            NL
          </button>
          <button
            className={`lang-btn ${language === 'en-US' ? 'active' : ''}`}
            onClick={() => onSwitchLanguage('en-US')}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

function AnalyzeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function Spinner() {
  return <span className="spinner" />;
}
