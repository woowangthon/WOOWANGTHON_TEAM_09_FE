import { api } from './client.js'
import { listBlocks, readUnavailablePeriods, refreshTimetable } from './weeklyBlocks.js'
import { getUnavailablePeriod, getUnavailablePeriods } from '../workoutAvailability.js'
import { loadPrefs, savePrefs } from '../userPrefs.js'
import { saveCampus } from '../campus.js'

// 운동 경험: 앱 선택지 ↔ 서버 자유 입력 문장
export const experienceText = {
  beginner: '처음 (운동은 거의 처음)',
  intermediate: '기본적인 운동 경험 있음',
  advanced: '다양한 운동 경험 있음',
}

function experienceKey(text) {
  return Object.keys(experienceText).find((key) => experienceText[key] === text) ?? 'beginner'
}

// 보낸 필드만 서버에 저장돼요. (처음 등록할 때는 age·height·weight·sex 필수)
export function saveInfo(fields) {
  return api('/info', { method: 'POST', body: fields })
}

export function bodyInfo(profile) {
  return {
    age: Number(profile.age),
    height: Math.round(Number(profile.height)),
    weight: Math.round(Number(profile.weight)),
    sex: profile.gender === 'male',
    experience: experienceText[profile.experience] ?? null,
  }
}

export function inbodyInfo(form) {
  return {
    body_fat_percent: Number(form.bodyFat),
    skeletal_muscle_kg: Number(form.muscleMass),
    inbody_measured_at: form.measuredAt,
  }
}

// 인바디 결과지 사진을 서버가 읽어 체지방률·골격근량·측정일을 돌려줘요. (저장은 하지 않아요)
export function readInbodyImage(file) {
  const form = new FormData()
  form.append('file', file)
  return api('/inbody/image', { method: 'POST', body: form, auth: false })
}

// 로그인 직후: 서버 정보를 이 기기 캐시(프로필·인바디·시간표)에 채워요. 서버에 없는 이름·목표 등은 기존 값을 유지해요.
export async function hydrateFromServer() {
  const [me, blocks] = await Promise.all([api('/user'), listBlocks()])
  const info = me?.info
  const prefs = loadPrefs(me.name)
  // 이 기기에 보관한 값 → (예전 형식 하나짜리) → 서버 반복 일정 이름 순으로 찾아요.
  const unavailablePeriods = Array.isArray(prefs.unavailablePeriods)
    ? getUnavailablePeriods(prefs.unavailablePeriods)
    : prefs.unavailablePeriod
      ? getUnavailablePeriods(null, getUnavailablePeriod(prefs.unavailablePeriod))
      : readUnavailablePeriods(blocks)

  if (info) {
    localStorage.setItem('demo-profile', JSON.stringify({
      name: prefs.name ?? me.name,
      goal: prefs.goal ?? 'general',
      environment: prefs.environment ?? 'gym',
      unavailablePeriods,
      age: info.age,
      height: info.height,
      weight: info.weight,
      gender: info.sex ? 'male' : 'female',
      experience: experienceKey(info.experience),
    }))

    if (info.body_fat_percent && info.skeletal_muscle_kg && info.inbody_measured_at) {
      localStorage.setItem('demo-inbody', JSON.stringify({
        bodyFat: info.body_fat_percent,
        muscleMass: info.skeletal_muscle_kg,
        measuredAt: info.inbody_measured_at.slice(0, 10),
      }))
    }
  }

  saveCampus({ department: me.department, college: me.college })
  savePrefs({ unavailablePeriods }, me.name)
  await refreshTimetable(blocks)
  return me
}

// 로그아웃할 때 이전 사용자의 기기 캐시를 지워요.
export function clearLocalData() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('demo-'))
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    // 저장소를 못 쓰면 지울 것도 없어요.
  }
}
