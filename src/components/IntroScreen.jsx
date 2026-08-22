import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Terminal, Cpu } from 'lucide-react'

export default function IntroScreen({ onFinished }) {
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [bootStep, setBootStep] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const videoRef = useRef(null)

  // Track cursor movement for high-end 3D parallax effect (disabled on small touch screens for stability)
  const handleMouseMove = (e) => {
    if (window.innerWidth < 768) return
    const { clientX, clientY } = e
    const width = window.innerWidth
    const height = window.innerHeight
    const x = ((clientX / width) - 0.5) * 16
    const y = ((clientY / height) - 0.5) * -16
    setMousePos({ x, y })
  }

  // Simulated tech bootup sequence logs with fail-safe auto-skip if video hangs
  useEffect(() => {
    const timers = [
      setTimeout(() => setBootStep(1), 50),
      setTimeout(() => setBootStep(2), 100),
      setTimeout(() => setBootStep(3), 150),
      setTimeout(() => setBootStep(4), 200),
    ]

    // Bulletproof Fail-safe Timeout: If video doesn't fire load event in 1.5s, auto-skip to ensure app never hangs.
    const failSafeTimeout = setTimeout(() => {
      console.log("Failsafe triggered: skipping intro screen due to load timeout")
      onFinished?.()
    }, 1500)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(failSafeTimeout)
    }
  }, [onFinished])

  // Bulletproof HTML5 Video Autoplay trigger for modern browsers & mobile
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.defaultMuted = true
      video.muted = true
      
      const attemptPlay = () => {
        video.play()
          .then(() => {
            setVideoLoaded(true)
          })
          .catch((err) => {
            console.warn("Autoplay was blocked or failed, waiting for interaction:", err)
            setVideoLoaded(true)
          })
      }

      attemptPlay()

      const handlePlayEvent = () => setVideoLoaded(true)
      video.addEventListener('canplay', handlePlayEvent)
      video.addEventListener('playing', handlePlayEvent)

      return () => {
        video.removeEventListener('canplay', handlePlayEvent)
        video.removeEventListener('playing', handlePlayEvent)
      }
    } else {
      setVideoLoaded(true)
    }
  }, [])

  const handleLaunch = () => {
    setIsExiting(true)
    setTimeout(() => {
      onFinished?.()
    }, 150)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted
      videoRef.current.muted = newMuted
      setIsMuted(newMuted)
    }
  }

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="hud-intro-viewport"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.05,
            filter: window.innerWidth >= 768 ? 'blur(10px) brightness(1.2)' : 'none'
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onMouseMove={handleMouseMove}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden bg-[#02050c] select-none text-right font-display"
          dir="rtl"
        >
          {/* Cyber Technical Grid & Matrix Layer */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Fallback Background Image (Fades down when video is loaded and playing) */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
              style={{ 
                backgroundImage: "url('/background.jpg')",
                opacity: videoLoaded ? (isHovered ? 0.3 : 0.45) : 0.85,
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 2s ease-out, opacity 1s ease'
              }}
            />

            {/* Background Video (Desktop Only) to prevent mobile OOM crashes */}
            {window.innerWidth >= 768 && (
              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover transition-all duration-[2s] ease-out"
                style={{
                  opacity: videoLoaded ? (isHovered ? 0.8 : 0.65) : 0,
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  filter: isHovered ? 'contrast(1.1) brightness(0.95)' : 'contrast(1) brightness(0.85)',
                }}
              >
                <source src="/loading-motor.mp4" type="video/mp4" />
              </video>
            )}

            {/* Futuristic Tech Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.04)_1px,transparent_1px)] bg-[size:40px_40px] opacity-70" />
            
            {/* Cyber Scanlines Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(2,6,23,0.25)_50%)] bg-[size:100%_4px]" />

            {/* Sweeping Laser Scan Line */}
            <motion.div 
              animate={{ y: ['-10%', '110%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_12px_rgba(6,182,212,0.8)] opacity-30"
            />

            {/* Depth Gradients for perfect text visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_15%,_#02050c_95%)]" />
            <div className="absolute inset-0 backdrop-blur-[0.5px]" />
          </div>

          {/* HUD Top Corner Indicators */}
          <div className="fixed top-6 right-6 z-50 flex items-center gap-4 text-cyan-500/60 text-[10px] font-black tracking-widest uppercase">
            <div className="flex items-center gap-2 px-3 py-1 border border-cyan-500/20 bg-cyan-950/20 backdrop-blur-md rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>SYSTEM: READY</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <Cpu size={12} />
              <span>CORE: ACTIVE</span>
            </div>
          </div>

          {/* Interactive EQ Waveform & Sound Button */}
          <div className="fixed bottom-6 left-6 z-50 flex items-center gap-4">
            {/* Waveform Equalizer (Only jumps when unmuted) */}
            <div className="flex items-end gap-1.5 h-6 px-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.span
                  key={i}
                  animate={!isMuted ? {
                    height: [
                      i * 3 + 'px', 
                      (i % 2 === 0 ? 20 : 12) + 'px', 
                      (i % 3 === 0 ? 8 : 24) + 'px', 
                      i * 3 + 'px'
                    ]
                  } : { height: '3px' }}
                  transition={{
                    duration: 0.6 + i * 0.15,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className={`w-[3px] rounded-full transition-all duration-300 ${!isMuted ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-slate-600'}`}
                />
              ))}
            </div>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="flex items-center justify-center w-12 h-12 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-white backdrop-blur-md hover:bg-cyan-500/20 hover:border-cyan-400 transition-all active:scale-90 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              title={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX size={18} className="text-slate-400" /> : <Volume2 size={18} className="text-cyan-400 animate-pulse" />}
            </button>
          </div>

          {/* Fast Skip Button */}
          <button
            onClick={handleLaunch}
            className="fixed top-6 left-6 z-50 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-500/20 bg-slate-950/40 text-slate-300 backdrop-blur-md text-xs font-black transition-all active:scale-95 hover:bg-white/10 hover:text-white"
          >
            تخطي العرض
          </button>

          {/* Futuristic 3D Parallax HUD Canvas Panel */}
          <motion.div
            style={{
              transform: `perspective(1000px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
              transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
            className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl px-4"
          >
            <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-cyan-500/20 bg-slate-950/80 p-6 sm:p-10 text-center backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.85)]">
              
              {/* Sci-Fi Decorative Corner Accents */}
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/60 rounded-tr-[2rem] pointer-events-none" />
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/60 rounded-tl-[2rem] pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/60 rounded-br-[2rem] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/60 rounded-bl-[2rem] pointer-events-none" />
              
              {/* Outer tech angle marks */}
              <div className="absolute top-4 right-10 text-cyan-500/30 text-[8px] font-black font-mono">TEL_MODE: 86B</div>
              <div className="absolute top-4 left-10 text-cyan-500/30 text-[8px] font-black font-mono">SYS_LATENCY: 0.1ms</div>

              {/* Simulated High-Tech System Loading Telemetry Terminal */}
              <div className="mb-6 mx-auto max-w-xs border border-cyan-500/10 bg-[#040c18] rounded-xl p-3 text-right font-mono text-[9px] text-cyan-400/80 shadow-inner">
                <div className="flex items-center gap-1.5 border-b border-cyan-500/10 pb-1.5 mb-1.5 text-[8px] text-cyan-500/60 font-black">
                  <Terminal size={10} />
                  <span>لوحة تشغيل النظام والربط التلقائي</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>{bootStep >= 1 ? 'OK' : 'PENDING...'}</span>
                    <span className="text-slate-400">&gt; تهيئة محرك التفاعل والـ HUD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{bootStep >= 2 ? 'OK' : 'PENDING...'}</span>
                    <span className="text-slate-400">&gt; فحص توازن التوربينات والمخزون</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{bootStep >= 3 ? 'OK' : 'PENDING...'}</span>
                    <span className="text-slate-400">&gt; ربط بروتوكول الإدارة السحابية</span>
                  </div>
                  <div className="flex justify-between text-cyan-300">
                    <span>{bootStep >= 4 ? 'ESTABLISHED' : 'READY TO FIRM...'}</span>
                    <span className="font-bold">&gt; محاكاة تشغيل محرك السيارات</span>
                  </div>
                </div>
              </div>

              {/* Brand Logo Container with interactive glow shadow */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                className="relative mx-auto mb-6 w-fit rounded-[2rem] bg-white/95 p-3.5 shadow-[0_20px_50px_rgba(6,182,212,0.3)] transition-transform duration-500 hover:scale-105"
              >
                <div className="absolute inset-0 rounded-[2rem] bg-cyan-400/20 blur-md animate-pulse pointer-events-none" />
                <img
                  src="/brand-logo.png"
                  alt="ELFAROUK"
                  className="relative h-16 w-auto object-contain sm:h-20"
                />
              </motion.div>

              {/* Headers Section */}
              <div className="space-y-2 mb-8">
                <h1 className="font-display text-2xl font-black tracking-wide text-white sm:text-4xl leading-tight">
                  <span className="text-gradient bg-gradient-to-l from-white via-cyan-100 to-cyan-300">الفاروق لخدمات السيارات</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-400/90 md:text-xs">
                  SMART INTEGRATED ENGINE PLATFORM
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-2 font-medium">
                  نظام الإدارة الشامل والخدمات التفاعلية وحجز صيانة المركبات بأعلى مستويات الاحترافية والذكاء.
                </p>
              </div>

              {/* Engine Ignition Start Button (Ultimate HUD Trigger) */}
              <div className="flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="relative flex items-center justify-center w-36 h-36"
                >
                  {/* Rotating Dashed outer Ring */}
                  <motion.svg
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-full h-full text-cyan-500/20 hover:text-cyan-400/40 transition-colors"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeDasharray="8 6"
                      fill="none"
                    />
                  </motion.svg>

                  {/* Pulsing Neon Glow Ring */}
                  <motion.div
                    animate={isHovered ? {
                      scale: [1, 1.08, 1],
                      borderColor: ['rgba(6,182,212,0.4)', 'rgba(234,179,8,0.7)', 'rgba(6,182,212,0.4)'],
                      boxShadow: [
                        '0 0 15px rgba(6,182,212,0.3)',
                        '0 0 35px rgba(234,179,8,0.6)',
                        '0 0 15px rgba(6,182,212,0.3)'
                      ]
                    } : {
                      scale: [1, 1.03, 1],
                      borderColor: ['rgba(6,182,212,0.2)', 'rgba(6,182,212,0.4)', 'rgba(6,182,212,0.2)'],
                      boxShadow: [
                        '0 0 10px rgba(6,182,212,0.2)',
                        '0 0 20px rgba(6,182,212,0.3)',
                        '0 0 10px rgba(6,182,212,0.2)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute w-[114px] h-[114px] rounded-full border-2 transition-all duration-300"
                  />

                  {/* Ultimate Start Engine Core Ignition button */}
                  <button
                    onClick={handleLaunch}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="group relative z-10 w-[96px] h-[96px] rounded-full bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/40 text-white flex flex-col items-center justify-center gap-1 shadow-2xl transition-all duration-300 active:scale-90"
                  >
                    {/* Inner glowing hover layer */}
                    <div className="absolute inset-0.5 rounded-full bg-cyan-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Radial ignition line */}
                    <div className="absolute top-2 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping group-hover:bg-yellow-400" />

                    <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 group-hover:text-yellow-400 transition-colors">
                      START
                    </span>
                    <span className="text-[12px] font-black text-white group-hover:text-cyan-300 transition-colors">
                      تشغيل
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                      ENGINE
                    </span>
                  </button>
                </motion.div>
              </div>

            </div>
          </motion.div>

          {/* Footer copyright */}
          <div className="absolute bottom-6 text-[8px] font-black uppercase tracking-[0.35em] text-cyan-500/40">
            AUTO-ALIGNED CYBER HUD EXPERIENCE • © {new Date().getFullYear()} ELFAROUK GROUP
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
