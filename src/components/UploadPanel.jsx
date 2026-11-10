import { imageAccept } from '../hooks/useImageFile.js'
import './UploadPanel.css'

// 사진 미리보기 칸 + 「사진 업로드」「직접 입력」 버튼
export default function UploadPanel({ imageAlt, image, inputRef, onFileChange, onClearImage, isFormOpen, onToggleForm }) {
  return (
    <div className="fit-upload">
      <div className="fit-upload__preview">
        {image && <img src={image.url} alt={imageAlt} />}
      </div>

      {image && (
        <p className="fit-upload__file">
          <span>{image.file.name}</span>
          <button type="button" onClick={onClearImage}>사진 지우기</button>
        </p>
      )}

      <div className="fit-upload__buttons">
        <label className="fit-upload__pill">
          사진 업로드
          <input ref={inputRef} type="file" accept={imageAccept} onChange={onFileChange} />
        </label>
        <button className="fit-upload__pill" type="button" aria-expanded={isFormOpen} onClick={onToggleForm}>
          직접 입력
        </button>
      </div>

      {image && (
        <p className="fit-upload__note">사진 자동 인식은 준비 중이에요. 사진을 보며 직접 입력해 주세요.</p>
      )}
    </div>
  )
}
