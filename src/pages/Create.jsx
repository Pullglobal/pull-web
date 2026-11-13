
import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useMapStore } from '../store/useMapStore'
 
/* ======================================================
   Password Gate
====================================================== */
const ACCESS_PASSWORD = 'EMPFREE'
 
function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
 
  const handleSubmit = () => {
    if (input.trim().toUpperCase() === ACCESS_PASSWORD) {
      setUnlocked(true)
    } else {
      setError(true)
      setInput('')
      setTimeout(() => setError(false), 2000)
    }
  }
 
  if (unlocked) return children
 
  return (
    <div style={gateStyles.page}>
      <div style={gateStyles.card}>
        <p style={gateStyles.wordmark}>PULL</p>
        <p style={gateStyles.body}>
          Artists are granted access to upload on the map on an invitation
          and submission basis only. You can send us your music at{' '}
          <a href="mailto:info@pull.global" style={gateStyles.link}>
            info@pull.global
          </a>
        </p>
        <div style={gateStyles.fieldRow}>
          <input
            style={{
              ...gateStyles.input,
              ...(error ? gateStyles.inputError : {}),
            }}
            type="text"
            placeholder={error ? 'Incorrect code' : 'Enter access code'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          <button style={gateStyles.btn} onClick={handleSubmit}>
            →
          </button>
        </div>
      </div>
    </div>
  )
}
 
const gateStyles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--yellow)',
    padding: '40px 20px',
  },
  card: {
    maxWidth: '480px',
    width: '100%',
  },
  wordmark: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 1200,
    fontSize: '29px',
    letterSpacing: '0.14em',
    opacity: 1.0,
    marginBottom: '40px',
  },
  body: {
    fontFamily: 'var(--font-body)',
    fontSize: '18px',
    fontWeight: 300,
    lineHeight: 1.7,
    marginBottom: '40px',
    opacity: 0.85,
  },
  link: {
    fontFamily: 'var(--font-mono)',
    fontSize: '14px',
    borderBottom: '1px solid currentColor',
    paddingBottom: '1px',
  },
  fieldRow: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    fontFamily: 'var(--font-mono)',
    fontSize: '14px',
    letterSpacing: '0.06em',
    padding: '14px 16px',
    border: '1.5px solid var(--black)',
    borderRadius: '2px',
    background: 'transparent',
    outline: 'none',
  },
  inputError: {
    borderColor: '#cc0000',
    color: '#cc0000',
  },
  btn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '18px',
    fontWeight: 700,
    background: 'var(--black)',
    color: 'var(--yellow)',
    border: 'none',
    borderRadius: '2px',
    padding: '14px 20px',
    cursor: 'pointer',
  },
}
 
/* ======================================================
   Genre options
====================================================== */
const GENRES = [
  'Hip-Hop',
  'Rock',
  'Indie',
  'Electronic',
  'Pop',
  'World',
  'Ambient',
  'Country',
  'Jazz',
  'Other',
]
 
/* ======================================================
   Helpers
====================================================== */
// Converts "4:32" or "1:04:32" → milliseconds
function parseTimeToMs(str) {
  const parts = str.trim().split(':').map(Number)
  if (parts.some(isNaN)) return 0
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000
  if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000
  return 0
}
 
