import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useAnalysis } from './hooks/useAnalysis';
import { Controls } from './components/Controls';
import { TranscriptPanel } from './components/TranscriptPanel';
import { InsightCard } from './components/InsightCard';

export default function App() {
  const {
    isListening,
    transcript,
    interimText,
    language,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
    switchLanguage,
  } = useSpeechRecognition();

  const { blocks, isAnalyzing, error, analyze, clearBlocks } = useAnalysis(
    transcript,
    isListening
  );

  function handleClear() {
    stopListening();
    clearTranscript();
    clearBlocks();
  }

  if (!isSupported) {
    return (
      <div className="app">
        <div className="unsupported">
          <h1>Co-Designer</h1>
          <p>
            Web Speech API wordt niet ondersteund in deze browser. Gebruik
            Chrome of Edge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">
          <span className="logo-dot" />
          Co-Designer
        </h1>
        <span className="header-sub">Real-time gespreksanalyse</span>
      </header>

      <Controls
        isListening={isListening}
        isAnalyzing={isAnalyzing}
        language={language}
        onStart={startListening}
        onStop={stopListening}
        onAnalyze={analyze}
        onSwitchLanguage={switchLanguage}
        onClear={handleClear}
        hasTranscript={transcript.trim().length > 0}
      />

      <TranscriptPanel
        transcript={transcript}
        interimText={interimText}
        isListening={isListening}
      />

      {error && <div className="error-banner">Fout: {error}</div>}

      {blocks.length > 0 && (
        <section className="insights-section">
          <h2 className="insights-heading">Inzichten</h2>
          <div className="insights-grid">
            {blocks.map((block, i) => (
              <InsightCard key={`${block.type}-${i}`} block={block} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
