import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, Wrench, Clock, User, Car } from 'lucide-react'

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]
const DAYS_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']

export default function ServiceCalendar() {
  const { serviceBookings = [] } = useStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDayStr, setSelectedDayStr] = useState(null)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Calculate calendar days
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    const cells = []

    // Padding for previous month
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ isPadding: true, day: null })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({ isPadding: false, day, dateStr })
    }

    return cells
  }, [currentYear, currentMonth])

  // Bookings grouped by date string (YYYY-MM-DD)
  const bookingsByDate = useMemo(() => {
    const map = {}
    serviceBookings.forEach(booking => {
      if (booking.day) {
        if (!map[booking.day]) {
          map[booking.day] = []
        }
        map[booking.day].push(booking)
      }
    })
    return map
  }, [serviceBookings])

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
    setSelectedDayStr(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
    setSelectedDayStr(null)
  }

  // Selected date bookings
  const selectedDayBookings = useMemo(() => {
    if (!selectedDayStr) return []
    return bookingsByDate[selectedDayStr] || []
  }, [selectedDayStr, bookingsByDate])

  const getStatusStyle = (status) => {
    switch (status) {
      case 'new':
        return { dot: 'bg-blue-500', bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400', label: 'جديد' }
      case 'confirmed':
        return { dot: 'bg-amber-500', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', label: 'مؤكد' }
      case 'completed':
        return { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', label: 'مكتمل' }
      case 'cancelled':
        return { dot: 'bg-rose-500', bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400', label: 'ملغي' }
      default:
        return { dot: 'bg-slate-400', bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400', label: 'تحت المراجعة' }
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight font-display flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <CalendarIcon size={20} className="text-indigo-400" />
            </div>
            تقويم حجوزات الصيانة
          </h1>
          <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">
            جدولة مواعيد السيارات والتحقق من الأماكن الشاغرة والحجوزات اليومية
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid card */}
        <div className="card lg:col-span-2 !p-5 space-y-4">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white font-display">
              {MONTHS_AR[currentMonth]} {currentYear}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="btn-ghost !p-2 rounded-xl">
                <ChevronRight size={18} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="btn-ghost !px-3 !py-1 text-[10px] font-black uppercase tracking-wider">
                اليوم
              </button>
              <button onClick={nextMonth} className="btn-ghost !p-2 rounded-xl">
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>

          {/* Days Grid */}
          <div className="space-y-2">
            {/* Week labels */}
            <div className="grid grid-cols-7 gap-2 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest pb-1 border-b border-white/5">
              {DAYS_AR.map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((cell, idx) => {
                if (cell.isPadding) {
                  return <div key={`pad-${idx}`} className="aspect-square opacity-0 pointer-events-none" />
                }

                const dayBookings = bookingsByDate[cell.dateStr] || []
                const isSelected = selectedDayStr === cell.dateStr
                const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, cell.day).toDateString()

                return (
                  <button
                    key={cell.dateStr}
                    onClick={() => setSelectedDayStr(cell.dateStr)}
                    className={`aspect-square rounded-2xl border p-2 flex flex-col justify-between items-start transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/[0.04] shadow-[0_8px_20px_rgba(99,102,241,0.06)]'
                        : isToday
                        ? 'border-white/20 bg-white/5'
                        : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className={`text-xs font-black px-1.5 py-0.5 rounded-lg ${
                      isToday ? 'bg-indigo-500 text-white font-display' : 'text-slate-400'
                    }`}>
                      {cell.day}
                    </span>

                    {/* Booking indicator dots */}
                    {dayBookings.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 w-full justify-end">
                        {dayBookings.slice(0, 3).map((b, bIdx) => {
                          const style = getStatusStyle(b.status)
                          return (
                            <span
                              key={`${b.id}-${bIdx}`}
                              className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                              title={`${b.name} - ${style.label}`}
                            />
                          )
                        })}
                        {dayBookings.length > 3 && (
                          <span className="text-[8px] font-black text-indigo-400 leading-none">
                            +{dayBookings.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bookings Drawer/Detail Card */}
        <div className="card lg:col-span-1 !p-5 flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="border-b border-white/5 pb-4 mb-4">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Wrench size={18} className="text-indigo-400" />
                حجوزات اليوم المحدد
              </h3>
              <p className="text-[10px] text-slate-500 font-bold mt-1">
                {selectedDayStr ? (
                  new Date(selectedDayStr).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                ) : (
                  'يرجى تحديد يوم من التقويم لعرض الحجوزات.'
                )}
              </p>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[350px] custom-scrollbar pr-1">
              {!selectedDayStr ? (
                <div className="text-center py-16 opacity-30">
                  <CalendarIcon size={40} className="text-slate-500 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400">لم يتم اختيار موعد</p>
                </div>
              ) : selectedDayBookings.length === 0 ? (
                <div className="text-center py-16 opacity-30">
                  <Clock size={40} className="text-slate-500 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400">لا توجد حجوزات صيانة في هذا اليوم</p>
                </div>
              ) : (
                selectedDayBookings.map(booking => {
                  const style = getStatusStyle(booking.status)
                  return (
                    <div key={booking.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 hover:border-white/10 transition-all">
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${style.bg}`}>
                          {style.label}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 font-display">
                          {booking.slot}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-300 font-black text-xs">
                          <User size={12} className="text-slate-500" />
                          <span>{booking.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                          <Clock size={12} className="text-slate-500" />
                          <span>{booking.phone}</span>
                        </div>
                        {booking.carModel && (
                          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                            <Car size={12} className="text-slate-500" />
                            <span>{booking.carModel}</span>
                          </div>
                        )}
                      </div>

                      {booking.notes && (
                        <p className="text-[10px] text-slate-500 italic border-t border-white/5 pt-1.5 mt-1.5">
                          ملاحظة: {booking.notes}
                        </p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-4 text-[10px] text-slate-500 font-bold space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>جديد: لم تتم المراجعة وتأكيد الموعد</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>مؤكد: تمت مراجعة التحويل/الموعد وجاهز للاستقبال</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>مكتمل: تم استكمال الصيانة وتسليم السيارة</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
