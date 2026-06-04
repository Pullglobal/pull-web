import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculatePrice } from '../lib/nodeUtils'
import { supabase } from '../lib/supabase'
import { useMapStore } from '../store/useMapStore'

const SUPABASE_FUNCTION_URL = 'https://bbiycmbahjpwvezndrzj.supabase.co/functions/v1/create-payment-intent'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const PROMO_CODES = {
  'EMP10': 0.10,
  'EMP50': 0.50,
  'EMPFREE': 1.00,
}

// ── Inner form (has access to Stripe hooks) ───────────────
function CheckoutForm({ finalTotal, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const draftDrop = useMapStore((s) => s.draftDrop)
  const nodes = useMapStore((s) => s.nodes)
  const clearDraftDrop = useMapStore((s) => s.clearDraftDrop)
  const setNodes = useMapStore((s) => s.setNodes)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const saveNodesToSupabase = async () => {
    if (!draftDrop) return
    const draftNodes = nodes.filter((n) => n.status === 'draft')
    if (!draftNodes.length) return
    const now = Date.now()
    const rows = draftNodes.map((node) => ({
      latitude: node.coordinate.latitude,
      longitude: node.coordinate.longitude,
      title: draftDrop.title,
      track_title: draftDrop.trackTitle,
      description: draftDrop.description,
      collab_notes: draftDrop.collabNotes,
      external_link: draftDrop.externalLink,
      contact_email: draftDrop.contactEmail,
      audio_url: draftDrop.audioUri,
      cover_art_url: draftDrop.coverArt,
      radius: draftDrop.radius ?? 25,
      duration_hours: draftDrop.durationHours ?? 24,
      start_time: draftDrop.scheduledStart ?? now,
      end_time: (draftDrop.scheduledStart ?? now) + (draftDrop.durationHours ?? 24) * 3600000,
      status: draftDrop.scheduledStart && draftDrop.scheduledStart > now ? 'scheduled' : 'live',
      play_count: 0,
    }))
    const { error } = await supabase.from('nodes').insert(rows)
    if (error) throw error
    clearDraftDrop()
    setNodes(nodes.filter((n) => n.status !== 'draft'))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Free drop
      if (finalTotal === 0) {
        await saveNodesToSupabase()
        onSuccess()
        return
      }

      if (!stripe || !elements) throw new Error('Stripe not loaded')

      // Get payment intent
      const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ amount: finalTotal }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      // Confirm payment with card element
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: { name: draftDrop?.title ?? 'Pull Artist' },
          },
        }
      )

      if (stripeError) throw new Error(stripeError.message)
      if (paymentIntent.status !== 'succeeded') throw new Error('Payment did not complete.')

      await saveNodesToSupabase()
      onSuccess()

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {finalTotal > 0 && (
        <div style={s.cardWrapper}>
          <p style={s.cardLabel}>Card details</p>
          <div style={s.cardBox}>
            <CardElement options={{
              style: {
                base: {
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '15px',
                  color: '#0A0A0A',
                  '::placeholder': { color: '#aaa' },
                },
              },
            }} />
          </div>
        </div>
      )}

      {error && <p style={s.errorText}>{error}</p>}

      <button
        style={{ ...s.payBtn, opacity: loading || !stripe ? 0.6 : 1 }}
        onClick={handleSubmit}
        disabled={loading || !stripe}
      >
        {loading ? 'Processing...' : finalTotal === 0 ? 'Drop for Free 🎵' : `Pay $${finalTotal.toFixed(2)} →`}
      </button>
    </div>
  )
}

