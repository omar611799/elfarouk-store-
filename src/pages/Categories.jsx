import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Trash2, Tag } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Categories() {
  const { categories, addCategory, deleteCategory } = useStore()
  const [name, setName] = useState('')

  const handleAdd = async () => {
    if (!name.trim()) return
    await addCategory({ name: name.trim() })
    setName('')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center">
              <Tag size={20} className="text-primary-600" />
            </span>
            فئات المنتجات
          </h1>
          <p className="text-slate-400 text-xs font-bold mt-1 mr-13">
            إجمالي الفئات النشطة: <span className="text-primary-600 font-black">{categories.length}</span>
          </p>
        </div>
      </div>

      <div className="card flex gap-2 !p-4">
        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="اسم الفئة الجديدة (مثلاً: مساعدين، بطاريات، زيوت)" className="input flex-1 text-sm !rounded-xl" />
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap !rounded-xl">
          <Plus size={16} /> إضافة فئة
        </button>
      </div>

      <div className="space-y-2">
        {categories.map(c => (
          <div key={c.id} className="card flex items-center gap-3 !p-4 hover:border-primary-200">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0 border border-primary-100">
              <Tag size={16} className="text-primary-600" />
            </div>
            <span className="flex-1 text-slate-800 font-black text-sm">{c.name}</span>
            <button onClick={() => { if(window.confirm('هل تريد حذف هذه الفئة؟')) deleteCategory(c.id) }} 
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="card text-center py-12 border-dashed">
            <Tag size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-bold">لا توجد فئات بعد</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

