import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion } from 'framer-motion'
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

  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDayIndex; i++) cells.push({ isPadding: true, day: null })
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({ isPadding: false, day, dateStr })
    }
    return cells
  }, [currentYear, currentMonth])

  const bookingsByDate = useMemo(() => {
    const map = {}
    serviceBookings.forEach(booking => {
      if (booking.day) {
        if (!map[booking.day]) map[booking.day] = []
        map[booking.day].push(booking)
      }
    })
    return map
  }, [serviceBookings])

  const prevMonth = () => { setCurrentDate(new Date(currentYear, currentMonth - 1, 1)); setSelectedDayStr(null) }
  const nextMonth = () => { setCurrentDate(new Date(currentYear, currentMonth + 1, 1)); setSelectedDayStr(null) }

  const selectedDayBookings = useMemo(() => {
    if (!selectedDayStr) return []
    return bookingsByDate[selectedDayStr] || []
  }, [selectedDayStr, bookingsByDate])

  const getStatusStyle = (status) => {
    switch (status) {
      case 'new': return { dot: 'bg-blue-500', badge: 'bg-blue-50 border-blue-200 text-blue-700', label: 'جديد' }
      case 'confirmed': return { dot: 'bg-amber-500', badge: 'bg-amber-50 border-amber-200 text-amber-700', label: 'مؤكد' }
      case 'completed': return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'مكتمل' }
      case 'cancelled': return { dot: 'bg-rose-500', badge: 'bg-rose-50 border-rose-200 text-rose-700', label: 'ملغي' }
      default: return { dot: 'bg-slate-400', badge: 'bg-slate-50 border-slate-200 text-slate-600', label: 'تحت المراجعة' }
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <CalendarIcon size={20} className="text-indigo-600" />
          </div>
          تقويم حجوزات الصيانة
        </h1>
        <p className="text-slate-500 text-xs mt-1">جدولة مواعيد السيارات والتحقق من الأماكن الشاغرة</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl lg:col-span-2 p-5 space-y-4 shadow-sm">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800">{MONTHS_AR[currentMonth]} {currentYear}</h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                <ChevronRight size={17} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors">
                اليوم
              </button>
              <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                <ChevronLeft size={17} />
              </button>
            </div>
          </div>

          {/* Days Grid */}
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1.5 text-center text-slate-400 text-[10px] font-bold uppercase tracking-wider pb-2 border-b border-slate-100">
              {DAYS_AR.map(d => <div key={d} className="py-1">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, idx) => {
                if (cell.isPadding) return <div key={`pad-${idx}`} className="aspect-square opacity-0 pointer-events-none" />

                const dayBookings = bookingsByDate[cell.dateStr] || []
                const isSelected = selectedDayStr === cell.dateStr
                const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, cell.day).toDateString()

                return (
                  <button
                    key={cell.dateStr}
                    onClick={() => setSelectedDayStr(cell.dateStr)}
                    className={`aspect-square rounded-xl border p-1.5 flex flex-col justify-between items-start transition-all ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                        : isToday
                        ? 'border-indigo-200 bg-indigo-50/50'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-xs font-black px-1 py-0.5 rounded-lg ${
                      isToday ? 'bg-indigo-500 text-white' : isSelected ? 'text-indigo-700' : 'text-slate-600'
                    }`}>
                      {cell.day}
                    </span>

                    {dayBookings.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 w-full justify-end">
                        {dayBookings.slice(0, 3).map((b, bIdx) => {
                          const style = getStatusStyle(b.status)
                          return <span key={`${b.id}-${bIdx}`} className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        })}
                        {dayBookings.length > 3 && (
                          <span className="text-[7px] font-black text-indigo-600 leading-none">+{dayBookings.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bookings Detail */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col min-h-[400px] shadow-sm">
          <div>
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <Wrench size={16} className="text-indigo-500" />
                حجوزات اليوم المحدد
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                {selectedDayStr
                  ? new Date(selectedDayStr).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : 'يرجى تحديد يوم من التقويم'
                }
              </p>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
              {!selectedDayStr ? (
                <div className="text-center py-12 opacity-40">
                  <CalendarIcon size={36} className="text-slate-400 mx-auto mb-3" />
                  <p className="text-xs font-medium text-slate-500">لم يتم اختيار موعد</p>
                </div>
              ) : selectedDayBookings.length === 0 ? (
                <div className="text-center py-12 opacity-40">
                  <Clock size={36} className="text-slate-400 mx-auto mb-3" />
                  <p className="text-xs font-medium text-slate-500">لا توجد حجوزات في هذا اليوم</p>
                </div>
              ) : (
                selectedDayBookings.map(booking => {
                  const style = getStatusStyle(booking.status)
                  return (
                    <div key={booking.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition-all">
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${style.badge}`}>
                          {style.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">{booking.slot}</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                          <User size={11} className="text-slate-400" /><span>{booking.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-medium">
                          <Clock size={11} className="text-slate-400" /><span>{booking.phone}</span>
                        </div>
                        {booking.carModel && (
                          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-medium">
                            <Car size={11} className="text-slate-400" /><span>{booking.carModel}</span>
                          </div>
                        )}
                      </div>

                      {booking.notes && (
                        <p className="text-[10px] text-slate-400 italic border-t border-slate-100 pt-1.5 mt-1.5">
                          ملاحظة: {booking.notes}
                        </p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-auto text-[10px] text-slate-400 font-medium space-y-1.5">
            {[
              { dot: 'bg-blue-500', label: 'جديد: لم تتم المراجعة وتأكيد الموعد' },
              { dot: 'bg-amber-500', label: 'مؤكد: جاهز للاستقبال' },
              { dot: 'bg-emerald-500', label: 'مكتمل: تم تسليم السيارة' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full shrink-0 ${item.dot}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
