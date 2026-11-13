import { api } from './client.js'
import { goalText } from './plan.js'
import { listBlocks, readUnavailablePeriods, refreshTimetable } from './weeklyBlocks.js'
import { getUnavailablePeriod, getUnavailablePeriods } from '../workoutAvailability.js'
import { loadPrefs, savePrefs, setCurrentUser } from '../userPrefs.js'
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

// 운동 목표: 앱 선택지 ↔ 서버에 저장하는 문장 (AI 계획이 이 문장을 읽어요)
function goalKey(text) {
  if (!text) return null
  return Object.keys(goalText).find((key) => key !== 'unsure' && goalText[key] === text) ?? 'general'
}

function environmentKey(usesGym) {
  if (usesGym === true) return 'gym'
  if (usesGym === false) return 'none'
  return null
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
    nickname: profile.name?.trim() || null,
    goal: goalText[profile.goal] ?? null,
    uses_gym: profile.environment ? profile.environment !== 'none' : null,
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

// 서버(DB) 정보로 이 기기 캐시(프로필·인바디·시간표)를 새로 채워요.
// 이름·목표·헬스장 여부도 서버 값이 우선이고, 서버에 아직 없을 때만 이 기기에 보관한 값을 써요.
export async function hydrateFromServer() {
  const [me, blocks] = await Promise.all([api('/user'), listBlocks()])
  const info = me?.info
  setCurrentUser(me.name)
  const prefs = loadPrefs(me.name)
  // 이 기기에 보관한 값 → (예전 형식 하나짜리) → 서버 반복 일정 이름 순으로 찾아요.
  const unavailablePeriods = Array.isArray(prefs.unavailablePeriods)
    ? getUnavailablePeriods(prefs.unavailablePeriods)
    : prefs.unavailablePeriod
      ? getUnavailablePeriods(null, getUnavailablePeriod(prefs.unavailablePeriod))
      : readUnavailablePeriods(blocks)

  if (info) {
    localStorage.setItem('demo-profile', JSON.stringify({
      name: info.nickname || prefs.name || me.name,
      goal: goalKey(info.goal) ?? prefs.goal ?? 'general',
      environment: environmentKey(info.uses_gym) ?? prefs.environment ?? 'gym',
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
    } else {
      localStorage.removeItem('demo-inbody')
    }
  } else {
    // 서버에 건강 정보가 없으면 이 기기의 예전 사본도 지워서 '프로필 만들기'가 보이게 해요.
    localStorage.removeItem('demo-profile')
    localStorage.removeItem('demo-inbody')
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
