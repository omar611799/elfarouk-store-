import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  X,
  Send,
  Car,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown,
  RefreshCw,
  Mic,
  MicOff,
  Search,
  ExternalLink,
} from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import toast from 'react-hot-toast'

const POPULAR_VEHICLES = [
  { make: 'تويوتا', model: 'كورولا', year: 2018 },
  { make: 'هيونداي', model: 'إلنترا', year: 2017 },
  { make: 'كيا', model: 'سيراتو', year: 2016 },
  { make: 'نيسان', model: 'صني', year: 2019 },
  { make: 'شيفروليه', model: 'أوبترا', year: 2015 },
  { make: 'ميتسوبيشي', model: 'لانسر شارك', year: 2016 },
  { make: 'فيات', model: 'تيبو', year: 2020 },
]

const QUICK_PROMPTS = [
  'عايز تيل فرامل أمامي',
  'فلتر زيت وفلتر هواء',
  'مساعدين أمامي وخلفي',
  'طقم بوجيهات إيريديوم',
  'سير كاتينة وطلمبة مياه',
]

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'أهلاً بك! أنا مساعد قطع الغيار الذكي 🚗✨\nاختر سيارتك أو اكتب مباشرة اسم القطعة التي تبحث عنها وسأتحقق من التوافق والمخزون فوراً.',
      products: [],
      suggestions: ['تيل فرامل كورولا 2018', 'فلتر زيت هيونداي النترا', 'مساعدين كيا سيراتو'],
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showVehiclePicker, setShowVehiclePicker] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  const { dispatch } = useStore()

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Speech Recognition (Voice Input)
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('خاصية الإدخال الصوتي غير مدعومة في متصفحك')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'ar-EG'
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsListening(true)
        toast('جاري الاستماع إليك...', { icon: '🎙️' })
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
        toast.error('لم يتم التعرف على الصوت')
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  const handleSend = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText : input
    if (!textToSend.trim() && !selectedVehicle) return

    const userMsg = {
      sender: 'user',
      text: textToSend || `البحث لسيارة ${selectedVehicle.make} ${selectedVehicle.model} ${selectedVehicle.year}`,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai-customer-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          vehicle: selectedVehicle,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل الاتصال بمساعد الذكاء الاصطناعي')
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.replyText,
          products: data.products || [],
          complementary: data.complementary || [],
          suggestions: data.suggestions || [],
          vehicleIdentified: data.vehicleIdentified,
        },
      ])
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'عذراً، حدث خطأ مؤقت أثناء الاتصال. يرجى المحاولة مرة أخرى.',
          products: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    dispatch({ type: 'CART_ADD', item: product })
    toast.success(`تمت إضافة ${product.name} إلى السلة!`)
  }

  return (
    <>
      {/* Floating Action Trigger Button */}
      <motion.button
        id="ai-assistant-trigger"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 p-3.5 px-5 text-white shadow-2xl shadow-blue-500/40 backdrop-blur-md transition-all border border-cyan-300/30"
      >
        <div className="relative">
          <Sparkles className="h-5 w-5 animate-pulse text-yellow-300" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>
        <span className="font-bold text-sm">مساعد قطع الغيار الذكي</span>
      </motion.button>

      {/* AI Assistant Modal Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-6 z-50 flex h-[620px] max-h-[85vh] w-[92vw] max-w-[440px] flex-col overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/95 shadow-2xl backdrop-blur-xl text-slate-100 dark:border-slate-700"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950/80 to-slate-900 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    ELFAROUK AI Assistant
                    <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                      Live ERP
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    مساعد قطع الغيار والتوافق الفوري
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowVehiclePicker(!showVehiclePicker)}
                  className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all ${
                    selectedVehicle
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="تحديد السيارة"
                >
                  <Car className="h-3.5 w-3.5" />
                  <span>
                    {selectedVehicle
                      ? `${selectedVehicle.model} ${selectedVehicle.year}`
                      : 'حدد سيارتك'}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Vehicle Quick Selector Dropdown */}
              <AnimatePresence>
                {showVehiclePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 z-20 border-b border-slate-800 bg-slate-900/98 p-3 shadow-xl backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-300">
                        اختر سيارتك لتصفية القطع المتوافقة:
                      </span>
                      {selectedVehicle && (
                        <button
                          onClick={() => {
                            setSelectedVehicle(null)
                            setShowVehiclePicker(false)
                          }}
                          className="text-[11px] text-red-400 hover:underline"
                        >
                          إلغاء التحديد
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {POPULAR_VEHICLES.map((v, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedVehicle(v)
                            setShowVehiclePicker(false)
                            toast.success(`تم اختيار ${v.make} ${v.model} ${v.year}`)
                          }}
                          className={`flex items-center gap-1.5 rounded-lg p-2 text-right text-xs transition-colors ${
                            selectedVehicle?.model === v.model &&
                            selectedVehicle?.year === v.year
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <Car className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          <span className="truncate">
                            {v.make} {v.model} ({v.year})
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* Matching Products Cards */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 w-full space-y-2">
                      <div className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        القطع المتوافقة المتاحة بالمخزن:
                      </div>

                      <div className="space-y-2">
                        {msg.products.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-700/60 bg-slate-800/60 p-2.5 hover:border-cyan-500/50 transition-all hover:bg-slate-800"
                          >
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Layers className="h-6 w-6 text-slate-500" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 text-right">
                              <h4 className="text-xs font-bold text-white truncate">
                                {p.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                                <span className="font-semibold text-emerald-400">
                                  {Number(p.price || 0).toLocaleString('ar-EG')} ج.م
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.2 ${
                                    (p.quantity || 0) > 0
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-red-500/20 text-red-300'
                                  }`}
                                >
                                  {(p.quantity || 0) > 0
                                    ? `متوفر (${p.quantity})`
                                    : 'نفد المخزون'}
                                </span>
                              </div>
                            </div>

                            <button
                              disabled={(p.quantity || 0) <= 0}
                              onClick={() => addToCart(p)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-95 shadow-md shadow-cyan-600/30"
                              title="إضافة للسلة"
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Complementary Recommendations */}
                  {msg.complementary && msg.complementary.length > 0 && (
                    <div className="mt-2.5 w-full rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-2.5">
                      <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1 mb-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        قطع يوصى بتغييرها معاً:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.complementary.map((comp) => (
                          <button
                            key={comp.id}
                            onClick={() => handleSend(comp.name)}
                            className="flex items-center gap-1 rounded-lg bg-slate-800/90 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
                          >
                            <span>{comp.name}</span>
                            <span className="text-cyan-400 font-bold">
                              ({Number(comp.price).toLocaleString('ar-EG')} ج.م)
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(sug)}
                          className="rounded-full border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-[10px] text-slate-300 hover:border-cyan-500 hover:bg-cyan-950/40 hover:text-cyan-300 transition-all"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-cyan-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>جاري فحص التوافق والمخزون في الـ ERP...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 scrollbar-none">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="whitespace-nowrap rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <div className="border-t border-slate-800 bg-slate-900/90 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      selectedVehicle
                        ? `ابحث لـ ${selectedVehicle.model} ${selectedVehicle.year}...`
                        : 'اكتب اسم القطعة أو نوع سيارتك...'
                    }
                    className="w-full rounded-2xl border border-slate-700 bg-slate-800/90 py-2.5 pr-3 pl-10 text-xs text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={`absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors ${
                      isListening ? 'text-red-400 animate-pulse' : ''
                    }`}
                    title="إدخال صوتي"
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || (!input.trim() && !selectedVehicle)}
                  className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
                >
                  <Send className="h-4 w-4 rotate-180" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
