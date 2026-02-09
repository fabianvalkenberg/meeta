import { useState, useRef, useCallback, useEffect } from 'react';

const API_URL = '/api/analyze';
const AUTO_INTERVAL = 60;

export function useAnalysis(transcript, isListening, onUsageUpdate) {
  const [blocks, setBlocks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [metaHistory, setMetaHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(AUTO_INTERVAL);
  const [limitReached, setLimitReached] = useState(false);
  const lastAnalyzedLengthRef = useRef(0);
  const previousSummaryRef = useRef('');
  const conversationIdRef = useRef(null);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const transcriptRef = useRef(transcript);
  const blocksRef = useRef(blocks);

  transcriptRef.current = transcript;
  blocksRef.current = blocks;

  // Create a new conversation when listening starts
  const startConversation = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        conversationIdRef.current = data.conversation.id;
      }
    } catch (err) {
      console.error('Start conversation error:', err);
    }
  }, []);

  // End the conversation when listening stops
  const endConversation = useCallback(async () => {
    const convId = conversationIdRef.current;
    if (!convId) return;

    try {
      await fetch(`/api/conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptRef.current,
          blocks: blocksRef.current,
          ended_at: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('End conversation error:', err);
    }
  }, []);

  const analyzeText = useCallback(async (text) => {
    const isPasted = !!text;
    const fullTranscript = (text || transcriptRef.current).trim();

    if (!fullTranscript || limitReached) {
      return;
    }

    let newTranscript;
    if (isPasted) {
      newTranscript = fullTranscript;
      lastAnalyzedLengthRef.current = 0;
      previousSummaryRef.current = '';
    } else {
      newTranscript = fullTranscript.slice(lastAnalyzedLengthRef.current).trim();
      if (!newTranscript) {
        return;
      }
    }

    setIsAnalyzing(true);
    setError(null);

    // For pasted transcripts, create a conversation first so it gets saved
    let pastedConvId = null;
    if (isPasted && !conversationIdRef.current) {
      try {
        const convRes = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (convRes.ok) {
          const convData = await convRes.json();
          pastedConvId = convData.conversation.id;
        }
      } catch (err) {
        console.error('Create conversation for paste error:', err);
      }
    }

    const activeConvId = conversationIdRef.current || pastedConvId;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newTranscript,
          previousSummary: previousSummaryRef.current || null,
          existingBlocks: blocksRef.current,
          conversationId: activeConvId,
        }),
      });

      if (response.status === 429) {
        const data = await response.json();
        setLimitReached(true);
        setError(data.error || 'Dagelijks limiet bereikt');
        if (data.usage && onUsageUpdate) onUsageUpdate(data.usage);
        return;
      }

      if (response.status === 401) {
        // Not authenticated — reload page to show login
        window.location.reload();
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // Update usage in AuthContext
      if (data.usage && onUsageUpdate) {
        onUsageUpdate(data.usage);
      }

      if (data.blocks && Array.isArray(data.blocks)) {
        setBlocks((prev) => {
          let updated = [...prev];

          for (const incoming of data.blocks) {
            if (incoming.action === 'add') {
              const { action, ...blockData } = incoming;
              updated.push({ ...blockData, _justAdded: true });
            } else if (incoming.action === 'update') {
              const idx = updated.findIndex((b) => b.id === incoming.id);
              if (idx !== -1) {
                const { action, ...blockData } = incoming;
                updated[idx] = { ...updated[idx], ...blockData, _justUpdated: true };
              }
            } else if (incoming.action === 'remove') {
              updated = updated.filter((b) => b.id !== incoming.id);
            }
          }

          updated.sort((a, b) => (b.strength || 1) - (a.strength || 1));
          return updated;
        });

        lastAnalyzedLengthRef.current = fullTranscript.length;

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
        if (data.meta.samenvatting) {
          previousSummaryRef.current = data.meta.samenvatting;
        }
      }

      // For pasted transcripts, save the full state and close the conversation
      if (isPasted && activeConvId && data.blocks) {
        try {
          // Merge the returned blocks into a final set
          const finalBlocks = [];
          for (const incoming of data.blocks) {
            if (incoming.action === 'add') {
              const { action, ...blockData } = incoming;
              finalBlocks.push(blockData);
            }
          }

          await fetch(`/api/conversations/${activeConvId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transcript: fullTranscript,
              blocks: finalBlocks,
              ended_at: new Date().toISOString(),
            }),
          });
        } catch (err) {
          console.error('Save pasted conversation error:', err);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
      setCountdown(AUTO_INTERVAL);
    }
  }, [limitReached, onUsageUpdate]);

  // Auto-analyze + countdown while listening
  useEffect(() => {
    if (isListening) {
      setCountdown(AUTO_INTERVAL);
      setLimitReached(false);
      startConversation();

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) return AUTO_INTERVAL;
          return prev - 1;
        });
      }, 1000);

      intervalRef.current = setInterval(() => analyzeText(), AUTO_INTERVAL * 1000);
    } else {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
      setCountdown(AUTO_INTERVAL);

      // Save final state when stopping
      if (conversationIdRef.current) {
        endConversation();
      }
    }

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [isListening, analyzeText, startConversation, endConversation]);

  // Load a saved conversation (read-only view)
  const loadConversation = useCallback((conversation) => {
    setBlocks(conversation.blocks || []);
    setMeta(conversation.meta || null);
    setMetaHistory([]);
    lastAnalyzedLengthRef.current = 0;
    previousSummaryRef.current = '';
    conversationIdRef.current = null;
    setError(null);
    setLimitReached(false);
  }, []);

  return { blocks, meta, metaHistory, isAnalyzing, error, analyzeText, countdown, limitReached, loadConversation };
}
