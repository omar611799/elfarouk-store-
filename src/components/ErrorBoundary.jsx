import React from 'react'

const isDevelopment = import.meta.env.DEV

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 px-4 py-10 text-white" dir="rtl">
          <div className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">
              System Recovery
            </p>
            <h2 className="mt-3 text-2xl font-black">حصل خطأ غير متوقع</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              الصفحة اتعرضت لمشكلة أثناء التشغيل. جرب إعادة التحميل، ولو المشكلة استمرت
              راجع السجل التقني أو تواصل مع الدعم الداخلي.
            </p>
            {isDevelopment && (
              <details
                className="mt-4 rounded-xl border border-white/10 bg-slate-900/80 p-4 text-left text-xs text-slate-300"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
