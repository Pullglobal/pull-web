import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  calculatePrice,
  formatCountdown,
  getHeatColor,
  getNodeStatus,
  rowToNode,
} from '../lib/nodeUtils'
import { fetchActiveNodes } from '../lib/supabase'
import { useMapStore } from '../store/useMapStore'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const DRAFT_COLOR = '#007aff'
const SCHEDULED_COLOR = '#999999'
const DEFAULT_CENTER = [-74.006, 40.7128]
const DEFAULT_ZOOM = 15

const DEFAULT_DRAFT = {
  radius: 15,
  durationHours: 24,
  tracks: [],
}

export default function MapPage() {
  const navigate = useNavigate()
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef({})
  const circleIdsRef = useRef(new Set())
  const searchMarkerRef = useRef(null)

  const draftDrop = useMapStore((s) => s.draftDrop)
  const updateDraftDrop = useMapStore((s) => s.updateDraftDrop)
  const setDraftDrop = useMapStore((s) => s.setDraftDrop)
  const nodes = useMapStore((s) => s.nodes)
  const addNode = useMapStore((s) => s.addNode)
  const removeNode = useMapStore((s) => s.removeNode)
  const setNodes = useMapStore((s) => s.setNodes)
  const setUserLocation = useMapStore((s) => s.setUserLocation)

  const [now, setNow] = useState(Date.now())
  const [mapReady, setMapReady] = useState(false)
  const [tapHint, setTapHint] = useState(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const tapHintTimer = useRef(null)

  useEffect(() => {
    if (!draftDrop) setDraftDrop(DEFAULT_DRAFT)
  }, [])

  const activeDraft = draftDrop ?? DEFAULT_DRAFT
  const radius = activeDraft.radius ?? 15
  const duration = activeDraft.durationHours ?? 24
  const draftNodes = nodes.filter((n) => n.status === 'draft')
  // Show $0.00 until first node is placed
  const price = draftNodes.length === 0 ? '0.00' : calculatePrice(activeDraft, draftNodes.length)

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
        setUserLocation(loc)
        if (map.current) {
          map.current.flyTo({ center: [loc.longitude, loc.latitude], zoom: DEFAULT_ZOOM })
        }
      },
      () => console.warn('Geolocation denied')
    )
  }, [mapReady])

  useEffect(() => {
    fetchActiveNodes().then((rows) => {
      const liveNodes = rows.map(rowToNode)
      const existing = useMapStore.getState().nodes.filter((n) => n.status === 'draft')
      setNodes([...existing, ...liveNodes])
    })
  }, [])

  useEffect(() => {
    if (map.current) return
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 45,
      bearing: -10,
      attributionControl: false,
    })

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'bottom-right')

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      placeholder: 'Search for a location (using its address)...',
      collapsed: false,
      marker: false,
    })

    geocoder.on('result', (e) => {
      const [lng, lat] = e.result.geometry.coordinates
      // Remove previous search marker
      if (searchMarkerRef.current) searchMarkerRef.current.remove()
      // Create a pin marker at the search result
      const el = document.createElement('div')
      el.style.cssText = `
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 20px solid #ff0000;  // ← change this color
        position: relative;
        cursor: pointer;
      `
      const dot = document.createElement('div')
      dot.style.cssText = `
        width: 8px; height: 8px; border-radius: 50%;
        background: #ff0000;  // ← and this one
        position: absolute;
        top: -24px; left: -4px;
      `
      el.appendChild(dot)
      searchMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map.current)
    })

    map.current.addControl(geocoder, 'top-left')

    map.current.on('load', () => {
      map.current.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        paint: {
          'fill-extrusion-color': '#f2f1e5',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.7,
        },
      })
      setMapReady(true)
    })

    map.current.on('click', (e) => {
      const store = useMapStore.getState()
      const draft = store.draftDrop ?? DEFAULT_DRAFT
      const { lng, lat } = e.lngLat
      const newNode = {
        id: `draft-${Date.now()}`,
        coordinate: { latitude: lat, longitude: lng },
        status: 'draft',
        startTime: draft.scheduledStart ?? Date.now(),
        endTime: Date.now() + (draft.durationHours ?? 24) * 3600000,
        draftDrop: draft,
      }
      store.addNode(newNode)
      showHint('Node placed — adjust radius and duration in the panel')
    })

    return () => { map.current?.remove(); map.current = null }
  }, [])

  const showHint = (msg) => {
    if (tapHintTimer.current) clearTimeout(tapHintTimer.current)
    setTapHint(msg)
    tapHintTimer.current = setTimeout(() => setTapHint(null), 3000)
  }

  useEffect(() => {
    if (!mapReady || !map.current) return
    const currentIds = new Set(nodes.map((n) => n.id))

    Object.keys(markersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        markersRef.current[id].marker.remove()
        delete markersRef.current[id]
      }
    })

    nodes.forEach((node) => {
      const status = getNodeStatus(node, now)
      const heat = getHeatColor(node.playCount ?? 0)
      const dotColor = status === 'live' ? heat.dot
        : status === 'scheduled' ? SCHEDULED_COLOR
        : status === 'expired' ? '#444'
        : DRAFT_COLOR

      if (!markersRef.current[node.id]) {
        const el = document.createElement('div')
        el.style.cssText = `
          width:28px;height:28px;border-radius:50%;
          background:${dotColor};border:2.5px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer;position:relative;
        `
        if (status === 'live') {
          const pulse = document.createElement('div')
          pulse.style.cssText = `
            position:absolute;inset:-6px;border-radius:50%;
            border:2px solid ${heat.pulse};
            animation:pulseRing 2s ease-out infinite;pointer-events:none;
          `
          el.appendChild(pulse)
        }
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([node.coordinate.longitude, node.coordinate.latitude])
          .addTo(map.current)
        markersRef.current[node.id] = { marker, el }
      } else {
        markersRef.current[node.id].el.style.background = dotColor
      }
    })

    nodes.forEach((node) => {
      const status = getNodeStatus(node, now)
      const heat = getHeatColor(node.playCount ?? 0)
      const nodeRadius = node.status === 'draft' ? radius : (node.draftDrop?.radius ?? 15)
      const sourceId = `circle-${node.id}`
      const fillId = `fill-${node.id}`
      const strokeId = `stroke-${node.id}`

      const strokeColor = status === 'live' ? heat.stroke
        : status === 'draft' ? 'rgba(0,122,255,0.5)'
        : 'rgba(153,153,153,0.4)'
      const fillColor = status === 'live' ? heat.fill
        : status === 'draft' ? 'rgba(0,122,255,0.08)'
        : 'rgba(153,153,153,0.06)'

      const circleData = createGeoJSONCircle(
        [node.coordinate.longitude, node.coordinate.latitude],
        nodeRadius
      )

      if (!map.current.getSource(sourceId)) {
        map.current.addSource(sourceId, { type: 'geojson', data: circleData })
        map.current.addLayer({ id: fillId, type: 'fill', source: sourceId, paint: { 'fill-color': fillColor } })
        map.current.addLayer({ id: strokeId, type: 'line', source: sourceId, paint: { 'line-color': strokeColor, 'line-width': 1.5 } })
        circleIdsRef.current.add(node.id)
      } else {
        map.current.getSource(sourceId).setData(circleData)
        map.current.setPaintProperty(fillId, 'fill-color', fillColor)
        map.current.setPaintProperty(strokeId, 'line-color', strokeColor)
      }
    })

    circleIdsRef.current.forEach((id) => {
      if (!currentIds.has(id)) {
        const fillId = `fill-${id}`
        const strokeId = `stroke-${id}`
        const sourceId = `circle-${id}`
        if (map.current.getLayer(fillId)) map.current.removeLayer(fillId)
        if (map.current.getLayer(strokeId)) map.current.removeLayer(strokeId)
        if (map.current.getSource(sourceId)) map.current.removeSource(sourceId)
        circleIdsRef.current.delete(id)
      }
    })
  }, [nodes, mapReady, now, radius])

  const clearLastNode = useCallback(() => {
    const drafts = useMapStore.getState().nodes.filter((n) => n.status === 'draft')
    if (!drafts.length) return
    removeNode(drafts[drafts.length - 1].id)
  }, [removeNode])

  const handleReview = () => {
    if (draftNodes.length === 0) { showHint('Tap the map to place your node first'); return }
    navigate('/review')
  }

  const durationLabel = (() => {
    if (duration < 24) return `${Math.round(duration)}hr flash drop`
    const days = Math.round(duration / 24)
    return `${days} day${days !== 1 ? 's' : ''}`
  })()

  const scheduledNodes = nodes.filter((n) => getNodeStatus(n, now) === 'scheduled')

  return (
    <div style={s.page}>
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .mapboxgl-ctrl-bottom-right { bottom: 32px !important; right: ${panelOpen ? '380px' : '24px'} !important; transition: right 0.3s ease; }
        .mapboxgl-ctrl-top-left { top: 50px !important; left: 0px !important; }
        .mapboxgl-ctrl-geocoder {
          min-width: 280px !important;
          max-width: 320px !important;
          border-radius: 20px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25) !important;
          font-family: 'DM Sans', sans-serif !important;
          background: rgba(255,255,255,0.92) !important;
        }
        .mapboxgl-ctrl-geocoder--input {
          font-family: 'DM Sans', sans-serif !important;
          font-size: 13px !important;
          color: #0A0A0A !important;
        }
        .mapboxgl-ctrl-geocoder--icon-search { fill: #1E3A8A !important; }
        .mapboxgl-ctrl-geocoder--suggestion { font-family: 'DM Sans', sans-serif !important; font-size: 13px !important; }
      `}</style>

      <div ref={mapContainer} style={s.map} />

      <div style={s.topLeft}>
        <button style={s.backBtn} onClick={() => navigate('/create')}>← Back to Form</button>
        <div style={s.creativeBanner}>
          <span style={s.creativeBannerText}></span>
        </div>
      </div>

      <div style={s.stepBadge}>
        <span style={s.stepBadgeText}> tap the map to place your node</span>
      </div>

      {tapHint && <div style={s.tapHint}>{tapHint}</div>}

      {scheduledNodes.map((node, i) => (
        <div key={`label-${node.id}`} style={{ ...s.countdownLabel, top: `${80 + i * 56}px` }}>
          <span>{node.draftDrop?.trackTitle ?? 'Untitled'} · {node.draftDrop?.title ?? 'Unknown'}</span>
          <span style={{ opacity: 0.6, fontSize: '10px' }}>live in {formatCountdown((node.startTime ?? 0) - now)}</span>
        </div>
      ))}

      <button
        style={{ ...s.panelTab, right: panelOpen ? '356px' : '0px' }}
        onClick={() => setPanelOpen(!panelOpen)}
      >
        <span style={s.panelTabText}>{panelOpen ? '›' : '‹'}</span>
        {!panelOpen && draftNodes.length > 0 && (
          <span style={s.panelTabBadge}>{draftNodes.length}</span>
        )}
      </button>

      <div style={{ ...s.panel, transform: panelOpen ? 'translateX(0)' : 'translateX(100%)' }}>
        <div style={s.panelInner}>

          <div style={s.panelHeader}>
            <span style={s.panelTitle}>Drop Settings</span>
            <span style={s.panelPrice}>${price}</span>
          </div>

          <div style={s.sliderBlock}>
            <div style={s.sliderLabelRow}>
              <span style={s.sliderLabel}>Radius</span>
              <span style={s.sliderValue}>{radius}m (~{Math.round(radius * 3.28)}ft)</span>
            </div>
            <input type="range" min={15} max={100} step={5} value={radius}
              onChange={(e) => updateDraftDrop({ radius: Number(e.target.value) })}
              style={s.slider} />
            <div style={s.sliderTicks}><span>15m</span><span>43m</span><span>72m</span><span>100m</span></div>
          </div>

          <div style={s.sliderBlock}>
            <div style={s.sliderLabelRow}>
              <span style={s.sliderLabel}>Duration</span>
              <span style={s.sliderValue}>{durationLabel}</span>
            </div>
            <input type="range" min={1} max={720} step={1} value={duration}
              onChange={(e) => updateDraftDrop({ durationHours: Number(e.target.value) })}
              style={s.slider} />
            <div style={s.sliderTicks}><span>1hr</span><span>1wk</span><span>2wk</span><span>30d</span></div>
          </div>

          <div style={s.nodeStatus}>
            {draftNodes.length === 0
              ? <span style={s.nodeHint}>Tap the map to place your node</span>
              : <span style={s.nodeCount}>✓ {draftNodes.length} node{draftNodes.length !== 1 ? 's' : ''} placed</span>
            }
          </div>

          <div style={s.btnCol}>
            {draftNodes.length > 0 && (
              <button style={s.clearBtn} onClick={clearLastNode}>✕ Clear Last Node</button>
            )}
            <button
              style={{ ...s.reviewBtn, opacity: draftNodes.length === 0 ? 0.45 : 1 }}
              onClick={handleReview}
            >
              Review Drop →
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

function createGeoJSONCircle(center, radiusInMeters, points = 64) {
  const coords = []
  const distanceX = radiusInMeters / (111320 * Math.cos((center[1] * Math.PI) / 180))
  const distanceY = radiusInMeters / 110540
  for (let i = 0; i < points; i++) {
    const angle = (i * 360) / points
    const rad = (angle * Math.PI) / 180
    coords.push([center[0] + distanceX * Math.cos(rad), center[1] + distanceY * Math.sin(rad)])
  }
  coords.push(coords[0])
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } }
}

const s = {
  page: {
    position: 'fixed',
    inset: 0,
    paddingTop: '64px',
    overflow: 'hidden',
  },
  map: {
    position: 'absolute',
    inset: 0,
    top: '64px',
  },
  topLeft: {
    position: 'absolute',
    top: '80px',
    left: '16px',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'flex-start',
  },
  backBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--blue)',
    background: 'rgba(145, 139, 139, 0.92)',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 16px',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    boxShadow: '0 2px 8px rgba(255, 6, 6, 0.54)',
  },
  stepBadge: {
    position: 'absolute',
    bottom: '32px',
    left: '45%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    background: 'rgba(4, 255, 0, 0.6)',
    borderRadius: '20px',
    padding: '6px 18px',
    backdropFilter: 'blur(4px)',
  },
  stepBadgeText: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.08em',
  },
  tapHint: {
    position: 'absolute',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    background: 'rgba(255,103,9,0.88)',
    borderRadius: '20px',
    padding: '10px 22px',
    color: 'white',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
  },
  countdownLabel: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    background: 'rgba(0,0,0,0.75)',
    borderRadius: '8px',
    padding: '6px 14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    color: 'white',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
  },
  panelTab: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 20,
    background: 'rgba(232,220,196,0.97)',
    border: '1.5px solid rgba(10,10,10,0.15)',
    borderRight: 'none',
    borderRadius: '8px 0 0 8px',
    width: '28px',
    height: '64px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    transition: 'right 0.3s ease',
    boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
  },
  panelTabText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--black)',
    lineHeight: 1,
  },
  panelTabBadge: {
    background: 'var(--blue)',
    color: 'white',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
  },
  panel: {
    position: 'absolute',
    top: '64px',
    right: 0,
    bottom: 0,
    width: '356px',
    background: 'rgba(232,220,196,0.97)',
    borderLeft: '1.5px solid rgba(10,10,10,0.12)',
    zIndex: 15,
    transition: 'transform 0.3s ease',
    backdropFilter: 'blur(8px)',
    overflowY: 'auto',
  },
  panelInner: {
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderBottom: '1px solid rgba(10,10,10,0.1)',
    paddingBottom: '16px',
  },
  panelTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    opacity: 0.6,
  },
  panelPrice: {
    fontFamily: 'var(--font-mono)',
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--blue)',
  },
  sliderBlock: { display: 'flex', flexDirection: 'column', gap: '10px' },
  sliderLabelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  sliderLabel: { fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--black)' },
  sliderValue: { fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--blue)', fontWeight: 700 },
  slider: { width: '100%', accentColor: 'var(--blue)', cursor: 'pointer' },
  sliderTicks: { display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: 0.35, letterSpacing: '0.04em' },
  nodeStatus: { padding: '12px 0', borderTop: '1px solid rgba(10,10,10,0.08)' },
  nodeHint: { fontFamily: 'var(--font-mono)', fontSize: '12px', opacity: 0.4, letterSpacing: '0.04em' },
  nodeCount: { fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#03d237', fontWeight: 700, letterSpacing: '0.04em' },
  btnCol: { display: 'flex', flexDirection: 'column', gap: '10px' },
  clearBtn: {
    fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700,
    color: '#B00020', background: 'rgba(176,0,32,0.08)', border: '1px solid rgba(176,0,32,0.2)',
    borderRadius: '4px', padding: '12px', cursor: 'pointer', letterSpacing: '0.04em',
  },
  reviewBtn: {
    fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700,
    letterSpacing: '0.04em', background: 'var(--blue)', color: 'white',
    border: 'none', borderRadius: '4px', padding: '16px', cursor: 'pointer', textAlign: 'center',
  },
}
