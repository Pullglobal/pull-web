/**
 * pull.global/tip
 *
 * Usage: /tip?dropId=<node-id>
 *
 * - Fetches the node from Supabase to get artist name, track title, cover art
 * - Lets the listener pick a tip amount
 * - Calls the Supabase Edge Function `create-tip-checkout` → redirects to Stripe
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AMOUNTS = [1, 3, 5, 10]  // dollars

const EDGE_URL = 'https://bbiycmbahjpwvezndrzj.supabase.co/functions/v1/create-tip-checkout'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function Tip() {
  const [params] = useSearchParams()
  const dropId = params.get('dropId')

  const [node, setNode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selected, setSelected] = useState(5)
  const [custom, setCustom] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!dropId) { setNotFound(true); setLoading(false); return }
    supabase
      .from('nodes')
      .select('id, title, track_title, cover_art_url, tip_enabled')
      .eq('id', dropId)
      .single()
      .then(({ data, error }) => {
        if (error || !data || !data.tip_enabled) { setNotFound(true) }
        else { setNode(data) }
        setLoading(false)
      })
  }, [dropId])

  const tipAmount = custom ? parseFloat(custom) : selected

  const handleTip = async () => {
    if (!tipAmount || tipAmount < 1) {
      setError('Minimum tip is $1.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          nodeId: node.id,
          artistName: node.title,
          amountCents: Math.round(tipAmount * 100),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      window.location.href = data.url   // Stripe Checkout redirect
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.inner}>
          <p style={s.hint}>Loading…</p>
        </div>
      </div>
    )
  }

  // ── Not found / tip not enabled ──────────────────────────────────────────
  if (notFound) {
    return (
      <div style={s.page}>
        <div style={s.inner}>
          <p style={s.wordmark}>pull</p>
          <h1 style={s.heading}>Drop not found</h1>
          <p style={s.hint}>This tip link may be invalid or the artist hasn't enabled tips.</p>
        </div>
      </div>
    )
  }

  // ── Tip page ─────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.inner}>
        <p style={s.wordmark}>pull</p>

        {/* Artist card */}
        <div style={s.artistCard}>
          {node.cover_art_url ? (
            <img src={node.cover_art_url} alt="cover" style={s.cover} />
          ) : (
            <div style={s.coverPlaceholder}>♪</div>
          )}
          <div style={s.artistInfo}>
            <p style={s.artistName}>{node.title}</p>
            {node.track_title && <p style={s.trackTitle}>{node.track_title}</p>}
          </div>
        </div>

        <h2 style={s.heading}>Send a tip</h2>
        <p style={s.hint}>
          100% goes to the artist. Tips are paid out monthly.
        </p>

        {/* Amount picker */}
        <div style={s.amountRow}>
          {AMOUNTS.map((amt) => (
            <button
              key={amt}
              style={{
                ...s.amountBtn,
                background: selected === amt && !custom ? '#0A0A0A' : 'transparent',
                color: selected === amt && !custom ? '#F5D000' : '#0A0A0A',
                border: selected === amt && !custom
                  ? '2px solid #0A0A0A'
                  : '2px solid rgba(10,10,10,0.2)',
              }}
              onClick={() => { setSelected(amt); setCustom('') }}
            >
              ${amt}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div style={s.customRow}>
          <span style={s.dollarSign}>$</span>
          <input
            style={s.customInput}
            type="number"
            min="1"
            placeholder="Custom amount"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        </div>

        {error && <p style={s.errorText}>{error}</p>}

        <button
          style={{ ...s.tipBtn, opacity: submitting ? 0.6 : 1 }}
          onClick={handleTip}
          disabled={submitting}
        >
          {submitting ? 'Redirecting…' : `Tip $${tipAmount || '—'} →`}
        </button>

        <p style={s.legal}>
          Payments are processed securely via Stripe. Pull collects tips and pays artists monthly.
        </p>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    background: '#FD500',
  },
  inner: {
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    textAlign: 'center',
  },
  wordmark: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '13px',
    letterSpacing: '0.15em',
    opacity: 0.35,
    margin: 0,
  },

  artistCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'white',
    border: '1.5px solid rgba(10,10,10,0.1)',
    borderRadius: '8px',
    padding: '16px 20px',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
    background: '#FD000',
  },
  cover: {
    width: '64px',
    height: '64px',
    borderRadius: '6px',
    objectFit: 'cover',
    flexShrink: 0,
  },
  coverPlaceholder: {
    width: '64px',
    height: '64px',
    borderRadius: '6px',
    background: 'rgba(10,10,10,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    background: '#F5D000',
    flexShrink: 0,

  },
  artistInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  artistName: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '16px',
    fontWeight: 700,
    margin: 0,
    color: '#0A0A0A',
    background: '#F5D000',
  },
  trackTitle: {
    fontFamily: 'var(--font-body, sans-serif)',
    fontSize: '13px',
    margin: 0,
    opacity: 0.5,
  },

  heading: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    margin: 0,
    color: '#0A0A0A',
  },
  hint: {
    fontFamily: 'var(--font-body, sans-serif)',
    fontSize: '14px',
    opacity: 0.5,
    lineHeight: 1.6,
    margin: 0,
  },

  amountRow: {
    display: 'flex',
    gap: '10px',
    width: '100%',
    justifyContent: 'center',
  },
  amountBtn: {
    flex: 1,
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '15px',
    fontWeight: 700,
    borderRadius: '6px',
    padding: '14px 8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },

  customRow: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    border: '1.5px solid rgba(10,10,10,0.15)',
    borderRadius: '6px',
    background: 'white',
    overflow: 'hidden',
  },
  dollarSign: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '15px',
    fontWeight: 700,
    padding: '0 12px',
    color: '#0A0A0A',
    opacity: 0.4,
  },
  customInput: {
    flex: 1,
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '15px',
    border: 'none',
    outline: 'none',
    padding: '14px 12px 14px 0',
    background: 'transparent',
    color: '#0A0A0A',
  },

  errorText: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '12px',
    color: '#B00020',
    margin: 0,
  },

  tipBtn: {
    width: '100%',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    background: '#13de1a',
    color: '#F5D000',
    border: 'none',
    borderRadius: '6px',
    padding: '18px 24px',
    cursor: 'pointer',
  },

  legal: {
    fontFamily: 'var(--font-body, sans-serif)',
    fontSize: '11px',
    opacity: 0.3,
    lineHeight: 1.7,
    margin: 0,
  },
}
