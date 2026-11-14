import './BrandMark.css'

// 모든 화면 왼쪽 위의 작은 '우왕코치' 표시 (아이콘: public/brand/logo.png)
export default function BrandMark() {
  return (
    <p className="fit-brand">
      <img className="fit-brand__icon" src="/brand/logo.png" alt="" width="200" height="188" />
      우왕코치
    </p>
  )
}
