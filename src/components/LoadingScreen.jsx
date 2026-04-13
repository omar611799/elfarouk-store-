import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <motion.div
      key="loading-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 overflow-hidden"
    >
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="w-full h-full object-cover opacity-80"
          src="/loading-motor.mp4"
        />
        {/* Cinematic Dark Overlay */}
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[3px]" />
        
        {/* Radial Lighting overlay to focus on the center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0)_0%,_rgba(11,15,25,0.9)_100%)] pointer-events-none" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 100 }}
          className="flex flex-col items-center text-center"
        >
          <div className="relative">
            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-primary-300 tracking-[0.25em] uppercase overflow-hidden drop-shadow-2xl">
              ELFAROUK
              <motion.div
                initial={{ left: '-100%' }}
                animate={{ left: '100%' }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
              />
            </h1>
            <div className="absolute -inset-4 bg-primary-500/20 blur-3xl -z-10 rounded-full" />
          </div>
          
          <p className="text-primary-400 font-bold tracking-[0.3em] mt-4 md:mt-6 text-sm md:text-lg uppercase drop-shadow-lg">
            Auto Spare Parts
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex items-center justify-center gap-3 w-48"
        >
          <motion.div animate={{ width: ["0%", "100%", "0%"], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="h-0.5 max-w-[60%] w-full bg-gradient-to-r from-transparent via-primary-500 to-transparent shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
        </motion.div>
      </div>
    </motion.div>
  )
}
