import { addDoc, collection } from 'firebase/firestore'
import { useState } from 'react'
import { db } from '../lib/firebase'
import type { Subscription, UserProfile } from '../types'

interface Props {
  sub: Subscription
  members: UserProfile[]
  onClose: () => void
}

export default function AddCycleModal({ sub, members, onClose }: Props) {
  const [label, setLabel] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [perPerson, setPerPerson] = useState('')
  const [payerUid, setPayerUid] = useState(members[0]?.uid || '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  function autoCalcPerPerson() {
    const total = parseFloat(totalAmount)
    if (!isNaN(total) && sub.memberUids.length > 0) {
      setPerPerson((total / sub.memberUids.length).toFixed(2))
    }
  }

  async function handleCreate() {
    if (!label.trim() || !totalAmount) return
    setLoading(true)
    await addDoc(collection(db, 'billingCycles'), {
      subscriptionId: sub.id,
      label: label.trim(),
      startDate,
      endDate,
      totalAmount: parseFloat(totalAmount),
      perPersonAmount: parseFloat(perPerson) || parseFloat(totalAmount) / sub.memberUids.length,
      ...(sub.billingType === 'rotation' ? { payerUid } : {}),
      createdAt: Date.now(),
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6 border border-gray-800" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-white mb-4">Tambah Period Baru</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Label Period</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Jan-June 2026, Aug-Sep 2026..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mula</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tamat</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Jumlah Total (RM)</label>
            <input
              type="number"
              value={totalAmount}
              onChange={e => setTotalAmount(e.target.value)}
              onBlur={autoCalcPerPerson}
              placeholder="34.20"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Bayaran Seorang (RM)</label>
            <input
              type="number"
              value={perPerson}
              onChange={e => setPerPerson(e.target.value)}
              placeholder={totalAmount && sub.memberUids.length ? (parseFloat(totalAmount) / sub.memberUids.length).toFixed(2) : '0.00'}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-kira: RM{totalAmount ? (parseFloat(totalAmount) / sub.memberUids.length).toFixed(2) : '0'} / {sub.memberUids.length} orang</p>
          </div>

          {sub.billingType === 'rotation' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Giliran Siapa Bayar?</label>
              <select
                value={payerUid}
                onChange={e => setPayerUid(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                {members.map(m => (
                  <option key={m.uid} value={m.uid}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition-colors">
            Batal
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !label.trim() || !totalAmount}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {loading ? 'Tunggu...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}
