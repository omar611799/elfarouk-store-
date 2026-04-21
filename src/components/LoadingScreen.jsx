import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const STATUS_MESSAGES = [
  'جاري تهيئة النظام...',
  'تحميل محرك قطع الغيار...',
  'مزامنة قاعدة البيانات...',
  'فحص المخزون الحالي...',
  'تجهيز واجهة المستخدم...',
  'بدء التشغيل الآمن...'
];

export default function LoadingScreen({ onFinished }) {
  const [statusIndex, setStatusIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [showRepair, setShowRepair] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const isMobi = window.innerWidth < 768 || /Mobi|Android|iP(hone|ad|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobi)
    }
    checkMobile()

    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length)
    }, 2000)

    const timer = setTimeout(() => setShowRepair(true), 4000)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [])

  const handleManualRepair = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (let r of regs) await r.unregister()
    }
    const names = await caches.keys()
    for (let name of names) await caches.delete(name)
    window.location.reload(true)
  }

  return (
    <motion.div
      key="loading-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#08111c_0%,#10243b_55%,#0f1c2d_100%)]"
    >
      <div className="absolute inset-0 w-full h-full">
        {!isMobile && (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/loading-poster.jpg"
            className="h-full w-full scale-105 object-cover opacity-20"
            src="/loading-motor.mp4"
          />
        )}

        <div className={`absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/90 to-transparent ${isMobile ? 'opacity-100' : 'opacity-85'}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,6,23,0.95)_100%)]" />
        {!isMobile && <div className="absolute inset-0 backdrop-blur-[2px]" />}

        <motion.div
          animate={{
            opacity: [0.15, 0.25, 0.15],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute -left-1/4 -top-1/4 h-full w-full rounded-full bg-primary-500/10 blur-[120px]"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-4">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative mb-8"
          >
            <div className="mx-auto w-fit rounded-[2rem] bg-white/95 p-3 shadow-[0_24px_70px_rgba(8,17,28,0.22)]">
              <img src="/brand-logo.png" alt="ELFAROUK Service" className="h-28 w-auto object-contain sm:h-32" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-6"
          >
            <h1 className="text-3xl font-black tracking-[0.18em] text-white sm:text-5xl md:text-6xl">
              ELFAROUK
            </h1>

            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-200/80 md:text-xs">
              SERVICE MANAGEMENT PLATFORM
            </p>

            <div className="relative h-1 w-56 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] md:w-64">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                onAnimationComplete={() => onFinished?.()}
                transition={{ duration: 3, ease: 'easeInOut' }}
                className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#5f8fc0_0%,#225c97_55%,#d8e7f6_100%)] shadow-[0_0_18px_rgba(95,143,192,0.5)]"
              />
            </div>

            <div className="h-12 flex flex-col items-center justify-center gap-4">
              <AnimatePresence mode="wait">
                {!showRepair ? (
                  <motion.p
                    key={statusIndex}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="font-arabic text-[10px] font-bold uppercase tracking-widest text-primary-100/70"
                  >
                    {STATUS_MESSAGES[statusIndex]}
                  </motion.p>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleManualRepair}
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 hover:bg-white/20"
                  >
                    تحديث النظام وإصلاح الملفات
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-10 text-[8px] font-black uppercase tracking-[0.3em] text-primary-100/35">
        Brand-aligned loading shell • mobile ready
      </div>
    </motion.div>
  )
}
