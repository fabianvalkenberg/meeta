import { useState, useRef, useCallback, useEffect } from 'react';

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [language, setLanguage] = useState('nl-NL');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        transcriptRef.current += finalTranscript;
        setTranscript(transcriptRef.current);
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Restart if still supposed to be listening
      if (recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      recognition.stop();
      setIsListening(false);
      setInterimText('');
    }
  }, []);

  const clearTranscript = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
    setInterimText('');
  }, []);

  const switchLanguage = useCallback((lang) => {
    const wasListening = isListening;
    if (wasListening) {
      stopListening();
    }
    setLanguage(lang);
    // Restart with new language after a brief delay
    if (wasListening) {
      setTimeout(() => startListening(), 100);
    }
  }, [isListening, stopListening, startListening]);

  return {
    isListening,
    transcript,
    interimText,
    language,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
    switchLanguage,
  };
}
