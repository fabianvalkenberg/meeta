import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useAnalysis } from './hooks/useAnalysis';
import { TranscriptPanel } from './components/TranscriptPanel';
import { InsightCard } from './components/InsightCard';
import { InsightDetail } from './components/InsightDetail';
import { MetaPanel } from './components/MetaPanel';
import { LoginScreen } from './components/LoginScreen';
import { ConversationHistory } from './components/ConversationHistory';
import { UsageBadge } from './components/UsageBadge';

export default function App() {
  const { user, isLoading, logout, updateUsage } = useAuth();

  const {
    isListening,
    transcript,
    interimText,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  const { blocks, meta, metaHistory, isAnalyzing, error, analyzeText, countdown, limitReached, loadConversation } = useAnalysis(transcript, isListening, updateUsage);
  const [pastedText, setPastedText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedCardRect, setSelectedCardRect] = useState(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingConversation, setViewingConversation] = useState(null);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="app">
        <div className="auth-loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  async function handlePasteAnalyze() {
    const text = pastedText.trim();
    if (!text || isAnalyzing) return;
    await analyzeText(text);
    setShowPasteArea(false);
    setPastedText('');
  }

  function handleLoadConversation(conversation) {
    loadConversation(conversation);
    setViewingConversation(conversation);
  }

  function handleBackToLive() {
    setViewingConversation(null);
    loadConversation({ blocks: [], meta: null });
  }

  const displayTranscript = viewingConversation?.transcript || pastedText || transcript;

  if (!isSupported) {
    return (
      <div className="app">
        <div className="unsupported">
          <MeetaLogo className="logo-img" />
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
      {/* Top bar: toggle buttons + centered logo */}
      <header className="topbar">
        <div className="topbar-left">
          <button
            className={`panel-toggle ${showTranscript ? 'panel-toggle--active' : ''}`}
            onClick={() => setShowTranscript(!showTranscript)}
            title="Transcript"
          >
            <TranscriptIcon />
          </button>
          <button
            className={`panel-toggle ${showHistory ? 'panel-toggle--active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            title="Geschiedenis"
          >
            <HistoryIcon />
          </button>
        </div>

        <div className="topbar-center">
          <MeetaLogo className="logo-img-large" />
        </div>

        <div className="topbar-right">
          <UsageBadge />
          <button
            className={`panel-toggle ${showMeta ? 'panel-toggle--active' : ''}`}
            onClick={() => setShowMeta(!showMeta)}
            title="Gespreksoverzicht"
          >
            <MetaIcon />
          </button>
          <button
            className="panel-toggle"
            onClick={logout}
            title="Uitloggen"
          >
            <LogoutIcon />
          </button>
        </div>
      </header>

      {/* Viewing saved conversation banner */}
      {viewingConversation && (
        <div className="viewing-banner">
          <span className="viewing-banner-text">
            Je bekijkt: <strong>{viewingConversation.title || 'Zonder titel'}</strong>
          </span>
          <button className="btn viewing-banner-btn" onClick={handleBackToLive}>
            ← Terug naar live
          </button>
        </div>
      )}

      {/* Three-zone layout */}
      <div className="layout-body">
        {/* Left panel — transcript */}
        <aside className={`panel-left ${showTranscript ? 'panel-left--open' : ''}`}>
          <div className="panel-left-inner">
            <div className="panel-left-header">
              <h2 className="panel-left-title">Transcript</h2>
              <button className="panel-close-btn" onClick={() => setShowTranscript(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {!viewingConversation && (
              <>
                <div className="sidebar-controls">
                  <div className="controls-row">
                    <button
                      className={`btn btn-paste-toggle ${showPasteArea ? 'btn-paste-toggle--active' : ''}`}
                      onClick={() => setShowPasteArea(!showPasteArea)}
                      title="Plak transcript"
                    >
                      <PasteIcon />
                    </button>
                    {isListening ? (
                      <button className="btn btn-stop" onClick={stopListening}>
                        <StopIcon /> Stop
                      </button>
                    ) : (
                      !showPasteArea && (
                        <button className="btn btn-start" onClick={startListening} disabled={limitReached}>
                          <MicIcon /> Start
                        </button>
                      )
                    )}
                    {showPasteArea && (
                      <>
                        <button
                          className="btn btn-start"
                          onClick={handlePasteAnalyze}
                          disabled={!pastedText.trim() || isAnalyzing || limitReached}
                        >
                          {isAnalyzing ? 'Analyseren...' : 'Analyseer'}
                        </button>
                        <button
                          className="btn"
                          onClick={() => { setPastedText(''); setShowPasteArea(false); }}
                        >
                          Annuleer
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isListening && (
                  <div className="countdown-bar">
                    <div
                      className="countdown-progress"
                      style={{ width: `${((60 - countdown) / 60) * 100}%` }}
                    />
                    <span className="countdown-text">
                      {isAnalyzing ? 'Analyseren...' : `Analyse over ${countdown}s`}
                    </span>
                  </div>
                )}
              </>
            )}

            {showPasteArea && !viewingConversation ? (
              <div className="paste-area-full">
                <textarea
                  className="paste-textarea-full"
                  placeholder="Plak hier een transcript..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  autoFocus
                />
              </div>
            ) : (
              <TranscriptPanel
                transcript={displayTranscript}
                interimText={viewingConversation ? '' : interimText}
                isListening={viewingConversation ? false : isListening}
              />
            )}
          </div>
        </aside>

        {/* Main content — cards */}
        <main className="main">
          {error && (
            <div className={`error-banner ${limitReached ? 'error-banner--limit' : ''}`}>
              {error}
            </div>
          )}

          {isAnalyzing && (
            <div className="analyzing-loader">
              <div className="loader-favicon-wrap">
                <svg className="loader-favicon" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className="loader-favicon-pill" d="M163.56 43.0205C209.73 44.0025 246.856 81.7364 246.856 128.143C246.856 175.166 208.737 213.285 161.714 213.285C157.083 213.285 152.539 212.914 148.109 212.202H108.747C104.317 212.914 99.7731 213.285 95.1426 213.285C48.1196 213.285 10 175.166 10 128.143C10 82.3601 46.1351 45.0184 91.4404 43.0801V43H163.56V43.0205Z" fill="#EBFF00"/>
                  <path className="loader-favicon-m" d="M121.181 173C118.48 164.235 115.825 155.922 113.214 148.06C110.603 140.108 108.173 132.88 105.922 126.373C103.672 119.777 101.736 114.175 100.116 109.566H99.0357C99.0357 110.38 98.9456 112.051 98.7656 114.581C98.5856 117.111 98.3605 120.093 98.0904 123.527C97.9104 126.961 97.6854 130.575 97.4153 134.37C97.1452 138.075 96.8752 141.645 96.6051 145.078C96.4251 148.422 96.245 151.268 96.065 153.617C95.9749 155.967 95.9299 157.413 95.9299 157.955C95.9299 160.846 97.3703 162.292 100.251 162.292C100.791 162.292 101.646 162.292 102.817 162.292C103.987 162.202 104.662 162.157 104.842 162.157L105.652 162.834L104.167 171.373C103.267 171.373 101.781 171.328 99.7108 171.238C97.7304 171.148 95.6599 171.057 93.4994 170.967C91.4289 170.876 89.7185 170.831 88.3682 170.831C87.2879 170.831 85.9826 170.876 84.4522 170.967C82.9219 171.057 81.4365 171.193 79.9962 171.373C78.5558 171.554 77.3406 171.69 76.3503 171.78C75.4501 171.87 75 171.916 75 171.916L75.8102 163.105C78.5108 162.834 80.4013 162.021 81.4815 160.666C82.6518 159.22 83.507 156.78 84.0471 153.346C84.2272 152.352 84.4522 150.41 84.7223 147.518C84.9924 144.626 85.3074 141.193 85.6675 137.217C86.1176 133.241 86.5227 129.175 86.8828 125.018C87.3329 120.771 87.738 116.75 88.0981 112.955C88.5482 109.16 88.8633 105.997 89.0433 103.467C89.3134 100.846 89.4484 99.2651 89.4484 98.7229C89.4484 97.006 89.1333 95.741 88.5032 94.9277C87.9631 94.0241 86.9278 93.3464 85.3975 92.8946C83.9571 92.3524 81.8866 91.991 79.186 91.8102L78.5108 90.997L79.7261 83.1355C81.2565 83.2259 83.1019 83.3163 85.2624 83.4066C87.4229 83.497 89.5384 83.5873 91.6089 83.6777C93.6794 83.7681 95.3448 83.8133 96.6051 83.8133C98.1355 83.8133 99.8009 83.8133 101.601 83.8133C103.492 83.7229 105.292 83.6325 107.003 83.5422C108.713 83.4518 110.018 83.3614 110.918 83.2711C112.809 90.1385 114.699 96.6898 116.59 102.925C118.48 109.069 120.191 114.672 121.721 119.732C123.341 124.792 124.692 129.084 125.772 132.608C126.942 136.133 127.752 138.617 128.203 140.063H129.283C129.733 138.708 130.498 136.268 131.578 132.744C132.749 129.22 134.144 124.928 135.764 119.867C137.475 114.807 139.32 109.205 141.301 103.06C143.281 96.9157 145.307 90.4548 147.377 83.6777C148.637 83.6777 150.168 83.7229 151.968 83.8133C153.859 83.9036 155.794 83.9488 157.775 83.9488C159.755 83.9488 161.6 83.9036 163.311 83.8133C164.751 83.8133 166.462 83.7681 168.442 83.6777C170.513 83.497 172.358 83.3614 173.978 83.2711C175.599 83.0904 176.634 83 177.084 83L177.624 83.5422L176.814 91.6747C173.033 91.9458 170.423 92.6235 168.982 93.7078C167.542 94.7018 166.822 96.4187 166.822 98.8584C166.822 100.033 166.867 102.021 166.957 104.822C167.137 107.623 167.317 110.922 167.497 114.717C167.767 118.422 168.037 122.398 168.307 126.645C168.667 130.801 168.982 134.913 169.252 138.979C169.522 142.955 169.792 146.569 170.062 149.822C170.693 154.792 171.413 158.136 172.223 159.852C173.033 161.479 174.518 162.292 176.679 162.292C177.399 162.292 178.164 162.247 178.975 162.157C179.785 162.066 180.28 162.021 180.46 162.021L181 162.699L179.785 171.238C179.245 171.238 178.164 171.193 176.544 171.102C175.014 171.012 173.258 170.922 171.278 170.831C169.387 170.831 167.677 170.831 166.147 170.831C164.616 170.831 162.816 170.876 160.745 170.967C158.675 171.057 156.604 171.193 154.534 171.373C152.463 171.554 150.708 171.69 149.268 171.78C147.827 171.87 147.062 171.916 146.972 171.916L147.917 163.105C150.618 162.744 152.553 162.066 153.724 161.072C154.894 159.988 155.479 158.407 155.479 156.328C155.479 155.605 155.389 154.205 155.209 152.126C155.119 150.048 154.939 147.518 154.669 144.536C154.489 141.554 154.309 138.346 154.129 134.913C153.949 131.479 153.724 128.136 153.454 124.883C153.273 121.63 153.093 118.648 152.913 115.937C152.733 113.226 152.643 111.102 152.643 109.566H151.428C150.168 113 148.772 116.976 147.242 121.494C145.712 126.012 144.001 130.982 142.111 136.404C140.22 141.825 138.285 147.518 136.304 153.482C134.324 159.446 132.344 165.545 130.363 171.78L121.181 173Z" fill="black"/>
                </svg>
                {/* Pill-shaped rings using same SVG path as favicon */}
                <svg className="loader-ring" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M163.56 43.0205C209.73 44.0025 246.856 81.7364 246.856 128.143C246.856 175.166 208.737 213.285 161.714 213.285C157.083 213.285 152.539 212.914 148.109 212.202H108.747C104.317 212.914 99.7731 213.285 95.1426 213.285C48.1196 213.285 10 175.166 10 128.143C10 82.3601 46.1351 45.0184 91.4404 43.0801V43H163.56V43.0205Z" fill="none" stroke="#EBFF00" strokeWidth="4"/>
                </svg>
                <svg className="loader-ring loader-ring--delayed" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M163.56 43.0205C209.73 44.0025 246.856 81.7364 246.856 128.143C246.856 175.166 208.737 213.285 161.714 213.285C157.083 213.285 152.539 212.914 148.109 212.202H108.747C104.317 212.914 99.7731 213.285 95.1426 213.285C48.1196 213.285 10 175.166 10 128.143C10 82.3601 46.1351 45.0184 91.4404 43.0801V43H163.56V43.0205Z" fill="none" stroke="#EBFF00" strokeWidth="4"/>
                </svg>
              </div>
            </div>
          )}

          {blocks.length > 0 && (
            <div className="insights-grid">
              {blocks.map((block, i) => (
                <InsightCard key={block.id || `${block.type}-${i}`} block={block} index={i} onClick={(b, rect) => { setSelectedBlock(b); setSelectedCardRect(rect); setSelectedCardIndex(i); }} />
              ))}
            </div>
          )}
        </main>

        {/* Right panel — meta/overview */}
        <MetaPanel
          meta={meta}
          metaHistory={metaHistory}
          blocks={blocks}
          isOpen={showMeta}
          onToggle={() => setShowMeta(false)}
        />
      </div>

      {/* Conversation History panel */}
      <ConversationHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onLoadConversation={handleLoadConversation}
      />

      {selectedBlock && (
        <InsightDetail
          block={selectedBlock}
          cardRect={selectedCardRect}
          cardIndex={selectedCardIndex}
          onClose={() => { setSelectedBlock(null); setSelectedCardRect(null); }}
        />
      )}
    </div>
  );
}

function MeetaLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 415 155" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M336.955 0L337.956 0.00585938C380.296 0.541931 414.454 35.0324 414.454 77.5C414.454 119.967 380.296 154.457 337.956 154.993L336.955 154.999H74.1299V154.926C32.8915 153.162 0.00020075 119.173 0 77.5C0 35.8272 32.8914 1.83652 74.1299 0.0722656V0H336.955Z" fill="#EBFF00"/>
      <path d="M334.459 109.093C331.36 109.093 328.895 108.389 327.063 106.98C325.302 105.572 324.246 103.564 323.894 100.958L323.049 100.641C321.71 102.05 320.302 103.388 318.823 104.656C317.343 105.853 315.97 106.839 314.702 107.614C313.434 108.319 312.343 108.671 311.427 108.671C308.68 108.671 306.215 108.002 304.031 106.663C301.848 105.325 300.122 103.494 298.854 101.169C297.587 98.8451 296.953 96.2391 296.953 93.3513C296.953 91.1678 297.516 89.3013 298.643 87.7517C299.84 86.1317 301.32 85.0752 303.08 84.5822L323.471 79.8279L323.577 77.2922C323.577 74.2635 322.767 71.904 321.147 70.2136C319.597 68.5231 317.379 67.6779 314.491 67.6779C312.519 67.6779 310.406 68.171 308.152 69.157C305.898 70.0727 303.89 71.2349 302.13 72.6435L301.179 72.2209L299.383 65.8818C301.425 64.6845 303.714 63.4871 306.25 62.2897C308.786 61.0219 311.18 59.9653 313.434 59.1201C315.759 58.2749 317.519 57.8523 318.717 57.8523C322.802 57.8523 326.148 58.4862 328.754 59.754C331.36 61.0219 333.262 62.7475 334.459 64.931C335.656 67.044 336.255 69.474 336.255 72.2209C336.255 73.1366 336.149 74.5453 335.938 76.447C335.727 78.3487 335.48 80.4265 335.199 82.6804C334.917 84.9343 334.67 87.0826 334.459 89.1252C334.248 91.1678 334.142 92.7878 334.142 93.9852C334.142 95.3234 334.459 96.3799 335.093 97.1547C335.797 97.9295 336.748 98.3169 337.945 98.3169C338.861 98.3169 339.777 98.1056 340.692 97.683C341.679 97.2604 342.453 96.873 343.017 96.5208L344.602 98.7395C343.897 99.9369 342.982 101.31 341.855 102.86C340.728 104.339 339.53 105.677 338.262 106.875C336.995 108.002 335.727 108.741 334.459 109.093ZM315.336 98.6338C316.393 98.6338 317.625 98.3521 319.034 97.7886C320.513 97.1547 321.816 96.4152 322.943 95.5699L323.26 85.533L311.955 88.7026C310.265 89.1956 309.42 90.3578 309.42 92.1891C309.42 94.0204 309.948 95.57 311.004 96.8378C312.131 98.0352 313.575 98.6338 315.336 98.6338Z" fill="black"/>
      <path d="M280.785 109.093C275.784 109.093 272.121 108.037 269.797 105.924C267.473 103.811 266.31 100.536 266.31 96.0982V72.5379C266.31 70.3544 265.923 68.8753 265.148 68.1005C264.373 67.3257 262.859 66.9031 260.605 66.8327L259.549 66.0931L260.288 60.9162C262.542 59.8597 264.726 58.6975 266.839 57.4297C268.952 56.0914 270.818 54.8588 272.438 53.7319C274.129 52.5345 275.467 51.5836 276.453 50.8793C277.439 50.1045 277.932 49.7171 277.932 49.7171L280.89 51.1963C280.89 51.1963 280.749 52.0063 280.468 53.6262C280.256 55.1758 280.01 57.3945 279.728 60.2823L292.195 59.9653L292.618 60.4936L291.561 67.5723L279.094 67.2553C278.883 70.284 278.707 73.7353 278.566 77.6092C278.496 81.4126 278.46 85.6387 278.46 90.2874C278.46 93.316 278.989 95.4995 280.045 96.8378C281.102 98.176 282.827 98.8452 285.222 98.8452C286.772 98.8452 288.216 98.5986 289.554 98.1056C290.892 97.6125 291.561 97.366 291.561 97.366L292.935 100.747C292.935 100.747 292.442 101.169 291.456 102.015C290.54 102.86 289.378 103.846 287.969 104.973C286.631 106.029 285.292 106.98 283.954 107.826C282.616 108.671 281.559 109.093 280.785 109.093Z" fill="black"/>
      <path d="M236.843 109.093C231.912 109.093 227.651 108.107 224.059 106.135C220.537 104.163 217.79 101.346 215.818 97.683C213.916 94.0204 212.965 89.7239 212.965 84.7935C212.965 80.9196 213.599 77.3626 214.867 74.1227C216.135 70.8827 217.896 68.0653 220.15 65.6705C222.404 63.2053 225.045 61.3036 228.074 59.9653C231.102 58.5567 234.377 57.8523 237.899 57.8523C249.732 57.8523 255.649 63.8392 255.649 75.8131C255.649 76.8696 255.543 77.9613 255.332 79.0883C255.191 80.2152 255.05 81.0957 254.909 81.7296L253.641 82.9974H226.277C226.418 87.8574 227.545 91.6608 229.658 94.4078C231.842 97.0843 234.87 98.5634 238.744 98.8452C242.618 99.1269 247.161 98.0704 252.373 95.6756L253.113 96.0982L254.803 101.275C253.395 102.332 251.634 103.494 249.521 104.762C247.408 105.959 245.224 106.98 242.97 107.826C240.717 108.671 238.674 109.093 236.843 109.093ZM226.277 77.1866L240.752 76.3413C241.597 76.2709 242.125 76.0948 242.337 75.8131C242.618 75.4609 242.759 74.827 242.759 73.9114C242.759 71.3757 242.196 69.4388 241.069 68.1005C239.942 66.7623 238.287 66.0931 236.103 66.0931C233.356 66.0931 231.102 67.044 229.341 68.9457C227.651 70.777 226.63 73.524 226.277 77.1866Z" fill="black"/>
      <path d="M188.041 109.093C183.11 109.093 178.849 108.107 175.257 106.135C171.735 104.163 168.988 101.346 167.016 97.683C165.114 94.0204 164.163 89.7239 164.163 84.7935C164.163 80.9196 164.797 77.3626 166.065 74.1227C167.333 70.8827 169.094 68.0653 171.348 65.6705C173.602 63.2053 176.243 61.3036 179.272 59.9653C182.3 58.5567 185.575 57.8523 189.097 57.8523C200.93 57.8523 206.847 63.8392 206.847 75.8131C206.847 76.8696 206.741 77.9613 206.53 79.0883C206.389 80.2152 206.248 81.0957 206.107 81.7296L204.839 82.9974H177.476C177.616 87.8574 178.743 91.6608 180.856 94.4078C183.04 97.0843 186.069 98.5634 189.942 98.8452C193.816 99.1269 198.359 98.0704 203.571 95.6756L204.311 96.0982L206.001 101.275C204.593 102.332 202.832 103.494 200.719 104.762C198.606 105.959 196.422 106.98 194.168 107.826C191.915 108.671 189.872 109.093 188.041 109.093ZM177.476 77.1866L191.95 76.3413C192.795 76.2709 193.323 76.0948 193.535 75.8131C193.816 75.4609 193.957 74.827 193.957 73.9114C193.957 71.3757 193.394 69.4388 192.267 68.1005C191.14 66.7623 189.485 66.0931 187.301 66.0931C184.554 66.0931 182.3 67.044 180.539 68.9457C178.849 70.777 177.828 73.524 177.476 77.1866Z" fill="black"/>
      <path d="M113.327 109.516C111.214 102.684 109.136 96.2039 107.093 90.0761C105.051 83.8778 103.149 78.2431 101.388 73.1718C99.6273 68.0301 98.113 63.6632 96.8451 60.071H95.9999C95.9999 60.7049 95.9295 62.0079 95.7886 63.9801C95.6478 65.9523 95.4717 68.2766 95.2604 70.9531C95.1195 73.6296 94.9434 76.447 94.7321 79.4053C94.5208 82.2931 94.3095 85.0752 94.0982 87.7517C93.9573 90.3578 93.8165 92.5765 93.6756 94.4078C93.6052 96.2391 93.5699 97.366 93.5699 97.7886C93.5699 100.043 94.6969 101.169 96.9508 101.169C97.3734 101.169 98.0425 101.169 98.9582 101.169C99.8738 101.099 100.402 101.064 100.543 101.064L101.177 101.592L100.015 108.248C99.3104 108.248 98.1482 108.213 96.5282 108.142C94.9786 108.072 93.3586 108.002 91.6682 107.931C90.0482 107.861 88.71 107.826 87.6535 107.826C86.8082 107.826 85.7869 107.861 84.5896 107.931C83.3922 108.002 82.23 108.107 81.103 108.248C79.9761 108.389 79.0252 108.495 78.2505 108.565C77.5461 108.636 77.1939 108.671 77.1939 108.671L77.8278 101.803C79.9409 101.592 81.42 100.958 82.2652 99.9017C83.1809 98.7747 83.85 96.873 84.2726 94.1965C84.4135 93.4217 84.5896 91.9074 84.8009 89.6535C85.0122 87.3996 85.2587 84.7231 85.5404 81.6239C85.8926 78.5248 86.2095 75.3553 86.4913 72.1153C86.8435 68.8049 87.1604 65.6705 87.4421 62.7123C87.7943 59.754 88.0408 57.2888 88.1817 55.3167C88.393 53.2741 88.4987 52.0415 88.4987 51.6189C88.4987 50.2806 88.2521 49.2945 87.7591 48.6606C87.3365 47.9563 86.5265 47.428 85.3291 47.0758C84.2022 46.6532 82.5822 46.3715 80.4691 46.2306L79.9409 45.5967L80.8917 39.4689C82.0891 39.5394 83.533 39.6098 85.2235 39.6802C86.9139 39.7507 88.5691 39.8211 90.1891 39.8915C91.8091 39.962 93.1121 39.9972 94.0982 39.9972C95.2956 39.9972 96.5986 39.9972 98.0073 39.9972C99.4864 39.9268 100.895 39.8563 102.233 39.7859C103.572 39.7154 104.593 39.645 105.297 39.5746C106.776 44.9276 108.256 50.0341 109.735 54.8941C111.214 59.6836 112.552 64.0505 113.749 67.9949C115.017 71.9392 116.074 75.2848 116.919 78.0318C117.835 80.7787 118.469 82.7157 118.821 83.8426H119.666C120.018 82.7861 120.617 80.8844 121.462 78.1374C122.378 75.3905 123.469 72.0449 124.737 68.1005C126.075 64.1562 127.519 59.7893 129.069 54.9997C130.618 50.2102 132.203 45.1741 133.823 39.8915C134.809 39.8915 136.007 39.9268 137.415 39.9972C138.895 40.0676 140.409 40.1028 141.958 40.1028C143.508 40.1028 144.952 40.0676 146.29 39.9972C147.417 39.9972 148.755 39.962 150.305 39.8915C151.925 39.7507 153.369 39.645 154.637 39.5746C155.904 39.4337 156.714 39.3633 157.067 39.3633L157.489 39.7859L156.855 46.125C153.897 46.3363 151.854 46.8645 150.727 47.7098C149.601 48.4845 149.037 49.8228 149.037 51.7245C149.037 52.6402 149.072 54.1897 149.143 56.3732C149.284 58.5567 149.424 61.1275 149.565 64.0858C149.777 66.9736 149.988 70.0727 150.199 73.3831C150.481 76.6231 150.727 79.8279 150.939 82.9974C151.15 86.0965 151.361 88.9139 151.573 91.4495C152.066 95.3234 152.629 97.9295 153.263 99.2678C153.897 100.536 155.059 101.169 156.75 101.169C157.313 101.169 157.912 101.134 158.546 101.064C159.18 100.993 159.567 100.958 159.708 100.958L160.13 101.486L159.18 108.142C158.757 108.142 157.912 108.107 156.644 108.037C155.447 107.966 154.073 107.896 152.524 107.826C151.044 107.826 149.706 107.826 148.509 107.826C147.311 107.826 145.903 107.861 144.283 107.931C142.663 108.002 141.043 108.107 139.423 108.248C137.803 108.389 136.429 108.495 135.302 108.565C134.175 108.636 133.577 108.671 133.506 108.671L134.246 101.803C136.359 101.522 137.873 100.993 138.789 100.219C139.704 99.3734 140.162 98.1408 140.162 96.5208C140.162 95.9573 140.092 94.8656 139.951 93.2456C139.881 91.6256 139.74 89.6535 139.528 87.3291C139.388 85.0048 139.247 82.5044 139.106 79.8279C138.965 77.1514 138.789 74.5453 138.578 72.0096C138.437 69.474 138.296 67.1497 138.155 65.0366C138.014 62.9236 137.944 61.2684 137.944 60.071H136.993C136.007 62.7475 134.915 65.8466 133.718 69.3683C132.52 72.8901 131.182 76.764 129.703 80.99C128.224 85.2161 126.709 89.6535 125.16 94.3021C123.61 98.9508 122.061 103.705 120.511 108.565L113.327 109.516Z" fill="black"/>
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function PasteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

function TranscriptIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function MetaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
