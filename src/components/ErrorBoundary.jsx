import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: 480, margin: "80px auto", padding: 32, fontFamily: "system-ui, sans-serif",
          textAlign: "center", color: "var(--cp-text-secondary)",
        }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: "var(--cp-text-muted)", marginBottom: 20 }}>
            An unexpected error occurred. Your saved data is safe in local storage.
          </p>
          <details style={{ textAlign: "left", marginBottom: 20, fontSize: 12, color: "var(--cp-text-muted)" }}>
            <summary style={{ cursor: "pointer", marginBottom: 6 }}>Error details</summary>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "var(--cp-bg-panel)", padding: 12, borderRadius: 6 }}>
              {this.state.error?.message || "Unknown error"}
            </pre>
          </details>
          <button
            onClick={this.handleReset}
            style={{
              padding: "8px 20px", fontSize: 14, fontFamily: "inherit",
              background: "var(--cp-text-secondary)", color: "var(--cp-bg)", border: "none", borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
