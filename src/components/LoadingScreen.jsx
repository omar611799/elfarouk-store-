import { Loader2 } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a1523] text-white select-none">
      <div className="flex flex-col items-center text-center p-6">
        <div className="mb-6 rounded-2xl bg-white/95 p-3 shadow-2xl">
          <img
            src="/brand-logo.png"
            alt="ELFAROUK Service"
            className="h-20 w-auto object-contain sm:h-24"
          />
        </div>

        <h1 className="text-xl font-black tracking-widest text-white sm:text-2xl">
          ELFAROUK STORE
        </h1>
        <p className="mt-1 text-[11px] font-bold tracking-wider text-cyan-400">
          نظام إدارة قطع الغيار المتكامل
        </p>

        <div className="mt-8 flex items-center gap-2.5 text-xs text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          <span>جاري التحميل السريع...</span>
        </div>
      </div>
    </div>
  )
}
