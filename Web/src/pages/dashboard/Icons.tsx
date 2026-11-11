import coroaImg from '../../assets/coroa.png'

export function DashIcon({ name }: { name: string }) {
  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10v9.5a1 1 0 0 0 1 1h3.5v-5.5a1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5v5.5H17a1 1 0 0 0 1-1V10" strokeLinejoin="round" />
        </svg>
      )
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
          <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
      )
    case 'bookmark':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" strokeLinejoin="round" />
        </svg>
      )
    case 'bookmark-filled':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" strokeLinejoin="round" />
        </svg>
      )
    case 'filter':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 5h16L14 13v6l-4 2v-8L4 5Z" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      )
    case 'question':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.3 9.6a2.7 2.7 0 0 1 5.3.7c0 1.8-2.3 1.9-2.3 3.7" strokeLinecap="round" />
          <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'people':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="9" cy="8" r="3.2" />
          <path d="M2.8 19.5c.9-3.3 3.3-5 6.2-5s5.3 1.7 6.2 5" strokeLinecap="round" />
          <circle cx="17" cy="7.5" r="2.4" />
          <path d="M15.5 19a5.5 5.5 0 0 1 5.7-4.6" strokeLinecap="round" />
        </svg>
      )
    case 'bell':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
      )
    case 'search':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M20 20l-4.3-4.3" strokeLinecap="round" />
        </svg>
      )
    case 'chevron-left':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'chevron-right':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'plus':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      )
    case 'trash':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m1 0-.7 12.1a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M4 12.5 9.5 18 20 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'arrow':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'building':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 21V9l8-5 8 5v12" strokeLinejoin="round" />
          <path d="M9 21v-6h6v6M4 21h16" strokeLinecap="round" />
        </svg>
      )
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'pin':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" strokeLinejoin="round" />
          <circle cx="12" cy="9.5" r="2.3" />
        </svg>
      )
    case 'schedule':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
          <path d="M3.5 9.5h17M8 3v4M16 3v4M12 13.2l1.6 1.6" strokeLinecap="round" />
        </svg>
      )
    case 'file':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 3.2h6.2l4.8 4.8v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.2a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
          <path d="M13.2 3.2V8h4.8" strokeLinejoin="round" />
          <path d="M9 13h6M9 16.5h6" strokeLinecap="round" />
        </svg>
      )
    case 'dots':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5.2" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="18.8" r="1.8" />
        </svg>
      )
    case 'id-badge':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.2" y="4.5" width="17.6" height="15" rx="2.4" />
          <circle cx="12" cy="10.2" r="2.6" />
          <path d="M7.6 17c.9-2.1 2.4-3 4.4-3s3.5.9 4.4 3" strokeLinecap="round" />
        </svg>
      )
    case 'camera':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" strokeLinejoin="round" />
          <circle cx="12" cy="13" r="3.4" />
        </svg>
      )
    case 'close':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'trophy':
      // Ícone da coroa (imagem enviada pelo usuário) no lugar do troféu SVG.
      return (
        <img
          src={coroaImg}
          alt="Premium"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      )
    // ---------- ícones de preferências (SVGs com currentColor) ----------
    case 'tech':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <rect x="5.5" y="6.5" width="13" height="8.5" rx="1" />
          <circle cx="12" cy="16" r="0.7" fill="currentColor" stroke="none" />
          <path d="M10 17l-.8 3h5.6l-.8-3" />
          <path d="M8.5 20h7" />
        </svg>
      )
    case 'saude':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 3v6c0 3.3 1.8 6 4 6s4-2.7 4-6V3" />
          <path d="M9 15v3c0 3 2.2 5.5 5 5.5s5-2.5 5-5.5v-2" />
          <circle cx="19" cy="13" r="3" />
        </svg>
      )
    case 'educacao':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
          <path d="M7 10v4.5c0 2.5 2.2 4.5 5 4.5s5-2 5-4.5V10" />
          <path d="M19 8.5v4.5" />
          <circle cx="19" cy="14.3" r="1.3" />
        </svg>
      )
    case 'infraestrutura':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 11.5h20" />
          <rect x="3" y="6.5" width="3.5" height="5" />
          <path d="M7.5 11.5V6L10 3.5 12.5 6v5.5" />
          <rect x="14" y="3" width="3.5" height="8.5" />
          <rect x="18.5" y="6.5" width="3" height="5" />
          <rect x="15" y="4.5" width="1.5" height="1.5" fill="currentColor" stroke="none" />
          <rect x="15" y="7" width="1.5" height="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="17.5" r="3" />
          <path d="M12 14.5v-1.5M12 20.5v1.5M9 17.5H7.5M15 17.5h1.5M10 15.5l-1-1M14 15.5l1-1M10 19.5l-1 1M14 19.5l1 1" />
        </svg>
      )
    case 'cultura':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 7c0-1.5 1.5-2.5 3.5-2.5h3.5c2 0 3.5 1 3.5 2.5v4.5c0 3.5-2.5 6-5.25 6S3.5 15 3.5 11.5V7z" />
          <path d="M13 9.5c0-1.5 1.5-2.5 3.5-2.5H20c2 0 3.5 1 3.5 2.5V14c0 3.5-2.5 6-5.25 6S13 17.5 13 14V9.5z" />
          <path d="M6 9.5q1-1 2 0M9 9.5q1-1 2 0" />
          <path d="M6 13q1.75 2.5 3.5 0" />
          <path d="M15.5 12q1 1 2 0M18.5 12q1 1 2 0" />
          <path d="M16 15.5q1.75-2.5 3.5 0" />
        </svg>
      )
    case 'servicos':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5.2 4.6 7.8 2.1H18.5V4" />
          <path d="M7.8 2.1V4.6H5.2" />
          <path d="M5.2 4.6V8.2" />
          <path d="M5.2 16v6.5h13.3" />
          <rect x="1.1" y="8.2" width="10" height="7.8" />
          <path d="M1.1 8.2 11.1 16M11.1 8.2 1.1 16" />
          <rect x="13.6" y="4" width="9" height="8.9" />
          <path d="M15.4 6.4h5.5M15.4 8.7h5.5M15.4 11h5.5" />
          <circle cx="18.9" cy="18" r="4.4" />
          <circle cx="18.9" cy="18" r="2" />
        </svg>
      )
    case 'consultoria':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="2.5" width="10" height="7.5" rx="1.5" />
          <path d="M12 10v2.5l-2-1.5" />
          <path d="M9.5 5h5M9.5 7.5h3.5" />
          <circle cx="6.5" cy="15.5" r="2.5" />
          <path d="M2 22c0-2.5 2-4.5 4.5-4.5S11 19.5 11 22" />
          <circle cx="17.5" cy="15.5" r="2.5" />
          <path d="M13 22c0-2.5 2-4.5 4.5-4.5S22 19.5 22 22" />
        </svg>
      )
    case 'engenharia':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7.5" cy="12" r="5" />
          <circle cx="7.5" cy="12" r="1.8" />
          <path d="M7.5 7V5.6M7.5 17v1.4M2.5 12H1.1M12.5 12h1.4M3.96 8.46 3.11 7.61M11.04 8.46l.85-.85M3.96 15.54 3.11 16.39M11.04 15.54l.85.85" />
          <path d="M13.5 21 17.38 9.12" />
          <path d="M19.24 4.01A3 3 0 1 0 22.49 7.26" />
        </svg>
      )
    default:
      return null
  }
}

export function DashAvatar({ size = 36, seed = 0 }: { size?: number; seed?: number }) {
  const hue = 165 + (seed % 4) * 12
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill={`hsl(${hue} 45% 88%)`} />
      <circle cx="20" cy="16.5" r="6.4" fill={`hsl(${hue} 30% 60%)`} />
      <path
        d="M6 36c1.6-7.4 7.3-11.5 14-11.5S32.4 28.6 34 36Z"
        fill={`hsl(${hue} 30% 60%)`}
      />
    </svg>
  )
}

export function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A11.99 11.99 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l4-3.1z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44A11.98 11.98 0 0 0 1.29 6.62l4 3.1C6.23 6.88 8.88 4.77 12 4.77z" />
    </svg>
  )
}