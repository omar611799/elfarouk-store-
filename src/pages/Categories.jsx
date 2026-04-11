import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Trash2, Tag } from 'lucide-react'

export default function Categories() {
  const { categories, addCategory, deleteCategory } = useStore()
  const [name, setName] = useState('')

  const handleAdd = async () => {
    if (!name.trim()) return
    await addCategory({ name: name.trim() })
    setName('')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">الفئات</h1>

      <div className="card flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="اسم الفئة الجديدة" className="input flex-1 text-sm" />
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
          <Plus size={16} /> إضافة
        </button>
      </div>

      <div className="space-y-2">
        {categories.map(c => (
          <div key={c.id} className="card flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Tag size={16} className="text-blue-400" />
            </div>
            <span className="flex-1 text-white font-medium text-sm">{c.name}</span>
            <button onClick={() => deleteCategory(c.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-slate-400 text-sm">لا توجد فئات بعد</p>
          </div>
        )}
      </div>
    </div>
  )
}
