import React from 'react'
import { Link } from 'react-router-dom'

export default function MapPage() {
  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <p style={styles.eyebrow}>// step 2 of 3</p>
        <h1 style={styles.title}>Place on Map</h1>
        <div style={styles.placeholder}>
          <p style={styles.placeholderIcon}>🗺</p>
          <p style={styles.placeholderText}>Map coming soon</p>
          <p style={styles.placeholderSub}>
            This is where you'll pin your drop to a location and set your radius.
          </p>
        </div>
        <div style={styles.actions}>
          <Link to="/create" style={styles.backBtn}>← Back to Track Info</Link>
          <button style={styles.nextBtn} onClick={() => alert('Review & Pay coming soon')}>
            Continue to Review & Pay →
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    paddingTop: '64px',
    minHeight: '100vh',
    paddingBottom: '80px',
  },
  inner: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '60px 40px',
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    letterSpacing: '0.1em',
    opacity: 0.4,
    marginBottom: '16px',
  },
  title: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(32px, 6vw, 56px)',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.0,
    marginBottom: '48px',
  },
  placeholder: {
    background: 'rgba(255,255,255,0.4)',
    border: '1.5px dashed rgba(10,10,10,0.2)',
    borderRadius: '8px',
    padding: '80px 40px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
  },
  placeholderIcon: {
    fontSize: '40px',
  },
  placeholderText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '18px',
    fontWeight: 700,
    opacity: 0.5,
  },
  placeholderSub: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    opacity: 0.4,
    maxWidth: '300px',
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  backBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    letterSpacing: '0.06em',
    color: 'var(--blue)',
    fontWeight: 600,
    borderBottom: '1.5px solid var(--blue)',
    paddingBottom: '2px',
  },
  nextBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    background: 'var(--black)',
    color: 'var(--yellow)',
    padding: '16px 28px',
    borderRadius: '2px',
    cursor: 'pointer',
    border: 'none',
  },
}
