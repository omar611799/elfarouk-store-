import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { Search, ShoppingBag, Plus, Minus, Trash2, Truck, DollarSign, FileText, BadgeCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ShoppingBag className="text-primary-400" /> تسجيل مشتريات (توريد)
        </h1>
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">رقم فاتورة المورد:</span>
            <input 
                value={billNumber} 
                onChange={e => setBillNumber(e.target.value)} 
                placeholder="مثال: 5542" 
                className="input text-xs w-32 py-1.5" 
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Search & Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white flex items-center gap-2">
                    <Plus size={18} className="text-primary-400" /> إضافة أصناف للفاتورة
                </h2>
                <div className="relative flex-1 max-w-xs mr-4">
                    <Search size={16} className="absolute right-3 top-2.5 text-slate-500" />
                    <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        placeholder="ابحث عن قطعة غيار لإضافتها..." 
                        className="input pr-10 text-sm" 
                    />
                    
                    {filteredProducts.length > 0 && (
                        <div className="absolute top-full right-0 left-0 bg-slate-900 border border-white/10 mt-1 rounded-xl shadow-2xl z-20 overflow-hidden">
                            {filteredProducts.map(p => (
                                <button 
                                    key={p.id} 
                                    onClick={() => addToBill(p)}
                                    className="w-full text-right px-4 py-2.5 text-sm text-slate-300 hover:bg-primary-500 hover:text-white transition-colors flex justify-between items-center"
                                >
                                    <span>{p.name}</span>
                                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">متاح: {p.quantity}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                    <thead>
                        <tr className="text-slate-500 border-b border-white/5">
                            <th className="pb-3 pr-2">المنتج</th>
                            <th className="pb-3">الكمية المستلمة</th>
                            <th className="pb-3 text-center">سعر الشراء (التكلفة)</th>
                            <th className="pb-3 text-left pl-2">الإجمالي</th>
                            <th className="pb-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {billItems.map(item => (
                            <tr key={item.id} className="group">
                                <td className="py-3 pr-2">
                                    <p className="text-white font-medium">{item.name}</p>
                                </td>
                                <td className="py-3">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateItem(item.id, 'qty', Math.max(1, item.qty - 1))} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10"><Minus size={14}/></button>
                                        <input 
                                            type="number" 
                                            value={item.qty} 
                                            onChange={e => updateItem(item.id, 'qty', Number(e.target.value))}
                                            className="w-12 bg-transparent text-center font-bold text-white border-b border-white/10 focus:border-primary-500 outline-none"
                                        />
                                        <button onClick={() => updateItem(item.id, 'qty', item.qty + 1)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10"><Plus size={14}/></button>
                                    </div>
                                </td>
                                <td className="py-3">
                                    <div className="flex items-center justify-center gap-2">
                                        <input 
                                            type="number" 
                                            value={item.cost} 
                                            onChange={e => updateItem(item.id, 'cost', e.target.value)}
                                            className="w-24 bg-slate-800/50 rounded-lg px-3 py-1.5 text-center font-bold text-emerald-400 outline-none border border-white/5"
                                        />
                                        <span className="text-[10px] text-slate-500">ج.م</span>
                                    </div>
                                </td>
                                <td className="py-3 text-left pl-2 font-bold text-white">
                                    {(Number(item.cost) * item.qty).toLocaleString('en-US')}
                                </td>
                                <td className="py-3 text-center">
                                    <button onClick={() => removeItem(item.id)} className="text-slate-600 hover:text-red-400 p-2 transition-colors"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {billItems.length === 0 && (
                    <div className="text-center py-20">
                        <ShoppingBag size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
                        <p className="text-slate-500">ابدأ بالبحث عن منتجات لإضافتها للفاتورة</p>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Right: Supplier & Totals */}
        <div className="space-y-4">
          <div className="glass-card space-y-4">
             <h2 className="font-bold text-white flex items-center gap-2 text-sm border-b border-white/5 pb-3">
                <Truck size={16} className="text-primary-400" /> بيانات المورد والدفع
            </h2>

            <div className="space-y-3">
                <div>
                    <label className="text-xs text-slate-500 block mb-1.5">اختر المورد:</label>
                    <select 
                        value={selectedSupplierId} 
                        onChange={e => setSupplierId(e.target.value)} 
                        className="input text-sm"
                    >
                        <option value="">-- اختر المورد --</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name} {s.debtTotal > 0 ? `(مديونية: ${s.debtTotal})` : ''}</option>
                        ))}
                    </select>
                </div>

                <div className="pt-2">
                    <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
                        <span>إجمالي الفاتورة:</span>
                        <span className="text-white font-bold">{total.toLocaleString('en-US')} ج.م</span>
                    </div>
                    <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                            <label className="text-xs text-slate-500 block mb-1.5 font-bold">المبلغ المدفوع للمورد (كاش):</label>
                            <div className="relative">
                                <DollarSign size={14} className="absolute right-3 top-2.5 text-emerald-400" />
                                <input 
                                    type="number" 
                                    value={paidAmount} 
                                    onChange={e => setPaidAmount(e.target.value)} 
                                    placeholder="0" 
                                    className="input pr-9 pl-4 py-2 font-bold text-emerald-400 border-emerald-500/20" 
                                />
                            </div>
                        </div>
                        
                        {due > 0 && (
                            <div className="flex justify-between items-center text-xs pt-1">
                                <span className="text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded">سيتم تسجيل مديونية:</span>
                                <span className="text-red-400 font-bold underline">{due.toLocaleString('en-US')} ج.م</span>
                            </div>
                        )}
                        {due === 0 && total > 0 && (
                             <div className="flex justify-center items-center gap-2 text-[10px] text-emerald-400 font-bold">
                                <BadgeCheck size={14} /> تم دفع الفاتورة بالكامل
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button 
                onClick={handleSave}
                disabled={saving || billItems.length === 0}
                className="btn-primary w-full py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-glow font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            >
                <FileText size={18} />
                {saving ? 'جاري الحفظ...' : 'اعتماد فاتورة الشراء'}
            </button>
          </div>

          <div className="glass-card bg-primary-500/5 border-primary-500/10">
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                  * سيتم تحديث الكميات في المخزن تلقائياً وتحديث "سعر التكلفة" للصنف بناءً على هذه الفاتورة لضمان دقة حساب الأرباح مستقبلاً.
              </p>
          </div>
        </div>
      </div>
    </div>
  )
}
