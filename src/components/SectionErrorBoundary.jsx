import React from "react";

export default class SectionErrorBoundary extends React.Component {
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
          padding: "24px 16px", textAlign: "center",
          background: "var(--cp-error-bg)", border: "1px solid var(--cp-error-border)",
          borderRadius: 6, margin: "12px 0",
        }}>
          <p style={{ fontSize: 13, color: "var(--cp-error-text)", marginBottom: 12 }}>
            {this.props.name ? `${this.props.name} encountered an error` : "Something went wrong in this section"}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: "6px 16px", fontSize: 12, fontFamily: "inherit",
              background: "var(--cp-bg-card)", color: "var(--cp-error-text)", border: "1px solid var(--cp-error-border)",
              borderRadius: 6, cursor: "pointer",
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
