// ManageMode — stub for Phase 1.
// Full articles table + SourceBar (n8n Phase 1/2 flow) added in Phase 3.
export default function ManageMode() {
  return (
    <main className="main manage-main">
      <h1 className="manage-h">Manage<em>.</em></h1>
      <div className="manage-stats">
        Loading articles… <span className="sep">·</span>
        <span style={{ color: "var(--ink-3)" }}>Phase 3 wires real data</span>
      </div>

      <div className="posts-wrap">
        <div className="posts-toolbar">
          <div className="filter-tabs">
            <button className="on">All</button>
            <button>Draft</button>
            <button>Live</button>
            <button>Scheduled</button>
          </div>
          <span className="search-mini">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Filter posts…" readOnly />
          </span>
          <div className="grow" />
        </div>
        <table className="posts-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Category</th>
              <th className="num">Words</th>
              <th className="num">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="title" colSpan={5} style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Articles load in Phase 3
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
