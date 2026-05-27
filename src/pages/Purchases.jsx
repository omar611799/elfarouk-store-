/* eslint-disable react/no-unescaped-entities */
import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { Search, ShoppingBag, Plus, Minus, Trash2, Truck, DollarSign, FileText, BadgeCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Purchases() {
  const { products, suppliers, recordPurchase } = useStore()
  
  const [search, setSearch] = useState('')
  const [selectedSupplierId, setSupplierId] = useState('')
  const [billItems, setBillItems] = useState([]) // { id, name, qty, cost }
  const [paidAmount, setPaidAmount] = useState('')
  const [billNumber, setBillNumber] = useState('')
  const [saving, setSaving] = useState(false)

  const filteredProducts = useMemo(() => {
    if (!search) return []
    return products.filter(p => 
      p.name?.toLowerCase().includes(search.toLowerCase()) || 
      p.sku?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 10)
  }, [products, search])

  const addToBill = (prod) => {
    const exists = billItems.find(i => i.id === prod.id)
    if (exists) {
        setBillItems(billItems.map(i => i.id === prod.id ? { ...i, qty: i.qty + 1 } : i))
    } else {
        setBillItems([...billItems, { id: prod.id, name: prod.name, qty: 1, cost: prod.cost || 0 }])
    }
    setSearch('')
  }

  const updateItem = (id, key, val) => {
    setBillItems(billItems.map(i => i.id === id ? { ...i, [key]: val } : i))
  }

  const removeItem = (id) => {
    setBillItems(billItems.filter(i => i.id !== id))
  }

  const total = billItems.reduce((sum, i) => sum + (Number(i.cost) * i.qty), 0)
  const due = Math.max(0, total - Number(paidAmount || 0))

  const handleSave = async () => {
    if (!selectedSupplierId || billItems.length === 0 || !billNumber) {
        return toast.error('يرجى اختيار المورد، إضافة منتجات، وإدخال رقم الفاتورة')
    }
    setSaving(true)
    try {
        await recordPurchase({
            supplierId: selectedSupplierId,
            items: billItems,
            total,
            paidAmount: Number(paidAmount || 0),
            billNumber
        })
        setBillItems([])
        setPaidAmount('')
        setBillNumber('')
        setSupplierId('')
        toast.success('تم تسجيل المشتريات وتحديث المخزون بنجاح')
    } catch (e) {
        console.error(e)
    } finally {
        setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
              <ShoppingBag size={20} className="text-primary-600" />
            </div>
            تسجيل مشتريات (توريد)
          </h1>
          <p className="text-slate-500 text-xs mt-1 mr-13">استلام بضاعة من الموردين وتحديث المخزون</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-4 py-2 shadow-sm">
          <span className="text-xs text-slate-500 font-bold">رقم فاتورة المورد:</span>
          <input 
            value={billNumber} 
            onChange={e => setBillNumber(e.target.value)} 
            placeholder="مثال: 5542" 
            className="text-xs w-28 py-1 bg-transparent text-slate-800 font-bold outline-none placeholder:text-slate-300 border-b border-slate-200 focus:border-primary-500 transition-colors" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Search & Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4 gap-4">
              <h2 className="font-bold text-slate-700 flex items-center gap-2 text-sm whitespace-nowrap">
                <Plus size={16} className="text-primary-500" /> إضافة أصناف للفاتورة
              </h2>
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute right-3 top-2.5 text-slate-400" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="ابحث عن قطعة غيار لإضافتها..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all" 
                />
                
                {filteredProducts.length > 0 && (
                  <div className="absolute top-full right-0 left-0 bg-white border border-slate-200 mt-1 rounded-xl shadow-xl z-20 overflow-hidden">
                    {filteredProducts.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => addToBill(p)}
                        className="w-full text-right px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors flex justify-between items-center"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-bold">متاح: {p.quantity}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-2">المنتج</th>
                    <th className="pb-3">الكمية</th>
                    <th className="pb-3 text-center">سعر الشراء</th>
                    <th className="pb-3 text-left pl-2">الإجمالي</th>
                    <th className="pb-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {billItems.map(item => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 pr-2">
                        <p className="text-slate-800 font-semibold">{item.name}</p>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateItem(item.id, 'qty', Math.max(1, item.qty - 1))} 
                            className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Minus size={13}/>
                          </button>
                          <input 
                            type="number" 
                            value={item.qty} 
                            onChange={e => updateItem(item.id, 'qty', Number(e.target.value))}
                            className="w-12 bg-transparent text-center font-bold text-slate-800 border-b border-slate-200 focus:border-primary-500 outline-none"
                          />
                          <button 
                            onClick={() => updateItem(item.id, 'qty', item.qty + 1)} 
                            className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Plus size={13}/>
                          </button>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-2">
                          <input 
                            type="number" 
                            value={item.cost} 
                            onChange={e => updateItem(item.id, 'cost', e.target.value)}
                            className="w-24 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-center font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-100"
                          />
                          <span className="text-[10px] text-slate-400 font-bold">ج.م</span>
                        </div>
                      </td>
                      <td className="py-3 text-left pl-2 font-black text-slate-800">
                        {(Number(item.cost) * item.qty).toLocaleString('en-US')}
                        <span className="text-[10px] font-normal text-slate-400 mr-1">ج.م</span>
                      </td>
                      <td className="py-3 text-center">
                        <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-400 p-2 transition-colors rounded-lg hover:bg-red-50">
                          <Trash2 size={15}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {billItems.length === 0 && (
                <div className="text-center py-16">
                  <ShoppingBag size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 text-sm font-medium">ابدأ بالبحث عن منتجات لإضافتها للفاتورة</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Supplier & Totals */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-slate-700 flex items-center gap-2 text-sm border-b border-slate-100 pb-3">
              <Truck size={16} className="text-primary-500" /> بيانات المورد والدفع
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1.5">اختر المورد:</label>
                <select 
                  value={selectedSupplierId} 
                  onChange={e => setSupplierId(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                >
                  <option value="">-- اختر المورد --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.debtTotal > 0 ? `(مديونية: ${s.debtTotal})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-slate-500 font-medium">إجمالي الفاتورة:</span>
                  <span className="text-slate-800 font-black text-lg">{total.toLocaleString('en-US')} <span className="text-xs font-normal text-slate-400">ج.م</span></span>
                </div>
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <label className="text-xs text-slate-500 font-bold block mb-1.5">المبلغ المدفوع للمورد (كاش):</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute right-3 top-2.5 text-emerald-500" />
                      <input 
                        type="number" 
                        value={paidAmount} 
                        onChange={e => setPaidAmount(e.target.value)} 
                        placeholder="0" 
                        className="w-full bg-white border border-emerald-200 rounded-xl pr-9 pl-4 py-2.5 font-bold text-emerald-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" 
                      />
                    </div>
                  </div>
                  
                  {due > 0 && (
                    <div className="flex justify-between items-center text-xs pt-1 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                      <span className="text-red-600 font-bold">سيتم تسجيل مديونية:</span>
                      <span className="text-red-600 font-black">{due.toLocaleString('en-US')} ج.م</span>
                    </div>
                  )}
                  {due === 0 && total > 0 && (
                    <div className="flex justify-center items-center gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-xl py-2">
                      <BadgeCheck size={14} /> تم دفع الفاتورة بالكامل
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={saving || billItems.length === 0}
              className="btn-primary w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={17} />
              {saving ? 'جاري الحفظ...' : 'اعتماد فاتورة الشراء'}
            </button>
          </div>

          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
            <p className="text-[10px] text-primary-700/70 leading-relaxed">
              * سيتم تحديث الكميات في المخزن تلقائياً وتحديث "سعر التكلفة" للصنف بناءً على هذه الفاتورة لضمان دقة حساب الأرباح مستقبلاً.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
