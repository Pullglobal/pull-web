import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

function WarpGrid() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animFrame
    let t = 0

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(10,10,10,0.25)'
      ctx.lineWidth = 1

      const cols = 22
      const rows = 16
      const cellW = W / cols
      const cellH = H / rows

      // Draw warped vertical lines
      for (let i = 0; i <= cols; i++) {
        ctx.beginPath()
        for (let j = 0; j <= rows; j++) {
          const x = i * cellW + Math.sin(j * 0.4 + t + i * 0.2) * 18
          const y = j * cellH
          if (j === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      // Draw warped horizontal lines
      for (let j = 0; j <= rows; j++) {
        ctx.beginPath()
        for (let i = 0; i <= cols; i++) {
          const x = i * cellW
          const y = j * cellH + Math.sin(i * 0.35 + t * 0.8 + j * 0.25) * 14
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      t += 0.008
      animFrame = requestAnimationFrame(draw)
    }

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}

export default function Home() {
  return (
    <div style={styles.page}>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.gridWrapper}>
          <WarpGrid />
        </div>
        <div style={styles.heroContent}>
          <p style={styles.eyebrow}>Putting Music on the Map.</p>
          <h1 style={styles.headline}>
            What's your<br />Pull.
          </h1>
          <p style={styles.sub}>
            Pull lets artists plant audio in real locations on a 3-D map,
            allowing listeners to discover music where it belongs... in the real world.
          </p>
          <div style={styles.heroActions}>
            <Link to="/create" style={styles.ctaPrimary}>Drop a Node →</Link>
            <a href="#how" style={styles.ctaSecondary}>How it works</a>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={styles.section}>
        <p style={styles.sectionLabel}> how it works</p>
        <div style={styles.steps}>
          {[
            {
              n: '01',
              title: 'Plant your sound',
              body: 'Choose a location that means something. A corner where you wrote the song, A city block that shaped you, A venue you have a partnership with...Let you music live there.',
            },
            {
              n: '02',
              title: 'Set your radius',
              body: 'Decide how far your node reaches, from a single doorway to a whole city block. Listeners have to be inside that radius to hear it.',
            },
            {
              n: '03',
              title: 'It goes live',
              body: 'Your drop appears on the Pull map. Listeners walking by are pulled. They play it, they lern about you and have an unforgettable ',
            },
          ].map((s) => (
            <div key={s.n} style={styles.step}>
              <span style={styles.stepNum}>{s.n}</span>
              <h3 style={styles.stepTitle}>{s.title}</h3>
              <p style={styles.stepBody}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div style={styles.divider} />

      {/* WHY PULL */}
      <section style={styles.section}>
        <p style={styles.sectionLabel}> why pull</p>
        <div style={styles.twoCol}>
          <div>
            <h2 style={styles.h2}>
              Music belongs<br />in the real world.
            </h2>
          </div>
          <div>
            <p style={styles.bodyText}>
              Streaming flattened music into an infinite scroll. Pull pulls music out of the matrix and puts it back where it belongs: with the people.
              Songs become tethered to places and moments that actually matter.
            </p>
            <p style={styles.bodyText} >
              For artists, Pull is here to revolutionize the release strategy. Songs don't belong in bios, they belong in the real world.
              As artists ourselves, our hope is that you will tell new stories, find new ways to prosper and rewrite the future of music with the tools this app offers. 
              For listeners, Pull is an adventure waiting to happen. Discover new music as you wander a new city or get out to experience a drop by your favorite artist. 
            </p>
            <p style={styles.bodyText}>
              This isn't about racking up followers or appeasing an algorithm, it's about getting music out for the people and getting people out for the music.
            </p>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div style={styles.divider} />

      {/* PRICING TEASER */}
      <section style={styles.section}>
        <p style={styles.sectionLabel}> drop pricing</p>
        <div style={styles.pricingGrid}>
          {[
            { label: 'Base drop', value: '$10', note: 'Any node, any location' },
            { label: 'Duration', value: '$3/day', note: 'or $20 for under 24hrs' },
            { label: 'Radius', value: 'Variable', note: 'Scales with how far it reaches' },
            { label: 'Per track', value: '$3', note: 'Add more songs to one drop' },
          ].map((p) => (
            <div key={p.label} style={styles.pricingCard}>
              <p style={styles.pricingLabel}>{p.label}</p>
              <p style={styles.pricingValue}>{p.value}</p>
              <p style={styles.pricingNote}>{p.note}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link to="/create" style={styles.ctaPrimary}>Start your drop →</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <span style={styles.footerLogo}>PULL</span>
        <span style={styles.footerTag}>putting music on the map</span>
        <a href="mailto:info@pull.global" style={styles.footerLink}>info@pull.global</a>
      </footer>

    </div>
  )
}

const styles = {
  page: {
    paddingTop: '64px',
  },

  // HERO
  hero: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottom: '1.5px solid var(--black)',
  },
  gridWrapper: {
    position: 'absolute',
    inset: 0,
    opacity: 0.6,
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '760px',
    padding: '80px 40px',
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    letterSpacing: '0.1em',
    marginBottom: '24px',
    opacity: 0.6,
  },
  headline: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(48px, 8vw, 96px)',
    fontWeight: 700,
    lineHeight: 1.0,
    letterSpacing: '-0.02em',
    marginBottom: '32px',
  },
  sub: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(16px, 2vw, 20px)',
    fontWeight: 300,
    lineHeight: 1.7,
    maxWidth: '520px',
    marginBottom: '48px',
    opacity: 0.85,
  },
  heroActions: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ctaPrimary: {
    fontFamily: 'var(--font-mono)',
    fontSize: '15px',
    fontWeight: 700,
    background: 'var(--black)',
    color: 'var(--yellow)',
    padding: '16px 32px',
    borderRadius: '2px',
    letterSpacing: '0.04em',
    display: 'inline-block',
  },
  ctaSecondary: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    letterSpacing: '0.06em',
    borderBottom: '1.5px solid var(--black)',
    paddingBottom: '2px',
    opacity: 0.7,
  },

  // SECTIONS
  section: {
    padding: '100px 40px',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    letterSpacing: '0.1em',
    opacity: 0.45,
    marginBottom: '48px',
  },
  divider: {
    borderTop: '1.5px solid var(--black)',
    opacity: 0.15,
    margin: '0 40px',
  },

  // HOW IT WORKS
  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '48px',
  },
  step: {
    borderTop: '1.5px solid var(--black)',
    paddingTop: '24px',
  },
  stepNum: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    opacity: 0.35,
    letterSpacing: '0.1em',
    display: 'block',
    marginBottom: '16px',
  },
  stepTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '12px',
    letterSpacing: '-0.01em',
  },
  stepBody: {
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
    fontWeight: 300,
    lineHeight: 1.7,
    opacity: 0.8,
  },

  // WHY PULL
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '64px',
    alignItems: 'start',
  },
  h2: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(24px, 3vw, 36px)',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  bodyText: {
    fontFamily: 'var(--font-body)',
    fontSize: '16px',
    fontWeight: 300,
    lineHeight: 1.8,
    opacity: 0.8,
    marginBottom: '20px',
  },

  // PRICING
  pricingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2px',
    background: 'var(--black)',
    border: '1.5px solid var(--black)',
  },
  pricingCard: {
    background: 'var(--yellow)',
    padding: '32px 28px',
  },
  pricingLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.1em',
    opacity: 0.45,
    marginBottom: '12px',
  },
  pricingValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  pricingNote: {
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    opacity: 0.6,
    lineHeight: 1.5,
  },

  // FOOTER
  footer: {
    borderTop: '1.5px solid var(--black)',
    padding: '40px',
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
    flexWrap: 'wrap',
  },
  footerLogo: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    fontSize: '18px',
    letterSpacing: '0.12em',
  },
  footerTag: {
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    opacity: 0.45,
    flex: 1,
    fontStyle: 'italic',
  },
  footerLink: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    letterSpacing: '0.06em',
    opacity: 0.5,
    borderBottom: '1px solid currentColor',
    paddingBottom: '1px',
  },
}
