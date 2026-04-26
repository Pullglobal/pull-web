import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Nav() {
  const { pathname } = useLocation()

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>PULL</Link>
      <div style={styles.links}>
        <Link
          to="/"
          style={{
            ...styles.link,
            borderBottom: pathname === '/' ? '2px solid var(--black)' : '2px solid transparent'
          }}
        >
          Info
        </Link>
        <Link
          to="/create"
          style={{
            ...styles.btn,
            background: pathname === '/create' ? 'var(--black)' : 'var(--black)',
          }}
        >
          Drop a Node
        </Link>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 40px',
    background: 'var(--yellow)',
    borderBottom: '1.5px solid var(--black)',
  },
  logo: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    fontSize: '20px',
    letterSpacing: '0.12em',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  link: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    letterSpacing: '0.06em',
    paddingBottom: '2px',
    transition: 'border-color 0.2s',
  },
  btn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    letterSpacing: '0.06em',
    background: 'var(--black)',
    color: 'var(--yellow)',
    padding: '10px 20px',
    borderRadius: '2px',
  },
}
