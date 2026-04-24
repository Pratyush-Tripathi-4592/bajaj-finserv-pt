import { useMemo, useState } from 'react'
import './App.css'
import { TreeViewTab } from './components/TreeViewTab'
import { DiagnosticsTab } from './components/DiagnosticsTab'
import { SummaryTab } from './components/SummaryTab'
import { RawJsonTab } from './components/RawJsonTab'

const API_CANDIDATES = import.meta.env.VITE_API_URL
  ? [import.meta.env.VITE_API_URL]
  : ['http://localhost:5000', 'http://localhost:5001']

const SAMPLE_INPUT = {
  data: [
    'A->B',
    'A->C',
    'B->D',
    'C->E',
    'E->F',
    'X->Y',
    'Y->Z',
    'Z->X',
    'P->Q',
    'Q->R',
    'G->H',
    'G->H',
    'G->I',
    'hello',
    '1->2',
    'A->',
  ],
}

const TAB_KEYS = {
  TREE: 'tree',
  DIAGNOSTICS: 'diagnostics',
  SUMMARY: 'summary',
  RAW: 'raw',
}

function App() {
  const [inputText, setInputText] = useState(JSON.stringify(SAMPLE_INPUT, null, 2))
  const [activeTab, setActiveTab] = useState(TAB_KEYS.TREE)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [responseData, setResponseData] = useState(null)

  const graphHealth = useMemo(() => {
    if (!responseData || !responseData.summary) return 0
    const trees = responseData.summary.total_trees || 0
    const cycles = responseData.summary.total_cycles || 0
    const invalid = (responseData.invalid_entries || []).length
    const duplicates = (responseData.duplicate_edges || []).length
    const totalSignals = trees + cycles + invalid + duplicates
    if (totalSignals === 0) return 100
    const health = ((trees - cycles - invalid * 0.5 - duplicates * 0.25) / totalSignals) * 100
    return Math.max(0, Math.min(100, Math.round(health)))
  }, [responseData])

  const loadSample = () => {
    setInputText(JSON.stringify(SAMPLE_INPUT, null, 2))
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    setIsLoading(true)

    let payload
    try {
      payload = JSON.parse(inputText)
    } catch (parseError) {
      setError('Input must be valid JSON with a `data` array.')
      setIsLoading(false)
      return
    }

    try {
      const body = await postWithFallback(payload)
      setResponseData(body)
      setActiveTab(TAB_KEYS.TREE)
    } catch (requestError) {
      setError(requestError.message || 'Unable to connect to backend.')
    } finally {
      setIsLoading(false)
    }
  }

  const postWithFallback = async (payload) => {
    let lastError = null

    for (const baseUrl of API_CANDIDATES) {
      try {
        const res = await fetch(`${baseUrl}/bfhl`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const contentType = res.headers.get('content-type') || ''
        const responseBody = contentType.includes('application/json') ? await res.json() : null

        if (!res.ok) {
          const message = responseBody?.error || `Backend at ${baseUrl} responded with ${res.status}.`
          throw new Error(message)
        }

        return responseBody
      } catch (error) {
        lastError = error
      }
    }

    throw lastError || new Error('Unable to connect to backend on default local ports.')
  }

  const copyRawJson = async () => {
    if (!responseData) return
    await navigator.clipboard.writeText(JSON.stringify(responseData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>Hierarchy Lab</h1>
        <p>Build, validate, and inspect directed hierarchies instantly.</p>
      </header>

      <main className="main-layout">
        <section className="glass-panel input-section">
          <div className="input-header">
            <h2>Input Edges JSON</h2>
            <button type="button" className="btn btn-secondary" onClick={loadSample}>
              Load Sample
            </button>
          </div>

          <textarea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            spellCheck={false}
            aria-label="Hierarchy input JSON"
          />

          {error ? <p className="error-message">{error}</p> : null}

          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Submit'}
          </button>
        </section>

        <section className="glass-panel results-section" style={{ position: 'relative' }}>
          {isLoading ? (
            <div className="loading-overlay">
              <div className="spinner" />
              <p>Computing hierarchies...</p>
            </div>
          ) : null}

          <div className="tabs">
            <button type="button" className={`tab-btn ${activeTab === TAB_KEYS.TREE ? 'active' : ''}`} onClick={() => setActiveTab(TAB_KEYS.TREE)}>
              Tree View
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === TAB_KEYS.DIAGNOSTICS ? 'active' : ''}`}
              onClick={() => setActiveTab(TAB_KEYS.DIAGNOSTICS)}
            >
              Diagnostics
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === TAB_KEYS.SUMMARY ? 'active' : ''}`}
              onClick={() => setActiveTab(TAB_KEYS.SUMMARY)}
            >
              Summary
            </button>
            <button type="button" className={`tab-btn ${activeTab === TAB_KEYS.RAW ? 'active' : ''}`} onClick={() => setActiveTab(TAB_KEYS.RAW)}>
              Raw JSON
            </button>
          </div>

          <div className="tab-content">
            {!responseData ? (
              <div className="placeholder-content">
                <div className="placeholder-icon">🧪</div>
                <p>Submit your JSON to inspect hierarchy output.</p>
              </div>
            ) : null}

            {responseData && activeTab === TAB_KEYS.TREE ? <TreeViewTab hierarchies={responseData.hierarchies} /> : null}
            {responseData && activeTab === TAB_KEYS.DIAGNOSTICS ? <DiagnosticsTab result={responseData} /> : null}
            {responseData && activeTab === TAB_KEYS.SUMMARY ? <SummaryTab summary={responseData.summary} graphHealth={graphHealth} /> : null}
            {responseData && activeTab === TAB_KEYS.RAW ? <RawJsonTab responseData={responseData} copied={copied} onCopy={copyRawJson} /> : null}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
