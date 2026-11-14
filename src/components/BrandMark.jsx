import './BrandMark.css'

// 모든 화면 왼쪽 위의 작은 '우왕코치' 표시
export default function BrandMark() {
  return (
    <p className="fit-brand">
      <svg className="fit-brand__icon" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="1" y="2.5" width="14" height="12.5" rx="2.5" fill="#b8245a" />
        <rect x="4" y="1" width="1.6" height="3.2" rx="0.8" fill="#e9a3bd" />
        <rect x="10.4" y="1" width="1.6" height="3.2" rx="0.8" fill="#e9a3bd" />
        <rect x="3.2" y="8" width="1.6" height="4" rx="0.6" fill="#fff" />
        <rect x="11.2" y="8" width="1.6" height="4" rx="0.6" fill="#fff" />
        <rect x="4.8" y="9.4" width="6.4" height="1.2" fill="#fff" />
      </svg>
      우왕코치
    </p>
  )
}
