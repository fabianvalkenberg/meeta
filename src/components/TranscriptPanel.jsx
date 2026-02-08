export function TranscriptPanel({ transcript, interimText, isListening }) {
  return (
    <div className="transcript-panel">
      <div className="transcript-header">
        <h2>Transcript</h2>
        {isListening && <span className="live-dot" />}
      </div>
      <div className="transcript-content">
        {transcript || !isListening ? (
          <>
            <span>{transcript}</span>
            {interimText && (
              <span className="interim-text">{interimText}</span>
            )}
          </>
        ) : (
          <span className="transcript-placeholder">Luisteren...</span>
        )}
      </div>
    </div>
  );
}