/* ======================================================
   Create Page
====================================================== */
export default function Create() {
  const navigate = useNavigate()
  const setDraftDrop = useMapStore((s) => s.setDraftDrop)
  const [step, setStep] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [form, setForm] = useState({
    artistName: '',
    trackTitle: '',
    genre: '',
    blurb: '',
    instructions: '',
    externalLink: '',
    email: '',
  })
 
  // Audio state
  const [audioFile, setAudioFile] = useState(null)
  const audioInputRef = useRef(null)
 
  // Cover art state
  const [coverArt, setCoverArt] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const coverInputRef = useRef(null)
 
  // Schedule state
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 16)
  })
 
  // Project / tracks state
  const [isProject, setIsProject] = useState(false)
  const [projectTracks, setProjectTracks] = useState([
    { title: '', time: '0:00' },
  ])
 
  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
 
  const handleAudioChange = (e) => {
    const file = e.target.files[0]
    if (file) setAudioFile(file)
  }
 
  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCoverArt(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }
 
  const removeAudio = () => {
    setAudioFile(null)
    if (audioInputRef.current) audioInputRef.current.value = ''
  }
 
  const removeCover = () => {
    setCoverArt(null)
    setCoverPreview(null)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }
 
  // Track editor helpers
  const updateTrack = (index, field, value) => {
    setProjectTracks(prev => prev.map((t, i) =>
      i === index ? { ...t, [field]: value } : t
    ))
  }
 
  const addTrack = () => {
    setProjectTracks(prev => [...prev, { title: '', time: '' }])
  }
 
  const removeTrack = (index) => {
    setProjectTracks(prev => prev.filter((_, i) => i !== index))
  }
 
  const uploadFile = async (file, bucket) => {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }
 
  const handleContinue = async () => {
    if (!form.artistName || !form.trackTitle) {
      setUploadError('Artist name and track title are required.')
      return
    }
    if (isProject && projectTracks.some(t => !t.title.trim())) {
      setUploadError('All tracks need a name.')
      return
    }
    setUploadError(null)
    setUploading(true)
    try {
      let audioUrl = null
      let coverUrl = null
 
      if (audioFile) audioUrl = await uploadFile(audioFile, 'audio')
      if (coverArt) coverUrl = await uploadFile(coverArt, 'covers')
 
      const tracks = isProject
        ? projectTracks.map(t => ({
            title: t.title.trim(),
            startMs: parseTimeToMs(t.time),
          }))
        : [{ title: form.trackTitle, startMs: 0 }]
 
      const draft = {
        title: form.artistName,
        trackTitle: form.trackTitle,
        genre: form.genre,
        description: form.blurb,
        collabNotes: form.instructions,
        externalLink: form.externalLink,
        contactEmail: form.email,
        audioUri: audioUrl,
        coverArt: coverUrl,
        scheduledStart: isScheduled ? new Date(scheduledDate).getTime() : undefined,
        radius: 25,
        durationHours: 24,
        isProject,
        tracks,
      }
 
      setDraftDrop(draft)
      navigate('/map')
    } catch (err) {
      setUploadError(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }
 
  return (
    <PasswordGate>
      <div style={styles.page}>
        <div style={styles.inner}>
 
          {/* Header */}
          <div style={styles.header}>
            <p style={styles.eyebrow}>// artist portal</p>
            <h1 style={styles.title}>Build Your Drop</h1>
            <p style={styles.subtitle}>
              Fill in your track details below. You'll place it on the map and set your radius next.
            </p>
          </div>
 
          {/* Steps indicator */}
          <div style={styles.stepsRow}>
            {['Track Info', 'Place on Map', 'Review & Pay'].map((s, i) => (
              <div key={s} style={styles.stepPill}>
                <div style={{
                  ...styles.stepDot,
                  background: i + 1 <= step ? 'var(--black)' : 'transparent',
                  border: '1.5px solid var(--black)',
                }} />
                <span style={{
                  ...styles.stepLabel,
                  opacity: i + 1 <= step ? 1 : 0.35,
                }}>{s}</span>
              </div>
            ))}
          </div>
 
          {/* Form */}
          <div style={styles.form}>
 
            <Field label="Artist Name" placeholder="Your Stage Name" value={form.artistName} onChange={v => update('artistName', v)} />
            <Field
              label={isProject ? 'Project / Album Title' : 'Track Title'}
              placeholder={isProject ? 'Name this project' : 'Name this track'}
              value={form.trackTitle}
              onChange={v => update('trackTitle', v)}
            />
 
            {/* Genre dropdown */}
            <div style={fieldStyles.wrapper}>
              <label style={fieldStyles.label}>Genre</label>
              <select
                style={fieldStyles.select}
                value={form.genre}
                onChange={e => update('genre', e.target.value)}
              >
                <option value="">Select a genre</option>
                {GENRES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
 
            <Field label="Blurb" placeholder="I wrote this song right here after a nasty breakup..." value={form.blurb} onChange={v => update('blurb', v)} multiline />
            <Field label="Collabs or Special Instructions" placeholder="Give the Barista the Code 1FH4..." value={form.instructions} onChange={v => update('instructions', v)} multiline />
            <Field label="External Link" placeholder="https://soundcloud.com/yourtrack" value={form.externalLink} onChange={v => update('externalLink', v)} />
            <Field label="Contact Email" placeholder="your@email.com" value={form.email} onChange={v => update('email', v)} type="email" />
 
            {/* AUDIO */}
            <div style={styles.sectionBlock}>
              <p style={styles.sectionLabel}>Audio</p>
              <input
                ref={audioInputRef}
                type="file"
                accept=".mp3,.wav,.flac,.aiff,.ogg,.m4a,.aac,*/*"
                style={{ display: 'none' }}
                onChange={handleAudioChange}
              />
              <button
                style={styles.uploadBtn}
                onClick={() => audioInputRef.current?.click()}
              >
                {audioFile ? 'Change Audio' : 'Upload Audio'}
              </button>
 
              {audioFile && (
                <>
                  <div style={styles.fileCard}>
                    <span style={styles.fileIcon}>🎵</span>
                    <span style={styles.fileName}>{audioFile.name}</span>
                  </div>
                  <button style={styles.removeBtn} onClick={removeAudio}>
                    Remove Audio
                  </button>
                </>
              )}
            </div>
 
            {/* COVER ART */}
            <div style={styles.sectionBlock}>
              <p style={styles.sectionLabel}>Cover Art</p>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCoverChange}
              />
              <button
                style={styles.uploadBtn}
                onClick={() => coverInputRef.current?.click()}
              >
                {coverArt ? 'Change Cover Art' : 'Select Cover Image'}
              </button>
 
              {coverPreview && (
                <>
                  <img
                    src={coverPreview}
                    alt="Cover art preview"
                    style={styles.coverPreview}
                  />
                  <button style={styles.removeBtn} onClick={removeCover}>
                    Remove Cover
                  </button>
                </>
              )}
            </div>
 
            {/* PROJECT TRACKS */}
            <div style={styles.sectionBlock}>
              <div style={styles.scheduleRow}>
                <div>
                  <p style={styles.sectionLabel}>Upload Type</p>
                  <p style={styles.sectionHint}>
                    {isProject
                      ? 'Add track names and timestamps below.'
                      : 'Toggle on if uploading an EP, album, or multi-track project.'}
                  </p>
                </div>
                <button
                  style={{
                    ...styles.toggleBtn,
                    background: isProject ? 'var(--blue)' : '#888',
                  }}
                  onClick={() => setIsProject(!isProject)}
                >
                  {isProject ? 'Project ✓' : 'Single'}
                </button>
              </div>
 
              {isProject && (
                <div style={styles.trackEditor}>
                  {projectTracks.map((track, i) => (
                    <div key={i} style={styles.trackRow}>
                      <span style={styles.trackIndex}>{i + 1}</span>
                      <input
                        style={{ ...fieldStyles.input, flex: 1 }}
                        placeholder="Track name"
                        value={track.title}
                        onChange={e => updateTrack(i, 'title', e.target.value)}
                      />
                      <input
                        style={{ ...fieldStyles.input, width: '72px', textAlign: 'center' }}
                        placeholder="0:00"
                        value={track.time}
                        onChange={e => updateTrack(i, 'time', e.target.value)}
                      />
                      {projectTracks.length > 1 && (
                        <button
                          style={styles.trackRemoveBtn}
                          onClick={() => removeTrack(i)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button style={styles.addTrackBtn} onClick={addTrack}>
                    + Add Track
                  </button>
                </div>
              )}
            </div>
 
            {/* SCHEDULE */}
            <div style={styles.sectionBlock}>
              <div style={styles.scheduleRow}>
                <p style={styles.sectionLabel}>Schedule Drop</p>
                <button
                  style={{
                    ...styles.toggleBtn,
                    background: isScheduled ? 'var(--blue)' : '#bb2424',
                  }}
                  onClick={() => setIsScheduled(!isScheduled)}
                >
                  {isScheduled ? 'Scheduled ✓' : 'Drop Immediately'}
                </button>
              </div>
 
              {isScheduled && (
                <input
                  type="datetime-local"
                  style={styles.dateInput}
                  value={scheduledDate}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={e => setScheduledDate(e.target.value)}
                />
              )}
            </div>
 
            {/* CTA */}
            {uploadError && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#B00020', textAlign: 'center' }}>
                {uploadError}
              </p>
            )}
            <button
              style={{ ...styles.nextBtn, opacity: uploading ? 0.6 : 1 }}
              onClick={handleContinue}
              disabled={uploading}
            >
              {uploading ? 'Uploading... (May take 30 secs)' : 'Continue to Map Placement →'}
            </button>
 
            <p style={styles.legal}>
              By continuing you agree to Pull's{' '}
              <a href="/" style={{ borderBottom: '1px solid currentColor' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="/" style={{ borderBottom: '1px solid currentColor' }}>Privacy Policy</a>.
              Map placement and payment happen next.
            </p>
 
          </div>
        </div>
      </div>
    </PasswordGate>
  )
}
 
function Field({ label, placeholder, value, onChange, multiline, type = 'text' }) {
  return (
    <div style={fieldStyles.wrapper}>
      <label style={fieldStyles.label}>{label}</label>
      {multiline ? (
        <textarea
          style={{ ...fieldStyles.input, minHeight: '100px', resize: 'vertical' }}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          style={fieldStyles.input}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
 
const fieldStyles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    letterSpacing: '0.08em',
    opacity: 0.6,
  },
  input: {
    background: 'rgba(255,255,255,0.55)',
    border: '1.5px solid rgba(10,10,10,0.2)',
    borderRadius: '4px',
    padding: '14px 16px',
    fontSize: '15px',
    fontFamily: 'var(--font-body)',
    color: 'var(--black)',
    outline: 'none',
    width: '100%',
  },
  select: {
    background: 'rgba(255,255,255,0.55)',
    border: '1.5px solid rgba(10,10,10,0.2)',
    borderRadius: '4px',
    padding: '14px 16px',
    fontSize: '15px',
    fontFamily: 'var(--font-body)',
    color: 'var(--black)',
    outline: 'none',
    width: '100%',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230A0A0A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    paddingRight: '40px',
  },
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
  header: {
    marginBottom: '48px',
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
    marginBottom: '16px',
  },
  subtitle: {
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
    fontWeight: 300,
    opacity: 0.7,
    lineHeight: 1.7,
  },
  stepsRow: {
    display: 'flex',
    gap: '32px',
    marginBottom: '48px',
    borderBottom: '1.5px solid rgba(10,10,10,0.12)',
    paddingBottom: '24px',
    flexWrap: 'wrap',
  },
  stepPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stepDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  stepLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.08em',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(10,10,10,0.1)',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    opacity: 0.7,
  },
  sectionHint: {
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    opacity: 0.5,
    marginTop: '2px',
    lineHeight: 1.5,
  },
  uploadBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    letterSpacing: '0.06em',
    fontWeight: 700,
    background: 'var(--blue)',
    color: 'white',
    padding: '14px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: 'none',
    textAlign: 'center',
  },
  fileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255,255,255,0.7)',
    border: '1.5px solid rgba(10,10,10,0.1)',
    borderRadius: '4px',
    padding: '12px 16px',
  },
  fileIcon: {
    fontSize: '18px',
  },
  fileName: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    color: 'var(--black)',
    opacity: 0.8,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  removeBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    letterSpacing: '0.06em',
    color: '#B00020',
    background: 'rgba(176,0,32,0.08)',
    border: '1px solid rgba(176,0,32,0.2)',
    borderRadius: '4px',
    padding: '10px 16px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  coverPreview: {
    width: '100%',
    aspectRatio: '1 / 1',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1.5px solid rgba(10,10,10,0.1)',
  },
  scheduleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  toggleBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  dateInput: {
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
    background: 'rgba(255,255,255,0.55)',
    border: '1.5px solid rgba(10,10,10,0.2)',
    borderRadius: '4px',
    padding: '14px 16px',
    color: 'var(--black)',
    outline: 'none',
    width: '100%',
  },
  trackEditor: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  trackRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  trackIndex: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    opacity: 0.4,
    width: '16px',
    textAlign: 'right',
    flexShrink: 0,
  },
  trackRemoveBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: '#B00020',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 6px',
    flexShrink: 0,
    opacity: 0.6,
  },
  addTrackBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    letterSpacing: '0.06em',
    fontWeight: 700,
    background: 'transparent',
    border: '1.5px dashed rgba(10,10,10,0.25)',
    borderRadius: '4px',
    padding: '12px',
    cursor: 'pointer',
    color: 'var(--black)',
    opacity: 0.6,
    textAlign: 'center',
  },
  nextBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    background: 'var(--black)',
    color: 'var(--yellow)',
    padding: '18px 32px',
    borderRadius: '2px',
    cursor: 'pointer',
    border: 'none',
    marginTop: '12px',
    width: '100%',
  },
  legal: {
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    opacity: 0.4,
    lineHeight: 1.7,
    textAlign: 'center',
  },
  blue: '#1E3A8A',
}