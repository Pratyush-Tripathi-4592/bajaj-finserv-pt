export function SummaryTab({ summary = {}, graphHealth = 0 }) {
  const totalTrees = summary.total_trees || 0
  const totalCycles = summary.total_cycles || 0
  const largestTreeRoot = summary.largest_tree_root || '-'

  const barColor = graphHealth >= 75 ? '#10b981' : graphHealth >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <>
      <div className="summary-grid">
        <article className="stat-card">
          <span className="stat-label">Total Trees</span>
          <span className="stat-value">{totalTrees}</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Total Cycles</span>
          <span className="stat-value">{totalCycles}</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Largest Tree Root</span>
          <span className="stat-value highlight">{largestTreeRoot}</span>
        </article>
      </div>

      <div className="health-container">
        <div className="health-header">
          <h3>Graph Health</h3>
          <span className="health-percentage">{graphHealth}%</span>
        </div>
        <div className="progress-bg">
          <div className="progress-fill" style={{ width: `${graphHealth}%`, backgroundColor: barColor }} />
        </div>
      </div>
    </>
  )
}
