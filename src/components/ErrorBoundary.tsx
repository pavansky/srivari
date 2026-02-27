'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global Error Boundary — Catches unhandled React rendering errors.
 * In production, this prevents a blank white screen and instead shows
 * a graceful fallback UI. It also logs the error for monitoring.
 */
export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('🚨 Uncaught React Error:', error, errorInfo);

        // TODO: When Sentry is configured, send the error here:
        // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }

    public render() {
        if (this.state.hasError) {
            // If a custom fallback was provided, use it
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default graceful fallback UI
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    padding: '2rem',
                    textAlign: 'center',
                    fontFamily: 'sans-serif',
                    color: '#e8e0d4',
                    background: '#0a0a0a',
                }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#D4AF37' }}>
                        Something went wrong
                    </h1>
                    <p style={{ fontSize: '1.1rem', maxWidth: '500px', lineHeight: 1.6, opacity: 0.7 }}>
                        We apologize for the inconvenience. Our team has been notified and is working on resolving this.
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.href = '/';
                        }}
                        style={{
                            marginTop: '2rem',
                            padding: '0.75rem 2rem',
                            background: 'linear-gradient(135deg, #D4AF37, #C5A028)',
                            color: '#0a0a0a',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '1rem',
                        }}
                    >
                        Return to Homepage
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
