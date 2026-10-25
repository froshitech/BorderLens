import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React ErrorBoundary caught error]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0B0B0F',
          color: '#F4F2EE',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#FF4D2E', marginBottom: '1rem', fontSize: '1.8rem' }}>
            Something went wrong loading BorderLens
          </h2>
          <p style={{ color: '#ADB5BD', maxWidth: '600px', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <pre style={{
            background: 'rgba(255,255,255,0.06)',
            padding: '1rem',
            borderRadius: '8px',
            maxWidth: '800px',
            overflowX: 'auto',
            textAlign: 'left',
            fontSize: '0.85rem',
            color: '#E4E7F0',
            marginBottom: '1.5rem',
          }}>
            {this.state.error?.stack || String(this.state.error)}
          </pre>
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#6C63FF',
              color: '#fff',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(108,99,255,0.3)',
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
