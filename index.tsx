
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in application:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
          <div className="bg-slate-800 p-8 rounded-3xl max-w-2xl w-full border border-slate-700 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-red-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h1 className="text-2xl font-black uppercase tracking-tight">Se produjo un error</h1>
            </div>
            
            <p className="text-sm text-slate-300">
              La aplicación de Estrategias DPM encontró un problema inesperado. A continuación se detallan los detalles técnicos para soporte:
            </p>

            <div className="bg-slate-950 p-4 rounded-xl overflow-auto max-h-60 border border-slate-900 font-mono text-xs text-red-400 space-y-2">
              <div className="font-bold text-white text-sm">{this.state.error?.toString()}</div>
              {this.state.error?.stack && (
                <pre className="whitespace-pre-wrap text-slate-400 text-[11px] leading-relaxed">
                  {this.state.error.stack}
                </pre>
              )}
              {this.state.errorInfo?.componentStack && (
                <pre className="whitespace-pre-wrap text-slate-500 text-[10px] leading-relaxed">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => window.location.reload()} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs py-4 px-6 rounded-2xl transition-all"
              >
                Recargar Aplicación
              </button>
              <button 
                onClick={this.handleReset} 
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold uppercase text-xs py-4 px-6 rounded-2xl transition-all"
              >
                Limpiar Cache Local
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

