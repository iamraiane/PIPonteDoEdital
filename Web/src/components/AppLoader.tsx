import logoNome from '../assets/logo-nome.png'
import logoPonte from '../assets/logo-ponte.png'
import './AppLoader.css'

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="pl-spinner-wrap">
      <span className="pl-spinner" role="status" aria-label={label ?? 'Carregando'} />
      {label && <span className="pl-spinner__label">{label}</span>}
    </span>
  )
}

export default function AppLoader({
  message = 'Carregando...',
  showBrand = true,
  fading = false,
}: {
  message?: string
  showBrand?: boolean
  fading?: boolean
}) {
  return (
    <div
      className={`pl-loader ${fading ? 'pl-loader--fading' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {showBrand && (
        <span className="pl-loader__brand">
          <img src={logoPonte} alt="" aria-hidden="true" className="pl-loader__icon" />
          <img src={logoNome} alt="Ponte do Edital" className="pl-loader__logo" />
        </span>
      )}
      <span className="pl-loader__spinner" aria-hidden="true" />
      {message && <span className="pl-loader__message">{message}</span>}
    </div>
  )
}
