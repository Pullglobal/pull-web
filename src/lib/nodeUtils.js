// ── Status ──────────────────────────────────────────────
export function getNodeStatus(node, now) {
  if (node.status === 'draft') return 'idle'
  if (!node.startTime || !node.endTime) return 'idle'
  if (now < node.startTime) return 'scheduled'
  if (now >= node.startTime && now < node.endTime) return 'live'
  return 'expired'
}

// ── Countdown ────────────────────────────────────────────
export function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// ── Distance ─────────────────────────────────────────────
export function distanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = (v) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Heat color (play count → color) ─────────────────────
export function getHeatColor(playCount) {
  if (playCount >= 50) return {
    dot: '#FF3B30',
    stroke: 'rgba(255,59,48,0.6)',
    fill: 'rgba(255,59,48,0.12)',
    pulse: 'rgba(255,59,48,0.25)',
  }
  if (playCount >= 20) return {
    dot: '#FF9500',
    stroke: 'rgba(255,149,0,0.6)',
    fill: 'rgba(255,149,0,0.12)',
    pulse: 'rgba(255,149,0,0.25)',
  }
  if (playCount >= 5) return {
    dot: '#FFCC00',
    stroke: 'rgba(255,204,0,0.6)',
    fill: 'rgba(255,204,0,0.12)',
    pulse: 'rgba(255,204,0,0.25)',
  }
  return {
    dot: '#00C97C',
    stroke: 'rgba(0,201,124,0.6)',
    fill: 'rgba(0,201,124,0.12)',
    pulse: 'rgba(0,201,124,0.25)',
  }
}

// ── Pricing ──────────────────────────────────────────────
export function calculatePrice(drop, nodeCount) {
  const base = 8; // first node, 24h, 1 track
  const hours = drop?.durationHours ?? 24;
  const durationCost = hours < 24 ? 20 : (hours / 24 - 1) * 3; // beyond 24h
  const trackCount = drop?.tracks?.length || 1;
  const trackCost = (trackCount - 1) * 3;                      // beyond the first track
  const normalized = Math.min(drop?.radius ?? 15, 100) / 100;
  const radiusCost = 70 * Math.pow(normalized, 2.8);
  const extraNodeCost = Math.max(0, nodeCount - 1) * 5;        // beyond the first node
  return (base + durationCost + trackCost + radiusCost + extraNodeCost).toFixed(2);
}

// ── Map node row → internal node shape ──────────────────
export function rowToNode(row) {
  return {
    id: row.id,
    coordinate: { latitude: row.latitude, longitude: row.longitude },
    status: row.status ?? 'live',
    startTime: row.start_time,
    endTime: row.end_time,
    playCount: row.play_count ?? 0,
    draftDrop: {
      title: row.title,
      trackTitle: row.track_title,
      description: row.description,
      collabNotes: row.collab_notes,
      externalLink: row.external_link,
      audioUri: row.audio_url,
      coverArt: row.cover_art_url,
      radius: row.radius,
      durationHours: row.duration_hours,
    },
  }
}
