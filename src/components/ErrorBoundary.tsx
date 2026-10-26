import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const raw = error instanceof Error ? error.message : String(error);
    let friendly = raw;
    if (raw.includes('Quota exceeded')) {
      friendly =
        'Kuota pembacaan harian database gratis telah tercapai dan akan disetel ulang besok.';
    } else if (raw.startsWith('{') && raw.includes('operationType')) {
      try {
        const parsed = JSON.parse(raw);
        friendly = `Akses database ditolak atau gagal pada jalur "${parsed.path || '-'}": ${parsed.error}`;
      } catch {
        friendly = raw;
      }
    }
    return { hasError: true, message: friendly };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Terjadi Kendala Pemrosesan Data
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">{this.state.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 rounded-lg"
            >
              Muat Ulang Tampilan
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
