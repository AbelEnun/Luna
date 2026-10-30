import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page narrow error-page" style={{ padding: "40px 20px", textAlign: "center" }}>
          <h1>The boutique is taking a moment.</h1>
          <p>Please refresh or return home. If the problem continues, contact the owner.</p>
          {this.state.error?.message && (
            <pre style={{ textAlign: "left", background: "#f1f5f9", padding: "12px", borderRadius: "8px", fontSize: "12px", overflowX: "auto", margin: "16px 0" }}>
              {this.state.error.message}
            </pre>
          )}
          <Link to="/" className="btn">Return home</Link>
        </main>
      );
    }
    return this.props.children;
  }
}
