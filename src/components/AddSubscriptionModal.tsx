import { addDoc, collection } from 'firebase/firestore'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import type { BillingType } from '../types'

interface Props {
  onClose: () => void
}

const EMOJIS = ['💳', '▶️', '🎬', '🎵', '🎮', '📺', '✨', '🌟', '💡', '🔑']

export default function AddSubscriptionModal({ onClose }: Props) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('💳')
  const [billingType, setBillingType] = useState<BillingType>('split')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim() || !user) return
    setLoading(true)
    await addDoc(collection(db, 'subscriptions'), {
      name: name.trim(),
      description: desc.trim(),
      billingType,
      memberUids: [user.uid],
      createdBy: user.uid,
      createdAt: Date.now(),
      currency: 'RM',
      iconEmoji: icon,
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6 border border-gray-800" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-white mb-4">Tambah Subscription</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nama</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="YouTube, Magic, Netflix..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setIcon(e)}
                  className={`text-xl w-10 h-10 rounded-xl transition-all ${icon === e ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Jenis Bayaran</label>
            <div className="flex gap-2">
              <button
                onClick={() => setBillingType('split')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${billingType === 'split' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
              >
                💰 Split Sama Rata
              </button>
              <button
                onClick={() => setBillingType('rotation')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${billingType === 'rotation' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
              >
                🔄 Giliran Bayar
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {billingType === 'split' ? 'Semua bayar bahagian masing-masing tiap period' : 'Satu orang bayar penuh, giliran bertukar tiap period'}
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Nota (optional)</label>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="e.g. 5 orang share"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition-colors">
            Batal
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {loading ? 'Tunggu...' : 'Buat'}
          </button>
        </div>
      </div>
    </div>
  )
}
