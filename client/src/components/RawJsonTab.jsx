export function RawJsonTab({ responseData, copied, onCopy }) {
  return (
    <div className="json-container">
      <button type="button" className="copy-btn" onClick={onCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre>{JSON.stringify(responseData, null, 2)}</pre>
    </div>
  )
}
