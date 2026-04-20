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

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const title = "ELFAROUK";
  
  return (
    <motion.div
      key="loading-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 overflow-hidden"
    >
      {/* Background Video with Sophisticated Overlay */}
      <div className="absolute inset-0 w-full h-full">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          poster="/loading-poster.jpg"
          className="w-full h-full object-cover opacity-60 scale-105"
          src="/loading-motor.mp4"
        />
        
        {/* Layered Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/80 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,6,23,0.9)_100%)]" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        
        {/* Animated Mesh Gradients */}
        <motion.div 
          animate={{ 
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-full h-full bg-electric-600/10 blur-[150px] rounded-full"
        />
        <motion.div 
          animate={{ 
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-primary-600/10 blur-[150px] rounded-full"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-4">
        <div className="flex flex-col items-center text-center">
          
          {/* Logo Animation with Original Shimmer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative mb-8"
          >
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-[0.2em] md:tracking-[0.4em] uppercase drop-shadow-2xl relative">
              ELFAROUK
              <motion.div
                initial={{ left: '-100%' }}
                animate={{ left: '100%' }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] pointer-events-none"
              />
            </h1>
            
            {/* Soft Glow behind the text */}
            <div className="absolute -inset-10 bg-electric-500/10 blur-[60px] -z-10 rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <p className="text-primary-400 font-black tracking-[0.5em] text-[10px] md:text-xs uppercase opacity-80">
              Auto Spare Parts • Premium Management
            </p>

            {/* High-Fidelity Progress Indicator */}
            <div className="relative w-64 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                onAnimationComplete={() => onFinished?.()}
                transition={{ duration: 3, ease: "easeInOut" }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-electric-600 to-cyan-400 shadow-[0_0_15px_rgba(37,99,235,0.8)]"
              >
                <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/40 blur-sm" />
              </motion.div>
            </div>

            {/* Dynamic Status Text */}
            <div className="h-6 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-slate-400 font-arabic text-sm font-medium tracking-wide"
                >
                  {STATUS_MESSAGES[statusIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-10 text-[10px] text-slate-600 font-black tracking-[0.3em] uppercase opacity-40"
      >
        Elfarouk Terminal v2.0
      </motion.div>
    </motion.div>
  )
}
