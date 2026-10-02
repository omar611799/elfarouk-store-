import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, AlertTriangle, Search, Filter, Download, 
  Trash2, Edit3, DollarSign, Package, UserCheck, RefreshCw,
  Clock, ShieldAlert, ArrowRight, Eye, ChevronDown, CheckCircle2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuditLogs() {
  const { auditLogs = [], products = [] } = useStore()
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState(null)

  // Unique users who performed actions
  const uniqueUsers = useMemo(() => {
    const map = new Map()
    auditLogs.forEach(log => {
      const uid = log.actorUid || 'unknown'
      const name = log.actorName || 'غير معروف'
      if (!map.has(uid)) map.set(uid, name)
    })
    return Array.from(map.entries()).map(([uid, name]) => ({ uid, name }))
  }, [auditLogs])

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchSearch = !search || 
        (log.details && log.details.toLowerCase().includes(search.toLowerCase())) ||
        (log.actorName && log.actorName.toLowerCase().includes(search.toLowerCase())) ||
        (log.targetId && String(log.targetId).toLowerCase().includes(search.toLowerCase()))

      const matchAction = actionFilter === 'all' || log.action === actionFilter
      const matchSeverity = severityFilter === 'all' || log.severity === severityFilter
      const matchUser = userFilter === 'all' || log.actorUid === userFilter

      return matchSearch && matchAction && matchSeverity && matchUser
    })
  }, [auditLogs, search, actionFilter, severityFilter, userFilter])

  // Statistics
  const stats = useMemo(() => {
    const danger = auditLogs.filter(l => l.severity === 'danger').length
    const warning = auditLogs.filter(l => l.severity === 'warning').length
    const priceChanges = auditLogs.filter(l => l.action?.includes('price') || l.action?.includes('cost')).length
    const deletions = auditLogs.filter(l => l.action?.includes('delete')).length
    return { danger, warning, priceChanges, deletions, total: auditLogs.length }
  }, [auditLogs])

  const exportAuditToExcel = async () => {
    if (filteredLogs.length === 0) return toast.error('لا توجد سجلات لتصديرها')
    const toastId = toast.loading('جاري تجهيز وتصدير سجل الأمان...')
    try {
      const XLSX = await import('xlsx')
      const rows = filteredLogs.map(l => {
        const dateObj = l.createdAt?.toDate?.() || (l.createdAt ? new Date(l.createdAt) : new Date())
        return {
          'التاريخ والوقت': dateObj.toLocaleString('ar-EG'),
          'الموظف / المسؤول': l.actorName || 'النظام',
          'نوع العملية': getActionLabel(l.action),
          'درجة الأهمية': l.severity === 'danger' ? 'حرجة / عالية' : l.severity === 'warning' ? 'تنبيه' : 'معلومات',
          'تفاصيل العملية': l.details || '',
          'معرف الهدف': l.targetId || '',
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل الرقابة والأمان')
      XLSX.writeFile(workbook, سجل_تدقيق_العمليات_.xlsx)
      toast.success('تم التصدير بنجاح!', { id: toastId })
    } catch {
      toast.error('حدث خطأ أثناء تصدير الملف!', { id: toastId })
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className=space-y-6 pb-28>
      {/* ── Page Header ── */}
      <div className=flex flex-col sm:flex-row sm:items-center justify-between gap-4>
        <div>
          <h1 className=text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3>
            <div className=w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center>
              <ShieldAlert size={20} className=text-rose-600 dark:text-rose-400 />
            </div>
            سجل تدقيق العمليات ومراقبة الكاشير
          </h1>
          <p className=text-slate-500 dark:text-slate-400 text-xs mt-1>
            متابعة فورية وموثقة لتعديلات الأسعار، حذف الفواتير، مرتجعات النقدية، وتعديلات المخزون
          </p>
        </div>

        <button
          onClick={exportAuditToExcel}
          className=inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm transition-all
        >
          <Download size={16} /> تصدير السجل إلى Excel
        </button>
      </div>

      {/* ── Metric Cards ── */}
      <div className=grid grid-cols-2 lg:grid-cols-4 gap-3.5>
        <div className=bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm>
          <div className=flex items-center justify-between>
            <span className=text-[11px] font-black text-slate-500 dark:text-slate-400>إجمالي العمليات المسجلة</span>
            <span className=p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300><ShieldCheck size={16} /></span>
          </div>
          <p className=text-2xl font-black text-slate-800 dark:text-slate-100 mt-2>{stats.total}</p>
          <span className=text-[10px] text-slate-400 font-bold>كل الحركات الموثقة</span>
        </div>

        <div className=bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 shadow-sm bg-rose-50/20 dark:bg-rose-950/10>
          <div className=flex items-center justify-between>
            <span className=text-[11px] font-black text-rose-700 dark:text-rose-400>عمليات حساسة / حرجة</span>
            <span className=p-2 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-rose-600><AlertTriangle size={16} /></span>
          </div>
          <p className=text-2xl font-black text-rose-600 dark:text-rose-400 mt-2>{stats.danger}</p>
          <span className=text-[10px] text-rose-500 font-bold>حذف فواتير وتصفير مديونيات</span>
        </div>

        <div className=bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 shadow-sm bg-amber-50/20 dark:bg-amber-950/10>
          <div className=flex items-center justify-between>
            <span className=text-[11px] font-black text-amber-700 dark:text-amber-400>تعديلات الأسعار</span>
            <span className=p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600><DollarSign size={16} /></span>
          </div>
          <p className=text-2xl font-black text-amber-600 dark:text-amber-400 mt-2>{stats.priceChanges}</p>
          <span className=text-[10px] text-amber-500 font-bold>تغيير سعر بيع أو تكلفة</span>
        </div>

        <div className=bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl p-4 shadow-sm bg-indigo-50/20 dark:bg-indigo-950/10>
          <div className=flex items-center justify-between>
            <span className=text-[11px] font-black text-indigo-700 dark:text-indigo-400>عمليات الحذف</span>
            <span className=p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600><Trash2 size={16} /></span>
          </div>
          <p className=text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2>{stats.deletions}</p>
          <span className=text-[10px] text-indigo-500 font-bold>حذف منتجات أو فواتير</span>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div className=bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3>
        <div className=grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3>
          {/* Search */}
          <div className=relative>
            <Search size={15} className=absolute right-3.5 top-3 text-slate-400 />
            <input
              type=text
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder=بحث في تفاصيل العملية أو الموظف...
              className=w-full pr-10 pl-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className=w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500
          >
            <option value=all>جميع أنواع العمليات</option>
            <option value=product_price_changed>تعديل أسعار المنتجات</option>
            <option value=product_deleted>حذف منتجات من المخزن</option>
            <option value=stock_override>تعديل المخزون اليدوي</option>
            <option value=invoice_deleted>حذف فواتير مبيعات</option>
            <option value=invoice_returned>مرتجعات مبيعات ورد نقدية</option>
            <option value=customer_debt_cleared>سداد وتسوية مديونيات</option>
            <option value=bulk_excel_imported>استيراد وتحديث إكسيل جماعي</option>
          </select>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className=w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500
          >
            <option value=all>جميع مستويات الخطورة</option>
            <option value=danger>حرجة / عالية الأهمية 🔴</option>
            <option value=warning>تنبيهات متوسطة 🟡</option>
            <option value=info>إجراءات عادية 🔵</option>
          </select>

          {/* User Filter */}
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className=w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500
          >
            <option value=all>جميع الموظفين والكاشيرات</option>
            {uniqueUsers.map(u => (
              <option key={u.uid} value={u.uid}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table of Audit Logs ── */}
      <div className=bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm>
        <div className=overflow-x-auto>
          <table className=w-full text-right text-xs>
            <thead className=bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-black>
              <tr>
                <th className=p-3.5>التاريخ والوقت</th>
                <th className=p-3.5>الموظف المسؤول</th>
                <th className=p-3.5>نوع العملية</th>
                <th className=p-3.5>التفاصيل والتغييرات</th>
                <th className=p-3.5 text-center>الخطورة</th>
                <th className=p-3.5 text-center>معاينة</th>
              </tr>
            </thead>
            <tbody className=divide-y divide-slate-100 dark:divide-slate-800/60>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className=p-8 text-center text-slate-400 font-bold>
                    لا توجد سجلات تدقيق مطابقة للشروط الحالية
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const dateObj = log.createdAt?.toDate?.() || (log.createdAt ? new Date(log.createdAt) : new Date())
                  const severityBadge = getSeverityBadge(log.severity)
                  const actionIcon = getActionIcon(log.action)

                  return (
                    <tr key={log.id} className=hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors>
                      <td className=p-3.5 font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap>
                        <div className=flex items-center gap-1.5>
                          <Clock size={13} className=text-slate-400 />
                          <span>{dateObj.toLocaleDateString('ar-EG')}</span>
                          <span className=text-[10px] text-slate-400 font-normal>{dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      <td className=p-3.5 font-black text-slate-800 dark:text-slate-100 whitespace-nowrap>
                        <div className=flex items-center gap-2>
                          <div className=w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-300>
                            {log.actorName ? log.actorName.slice(0, 1) : 'ك'}
                          </div>
                          <span>{log.actorName || 'النظام'}</span>
                        </div>
                      </td>

                      <td className=p-3.5 whitespace-nowrap>
                        <div className=inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[11px]>
                          {actionIcon}
                          <span>{getActionLabel(log.action)}</span>
                        </div>
                      </td>

                      <td className=p-3.5 font-medium text-slate-700 dark:text-slate-200 max-w-md>
                        <p className=line-clamp-2>{log.details}</p>
                        {renderQuickDiff(log)}
                      </td>

                      <td className=p-3.5 text-center whitespace-nowrap>
                        <span className={inline-block px-2 py-0.5 rounded-full text-[10px] font-black }>
                          {severityBadge.label}
                        </span>
                      </td>

                      <td className=p-3.5 text-center whitespace-nowrap>
                        {(log.oldData || log.newData) ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className=p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors
                            title=عرض المقارنة الكاملة
                          >
                            <Eye size={15} />
                          </button>
                        ) : (
                          <span className=text-slate-300 dark:text-slate-700 text-xs>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail & Diff Modal ── */}
      <AnimatePresence>
        {selectedLog && (
          <div className=fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className=bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl
            >
              <div className=p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50>
                <div className=flex items-center gap-2.5>
                  <ShieldCheck size={20} className=text-primary-600 dark:text-primary-400 />
                  <h3 className=font-black text-slate-800 dark:text-slate-100 text-sm>
                    تفاصيل العملية ومقارنة البيانات (Audit Diff)
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className=p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500
                >
                  ✕
                </button>
              </div>

              <div className=p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs>
                <div className=grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl>
                  <div>
                    <span className=text-slate-400 block mb-1>الموظف المنفذ:</span>
                    <span className=font-black text-slate-800 dark:text-slate-100>{selectedLog.actorName || 'النظام'}</span>
                  </div>
                  <div>
                    <span className=text-slate-400 block mb-1>نوع العملية:</span>
                    <span className=font-black text-slate-800 dark:text-slate-100>{getActionLabel(selectedLog.action)}</span>
                  </div>
                  <div className=col-span-2>
                    <span className=text-slate-400 block mb-1>البيان:</span>
                    <span className=font-bold text-slate-700 dark:text-slate-200>{selectedLog.details}</span>
                  </div>
                </div>

                {/* Diff Viewer */}
                <div className=grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2>
                  <div className=border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 bg-rose-50/20 dark:bg-rose-950/10>
                    <h4 className=font-black text-rose-700 dark:text-rose-400 text-xs mb-2.5 flex items-center gap-1.5>
                      <span className=w-2 h-2 rounded-full bg-rose-500 /> البيانات السابقة (قبل التعديل)
                    </h4>
                    <pre className=text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto>
                      {selectedLog.oldData ? JSON.stringify(selectedLog.oldData, null, 2) : 'لا توجد بيانات سابقة'}
                    </pre>
                  </div>

                  <div className=border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 bg-emerald-50/20 dark:bg-emerald-950/10>
                    <h4 className=font-black text-emerald-700 dark:text-emerald-400 text-xs mb-2.5 flex items-center gap-1.5>
                      <span className=w-2 h-2 rounded-full bg-emerald-500 /> البيانات الجديدة (بعد التعديل)
                    </h4>
                    <pre className=text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto>
                      {selectedLog.newData ? JSON.stringify(selectedLog.newData, null, 2) : 'لا توجد بيانات جديدة'}
                    </pre>
                  </div>
                </div>
              </div>

              <div className=p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end>
                <button
                  onClick={() => setSelectedLog(null)}
                  className=px-5 py-2 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-black text-xs
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function getActionLabel(action) {
  switch (action) {
    case 'product_price_changed': return 'تعديل سعر / تكلفة'
    case 'product_deleted': return 'حذف صنف من المخزن'
    case 'product_added': return 'إضافة صنف جديد'
    case 'stock_override': return 'تعديل مخزون يدوي'
    case 'invoice_deleted': return 'حذف فاتورة مبيعات'
    case 'invoice_returned': return 'مرتجع مبيعات واسترداد'
    case 'customer_debt_cleared': return 'سداد مديونية عميل'
    case 'bulk_excel_imported': return 'استيراد إكسيل جماعي'
    default: return action || 'عملية غير محددة'
  }
}

function getActionIcon(action) {
  switch (action) {
    case 'product_price_changed': return <DollarSign size={13} className=text-amber-500 />
    case 'product_deleted':
    case 'invoice_deleted': return <Trash2 size={13} className=text-rose-500 />
    case 'invoice_returned': return <RefreshCw size={13} className=text-cyan-500 />
    case 'stock_override': return <Package size={13} className=text-purple-500 />
    case 'bulk_excel_imported': return <Download size={13} className=text-emerald-500 />
    default: return <Edit3 size={13} className=text-slate-400 />
  }
}

function getSeverityBadge(severity) {
  switch (severity) {
    case 'danger':
      return { label: 'حرجة 🔴', className: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' }
    case 'warning':
      return { label: 'تنبيه 🟡', className: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' }
    default:
      return { label: 'عادي 🔵', className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' }
  }
}

function renderQuickDiff(log) {
  if (log.oldData && log.newData) {
    if (log.oldData.price !== undefined && log.newData.price !== undefined) {
      return (
        <div className=mt-1 flex items-center gap-2 text-[10px] font-black>
          <span className=text-rose-600 line-through>{log.oldData.price} ج.م</span>
          <ArrowRight size={10} className=text-slate-400 />
          <span className=text-emerald-600>{log.newData.price} ج.م</span>
        </div>
      )
    }
  }
  return null
}
