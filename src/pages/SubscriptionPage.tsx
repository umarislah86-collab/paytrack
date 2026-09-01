import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
  addDoc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import type { BillingCycle, Payment, Subscription, UserProfile } from '../types'
import AddCycleModal from '../components/AddCycleModal'
import InviteMemberModal from '../components/InviteMemberModal'

export default function SubscriptionPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [cycles, setCycles] = useState<BillingCycle[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [members, setMembers] = useState<UserProfile[]>([])
  const [showAddCycle, setShowAddCycle] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    return onSnapshot(doc(db, 'subscriptions', id), snap => {
      if (!snap.exists()) { navigate('/'); return }
      setSub({ id: snap.id, ...snap.data() } as Subscription)
    })
  }, [id])

  useEffect(() => {
    if (!id) return
    const q = query(collection(db, 'billingCycles'), where('subscriptionId', '==', id))
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as BillingCycle))
      data.sort((a, b) => b.createdAt - a.createdAt)
      setCycles(data)
    })
  }, [id])

  useEffect(() => {
    if (!id) return
    const q = query(collection(db, 'payments'), where('subscriptionId', '==', id))
    return onSnapshot(q, snap => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)))
    })
  }, [id])

  useEffect(() => {
    if (!sub) return
    Promise.all(
      sub.memberUids.map(uid => getDoc(doc(db, 'users', uid)))
    ).then(snaps => {
      setMembers(snaps.filter(s => s.exists()).map(s => s.data() as UserProfile))
    })
  }, [sub?.memberUids.join(',')])

  async function togglePayment(cycleId: string, memberUid: string, currentPaid: boolean) {
    if (!id) return
    const existing = payments.find(p => p.cycleId === cycleId && p.memberUid === memberUid)
    if (existing) {
      await updateDoc(doc(db, 'payments', existing.id), {
        paid: !currentPaid,
        paidAt: !currentPaid ? Date.now() : null,
      })
    } else {
      const cycle = cycles.find(c => c.id === cycleId)
      await addDoc(collection(db, 'payments'), {
        cycleId,
        subscriptionId: id,
        memberUid,
        amount: cycle?.perPersonAmount || 0,
        paid: true,
        paidAt: Date.now(),
      })
    }
  }

  function getPayment(cycleId: string, memberUid: string) {
    return payments.find(p => p.cycleId === cycleId && p.memberUid === memberUid)
  }

  function cycleProgress(cycleId: string) {
    if (!sub) return { paid: 0, total: 0 }
    if (sub.billingType === 'rotation') {
      const cycle = cycles.find(c => c.id === cycleId)
      if (!cycle?.payerUid) return { paid: 0, total: 1 }
      const p = payments.find(pp => pp.cycleId === cycleId && pp.memberUid === cycle.payerUid)
      return { paid: p?.paid ? 1 : 0, total: 1 }
    }
    const paid = sub.memberUids.filter(uid => getPayment(cycleId, uid)?.paid).length
    return { paid, total: sub.memberUids.length }
  }

  if (!sub) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white text-xl">‹</button>
          <span className="text-2xl">{sub.iconEmoji || '💳'}</span>
          <div className="flex-1">
            <h1 className="font-bold">{sub.name}</h1>
            <p className="text-xs text-gray-400">{sub.billingType === 'rotation' ? '🔄 Giliran Bayar' : '💰 Split Sama Rata'}</p>
          </div>
          <button onClick={() => setShowInvite(true)} className="text-sm text-blue-400 hover:text-blue-300">+ Invite</button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Members */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Ahli Group ({members.length})</p>
          <div className="flex gap-2 flex-wrap">
            {members.map(m => (
              <div key={m.uid} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${m.uid === user?.uid ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
                <span className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                  {m.name.charAt(0).toUpperCase()}
                </span>
                {m.uid === user?.uid ? 'Kau' : m.name}
              </div>
            ))}
          </div>
        </div>

        {/* Cycles */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-300">Rekod Pembayaran</h2>
          <button
            onClick={() => setShowAddCycle(true)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            + Period Baru
          </button>
        </div>

        {cycles.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">Belum ada rekod. Tambah period pembayaran.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cycles.map(cycle => {
              const { paid, total } = cycleProgress(cycle.id)
              const allPaid = paid === total
              const isExpanded = expandedCycle === cycle.id

              return (
                <div key={cycle.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <button
                    className="w-full p-4 text-left flex items-center gap-3"
                    onClick={() => setExpandedCycle(isExpanded ? null : cycle.id)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${allPaid ? 'bg-green-900' : 'bg-gray-800'}`}>
                      {allPaid ? '✅' : '⏳'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{cycle.label}</p>
                      <p className="text-xs text-gray-400">
                        RM {cycle.totalAmount.toFixed(2)} • {paid}/{total} bayar
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-400">RM {cycle.perPersonAmount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">seorang</p>
                    </div>
                    <span className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>›</span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-800 px-4 pb-4 pt-3">
                      {sub.billingType === 'rotation' ? (
                        <RotationPaymentRow
                          cycle={cycle}
                          members={members}
                          payment={cycle.payerUid ? getPayment(cycle.id, cycle.payerUid) : undefined}
                          currentUser={user?.uid || ''}
                          onToggle={() => cycle.payerUid && togglePayment(cycle.id, cycle.payerUid, getPayment(cycle.id, cycle.payerUid)?.paid || false)}
                        />
                      ) : (
                        <div className="space-y-2">
                          {sub.memberUids.map(uid => {
                            const member = members.find(m => m.uid === uid)
                            const payment = getPayment(cycle.id, uid)
                            return (
                              <div key={uid} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                                    {member?.name.charAt(0).toUpperCase() || '?'}
                                  </span>
                                  <span className="text-sm">{uid === user?.uid ? 'Kau' : (member?.name || uid)}</span>
                                </div>
                                <button
                                  onClick={() => togglePayment(cycle.id, uid, payment?.paid || false)}
                                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all ${payment?.paid ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                >
                                  {payment?.paid ? '✓ Dah Bayar' : 'Belum Bayar'}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {showAddCycle && (
        <AddCycleModal
          sub={sub}
          members={members}
          onClose={() => setShowAddCycle(false)}
        />
      )}
      {showInvite && (
        <InviteMemberModal
          sub={sub}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  )
}

function RotationPaymentRow({
  cycle, members, payment, currentUser, onToggle
}: {
  cycle: BillingCycle
  members: UserProfile[]
  payment: Payment | undefined
  currentUser: string
  onToggle: () => void
}) {
  const payer = members.find(m => m.uid === cycle.payerUid)
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400 mb-1">Giliran Bayar</p>
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold">
            {payer?.name.charAt(0).toUpperCase() || '?'}
          </span>
          <span className="text-sm font-medium">{cycle.payerUid === currentUser ? 'Kau' : (payer?.name || 'Unknown')}</span>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all ${payment?.paid ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
      >
        {payment?.paid ? '✓ Dah Bayar' : 'Belum Bayar'}
      </button>
    </div>
  )
}