// ── Main Review page ──────────────────────────────────────
export default function ReviewPage() {
  const navigate = useNavigate()
  const draftDrop = useMapStore((s) => s.draftDrop)
  const nodes = useMapStore((s) => s.nodes)
  const draftNodes = nodes.filter((n) => n.status === 'draft')
  const basePrice = draftDrop ? parseFloat(calculatePrice(draftDrop, draftNodes.length)) : 0

  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(null)
  const [discount, setDiscount] = useState(0)
  const [promoError, setPromoError] = useState(null)
  const [success, setSuccess] = useState(false)

  const discountAmount = basePrice * discount
  const finalTotal = Math.max(0, basePrice - discountAmount)

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase()
    const match = PROMO_CODES[code]
    if (match !== undefined) {
      setDiscount(match)
      setPromoApplied(code)
      setPromoError(null)
    } else {
      setPromoError('Invalid promo code.')
    }
  }

  if (success) {
    return (
      <div style={s.page}>
        <div style={s.inner}>
          <div style={s.successBox}>
            <p style={s.successIcon}>🎵</p>
            <h1 style={s.successTitle}>Drop is live!</h1>
            <p style={s.successSub}>
              Your node is now active on the Pull map. Listeners walking nearby will find it.
            </p>
            <button style={s.successBtn} onClick={() => navigate('/')}>Back to Home</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <p style={s.eyebrow}>step 3 of 3</p>
        <h1 style={s.title}>Review & Pay</h1>

        {/* Summary */}
        <div style={s.card}>
          <Row label="Artist" value={draftDrop?.title ?? '—'} />
          <Row label="Track" value={draftDrop?.trackTitle ?? '—'} />
          <Row label="Nodes" value={`${draftNodes.length}`} />
          <Row label="Radius" value={`${draftDrop?.radius ?? 25}m`} />
          <Row label="Duration" value={`${draftDrop?.durationHours ?? 24}hrs`} />
          {draftDrop?.scheduledStart && (
            <Row label="Goes live" value={new Date(draftDrop.scheduledStart).toLocaleString()} />
          )}
          <div style={s.divider} />
          {discount > 0 && (
            <Row label={`Promo (${Math.round(discount * 100)}% off)`} value={`-$${discountAmount.toFixed(2)}`} green />
          )}
          <Row label="Total" value={`$${finalTotal.toFixed(2)}`} large />
        </div>

        {/* Promo */}
        <div style={s.promoRow}>
          <input
            style={s.promoInput}
            placeholder="Promo code"
            value={promoCode}
            onChange={(e) => { setPromoCode(e.target.value); setPromoError(null) }}
            disabled={!!promoApplied}
          />
          <button
            style={{ ...s.promoBtn, background: promoApplied ? '#00C97C' : 'var(--blue)' }}
            onClick={handleApplyPromo}
            disabled={!!promoApplied || !promoCode.trim()}
          >
            {promoApplied ? 'Applied ✓' : 'Apply'}
          </button>
        </div>
        {promoError && <p style={s.errorText}>{promoError}</p>}

        {/* Stripe Elements wrapper */}
        <Elements stripe={stripePromise}>
          <CheckoutForm finalTotal={finalTotal} onSuccess={() => setSuccess(true)} />
        </Elements>

        <button style={s.backBtn} onClick={() => navigate('/map')}>← Back to Map</button>

        <p style={s.legal}>
          Payment processed securely via Stripe. Your node goes live immediately after payment.
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, large, green }) {
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={{
        ...s.rowValue,
        fontSize: large ? '22px' : '15px',
        color: green ? '#00C97C' : large ? 'var(--blue)' : 'var(--black)',
      }}>
        {value}
      </span>
    </div>
  )
}

const s = {
  page: { paddingTop: '64px', minHeight: '100vh', paddingBottom: '80px' },
  inner: { maxWidth: '560px', margin: '0 auto', padding: '60px 40px' },
  eyebrow: { fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em', opacity: 0.4, marginBottom: '16px' },
  title: { fontFamily: 'var(--font-mono)', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '32px' },

  card: {
    background: 'rgba(255,255,255,0.5)', border: '1.5px solid rgba(10,10,10,0.12)',
    borderRadius: '8px', padding: '24px', marginBottom: '20px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' },
  rowLabel: { fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', opacity: 0.45, flexShrink: 0 },
  rowValue: { fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' },
  divider: { borderTop: '1px solid rgba(10,10,10,0.1)', margin: '4px 0' },

  promoRow: { display: 'flex', gap: '10px', marginBottom: '8px' },
  promoInput: {
    flex: 1, fontFamily: 'var(--font-body)', fontSize: '14px',
    background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(10,10,10,0.15)',
    borderRadius: '4px', padding: '12px 16px', outline: 'none',
  },
  promoBtn: {
    fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
    color: 'white', border: 'none', borderRadius: '4px',
    padding: '12px 20px', cursor: 'pointer', letterSpacing: '0.04em',
  },

  cardWrapper: { display: 'flex', flexDirection: 'column', gap: '8px' },
  cardLabel: { fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.08em', opacity: 0.5 },
  cardBox: {
    background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(10,10,10,0.15)',
    borderRadius: '4px', padding: '14px 16px',
  },

  errorText: { fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#B00020', marginBottom: '8px' },

  payBtn: {
    width: '100%', fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700,
    letterSpacing: '0.04em', background: 'var(--black)', color: 'var(--yellow)',
    border: 'none', borderRadius: '4px', padding: '16px 24px', cursor: 'pointer',
  },
  backBtn: {
    fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--blue)',
    background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700,
    letterSpacing: '0.04em', borderBottom: '1.5px solid var(--blue)', paddingBottom: '2px',
    marginTop: '16px', display: 'inline-block',
  },
  legal: { fontFamily: 'var(--font-body)', fontSize: '12px', opacity: 0.35, lineHeight: 1.7, textAlign: 'center', marginTop: '20px' },

  successBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '60px 0', gap: '16px' },
  successIcon: { fontSize: '56px' },
  successTitle: { fontFamily: 'var(--font-mono)', fontSize: '36px', fontWeight: 700, letterSpacing: '-0.02em' },
  successSub: { fontFamily: 'var(--font-body)', fontSize: '16px', opacity: 0.6, maxWidth: '360px', lineHeight: 1.7 },
  successBtn: {
    marginTop: '16px', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700,
    letterSpacing: '0.04em', background: 'var(--black)', color: 'var(--yellow)',
    border: 'none', borderRadius: '4px', padding: '14px 28px', cursor: 'pointer',
  },
}

