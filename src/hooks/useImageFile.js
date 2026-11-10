import { useEffect, useRef, useState } from 'react'

const imageTypes = ['image/jpeg', 'image/png', 'image/webp']

export const imageAccept = imageTypes.join(',')

// 이미지 파일 선택·검증·미리보기 URL 관리
export function useImageFile(onError) {
  const [image, setImage] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!image) return

    return () => URL.revokeObjectURL(image.url)
  }, [image])

  function selectFile(event) {
    const file = event.target.files?.[0]

    if (!file) return false

    if (!imageTypes.includes(file.type)) {
      onError('JPG, PNG, WEBP 이미지를 선택해 주세요.')
      event.target.value = ''
      return false
    }

    if (file.size > 10 * 1024 * 1024) {
      onError('10MB 이하의 이미지를 선택해 주세요.')
      event.target.value = ''
      return false
    }

    setImage({ file, url: URL.createObjectURL(file) })
    return true
  }

  function clear() {
    setImage(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return { image, inputRef, selectFile, clear }
}
