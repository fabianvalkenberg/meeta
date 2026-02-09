import { useEffect, useRef } from 'react';

export function TranscriptPanel({ transcript, interimText, isListening }) {
  const contentRef = useRef(null);
  const prevLengthRef = useRef(0);

  // Auto-scroll to bottom when transcript grows
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  // Track new text for animation
  const isNew = transcript.length > prevLengthRef.current;
  useEffect(() => {
    prevLengthRef.current = transcript.length;
  }, [transcript]);

  const previousText = isNew
    ? transcript.slice(0, prevLengthRef.current)
    : transcript;
  const newText = isNew
    ? transcript.slice(prevLengthRef.current)
    : '';

  return (
    <div className="transcript-panel">
      <div className="transcript-header">
        <h2>Transcript</h2>
        {isListening && <span className="live-dot" />}
      </div>
      <div className="transcript-content" ref={contentRef}>
        {transcript || isListening ? (
          <>
            <span>{previousText}</span>
            {newText && (
              <span className="transcript-new">{newText}</span>
            )}
            {interimText && (
              <span className="interim-text">{interimText}</span>
            )}
          </>
        ) : (
          <span className="transcript-placeholder">
            Druk op Start om te beginnen...
          </span>
        )}
      </div>
    </div>
  );
}
