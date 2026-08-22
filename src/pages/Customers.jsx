import { useState, useMemo, useCallback } from 'react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { 
  Plus, Edit2, Trash2, Users, Phone, Car, History, Wrench, Calendar, Search, 
  X, ShieldCheck, CheckCircle2, Clock3, Mail, PauseCircle, XCircle, Wallet,
  Sparkles, UploadCloud, Camera
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CUSTOMER_ACCOUNT_STATUSES, getCustomerAccountStatusLabel } from '../utils/customerAccounts'
import toast from 'react-hot-toast'

const EMPTY = { name: '', phone: '', nationalId: '', carModel: '', licensePlate: '' }

/* ─── car list database ─── */
const POPULAR_CARS = [
  'تويوتا كورولا', 'تويوتا يارس', 'تويوتا هيلوكس', 'تويوتا فورتشنر',
  'هيونداي إلنترا', 'هيونداي أكسنت', 'هيونداي فيرنا', 'هيونداي توسان', 'هيونداي آي 10',
  'كيا سيراتو', 'كيا سبورتاج', 'كيا ريو', 'كيا بيكانتو',
  'ميتسوبيشي لانسر بومة', 'ميتسوبيشي لانسر شارك', 'ميتسوبيشي باجيرو',
  'شيفروليه أوبترا', 'شيفروليه أفيو', 'شيفروليه كروز', 'شيفروليه لانوس', 'شيفروليه الدبابة',
  'نيسان صني', 'نيسان سنترا', 'نيسان قشقاي',
  'رينو لوجان', 'رينو ميجان', 'رينو داستر',
  'فيات تيبو', 'فيات شاهين', 'فيات 128',
  'سكودا أوكتافيا', 'سكودا كودياك',
  'فولكس فاجن جولف', 'فولكس فاجن باسات',
  'أوبل أسترا', 'أوبل إنسينيا'
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export default function Customers() {
  const {
    customers,
    customerAccounts,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    invoices,
    reviewCustomerAccount,
    payInvoiceDebt,
  } = useStore()
  const { currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(EMPTY)
  const [historyCustomer, setHistoryCustomer] = useState(null)

  const [payModal, setPayModal] = useState(false)
  const [payCustomer, setPayCustomer] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payNote, setPayNote] = useState('')
  const [paying, setPaying] = useState(false)

  // Smart suggestions & scanner states
  const [showCarSuggestions, setShowCarSuggestions] = useState(false)
  const [showPlateScanner, setShowPlateScanner] = useState(false)
  const [scanningState, setScanningState] = useState('idle')
  const [scannedPlate, setScannedPlate] = useState('')
  const [scanProgress, setScanProgress] = useState(0)
  const [scanningLogs, setScanningLogs] = useState([])

  const SAMPLE_PLATES = useMemo(() => [
    { plate: 'أ ب ج 123', name: 'محمد علي', car: 'تويوتا كورولا 2018', phone: '01115329887' },
    { plate: 'ط ر ب 456', name: 'أحمد السيد', car: 'هيونداي إلنترا 2015', phone: '01099238812' },
    { plate: 'س ص ع 789', name: 'محمود مصطفى', car: 'لانسر شارك 2016', phone: '01223456789' }
  ], [])

  const customerUnpaidInvoices = useMemo(() => {
    if (!payCustomer) return []
    return invoices
      .filter(i => 
        i.paymentStatus !== 'paid' && 
        ((payCustomer.phone && i.customerData?.phone === payCustomer.phone) ||
         (!payCustomer.phone && i.customerData?.name === payCustomer.name))
      )
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt)
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt)
        return dateA - dateB
      })
  }, [payCustomer, invoices])

  const handleCollectDebt = async () => {
    if (!payCustomer || !payAmount || Number(payAmount) <= 0) return
    setPaying(true)
    try {
      let amountToDistribute = Number(payAmount)
      const invoicesToPay = [...customerUnpaidInvoices]
      
      if (amountToDistribute > (payCustomer.debtTotal || 0)) {
        toast.error('مبلغ السداد أكبر من إجمالي مديونية العميل!')
        setPaying(false)
        return
      }

      for (const inv of invoicesToPay) {
        if (amountToDistribute <= 0) break
        const invDue = inv.dueAmount || 0
        if (invDue <= 0) continue

        const paymentForThisInvoice = Math.min(amountToDistribute, invDue)
        await payInvoiceDebt(inv.id, paymentForThisInvoice, payNote || 'سداد جزء من الحساب')
        amountToDistribute -= paymentForThisInvoice
      }

      const remainingDebt = Math.max(0, payCustomer.debtTotal - Number(payAmount))
      const msg = `💵 إيصال استلام دفعة مالية - ELFAROUK Service\n` +
             `مرحباً أ/ ${payCustomer.name} 👋\n` +
             `تم استلام دفعة بقيمة: ${Number(payAmount).toLocaleString()} ج.م من حسابكم المعلق.\n` +
             (remainingDebt > 0 
               ? `إجمالي المديونية المتبقية طرفكم حالياً: ${remainingDebt.toLocaleString()} ج.م\n` 
               : `تم تسوية مديونياتكم بالكامل، رصيدكم الحالي 0 ج.م ✨\n`) +
             `شكراً لتعاملكم معنا 🙏`

      const phone = payCustomer.phone?.replace(/^0/, '20')
      if (phone) {
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
      }

      setPayModal(false)
      setPayCustomer(null)
      setPayAmount('')
      setPayNote('')
    } catch (error) {
      console.error(error)
    } finally {
      setPaying(false)
    }
  }

  const customerHistory = useMemo(() => {
    if (!historyCustomer) return []
    return invoices
      .filter(i => 
        (historyCustomer.phone && i.customerData?.phone === historyCustomer.phone) || 
        (!historyCustomer.phone && i.customerData?.name === historyCustomer.name)
      )
      .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB - dateA;
      })
  }, [historyCustomer, invoices])

  // ✅ Fix #3: Export Customer vehicle & service history to Excel
  const exportCustomerHistoryToExcel = async () => {
    if (!historyCustomer || customerHistory.length === 0) return
    const toastId = toast.loading('جاري تجهيز وتصدير سجل السيارة...')
    try {
      const XLSX = await import('xlsx')
      const data = []
      customerHistory.forEach(inv => {
        const invDate = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt)
        inv.items?.forEach(item => {
          data.push({
            'التاريخ': invDate.toLocaleDateString('ar-EG'),
            'رقم الفاتورة': inv.number,
            'العميل': historyCustomer.name,
            'الهاتف': historyCustomer.phone || '',
            'السيارة': historyCustomer.carModel || '',
            'اللوحة': historyCustomer.licensePlate || '',
            'اسم القطعة / الخدمة': item.name,
            'الكمية المشتراة': item.qty,
            'المرتجع': item.returnedQty || 0,
            'سعر الواحدة': item.price,
            'الإجمالي': item.price * item.qty
          })
        })
      })
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل صيانة سيارة العميل')
      XLSX.writeFile(workbook, `سجل_صيانة_${historyCustomer.name.replace(/\s+/g, '_')}.xlsx`)
      toast.success('تم التصدير بنجاح!', { id: toastId })
    } catch {
      toast.error('فشل تصدير السجل!', { id: toastId })
    }
  }


  const filtered = customers.filter(c =>
    !search || 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search) ||
    c.licensePlate?.toLowerCase().includes(search.toLowerCase()) ||
    c.carModel?.toLowerCase().includes(search.toLowerCase())
  )


  const pendingCustomerAccounts = useMemo(
    () =>
      customerAccounts.filter(
        (account) => account.status === CUSTOMER_ACCOUNT_STATUSES.PENDING
      ),
    [customerAccounts]
  )

  const restrictedCustomerAccounts = useMemo(
    () =>
      customerAccounts.filter((account) =>
        [CUSTOMER_ACCOUNT_STATUSES.REJECTED, CUSTOMER_ACCOUNT_STATUSES.SUSPENDED].includes(
          account.status
        )
      ),
    [customerAccounts]
  )

  const activeCustomerAccounts = useMemo(
    () =>
      customerAccounts
        .filter((account) => account.status === CUSTOMER_ACCOUNT_STATUSES.ACTIVE)
        .slice(0, 6),
    [customerAccounts]
  )

  const isAdminUser = currentUser?.role === 'admin'

  const runAccountReview = async (account, action) => {
    let reason = ''
    if (action === 'reject' || action === 'suspend') {
      reason = window.prompt(
        action === 'reject' ? 'اكتب سبب رفض الحساب' : 'اكتب سبب إيقاف الحساب',
        account.reviewReason || ''
      ) || ''
    }

    await reviewCustomerAccount(account.id, action, reason)
  }

  const formatReviewMeta = (account) => {
    const actor = account.statusUpdatedByName || account.statusUpdatedByUid || ''
    const date = account.statusUpdatedAt?.toDate?.() || (account.statusUpdatedAt ? new Date(account.statusUpdatedAt) : null)
    const dateLabel = date && !Number.isNaN(date.getTime()) ? date.toLocaleString('ar-EG') : ''
    return [actor, dateLabel].filter(Boolean).join(' - ')
  }

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (c) => { setEditing(c.id); setForm({ ...EMPTY, ...c }); setModal(true) }

  const handleSubmit = async () => {
    if (!form.name) return
    if (editing) await updateCustomer(editing, form)
    else await addCustomer(form)
    setModal(false)
  }

  const filteredCarSuggestions = useMemo(() => {
    const q = (form.carModel || '').trim().toLowerCase()
    if (!q) return POPULAR_CARS.slice(0, 8)
    return POPULAR_CARS.filter(c => c.toLowerCase().includes(q)).slice(0, 8)
  }, [form.carModel])

  /* ─── AI Plate OCR Simulator ─── */
  const startPlateScan = useCallback((customPlate = null) => {
    setScanningState('scanning')
    setScanProgress(0)
    setScanningLogs([])

    const logs = [
      '🤖 تم تشغيل نظام فحص لوحات الترخيص الذكي...',
      '📸 جاري الاتصال بالكاميرا وتأطير الصورة...',
      '⚡ جاري استخراج الحقول النصية (OCR)...',
      '🔍 جاري مطابقة الأحرف والأرقام مع الصيغة المصرية الموحدة...',
      '✨ تم فك التشفير بنجاح وقراءة بيانات المركبة!'
    ]

    let step = 0
    const interval = setInterval(() => {
      if (step < logs.length) {
        setScanningLogs(prev => [...prev, logs[step]])
        setScanProgress((step + 1) * 20)
        step++
      } else {
        clearInterval(interval)
        const plate = customPlate || SAMPLE_PLATES[Math.floor(Math.random() * SAMPLE_PLATES.length)].plate
        setScannedPlate(plate)
        setScanningState('success')

        setTimeout(() => {
          const sample = SAMPLE_PLATES.find(sp => sp.plate === plate)
          if (sample) {
            setForm(prev => ({
              ...prev,
              name: sample.name,
              phone: sample.phone,
              carModel: sample.car,
              licensePlate: sample.plate
            }))
            toast.success(`✨ تم تحميل بيانات العميل: أ/ ${sample.name}`)
          } else {
            setForm(prev => ({ ...prev, licensePlate: plate }))
            toast.success(`📋 تم إدخال اللوحة المقروءة: ${plate}`)
          }
          setShowPlateScanner(false)
          setScanningState('idle')
        }, 1500)
      }
    }, 500)
  }, [SAMPLE_PLATES])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 sm:space-y-8 pb-32">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight font-display flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shadow-sm">
              <Users size={20} className="text-primary-600" />
            </div>
            قاعدة بيانات العملاء
          </h1>
          <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">إجمالي المسجلين: {customers.length}</p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={openAdd} 
          className="btn-primary !px-4 sm:!px-6 !py-2.5 sm:!py-3 text-[10px] sm:text-sm !rounded-xl !bg-primary-600 hover:!bg-primary-700 shadow-md shadow-primary-600/10 flex items-center gap-2"
        >
          <Plus size={16} /> إضافة عميل جديد
        </motion.button>
      </div>

      {/* Search Box */}
      <div className="relative group px-1">
        <Search size={16} className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث بالاسم، رقم الهاتف..." 
          className="w-full bg-white border border-slate-200 rounded-2xl pr-10 sm:pr-12 pl-4 py-3.5 text-sm text-slate-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all shadow-sm" 
        />
      </div>

      {/* Admin Verification Section */}
      {isAdminUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-50/50 border border-primary-100 rounded-3xl p-5 sm:p-6 mx-1 shadow-sm"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-600 flex items-center gap-2">
                  <ShieldCheck size={14} />
                  Phone Verification Queue
                </p>
                <h2 className="mt-2 text-lg sm:text-2xl font-black text-slate-800 font-display">
                  حسابات بانتظار تأكيد الرقم
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  الحساب يظل مقفول للعميل لحد ما توافق أنت على رقم الهاتف.
                </p>
              </div>

              <div className="badge-primary !bg-amber-50 !text-amber-700 !border-amber-200 px-3 py-2 w-fit font-bold rounded-xl text-xs flex items-center gap-1">
                <Clock3 size={13} />
                {pendingCustomerAccounts.length} معلق
              </div>
            </div>

            {pendingCustomerAccounts.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white/40 px-4 py-5 text-sm text-slate-500">
                لا توجد حسابات معلقة الآن. أي عميل يسجل بحسابه سيظهر هنا إلى أن يتم التفعيل.
              </div>
            ) : (
              <div className="grid gap-3">
                {pendingCustomerAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="rounded-2xl border border-slate-200/60 bg-white px-4 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-sm"
                  >
                    <div className="grid gap-2">
                      <p className="text-base font-black text-slate-800">{account.name || 'عميل جديد'}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-bold">
                        {account.phone && (
                          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100">
                            <Phone size={12} className="text-emerald-600" />
                            {account.phone}
                          </span>
                        )}
                        {account.email && (
                          <span className="flex items-center gap-1 bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg border border-primary-100">
                            <Mail size={12} className="text-primary-600" />
                            {account.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => runAccountReview(account, 'approve')}
                      className="btn-primary !px-4 !py-2.5 text-[11px] sm:text-sm self-start lg:self-center !rounded-xl !bg-primary-600 hover:!bg-primary-700 shadow-md shadow-primary-600/10 flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      تفعيل الحساب
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Admin Restrictions / Status Dashboard */}
      {isAdminUser && (
        <div className="mx-1 grid gap-4 xl:grid-cols-2">
          {/* Restricted Accounts */}
          <div className="bg-rose-50/30 border border-rose-100 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-600">
                  Restricted Accounts
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-800">حسابات مرفوضة أو موقوفة</h2>
              </div>
              <div className="badge-primary !bg-rose-50 !text-rose-700 !border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                <XCircle size={13} />
                {restrictedCustomerAccounts.length}
              </div>
            </div>

            <div className="grid gap-3">
              {restrictedCustomerAccounts.length === 0 ? (
                <div className="rounded-2xl border border-rose-100/50 bg-white/30 px-4 py-5 text-sm text-slate-500">
                  لا توجد حسابات مرفوضة أو موقوفة.
                </div>
              ) : (
                restrictedCustomerAccounts.map((account) => (
                  <div key={account.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black text-slate-800">{account.name || 'عميل'}</p>
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                        {getCustomerAccountStatusLabel(account.status)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      {account.phone && (
                        <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
                          <Phone size={12} className="text-slate-500" />
                          {account.phone}
                        </span>
                      )}
                      {account.email && (
                        <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
                          <Mail size={12} className="text-slate-500" />
                          {account.email}
                        </span>
                      )}
                    </div>
                    {account.reviewReason && (
                      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 font-medium">
                        السبب: {account.reviewReason}
                      </p>
                    )}
                    <p className="mt-2 text-[10px] text-slate-400 font-bold">{formatReviewMeta(account)}</p>
                    <button
                      type="button"
                      onClick={() => runAccountReview(account, 'approve')}
                      className="btn-primary mt-4 !px-4 !py-2.5 text-[11px] sm:text-sm !rounded-xl !bg-slate-800 hover:!bg-slate-900 shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={15} />
                      إعادة التفعيل
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Accounts Management */}
          <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                  Active Accounts
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-800">حسابات مفعلة يمكن إيقافها</h2>
              </div>
              <div className="badge-primary !bg-slate-100 !text-slate-700 !border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                <PauseCircle size={13} />
                {activeCustomerAccounts.length} مفعل
              </div>
            </div>

            <div className="grid gap-3">
              {activeCustomerAccounts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/50 bg-white/30 px-4 py-5 text-sm text-slate-500">
                  لا توجد حسابات مفعلة حالياً.
                </div>
              ) : (
                activeCustomerAccounts.map((account) => (
                  <div key={account.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="font-black text-slate-800">{account.name || 'عميل'}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      {account.phone && (
                        <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
                          <Phone size={12} className="text-slate-500" />
                          {account.phone}
                        </span>
                      )}
                      {account.email && (
                        <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
                          <Mail size={12} className="text-slate-500" />
                          {account.email}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] text-slate-400 font-bold">{formatReviewMeta(account)}</p>
                    <button
                      type="button"
                      onClick={() => runAccountReview(account, 'suspend')}
                      className="btn-ghost mt-4 !px-4 !py-2.5 text-[11px] sm:text-sm !rounded-xl !border-rose-100 hover:!bg-rose-50 !text-rose-600 flex items-center gap-1.5"
                    >
                      <PauseCircle size={15} />
                      إيقاف الحساب
                    </button>
                  </div>
                )))}
            </div>
          </div>
        </div>
      )}

      {/* Customers List */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-2.5 sm:gap-4 px-1">
        {filtered.map(c => (
          <motion.div 
            variants={itemVariant} 
            layout 
            key={c.id} 
            className="bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-primary-400 hover:shadow-md transition-all duration-300 p-4 sm:p-6 group flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-50 border border-primary-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all duration-500 shadow-sm">
                <Users size={20} className="text-primary-600 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="flex-1 min-w-0 text-right">
                <p className="font-black text-slate-800 text-sm sm:text-lg tracking-tight group-hover:text-primary-600 transition-colors font-display truncate leading-tight">{c.name}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  {c.phone && <span className="text-[7px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none flex items-center gap-1"><Phone size={8} className="text-emerald-500" /> {c.phone}</span>}
                  {c.carModel && <span className="text-[7px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none flex items-center gap-1"><Car size={8} className="text-primary-500" /> {c.carModel}</span>}
                  {c.licensePlate && <span className="text-[7px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none flex items-center gap-1">📋 لوحة: {c.licensePlate}</span>}
                  {c.nationalId && <span className="text-[7px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none flex items-center gap-1">🪪 قومي: {c.nationalId}</span>}
                </div>
              </div>

              <div className="sm:hidden text-left shrink-0">
                <p className="text-sm font-black text-slate-800 font-display leading-none mb-1">{Number(c.totalSpent || 0).toLocaleString('en-US')}</p>
                <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest leading-none text-left">ج.م</p>
              </div>
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1 gap-2 border-t border-slate-100 pt-3 sm:pt-0 sm:border-0 mt-1 sm:mt-0">
              <div className="flex-1 sm:hidden">
                {c.debtTotal > 0 && <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-lg text-[9px] font-bold">ديون: {Number(c.debtTotal).toLocaleString('en-US')} ج</span>}
              </div>

              <div className="sm:px-6 2xl:px-10 py-1 border-x border-slate-100 hidden sm:flex flex-col items-center justify-center min-w-[140px]">
                <p className="text-lg 2xl:text-xl font-black text-slate-800 font-display tracking-tight leading-none mb-1">
                  {Number(c.totalSpent || 0).toLocaleString('en-US')} <span className="text-[9px] text-slate-400 font-normal">ج.م</span>
                </p>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider text-center">إجمالي المشتريات</span>
                {c.debtTotal > 0 && <span className="mt-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl px-2 py-0.5 font-bold text-[9px]">مديونية: {Number(c.debtTotal).toLocaleString('en-US')}</span>}
              </div>

              <div className="flex gap-2">
                {c.debtTotal > 0 && (
                  <button 
                    onClick={() => { setPayCustomer(c); setPayModal(true); }} 
                    className="p-2.5 bg-emerald-50 text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-100 rounded-xl transition-all active:scale-95 animate-pulse" 
                    title="تحصيل مديونية"
                  >
                    <Wallet size={14} />
                  </button>
                )}
                <button 
                  onClick={() => setHistoryCustomer(c)} 
                  className="p-2.5 bg-slate-50 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 border border-slate-200 rounded-xl transition-all active:scale-95" 
                  title="سجل الصيانة"
                >
                  <History size={14} />
                </button>
                <button 
                  onClick={() => openEdit(c)} 
                  className="p-2.5 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => { if(window.confirm('حذف العميل؟')) deleteCustomer(c.id) }} 
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition-all active:scale-95"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-slate-50 border border-dashed border-slate-200 text-center py-20 rounded-3xl">
            <Users size={50} className="text-slate-400 mx-auto mb-6" />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-4">لم يتم العثور على عملاء بهذا البحث</p>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {/* Pay Modal */}
        {payModal && payCustomer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="bg-white w-full max-w-xl border-t sm:border border-slate-200 shadow-2xl overflow-hidden rounded-t-[2.5rem] sm:rounded-[2rem] text-right" dir="rtl">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 sm:hidden" />
              <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 font-display tracking-tight flex items-center gap-2">
                    <Wallet className="text-emerald-500" size={22} />
                    تحصيل مديونية العميل
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">أ/ {payCustomer.name}</p>
                </div>
                <button onClick={() => { setPayModal(false); setPayCustomer(null); }} className="text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-xl transition-colors"><X size={18} /></button>
              </div>
              
              <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Debt Stat */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">إجمالي المديونية الطرفية</p>
                    <p className="text-xl font-black text-rose-600">{payCustomer.debtTotal?.toLocaleString()} ج.م</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">عدد الفواتير المعلقة</p>
                    <p className="text-xl font-black text-slate-700">{customerUnpaidInvoices.length} فواتير</p>
                  </div>
                </div>

                {/* Invoices List */}
                <div className="space-y-2">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">تفاصيل الفواتير غير المدفوعة:</p>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {customerUnpaidInvoices.map(inv => (
                      <div key={inv.id} className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-150 text-xs text-slate-700">
                        <span>فاتورة #{inv.number} ({(inv.createdAt?.toDate?.() || new Date(inv.createdAt)).toLocaleDateString('en-GB')})</span>
                        <span className="font-bold text-rose-600">متبقي: {inv.dueAmount?.toLocaleString()} ج.م</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">المبلغ المراد سداده حالياً *</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder="أدخل قيمة السداد..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">بيان / ملاحظة السداد (اختياري)</label>
                    <input
                      value={payNote}
                      onChange={e => setPayNote(e.target.value)}
                      placeholder="مثال: سداد نقدي بالخزينة..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 sm:p-8 border-t border-slate-100 flex gap-4 bg-slate-50/80">
                <button onClick={() => { setPayModal(false); setPayCustomer(null); }} className="btn-ghost flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest !rounded-xl !border-slate-200 hover:!bg-slate-100">إلغاء</button>
                <button
                  onClick={handleCollectDebt}
                  disabled={paying || !payAmount || Number(payAmount) <= 0}
                  className="btn-primary flex-[2] py-3.5 text-[10px] font-black uppercase tracking-widest !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 shadow-md shadow-emerald-600/10 disabled:opacity-25"
                >
                  {paying ? 'جار السداد...' : 'تأكيد تحصيل المبلغ'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Add/Edit Modal */}
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="bg-white w-full max-w-xl border-t sm:border border-slate-200 shadow-2xl overflow-hidden rounded-t-[2.5rem] sm:rounded-[2rem]">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 sm:hidden" />
              <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 font-display tracking-tight">{editing ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h2>
                <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-xl transition-colors"><X size={18} /></button>
              </div>
              
              <div className="p-6 sm:p-8 space-y-5 sm:space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar text-right" dir="rtl">
                <div>
                  <label className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 block">اسم العميل بالكامل *</label>
                  <input 
                    value={form.name || ''} 
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all font-bold" 
                    placeholder="مثلاً: محمد علي" 
                  />
                </div>

                <div>
                  <label className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 block">رقم الهاتف / الواتساب</label>
                  <input 
                    value={form.phone || ''} 
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all font-bold" 
                    placeholder="01xxxxxxxxx" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 block">الرقم القومي (اختياري)</label>
                    <input 
                      value={form.nationalId || ''} 
                      onChange={e => setForm(p => ({ ...p, nationalId: e.target.value }))} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all font-bold" 
                      placeholder="29xxxxxxxxxxxx" 
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 block">رقم لوحة السيارة</label>
                    <div className="relative">
                      <input 
                        value={form.licensePlate || ''} 
                        onChange={e => setForm(p => ({ ...p, licensePlate: e.target.value }))} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all font-bold" 
                        placeholder="أ ب ج 123" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPlateScanner(true)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary-50 hover:bg-primary-100 border border-primary-100 text-primary-600 rounded-lg transition-all"
                        title="فحص اللوحة بالذكاء الاصطناعي"
                      >
                        <Sparkles size={13} className="animate-pulse text-primary-500" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 block">نوع السيارة والموديل</label>
                  <div className="relative">
                    <input 
                      value={form.carModel || ''} 
                      onChange={e => setForm(p => ({ ...p, carModel: e.target.value }))} 
                      onFocus={() => setShowCarSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCarSuggestions(false), 205)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all font-bold" 
                      placeholder="لانسر بومة 2008" 
                      autoComplete="off"
                    />
                    
                    {showCarSuggestions && filteredCarSuggestions.length > 0 && (
                      <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto text-right">
                        {filteredCarSuggestions.map((car, idx) => (
                          <button 
                            key={idx} 
                            type="button"
                            onMouseDown={() => {
                              setForm(p => ({ ...p, carModel: car }))
                              setShowCarSuggestions(false)
                            }}
                            className="w-full text-right px-4 py-2.5 hover:bg-primary-50 transition-all text-xs font-bold text-slate-700 flex items-center justify-between"
                          >
                            <span>🚗</span>
                            <span>{car}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 border-t border-slate-100 flex gap-4 bg-slate-50/80">
                <button onClick={() => setModal(false)} className="btn-ghost flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest !rounded-xl !border-slate-200 hover:!bg-slate-100">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary flex-[2] py-3.5 text-[10px] font-black uppercase tracking-widest !rounded-xl !bg-primary-600 hover:!bg-primary-700 shadow-md shadow-primary-600/10">
                  {editing ? 'حفظ التغييرات' : 'تأكيد الإضافة'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* History Modal */}
        {historyCustomer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-baseline sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="bg-white w-full max-w-2xl border-slate-200 shadow-2xl flex flex-col h-[90vh] sm:h-[85vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 sm:hidden" onClick={() => setHistoryCustomer(null)} />
              <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-50 rounded-xl sm:rounded-2xl flex items-center justify-center border border-primary-100 shadow-sm">
                    <Wrench size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-800 text-lg sm:text-xl font-display">سجل صيانة العميل</h2>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">{historyCustomer.name}</p>
                  </div>
                </div>
                <button onClick={() => setHistoryCustomer(null)} className="text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-xl transition-colors"><X size={18} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 scrollbar-hide pb-32">
                {customerHistory.length === 0 ? (
                  <div className="text-center py-20 opacity-30">
                    <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] sm:text-xs">لا يوجد صيانة مسجلة حالياً</p>
                  </div>
                ) : (
                  customerHistory.map((inv) => (
                    <div key={inv.id} className="relative pr-6 sm:pr-8 border-r-2 border-slate-100 pb-2">
                      <div className="absolute right-[-5px] top-0 w-2.5 h-2.5 bg-primary-500 rounded-full shadow-md shadow-primary-500/25" />
                      
                      <div className="flex justify-between items-center mb-3 sm:mb-4 pr-3 sm:pr-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="bg-slate-50 p-1.5 rounded-lg text-slate-400 border border-slate-200">
                            <Calendar size={12} />
                          </div>
                          <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                            {(inv.createdAt?.toDate?.() || new Date(inv.createdAt)).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        <div className="badge-primary !bg-slate-100 !border-slate-200 !text-slate-700 !text-[7px] sm:!text-[8px] tracking-tighter rounded-lg px-2 py-0.5 font-bold">رقم {inv.number}</div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-3 sm:p-5 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4 shadow-sm">
                        {inv.items?.map((item, iIdx) => (
                          <div key={iIdx} className="flex justify-between items-center bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm">
                            <div className="flex flex-col flex-1 min-w-0 pr-2">
                              <span className="text-slate-800 text-xs sm:text-sm font-bold font-display truncate">{item.name}</span>
                              {item.returnedQty > 0 && <span className="bg-rose-50 text-rose-600 border border-rose-100 rounded-lg py-0.5 px-2 mt-1 text-[8px] font-bold w-fit">مرتجع: {item.returnedQty}</span>}
                            </div>
                            <div className="text-left flex flex-col items-end shrink-0">
                              <p className="text-primary-600 font-bold font-display text-xs sm:text-sm">{item.price?.toLocaleString('en-US')} ج.م</p>
                              <p className="text-[8px] lg:text-[9px] text-slate-400 font-bold uppercase mt-0.5">الكمية: {item.qty}</p>
                            </div>
                          </div>
                        ))}
                        <div className="pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-slate-200 flex justify-between items-center px-1 sm:px-2">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">إجمالي الفاتورة</span>
                          <span className="text-xs sm:text-sm font-black text-slate-800 font-display tracking-tight">{inv.total?.toLocaleString('en-US')} ج.م</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-6 sm:p-8 border-t border-slate-100 bg-slate-50/95 absolute bottom-0 left-0 right-0 backdrop-blur-md flex gap-3">
                <button onClick={() => setHistoryCustomer(null)} className="btn-ghost flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest !rounded-xl !border-slate-250 hover:!bg-slate-100 pb-safe">إغلاق</button>
                <button onClick={exportCustomerHistoryToExcel} disabled={customerHistory.length === 0}
                  className="btn-primary flex-[2] py-3.5 text-[10px] font-black uppercase tracking-widest !rounded-xl flex items-center justify-center gap-2 disabled:opacity-30 pb-safe">
                  <Download size={14} /> تصدير السجل لـ Excel
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI License Plate Scanner for Customers Modal */}
      <AnimatePresence>
        {showPlateScanner && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowPlateScanner(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[520px] bg-slate-900 border border-slate-800 shadow-2xl rounded-3xl z-[310] flex flex-col overflow-hidden text-right text-white"
              dir="rtl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-600/20 border border-primary-500/30 text-primary-400 rounded-xl flex items-center justify-center">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white font-display">فحص لوحة السيارة بالذكاء الاصطناعي</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">نظام استخراج الحروف والتحقق التلقائي (OCR)</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPlateScanner(false)}
                  className="p-2 text-slate-500 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Scanner Area */}
                <div className="relative w-full h-48 bg-black rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center group">
                  <div className="absolute inset-0 border-2 border-slate-800/20 rounded-2xl pointer-events-none" />
                  <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-primary-500" />
                  <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-primary-500" />
                  <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-primary-500" />
                  <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-primary-500" />

                  {scanningState === 'scanning' ? (
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <motion.div 
                        animate={{ y: [0, 160, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                      />
                      <div className="bg-black/80 backdrop-blur-sm border border-slate-800 rounded-xl p-3 space-y-1 font-mono text-[9px] text-primary-400 h-28 overflow-y-auto custom-scrollbar select-none">
                        {scanningLogs.map((log, idx) => (
                          <div key={idx} className="flex gap-2">
                            <span className="text-slate-600 font-bold">[{idx + 1}]</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-700">
                        <div 
                          className="bg-primary-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : scanningState === 'success' ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-3 text-center"
                    >
                      <CheckCircle2 size={40} className="text-emerald-500" />
                      <div className="bg-amber-400 text-slate-900 border-4 border-black px-8 py-3.5 rounded-xl font-black text-2xl font-mono shadow-lg tracking-wider flex items-center justify-center gap-2">
                        <span>مصر</span>
                        <span className="border-r border-slate-900 h-6 mx-2" />
                        <span>{scannedPlate}</span>
                      </div>
                      <p className="text-xs text-emerald-400 font-bold animate-pulse">تم فك التشفير ومطابقة الحساب بنجاح ✨</p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-500 select-none">
                      <Camera size={44} className="opacity-40 animate-pulse text-slate-400" />
                      <p className="text-xs font-bold">قم باختيار لوحة اختبار سريعة أدناه لتجربة الميزة</p>
                    </div>
                  )}
                </div>

                {/* Sample Plates */}
                <div className="space-y-3">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">اختر لوحة جاهزة للاختبار الفوري:</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {SAMPLE_PLATES.map((sp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => startPlateScan(sp.plate)}
                        disabled={scanningState === 'scanning'}
                        className="p-3 bg-slate-800/40 border border-slate-800 hover:border-primary-500 rounded-2xl flex flex-col items-center gap-2 transition-all hover:scale-[1.03] active:scale-95 group"
                      >
                        <div className="bg-amber-400 border border-slate-900 text-slate-900 rounded px-2 py-0.5 text-xs font-mono font-black text-center w-full shadow-sm leading-none flex justify-center items-center gap-1 group-hover:bg-amber-300">
                          <span className="text-[8px] font-black">EGY</span>
                          <span className="border-r border-slate-900 h-3" />
                          <span>{sp.plate}</span>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-200">{sp.name}</p>
                          <p className="text-[8px] text-slate-500 font-bold">{sp.car}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fast manual options */}
                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 py-3 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-bold cursor-pointer transition-all active:scale-95 text-slate-300">
                    <UploadCloud size={16} /> رفع صورة لوحة ترخيص
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      disabled={scanningState === 'scanning'} 
                      onChange={() => startPlateScan()} 
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => startPlateScan('ج ر ت 612')}
                    disabled={scanningState === 'scanning'}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 text-slate-300"
                  >
                    <span>🆕 فحص لوحة جديدة بالكامل</span>
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex">
                <button
                  type="button"
                  onClick={() => setShowPlateScanner(false)}
                  disabled={scanningState === 'scanning'}
                  className="w-full btn-ghost py-3 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white !rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
