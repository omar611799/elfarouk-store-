import { useState, useRef, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { 
  Plus, Search, Edit2, Trash2, AlertTriangle, Package, UploadCloud, 
  QrCode, Printer, X, Filter, Sparkles, Download, Camera,
  FileSpreadsheet, ArrowRight, CheckCircle2, RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import toast from 'react-hot-toast'


const EMPTY = {
  name: '',
  category: '',
  price: '',
  cost: '',
  quantity: '',
  minStock: '5',
  sku: '',
  supplier: '',
  image: '',
  hasSubUnits: false,
  piecesPerBox: '',
  boxCost: '',
  piecePrice: '',
  brand: '',
  qualityTier: 'oem',
  oemPartNumber: '',
  carMake: '',
  carModel: '',
  yearStart: '',
  yearEnd: '',
}

export default function Products() {
  const { products, categories, suppliers, addProduct, updateProduct, deleteProduct, importProductsBatch } = useStore()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [qrModal, setQrModal] = useState(null)
  const [reorderModal, setReorderModal] = useState(false)
  const [excelPreviewData, setExcelPreviewData] = useState(null)
  const [importStrategy, setImportStrategy] = useState('all') // 'all' | 'update_only' | 'add_only'
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef(null)

  const startScanner = async () => {``
    setScanning(true)
    setTimeout(async () => {
      try {
        let qrScanner = new Html5Qrcode('products-barcode-scanner')
        scannerRef.current = qrScanner

        const config = {
          fps: 30,
          disableFlip: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_39,
          ]
        }

        const onSuccess = (decodedText) => {
          setForm(p => ({ ...p, sku: decodedText }))
          toast.success(`تم قراءة الباركود: ${decodedText}`)
          stopScanner(qrScanner)
        }

        try {
          // Try with automatic flash (torch)
          await qrScanner.start(
            { 
              facingMode: 'environment',
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
              advanced: [{ focusMode: "continuous", torch: true }]
            },
            config,
            onSuccess,
            () => {}
          )
        } catch (torchErr) {
          // Fallback: If device has no flash or rejects torch constraint, start without it
          qrScanner = new Html5Qrcode('products-barcode-scanner')
          scannerRef.current = qrScanner
          await qrScanner.start(
            { 
              facingMode: 'environment',
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
              advanced: [{ focusMode: "continuous" }]
            },
            config,
            onSuccess,
            () => {}
          )
        }
      } catch (err) {
        console.error(err)
        toast.error('فشل في تشغيل كاميرا الهاتف. تأكد من السماح بالوصول للكاميرا.')
        setScanning(false)
      }
    }, 300)
  }

  const stopScanner = async (instance = null) => {
    const activeScanner = instance || scannerRef.current
    if (activeScanner && activeScanner.isScanning) {
      try {
        await activeScanner.stop()
      } catch (err) {
        console.error(err)
      }
    }
    scannerRef.current = null
    setScanning(false)
  }

  const filtered = products.filter(p =>
    (!search    || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.category === catFilter)
  )

  const lowStockCount = products.filter(p => p.quantity <= (p.minStock || 5)).length

  // ✅ Fix #5: Generate reorder suggestions based on minStock
  const reorderSuggestions = useMemo(() => {
    return products
      .filter(p => p.quantity <= (p.minStock || 5))
      .map(p => {
        const deficit = Math.max(0, (p.minStock || 5) * 2 - p.quantity)
        const suggestedQty = deficit > 0 ? deficit : 10 // الاقتراح الافتراضي
        const estimatedCost = suggestedQty * (p.cost || 0)
        return { ...p, suggestedQty, estimatedCost }
      })
  }, [products])

  const totalEstimatedReorderCost = reorderSuggestions.reduce((acc, curr) => acc + curr.estimatedCost, 0)

  const exportReorderToExcel = async () => {
    if (reorderSuggestions.length === 0) return
    const toastId = toast.loading('جاري تصدير اقتراحات الشراء...')
    try {
      const XLSX = await import('xlsx')
      const data = reorderSuggestions.map(s => ({
        'اسم القطعة': s.name,
        'كود SKU': s.sku || '',
        'الفئة': s.category || '',
        'المخزون الحالي': s.quantity,
        'الحد الأدنى': s.minStock || 5,
        'الكمية المقترحة للشراء': s.suggestedQty,
        'سعر التكلفة للواحدة': s.cost || 0,
        'التكلفة الإجمالية المتوقعة': s.estimatedCost,
        'المورد المحتمل': s.supplier || ''
      }))
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'اقتراحات الشراء')
      XLSX.writeFile(workbook, `طلبات_الشراء_المقترحة_${new Date().toLocaleDateString('en-GB')}.xlsx`)
      toast.success('تم التصدير بنجاح!', { id: toastId })
    } catch {
      toast.error('فشل التصدير!', { id: toastId })
    }
  }

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (p) => {
    setEditing(p.id)
    const firstComp = Array.isArray(p.compatibility) && p.compatibility.length > 0 ? p.compatibility[0] : {}
    setForm({
      ...EMPTY,
      ...p,
      carMake: firstComp.make || p.carMake || '',
      carModel: firstComp.model || p.carModel || '',
      yearStart: firstComp.yearStart || p.yearStart || '',
      yearEnd: firstComp.yearEnd || p.yearEnd || '',
    })
    setModal(true)
  }
  const close    = () => setModal(false)

  const handleSubmit = async () => {
    if (!form.name || !form.price) return toast.error('اسم المنتج والسعر مطلوبان')
    if (form.hasSubUnits && !form.piecesPerBox) return toast.error('ادخل عدد القطع في العلبة')
    
    const compatibility = (form.carMake || form.carModel) ? [{
      make: form.carMake || '',
      model: form.carModel || '',
      yearStart: form.yearStart ? Number(form.yearStart) : null,
      yearEnd: form.yearEnd ? Number(form.yearEnd) : null,
    }] : (editing?.compatibility || [])

    const data = {
      ...form,
      price:       Number(form.price),
      cost:        Number(form.cost || 0),
      quantity:    Number(form.quantity || 0),
      minStock:    Number(form.minStock || 5),
      hasSubUnits: !!form.hasSubUnits,
      piecesPerBox: form.hasSubUnits ? Number(form.piecesPerBox || 1) : null,
      boxCost:     form.hasSubUnits ? Number(form.boxCost || 0) : null,
      piecePrice:  form.hasSubUnits ? Number(form.piecePrice || 0) : null,
      compatibility,
    }
    if (editing) await updateProduct(editing, data)
    else         await addProduct(data)
    close()
  }

  const exportFullCatalogToExcel = async () => {
    if (products.length === 0) return toast.error('لا توجد منتجات في المخزن لتصديرها')
    const toastId = toast.loading('جاري تجهيز كشف الجرد والأسعار...')
    try {
      const XLSX = await import('xlsx')
      const data = products.map((p, idx) => {
        const comp = Array.isArray(p.compatibility) && p.compatibility.length > 0
          ? p.compatibility.map(c => `${c.make || ''} ${c.model || ''}`).filter(Boolean).join(' - ')
          : [p.carMake, p.carModel].filter(Boolean).join(' ')

        return {
          'م': idx + 1,
          'كود الصنف / SKU': p.sku || '',
          'اسم القطعة': p.name || '',
          'الفئة': p.category || '',
          'سعر البيع (ج.م)': Number(p.price || 0),
          'سعر التكلفة (ج.م)': Number(p.cost || 0),
          'رصيد المخزن (قطعة)': Number(p.quantity || 0),
          'حد الطلب الأدنى': Number(p.minStock || 5),
          'الماركة': p.brand || '',
          'نوع الجودة': p.qualityTier === 'oem' ? 'أصلية OEM' : p.qualityTier === 'oam_aftermarket' ? 'بديل تجاري معتمد' : 'تجاري',
          'السيارات المتوافقة': comp || 'عام',
          'المورد الافتراضي': p.supplier || '',
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'كشف المخزن والأسعار')
      XLSX.writeFile(workbook, `كشف_مخزن_الفاروق_${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('تم تصدير كشف المخزن بنجاح!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('فشل تصدير ملف الإكسيل!', { id: toastId })
    }
  }

  const downloadSampleTemplateExcel = async () => {
    const toastId = toast.loading('جاري تحميل النموذج...')
    try {
      const XLSX = await import('xlsx')
      const templateData = [
        {
          'كود الصنف / SKU': 'DB-BRK-001',
          'اسم القطعة': 'طقم تيل فرامل أمامي شيفروليه دبابة',
          'الفئة': 'فرامل',
          'سعر البيع (ج.م)': 480,
          'سعر التكلفة (ج.م)': 360,
          'رصيد المخزن (قطعة)': 25,
          'حد الطلب الأدنى': 8,
          'الماركة': 'Gold / كوريا',
          'نوع الجودة': 'oem',
          'السيارة': 'شيفروليه الدبابة (نصف نقل)',
          'المورد': 'الشركة الدولية للاستيراد'
        },
        {
          'كود الصنف / SKU': 'JB-BELT-7000',
          'اسم القطعة': 'سير دينامو ومكيف شيفروليه جامبو 7000',
          'الفئة': 'سيور ومحركات',
          'سعر البيع (ج.م)': 240,
          'سعر التكلفة (ج.م)': 175,
          'رصيد المخزن (قطعة)': 14,
          'حد الطلب الأدنى': 5,
          'الماركة': 'Bando',
          'نوع الجودة': 'oam_aftermarket',
          'السيارة': 'شيفروليه الجامبو 7000',
          'المورد': 'مؤسسة النور للتجارة'
        }
      ]

      const worksheet = XLSX.utils.json_to_sheet(templateData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج إدخال وتحديث المنتجات')
      XLSX.writeFile(workbook, `نموذج_إدخال_منتجات_الفاروق.xlsx`)
      toast.success('تم تحميل النموذج بنجاح!', { id: toastId })
    } catch {
      toast.error('فشل تحميل النموذج!', { id: toastId })
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const toastId = toast.loading('جاري فحص وتحليل ملف الإكسيل...')
      try {
        const XLSX = await import('xlsx')
        const wb  = XLSX.read(evt.target.result, { type: 'binary' })
        const ws  = wb.Sheets[wb.SheetNames[0]]
        const rawData = XLSX.utils.sheet_to_json(ws)

        const formatted = rawData.map(row => {
          const name = String(row['الاسم'] || row['اسم القطعة'] || row['name'] || '').trim()
          const price = Number(row['السعر'] || row['سعر البيع'] || row['سعر البيع (ج.م)'] || row['price'] || 0)
          const cost = Number(row['التكلفة'] || row['سعر التكلفة'] || row['سعر التكلفة (ج.م)'] || row['cost'] || 0)
          const quantity = Number(row['الكمية'] || row['المخزون'] || row['رصيد المخزن (قطعة)'] || row['quantity'] || 0)
          const category = String(row['الفئة'] || row['category'] || '').trim()
          const sku = String(row['الكود'] || row['كود الصنف / SKU'] || row['كود الصنف'] || row['sku'] || '').trim()
          const brand = String(row['الماركة'] || row['brand'] || '').trim()
          const carModel = String(row['السيارة'] || row['السيارات المتوافقة'] || row['carModel'] || '').trim()
          const minStock = Number(row['حد الطلب الأدنى'] || row['الحد الأدنى'] || row['minStock'] || 5)

          return { name, price, cost, quantity, category, sku, brand, carModel, minStock }
        }).filter(item => item.name && item.price > 0)

        if (formatted.length === 0) {
          toast.error('لم يتم العثور على أعمدة صالحة (الاسم والسعر مطلوبان)', { id: toastId })
          return
        }

        let toUpdateCount = 0
        let toAddCount = 0
        const diffList = formatted.map(rowItem => {
          const matchBySku = rowItem.sku ? products.find(p => p.sku === rowItem.sku) : null
          const matchByName = !matchBySku ? products.find(p => p.name?.trim().toLowerCase() === rowItem.name?.trim().toLowerCase()) : null
          const matched = matchBySku || matchByName

          if (matched) {
            toUpdateCount++
            const priceChanged = Number(matched.price) !== Number(rowItem.price)
            const costChanged = Number(matched.cost) !== Number(rowItem.cost)
            const qtyChanged = Number(matched.quantity) !== Number(rowItem.quantity)
            return {
              ...rowItem,
              isExisting: true,
              matchedId: matched.id,
              oldPrice: matched.price,
              oldCost: matched.cost,
              oldQty: matched.quantity,
              priceChanged,
              costChanged,
              qtyChanged,
            }
          } else {
            toAddCount++
            return {
              ...rowItem,
              isExisting: false,
            }
          }
        })

        toast.dismiss(toastId)
        setExcelPreviewData({
          items: diffList,
          total: formatted.length,
          toUpdateCount,
          toAddCount,
        })
      } catch (err) {
        console.error(err)
        toast.error('خطأ في قراءة ملف الإكسيل!', { id: toastId })
      }
      e.target.value = null
    }
    reader.readAsBinaryString(file)
  }

  const handleCommitExcelImport = async () => {
    if (!excelPreviewData || !excelPreviewData.items.length) return
    setIsImporting(true)
    const toastId = toast.loading('جاري حفظ وتحديث البيانات في السحابة...')
    try {
      let filteredItems = excelPreviewData.items
      if (importStrategy === 'update_only') {
        filteredItems = filteredItems.filter(i => i.isExisting)
      } else if (importStrategy === 'add_only') {
        filteredItems = filteredItems.filter(i => !i.isExisting)
      }

      if (filteredItems.length === 0) {
        toast.error('لا توجد عناصر مطابقة للاستراتيجية المحددة', { id: toastId })
        setIsImporting(false)
        return
      }

      await importProductsBatch(filteredItems)
      toast.success('تم استيراد وتحديث البيانات بنجاح!', { id: toastId })
      setExcelPreviewData(null)
    } catch (err) {
      console.error(err)
      toast.error('حدث خطأ أثناء الاستيراد!', { id: toastId })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-7 pb-20">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center">
              <Package size={20} className="text-primary-600" />
            </span>
            المخزن وقطع الغيار
          </h1>
          <p className="text-slate-400 text-xs font-bold mt-1">
            إجمالي القطع: <span className="text-primary-600 font-black">{products.length}</span>
            {lowStockCount > 0 && <span className="mr-3 text-rose-500 font-black">{lowStockCount} منخفضة</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          
          <button 
            onClick={exportFullCatalogToExcel}
            className="btn-ghost flex items-center gap-2 text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
            title="تصدير كشف الجرد والأسعار إلى ملف Excel"
          >
            <Download size={14} className="text-emerald-600" /> تصدير المخزن (Excel)
          </button>

          <button onClick={() => fileInputRef.current?.click()}
            className="btn-ghost flex items-center gap-2 text-xs text-emerald-700 border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100">
            <UploadCloud size={15} className="text-emerald-600" /> تحديث واستيراد Excel
          </button>

          <button onClick={downloadSampleTemplateExcel}
            className="btn-ghost flex items-center gap-2 text-xs text-slate-500 border border-slate-200 bg-white hover:bg-slate-50"
            title="تحميل نموذج Excel فارغ لإدخال وتحديث البيانات">
            <FileSpreadsheet size={14} /> نموذج فارغ
          </button>

          <button onClick={() => setReorderModal(true)}
            className="btn-ghost flex items-center gap-2 text-xs text-violet-600 border border-violet-200 bg-violet-50/50 hover:bg-violet-100">
            <Sparkles size={14} /> اقتراحات الشراء
          </button>
          
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} /> إضافة منتج
          </button>
        </div>

      </div>

      {/* ── Summary Mini Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniStat label="كل المنتجات" value={products.length} color="primary" />
        <MiniStat label="منخفض المخزون" value={lowStockCount} color="rose" alert />
        <MiniStat label="الفئات" value={categories.length} color="slate" />
        <MiniStat label="الموردين" value={suppliers.length} color="emerald" />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md py-2">
        <div className="relative flex-1 group">
          <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الكود SKU..." className="input pr-11 !rounded-2xl" />
        </div>
        <div className="relative sm:w-52">
          <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="input pr-10 !rounded-2xl appearance-none text-sm">
            <option value="">كل الفئات</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── Products Grid ── */}
      {filtered.length === 0 ? (
        <div className="card text-center py-20 border-dashed">
          <Package size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-bold">لا توجد منتجات تطابق البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((p, idx) => {
              const isLow = p.quantity <= (p.minStock || 5)
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`card !p-0 overflow-hidden hover:shadow-xl transition-all duration-500 group
                    ${isLow ? 'border-rose-200 bg-rose-50/30' : 'hover:border-primary-200'}`}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-4 px-5 py-5 border-b border-slate-100">
                    {/* Product Icon */}
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 group-hover:scale-110 transition-transform shadow-sm overflow-hidden">
                      {p.image
                        ? <img src={p.image} className="w-full h-full object-cover" />
                        : <Package size={24} className="text-slate-300" />}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-slate-950 text-base truncate">{p.name}</p>
                        {isLow && <AlertTriangle size={15} className="text-rose-600 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-slate-600 bg-slate-200 px-2.5 py-1 rounded-md border border-slate-300">{p.sku || '–'}</span>
                        {p.category && <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1 rounded-md border border-primary-100">{p.category}</span>}
                        {p.image && p.image.length > 100000 && (
                          <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 animate-pulse">
                            ⚠️ حجم الصورة كبير (يرجى تعديلها لضغطها)
                          </span>
                        )}
                      </div>
                    </div>
                    </div>

                    <div className="px-5 py-4 grid grid-cols-2 gap-4 bg-slate-50/50">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">المخزن</p>
                        <p className={`text-xl font-black ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>{p.quantity} <small className="text-[10px] font-normal text-slate-400">قطعة</small></p>
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">السعر</p>
                        <p className="text-xl font-black text-primary-600 font-display">{Number(p.price).toLocaleString()} <small className="text-[10px] font-normal">ج</small></p>
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(p)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                          <Edit2 size={16} />
                        </button>
                      <button onClick={() => setQrModal(p)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                          <QrCode size={16} />
                      </button>
                      <button onClick={() => { if (window.confirm('حذف هذا المنتج؟')) deleteProduct(p.id) }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                          <Trash2 size={16} />
                      </button>
                      </div>
                      {p.supplier && <span className="text-[9px] font-black text-slate-400 uppercase">{p.supplier}</span>}
                    </div>

                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
            onClick={close}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-xl shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Handle (mobile) */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 sm:hidden" />

              <div className="px-7 pt-6 pb-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">{editing ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h2>
                <button onClick={close} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-7 grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div className="sm:col-span-2">
                  <label className="label-text">اسم المنتج *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="input mt-1" placeholder="مثلاً: مساعدين أمامية تويوتا" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-text">كود SKU / الباركود</label>
                  <div className="relative mt-1 flex gap-2">
                    <input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                      className="input flex-1" placeholder="123-ABC" />
                    <button
                      type="button"
                      onClick={scanning ? () => stopScanner() : startScanner}
                      className={`px-4 rounded-2xl flex items-center justify-center border transition-all ${
                        scanning 
                          ? 'bg-rose-500 border-rose-500 text-white animate-pulse' 
                          : 'bg-primary-50 border-primary-200 text-primary-600 hover:bg-primary-100'
                      }`}
                      title="مسح الباركود بكاميرا الهاتف"
                    >
                      <Camera size={18} />
                    </button>
                  </div>
                  {scanning && (
                    <div className="mt-3 relative rounded-2xl overflow-hidden border-2 border-primary-500 bg-black">
                      <div id="products-barcode-scanner" className="w-full h-48"></div>
                      <button
                        type="button"
                        onClick={() => stopScanner()}
                        className="absolute bottom-3 left-3 bg-rose-600 text-white px-3 py-1.5 rounded-xl text-xs font-black"
                      >
                        إغلاق الكاميرا
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="label-text">الفئة</label>
                  <select value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="input mt-1">
                    <option value="">غير مصنف</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text">سعر البيع *</label>
                  <div className="relative mt-1">
                    <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                      className="input pr-12" placeholder="0" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">ج.م</span>
                  </div>
                </div>
                <div>
                  <label className="label-text">سعر التكلفة</label>
                  <div className="relative mt-1">
                    <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))}
                      className="input pr-12" placeholder="0" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">ج.م</span>
                  </div>
                </div>
                <div>
                  <label className="label-text">الكمية المتاحة</label>
                  <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                    className="input mt-1" placeholder="0" />
                </div>
                <div>
                  <label className="label-text">حد التنبيه (أقل من)</label>
                  <input type="number" value={form.minStock} onChange={e => setForm(p => ({ ...p, minStock: e.target.value }))}
                    className="input mt-1 border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" placeholder="5" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-text">المورد</label>
                  <select value={form.supplier || ''} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))}
                    className="input mt-1">
                    <option value="">بدون مورد</option>
                    {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label-text">صورة المنتج</label>
                  <div className="mt-1 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {form.image ? (
                        <img src={form.image} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-slate-300" />
                      )}
                    </div>
                    <label className="btn-ghost text-xs cursor-pointer flex items-center gap-2">
                      <UploadCloud size={14} />
                      رفع صورة المنتج
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (evt) => {
                              const img = new Image()
                              img.src = evt.target.result
                              img.onload = () => {
                                const canvas = document.createElement('canvas')
                                const MAX_WIDTH = 300
                                const MAX_HEIGHT = 300
                                let width = img.width
                                let height = img.height
                                if (width > height) {
                                  if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width
                                    width = MAX_WIDTH
                                  }
                                } else {
                                  if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height
                                    height = MAX_HEIGHT
                                  }
                                }
                                canvas.width = width
                                canvas.height = height
                                const ctx = canvas.getContext('2d')
                                ctx.drawImage(img, 0, 0, width, height)
                                const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
                                setForm(p => ({ ...p, image: dataUrl }))
                              }
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </label>
                    {form.image && (
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, image: '' }))}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        إزالة الصورة
                      </button>
                    )}
                  </div>
                </div>

                {/* ===== قسم البيع بالعلبة والقطعة ===== */}
                <div className="sm:col-span-2 border border-dashed border-blue-300 bg-blue-50 rounded-2xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div
                      onClick={() => setForm(p => ({ ...p, hasSubUnits: !p.hasSubUnits }))}
                      className={`w-11 h-6 rounded-full flex items-center transition-colors duration-300 ${
                        form.hasSubUnits ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                      } p-0.5`}
                    >
                      <div className="w-5 h-5 bg-white rounded-full shadow" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">يُباع بالعلبة والقطعة</span>
                  </label>

                  {form.hasSubUnits && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="label-text">عدد القطع في العلبة الواحدة *</label>
                        <input
                          type="number" min="1"
                          value={form.piecesPerBox}
                          onChange={e => setForm(p => ({ ...p, piecesPerBox: e.target.value }))}
                          className="input mt-1" placeholder="مثال: 12"
                        />
                      </div>
                      <div>
                        <label className="label-text">تكلفة العلبة (شراء)</label>
                        <div className="relative mt-1">
                          <input
                            type="number"
                            value={form.boxCost}
                            onChange={e => setForm(p => ({ ...p, boxCost: e.target.value }))}
                            className="input pr-12" placeholder="0"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">ج.م</span>
                        </div>
                        {form.boxCost && form.piecesPerBox && (
                          <p className="text-xs text-slate-500 mt-1">
                            تكلفة القطعة: <span className="font-bold text-blue-600">{(Number(form.boxCost) / Number(form.piecesPerBox)).toFixed(2)} ج.م</span>
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="label-text">سعر بيع القطعة</label>
                        <div className="relative mt-1">
                          <input
                            type="number"
                            value={form.piecePrice}
                            onChange={e => setForm(p => ({ ...p, piecePrice: e.target.value }))}
                            className="input pr-12" placeholder="0"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">ج.م</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">سعر بيع العلبة (الحقل أعلاه): <span className="font-bold">{form.price || '0'} ج.م</span></p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== قسم توافق السيارات وذكاء القطع (AI Vehicle Compatibility) ===== */}
                <div className="sm:col-span-2 border border-cyan-200 bg-gradient-to-r from-cyan-50/50 to-blue-50/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-cyan-600 animate-pulse" />
                    <span className="font-bold text-slate-800 text-sm">بيانات التوافق مع السيارات (AI Compatibility)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="label-text">ماركة السيارة</label>
                      <input
                        type="text"
                        value={form.carMake || ''}
                        onChange={e => setForm(p => ({ ...p, carMake: e.target.value }))}
                        className="input mt-1 text-xs"
                        placeholder="مثال: تويوتا"
                      />
                    </div>
                    <div>
                      <label className="label-text">موديل السيارة</label>
                      <input
                        type="text"
                        value={form.carModel || ''}
                        onChange={e => setForm(p => ({ ...p, carModel: e.target.value }))}
                        className="input mt-1 text-xs"
                        placeholder="مثال: كورولا"
                      />
                    </div>
                    <div>
                      <label className="label-text">من سنة</label>
                      <input
                        type="number"
                        value={form.yearStart || ''}
                        onChange={e => setForm(p => ({ ...p, yearStart: e.target.value }))}
                        className="input mt-1 text-xs"
                        placeholder="2014"
                      />
                    </div>
                    <div>
                      <label className="label-text">إلى سنة</label>
                      <input
                        type="number"
                        value={form.yearEnd || ''}
                        onChange={e => setForm(p => ({ ...p, yearEnd: e.target.value }))}
                        className="input mt-1 text-xs"
                        placeholder="2019"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="label-text">الماركة المصنعة للقطعة (Brand)</label>
                      <input
                        type="text"
                        value={form.brand || ''}
                        onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                        className="input mt-1 text-xs"
                        placeholder="مثال: Bosch, Brembo, Denso, Mobis"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="label-text">مستوى الجودة (Quality Tier)</label>
                      <select
                        value={form.qualityTier || 'oem'}
                        onChange={e => setForm(p => ({ ...p, qualityTier: e.target.value }))}
                        className="input mt-1 text-xs"
                      >
                        <option value="oem">أصلي معتمد (OEM / Genuine)</option>
                        <option value="oam_aftermarket">بديل ممتاز (Aftermarket Premium)</option>
                        <option value="commercial">تجاري درجة أولى</option>
                        <option value="economy">اقتصادي</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              <div className="px-7 py-5 border-t border-slate-100 flex gap-3">
                <button onClick={close} className="btn-ghost flex-1">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary flex-[2]">
                  {editing ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* QR Modal */}
        {qrModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
            onClick={() => setQrModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="print-area">
                <p className="text-[10px] font-black uppercase text-primary-600 mb-1">ELFAROUK SERVICE</p>
              <h3 className="text-xl font-black text-slate-800 mb-1">{qrModal.name}</h3>
              <p className="text-xs text-slate-400 font-bold mb-6">SKU: {qrModal.sku || qrModal.id}</p>
              <div className="bg-white p-5 border-4 border-slate-100 rounded-2xl inline-block mb-6 shadow-inner">
                <QRCodeSVG value={qrModal.sku || qrModal.id} size={160} />
              </div>
                <p className="text-2xl font-black text-slate-900 mb-4">{qrModal.price} ج.م</p>
              </div>

              <div className="space-y-3">
                <button onClick={() => window.print()} className="btn-primary w-full">
                  <Printer size={16} /> طباعة ملصق الرف
                </button>
                <button onClick={() => setQrModal(null)} className="btn-ghost w-full">إغلاق</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Smart Reorder suggestions modal */}
        {reorderModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
            onClick={() => setReorderModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-2xl border-t sm:border border-slate-200 shadow-2xl overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] text-right"
              dir="rtl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center border border-violet-100">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">اقتراحات الشراء الذكية</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">تجنب نفاد قطع الغيار الهامة</p>
                  </div>
                </div>
                <button onClick={() => setReorderModal(false)} className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 p-2 rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-6 max-h-[55vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4 bg-violet-50/50 p-4 rounded-2xl border border-violet-100">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">عدد الأصناف المقترحة</p>
                    <p className="text-xl font-black text-violet-700">{reorderSuggestions.length} صنف</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">التكلفة التقريبية المقدرة</p>
                    <p className="text-xl font-black text-emerald-600">{totalEstimatedReorderCost.toLocaleString()} ج.م</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {reorderSuggestions.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                      <p className="text-slate-400 text-xs font-bold">جميع المنتجات بمخزون كافٍ وممتاز! 👍</p>
                    </div>
                  ) : (
                    reorderSuggestions.map(item => (
                      <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <p className="font-black text-slate-800 text-sm">{item.name}</p>
                          <div className="flex gap-2 text-[10px] text-slate-400 font-bold">
                            <span>المخزون الحالي: <strong className="text-rose-500">{item.quantity}</strong></span>
                            <span>الحد الأدنى: <strong>{item.minStock || 5}</strong></span>
                            {item.supplier && <span>المورد: <strong>{item.supplier}</strong></span>}
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-[9px] font-black text-violet-700 bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-lg">
                            اقتراح طلب: {item.suggestedQty} قطة
                          </span>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">التكلفة: {(item.suggestedQty * (item.cost || 0)).toLocaleString()} ج</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-8 border-t border-slate-100 bg-slate-50/80 flex gap-3">
                <button onClick={() => setReorderModal(false)} className="btn-ghost flex-1 py-3">إغلاق</button>
                <button onClick={exportReorderToExcel} disabled={reorderSuggestions.length === 0}
                  className="btn-primary flex-[2] py-3 flex items-center justify-center gap-2 !bg-violet-600 hover:!bg-violet-750 disabled:opacity-30">
                  <Download size={14} /> تصدير الاقتراحات لـ Excel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Bulk Excel Preview & Diff Modal */}
        {excelPreviewData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => !isImporting && setExcelPreviewData(null)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-900 w-full max-w-4xl border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] text-right"
              dir="rtl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                      معاينة وتحديث الأسعار والمخزون من Excel
                    </h3>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                      راجع التغييرات والفروقات قبل تأكيد الحفظ في النظام
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => !isImporting && setExcelPreviewData(null)}
                  disabled={isImporting}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3.5 text-center">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">إجمالي الأصناف المقروءة</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">{excelPreviewData.total}</span>
                  </div>
                  <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 text-center">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block mb-1">أصناف سيتم تحديثها</span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400">{excelPreviewData.toUpdateCount}</span>
                  </div>
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-3.5 text-center">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">أصناف جديدة ستضاف</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{excelPreviewData.toAddCount}</span>
                  </div>
                </div>

                {/* Strategy Selector */}
                <div className="bg-slate-50 dark:bg-slate-800/30 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="font-black text-slate-700 dark:text-slate-300">استراتيجية المعالجة:</span>
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'all', label: 'تحديث شامل وإضافة جديدة (مستحسن)' },
                      { id: 'update_only', label: 'تحديث الأسعار والمخزون الحالي فقط' },
                      { id: 'add_only', label: 'إضافة أصناف جديدة فقط' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setImportStrategy(opt.id)}
                        className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition-all ${
                          importStrategy === opt.id 
                            ? 'bg-primary-600 text-white shadow-sm' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Diff Preview Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                      <tr>
                        <th className="p-3">اسم القطعة / الكود</th>
                        <th className="p-3 text-center">الحالة</th>
                        <th className="p-3 text-center">سعر البيع</th>
                        <th className="p-3 text-center">سعر التكلفة</th>
                        <th className="p-3 text-center">المخزون</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {excelPreviewData.items.slice(0, 50).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                            <div>{row.name}</div>
                            {row.sku && <span className="text-[10px] text-slate-400 font-mono">{row.sku}</span>}
                          </td>
                          <td className="p-3 text-center">
                            {row.isExisting ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                                تحديث صنف
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                                صنف جديد
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold">
                            {row.isExisting && row.priceChanged ? (
                              <div className="flex items-center justify-center gap-1.5 text-[11px]">
                                <span className="text-slate-400 line-through">{row.oldPrice}</span>
                                <ArrowRight size={10} className="text-slate-400" />
                                <span className="text-emerald-600 font-black">{row.price} ج</span>
                              </div>
                            ) : (
                              <span className="text-slate-800 dark:text-slate-200">{row.price} ج</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold">
                            {row.isExisting && row.costChanged ? (
                              <div className="flex items-center justify-center gap-1.5 text-[11px]">
                                <span className="text-slate-400 line-through">{row.oldCost}</span>
                                <ArrowRight size={10} className="text-slate-400" />
                                <span className="text-indigo-600 font-black">{row.cost} ج</span>
                              </div>
                            ) : (
                              <span className="text-slate-600 dark:text-slate-400">{row.cost} ج</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold">
                            {row.isExisting && row.qtyChanged ? (
                              <div className="flex items-center justify-center gap-1.5 text-[11px]">
                                <span className="text-slate-400 line-through">{row.oldQty}</span>
                                <ArrowRight size={10} className="text-slate-400" />
                                <span className="text-primary-600 font-black">{row.quantity}</span>
                              </div>
                            ) : (
                              <span className="text-slate-700 dark:text-slate-300">{row.quantity}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {excelPreviewData.items.length > 50 && (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 text-center text-[11px] text-slate-500 font-bold border-t border-slate-200 dark:border-slate-700">
                      معروض أول 50 صنف من إجمالي {excelPreviewData.items.length} صنف
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex gap-3">
                <button 
                  onClick={() => setExcelPreviewData(null)}
                  disabled={isImporting}
                  className="btn-ghost flex-1 py-3"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCommitExcelImport}
                  disabled={isImporting}
                  className="btn-primary flex-[2] py-3 flex items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-700 text-white font-black"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> جاري الحفظ والتطبيق...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> تأكيد وتطبيق التحديثات في النظام
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Global label style helper */}
      <style>{`.label-text { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }`}</style>
    </motion.div>
  )
}

function MiniStat({ label, value, color, alert }) {
  const palette = {
    primary: 'bg-primary-50 text-primary-700',
    rose:    'bg-rose-50 text-rose-700',
    slate:   'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-1 ${palette[color]}`}>
      <p className={`text-2xl font-black ${alert && value > 0 ? 'text-rose-600' : ''}`}>{value}</p>
      <p className="text-[10px] font-bold opacity-70">{label}</p>
    </div>
  )
}
