function BadgeList({ entries, className, emptyText }) {
  if (!entries.length) {
    return <p className="empty-state">{emptyText}</p>
  }

  return (
    <div className="badges-container">
      {entries.map((value, index) => (
        <span key={`${value}-${index}`} className={`badge ${className}`}>
          {String(value)}
        </span>
      ))}
    </div>
  )
}

export function DiagnosticsTab({ result }) {
  const invalidEntries = result.invalid_entries || []
  const duplicateEdges = result.duplicate_edges || []
  const debug = result.debug || {}

  return (
    <>
      <section className="diag-section">
        <h3>Invalid Entries</h3>
        <BadgeList entries={invalidEntries} className="badge-invalid" emptyText="No invalid entries." />
      </section>

      <section className="diag-section">
        <h3>Duplicate Edges</h3>
        <BadgeList entries={duplicateEdges} className="badge-duplicate" emptyText="No duplicate edges." />
      </section>

      <section className="debug-section">
        <h3>Debug Mode: Parsed Edges</h3>
        <pre className="debug-content">{JSON.stringify(debug.parsed_edges || [], null, 2)}</pre>
      </section>

      <section className="debug-section">
        <h3>Debug Mode: Filtered Edges</h3>
        <pre className="debug-content">{JSON.stringify(debug.after_dedup || [], null, 2)}</pre>
      </section>

      <section className="debug-section">
        <h3>Debug Mode: Final Graph</h3>
        <pre className="debug-content">{JSON.stringify(debug.final_adj || {}, null, 2)}</pre>
      </section>
    </>
  )
}
