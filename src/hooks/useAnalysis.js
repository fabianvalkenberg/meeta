import { useState, useRef, useCallback, useEffect } from 'react';

const API_URL = '/api/analyze';
const AUTO_INTERVAL = 40;

export function useAnalysis(transcript, isListening) {
  const [blocks, setBlocks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [metaHistory, setMetaHistory] = useState([]);
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
          existingBlocks: blocksRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.blocks && Array.isArray(data.blocks)) {
        setBlocks((prev) => {
          let updated = [...prev];

          for (const incoming of data.blocks) {
            if (incoming.action === 'add') {
              // Add new block — mark as just added for animation
              const { action, ...blockData } = incoming;
              updated.push({ ...blockData, _justAdded: true });
            } else if (incoming.action === 'update') {
              // Update existing block by id — mark as just updated for animation
              const idx = updated.findIndex((b) => b.id === incoming.id);
              if (idx !== -1) {
                const { action, ...blockData } = incoming;
                updated[idx] = { ...updated[idx], ...blockData, _justUpdated: true };
              }
            } else if (incoming.action === 'remove') {
              // Remove block by id
              updated = updated.filter((b) => b.id !== incoming.id);
            }
          }

          // Sort by strength (highest first) for better visual hierarchy
          updated.sort((a, b) => (b.strength || 1) - (a.strength || 1));

          return updated;
        });

        lastAnalyzedRef.current = currentTranscript;

        // Clear animation flags after a short delay
        setTimeout(() => {
          setBlocks((prev) =>
            prev.map((b) => {
              if (b._justAdded || b._justUpdated) {
                const { _justAdded, _justUpdated, ...rest } = b;
                return rest;
              }
              return b;
            })
          );
        }, 1200);
      }

      if (data.meta) {
        setMeta(data.meta);
        setMetaHistory((prev) => [...prev, { ...data.meta, timestamp: Date.now() }]);
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

  return { blocks, meta, metaHistory, isAnalyzing, error, analyzeText, countdown };
}
