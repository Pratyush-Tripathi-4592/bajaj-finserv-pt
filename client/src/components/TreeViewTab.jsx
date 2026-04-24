export function TreeViewTab({ hierarchies = [] }) {
  if (!hierarchies.length) {
    return <p className="empty-state">No hierarchies found.</p>
  }

  return (
    <div className="tree-grid">
      {hierarchies.map((item, index) => (
        <article className="tree-card" key={`${item.root}-${index}`}>
          <header className="tree-header">
            <span className="root-badge">{item.root}</span>
            {item.has_cycle ? (
              <span className="status-badge status-cycle">Cycle detected</span>
            ) : (
              <span className="status-badge status-depth">Depth {item.depth}</span>
            )}
          </header>
          <div className="tree-body">
            <pre>{JSON.stringify(item.tree, null, 2)}</pre>
          </div>
        </article>
      ))}
    </div>
  )
}
