import { useState, useRef, useCallback, useEffect } from 'react';

const API_URL = '/api/analyze';
const AUTO_INTERVAL = 45_000;

export function useAnalysis(transcript, isListening) {
  const [blocks, setBlocks] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const lastAnalyzedRef = useRef('');
  const intervalRef = useRef(null);

  const analyze = useCallback(async () => {
    const currentTranscript = transcript.trim();

    if (!currentTranscript || currentTranscript === lastAnalyzedRef.current) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: currentTranscript,
          previousBlocks: blocks,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.blocks && Array.isArray(data.blocks)) {
        setBlocks((prev) => [...data.blocks, ...prev]);
        lastAnalyzedRef.current = currentTranscript;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [transcript, blocks]);

  // Auto-analyze every 45 seconds while listening
  useEffect(() => {
    if (isListening) {
      intervalRef.current = setInterval(() => {
        analyze();
      }, AUTO_INTERVAL);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isListening, analyze]);

  const clearBlocks = useCallback(() => {
    setBlocks([]);
    lastAnalyzedRef.current = '';
  }, []);

  return { blocks, isAnalyzing, error, analyze, clearBlocks };
}
