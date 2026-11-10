const STORAGE_KEY = 'demo-inbody'

export const emptyInbody = { bodyFat: '', muscleMass: '', measuredAt: '' }

export function todayText() {
  const today = new Date()

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
}

// 입력 폼에 바로 쓸 수 있게 문자열로 돌려줘요.
export function loadInbody() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY))

    if (
      !data ||
      !Number.isFinite(data.bodyFat) ||
      data.bodyFat <= 0 ||
      data.bodyFat > 100 ||
      !Number.isFinite(data.muscleMass) ||
      data.muscleMass <= 0 ||
      typeof data.measuredAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.measuredAt)
    ) {
      return emptyInbody
    }

    return {
      bodyFat: String(data.bodyFat),
      muscleMass: String(data.muscleMass),
      measuredAt: data.measuredAt,
    }
  } catch {
    return emptyInbody
  }
}

export function saveInbody(form) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    bodyFat: Number(form.bodyFat),
    muscleMass: Number(form.muscleMass),
    measuredAt: form.measuredAt,
    savedAt: new Date().toISOString(),
  }))
}
