/**
 * pull.global/tip/thanks
 *
 * Landing page after a successful Stripe tip checkout.
 * Usage: /tip/thanks?dropId=<node-id>
 */

import { useSearchParams } from 'react-router-dom'

export default function TipThanks() {
  const [params] = useSearchParams()
  const dropId = params.get('dropId')

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <p style={s.wordmark}>pull</p>

        <div style={s.iconBox}></div>

        <h1 style={s.heading}>Thank you!</h1>
        <p style={s.hint}>
          Your tip is on its way to the artist. It'll be paid out monthly — every dollar makes a difference.
        </p>

        <a
          href={dropId ? `pull://tip-thanks?dropId=${dropId}` : '/'}
          style={s.btn}
        >
          Back to Pull ↗
        </a>

        <p style={s.legal}>Tips are collected by Pull and paid out to artists monthly.</p>
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
    background: '#FAF9F6',
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
  iconBox: { fontSize: '64px', lineHeight: 1 },
  heading: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '36px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    margin: 0,
    color: '#0A0A0A',
  },
  hint: {
    fontFamily: 'var(--font-body, sans-serif)',
    fontSize: '15px',
    opacity: 0.6,
    lineHeight: 1.7,
    margin: 0,
    maxWidth: '340px',
  },
  btn: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    background: '#0A0A0A',
    color: '#F5D000',
    border: 'none',
    borderRadius: '6px',
    padding: '16px 32px',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  legal: {
    fontFamily: 'var(--font-body, sans-serif)',
    fontSize: '11px',
    opacity: 0.3,
    lineHeight: 1.7,
    margin: 0,
  },
}
