export interface Member {
  uid: string
  name: string
  email: string
}

export type BillingType = 'split' | 'rotation'
// split: everyone pays their share each period (e.g. YouTube)
// rotation: one person pays full amount per period/turn (e.g. Magic)

export interface Subscription {
  id: string
  name: string
  description?: string
  billingType: BillingType
  memberUids: string[]
  createdBy: string
  createdAt: number
  currency: string
  iconEmoji?: string
}

export interface BillingCycle {
  id: string
  subscriptionId: string
  label: string          // e.g. "Jan-June 2026"
  startDate: string      // YYYY-MM-DD
  endDate: string        // YYYY-MM-DD
  totalAmount: number
  perPersonAmount: number
  payerUid?: string      // for rotation type: who pays the bill this period
  createdAt: number
}

export interface Payment {
  id: string
  cycleId: string
  subscriptionId: string
  memberUid: string
  amount: number
  paid: boolean
  paidAt?: number
}

export interface UserProfile {
  uid: string
  name: string
  email: string
  createdAt: number
}
