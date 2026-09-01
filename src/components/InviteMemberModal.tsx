import { arrayUnion, doc, getDocs, query, collection, where, updateDoc } from 'firebase/firestore'
import { useState } from 'react'
import { db } from '../lib/firebase'
import type { Subscription, UserProfile } from '../types'

interface Props {
  sub: Subscription
  onClose: () => void
}

export default function InviteMemberModal({ sub, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleInvite() {
    if (!email.trim()) return
    setError('')
    setSuccess('')
    setLoading(true)

    const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()))
    const snap = await getDocs(q)

    if (snap.empty) {
      setError('User tidak dijumpai. Dia kena daftar dulu.')
      setLoading(false)
      return
    }

    const member = snap.docs[0].data() as UserProfile
    if (sub.memberUids.includes(member.uid)) {
      setError('Orang ni dah ada dalam group.')
      setLoading(false)
      return
    }

    await updateDoc(doc(db, 'subscriptions', sub.id), {
      memberUids: arrayUnion(member.uid),
    })

    setSuccess(`${member.name} dah berjaya dijemput!`)
    setEmail('')
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6 border border-gray-800" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-white mb-1">Jemput Ahli</h2>
        <p className="text-gray-400 text-sm mb-4">Masukkan email ahli yang kau nak tambah. Dia kena daftar dulu.</p>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition-colors">
            Tutup
          </button>
          <button
            onClick={handleInvite}
            disabled={loading || !email.trim()}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {loading ? 'Cari...' : 'Jemput'}
          </button>
        </div>
      </div>
    </div>
  )
}
