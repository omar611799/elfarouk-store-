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
  const [statusIndex, setStatusIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile for performance optimization
    const checkMobile = () => {
      const isMobi = window.innerWidth < 768 || /Mobi|Android|iP(hone|ad|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobi);
    };
    checkMobile();
    
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <motion.div
      key="loading-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 overflow-hidden"
    >
      {/* Background Layer */}
      <div className="absolute inset-0 w-full h-full">
        {!isMobile && (
          <video 
            autoPlay 
            muted 
            loop 
            playsInline 
            poster="/loading-poster.jpg"
            className="w-full h-full object-cover opacity-50 scale-105"
            src="/loading-motor.mp4"
          />
        )}
        
        {/* Cinematic Overlays */}
        <div className={`absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/90 to-transparent ${isMobile ? 'opacity-100' : 'opacity-80'}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,6,23,0.95)_100%)]" />
        {!isMobile && <div className="absolute inset-0 backdrop-blur-[2px]" />}
        
        {/* Optimized Mesh Gradients */}
        <motion.div 
          animate={{ 
            opacity: [0.15, 0.25, 0.15],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-full h-full bg-electric-600/10 blur-[100px] rounded-full"
        />
        {!isMobile && (
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 2 }}
            className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-primary-600/10 blur-[150px] rounded-full"
          />
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-4">
        <div className="flex flex-col items-center text-center">
          
          {/* Logo Animation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative mb-8"
          >
            <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-[0.2em] md:tracking-[0.4em] uppercase relative leading-none pb-2">
              ELFAROUK
              {!isMobile && (
                <motion.div
                  initial={{ left: '-100%' }}
                  animate={{ left: '100%' }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] pointer-events-none"
                />
              )}
            </h1>
            <div className="absolute -inset-10 bg-electric-500/5 blur-[50px] -z-10 rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-6"
          >
            <p className="text-electric-400 font-black tracking-[0.4em] text-[9px] md:text-xs uppercase opacity-60">
              Auto Spare Parts • Elite Management
            </p>

            {/* Progress Bar */}
            <div className="relative w-56 md:w-64 h-1 bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                onAnimationComplete={() => onFinished?.()}
                transition={{ duration: 2.5, ease: "easeInOut" }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-electric-600 to-cyan-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
              />
            </div>

            {/* Status Text */}
            <div className="h-6 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusIndex}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-slate-500 font-arabic text-xs font-bold tracking-widest uppercase"
                >
                  {STATUS_MESSAGES[statusIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-10 text-[8px] text-slate-700 font-black tracking-[0.3em] uppercase opacity-40">
        System Core v2.1 • Optimized
      </div>
    </motion.div>
  )
}
