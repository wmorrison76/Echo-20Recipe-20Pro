export default function RDLabsWorkspace() {
  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: "#0f172a", color: "#e2e8f0", padding: "24px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#06b6d4", marginBottom: "16px" }}>
        R&D Labs Dashboard
      </h1>
      <p style={{ color: "#cbd5e1" }}>
        Dashboard is loading...
      </p>
      <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
        <p>No projects yet. Click "Create New Project" to begin.</p>
      </div>
    </div>
  );
}
