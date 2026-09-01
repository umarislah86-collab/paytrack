import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import type { Subscription } from '../types'
import AddSubscriptionModal from '../components/AddSubscriptionModal'

export default function DashboardPage() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [subs, setSubs] = useState<Subscription[]>([])
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'subscriptions'), where('memberUids', 'array-contains', user.uid))
    return onSnapshot(q, snap => {
      setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subscription)))
    })
  }, [user])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">💳 PayTrack</h1>
            <p className="text-gray-400 text-xs">Hei, {profile?.name || user?.email}</p>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-white text-sm">Keluar</button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-300">Subscriptions Kau</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            + Tambah
          </button>
        </div>

        {subs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-3">📭</div>
            <p>Takde subscription lagi</p>
            <p className="text-sm mt-1">Tambah subscription group kau</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subs.map(sub => (
              <button
                key={sub.id}
                onClick={() => navigate(`/sub/${sub.id}`)}
                className="w-full bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-4 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sub.iconEmoji || '💳'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{sub.name}</p>
                    <p className="text-gray-400 text-sm">{sub.memberUids.length} orang • {sub.billingType === 'rotation' ? 'Giliran bayar' : 'Split sama rata'}</p>
                  </div>
                  <span className="text-gray-600">›</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {showAdd && <AddSubscriptionModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
