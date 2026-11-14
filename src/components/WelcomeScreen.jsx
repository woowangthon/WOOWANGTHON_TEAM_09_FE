// 로그인 전 첫 화면: 캐릭터와 「우왕코치 시작하기」 (스타일은 SignupPage.css)
export default function WelcomeScreen({ onStart }) {
  return (
    <div className="fit-setup__screen fit-setup__screen--welcome">
      <h1 className="fit-welcome__title">
        <span>바쁜 하루에도</span>
        <span>운동은 <em>꾸준하게<svg className="fit-welcome__spark" viewBox="0 0 14 16" aria-hidden="true"><path d="M3 1 5 10M10 3 9 12" /></svg></em></span>
      </h1>
      <div className="fit-welcome__hero">
        <img src="/brand/mascot.png" alt="" onError={(event) => { event.currentTarget.hidden = true }} />
      </div>
      <div className="fit-setup__options">
        <button className="fit-setup__choice" type="button" onClick={onStart}>우왕코치 시작하기 →</button>
      </div>
    </div>
  )
}
