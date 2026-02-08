import { useState, useRef, useCallback, useEffect } from 'react';

const API_URL = '/api/analyze';
const AUTO_INTERVAL = 45;

export function useAnalysis(transcript, isListening) {
  const [blocks, setBlocks] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(AUTO_INTERVAL);
  const lastAnalyzedRef = useRef('');
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const transcriptRef = useRef(transcript);
  const blocksRef = useRef(blocks);

  transcriptRef.current = transcript;
  blocksRef.current = blocks;

  const analyzeText = useCallback(async (text) => {
    const currentTranscript = (text || transcriptRef.current).trim();

    if (!currentTranscript) {
      return;
    }

    // Only skip duplicate check for auto-analysis (no explicit text passed)
    if (!text && currentTranscript === lastAnalyzedRef.current) {
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
          previousBlocks: blocksRef.current,
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
      setCountdown(AUTO_INTERVAL);
    }
  }, []);

  // Auto-analyze + countdown while listening
  useEffect(() => {
    if (isListening) {
      setCountdown(AUTO_INTERVAL);

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return AUTO_INTERVAL;
          }
          return prev - 1;
        });
      }, 1000);

      intervalRef.current = setInterval(() => analyzeText(), AUTO_INTERVAL * 1000);
    } else {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
      setCountdown(AUTO_INTERVAL);
    }

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [isListening, analyzeText]);

  return { blocks, isAnalyzing, error, analyzeText, countdown };
}
