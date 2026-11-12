import { api } from './api/client.js'
import { loadCampus, loadDashboard } from './campus.js'
import { getCurrentUser } from './userPrefs.js'
import { readStorage } from './workoutPlan.js'

// 그룹 기능은 아직 서버에 없어요.
// - 단과대 그룹: 서버 대시보드(/dashboard)의 실제 수치
// - 탐색 그룹: 예시 데이터
// - 직접 만든 그룹·가입한 그룹: 이 기기에만 아이디별로 저장
const storeKey = () => `user-groups:${getCurrentUser() ?? 'guest'}`

const demoGroups = [
  {
    id: 'demo-running',
    name: '우왕코치 러닝크루',
    category: '러닝',
    icon: 'people',
    intro: '수업 끝나고 함께 달려요!',
    participants: 15,
    rate: 88,
    ranking: [
      { name: '김우왕', rate: 96 },
      { name: '이건강', rate: 92 },
      { name: '박운동', rate: 88 },
    ],
  },
  {
    id: 'demo-gym',
    name: '공강에 헬스 한 시간',
    category: '헬스',
    icon: 'dumbbell',
    intro: '공강 시간에 같이 헬스해요!',
    participants: 12,
    rate: 81,
    ranking: [
      { name: '최근육', rate: 94 },
      { name: '정스쿼트', rate: 85 },
      { name: '한벤치', rate: 79 },
    ],
  },
  {
    id: 'demo-walk',
    name: '충북대 저녁 산책',
    category: '걷기',
    icon: 'shoe',
    intro: '저녁에 가볍게 학교 한 바퀴 걸어요!',
    participants: 24,
    rate: 74,
    ranking: [
      { name: '윤산책', rate: 90 },
      { name: '강걷기', rate: 83 },
      { name: '조저녁', rate: 77 },
    ],
  },
]

function loadStore() {
  const value = readStorage(storeKey(), null)
  return {
    joined: Array.isArray(value?.joined) ? value.joined : [],
    created: Array.isArray(value?.created) ? value.created : [],
  }
}

function saveStore(store) {
  localStorage.setItem(storeKey(), JSON.stringify(store))
}

// 내 이번 주 수행률 (리포트 API). 그룹 순위에 '나'로 들어가요.
async function myRate() {
  try {
    const report = await api('/report')
    return report?.so_far?.rate ?? null
  } catch {
    return null
  }
}

export function exploreGroups(query = '') {
  const { joined, created } = loadStore()
  const text = query.trim()
  return [...created.filter((group) => group.isPublic), ...demoGroups]
    .filter((group) => !text || group.name.includes(text) || group.category?.includes(text) || group.intro?.includes(text))
    .map((group) => ({ ...group, isJoined: joined.includes(group.id) || created.some((item) => item.id === group.id) }))
}

// 내가 참여 중인 그룹: 단과대(실제 수치) · 학과 · 만든 그룹 · 가입한 그룹
export async function loadMyGroups() {
  const { department } = loadCampus()
  const { joined, created } = loadStore()
  const groups = []

  const { mine } = await loadDashboard()
  if (mine && mine.college !== '기타') {
    groups.push({ id: 'college', name: mine.college, tag: '단과대', icon: 'building', participants: mine.active_members ?? 0, rate: mine.rate })
  }
  if (department) {
    groups.push({ id: 'department', name: department, tag: '학과', icon: 'cap', meta: '학과별 통계는 준비 중이에요' })
  }

  created.forEach((group) => groups.push({ ...group, tag: '운동 그룹', participants: 1, rate: null }))
  demoGroups.filter((group) => joined.includes(group.id)).forEach((group) => groups.push({ ...group, tag: '운동 그룹', participants: group.participants + 1 }))
  return groups
}

export async function loadGroup(id) {
  const me = { name: '나', rate: await myRate(), isMe: true }

  if (id === 'college') {
    const { mine } = await loadDashboard()
    if (!mine || mine.college === '기타') return null
    return { id, name: mine.college, icon: 'building', intro: '같은 단과대 학생들과 함께해요', participants: mine.active_members ?? 0, rate: mine.rate, ranking: null, isJoined: true, isAuto: true }
  }

  const { joined, created } = loadStore()
  const own = created.find((group) => group.id === id)
  if (own) return { ...own, participants: 1, rate: me.rate, ranking: [me], isJoined: true, isOwner: true }

  const demo = demoGroups.find((group) => group.id === id)
  if (!demo) return null
  const isJoined = joined.includes(id)
  const ranking = isJoined && me.rate !== null ? [...demo.ranking, me].sort((a, b) => b.rate - a.rate) : demo.ranking
  return { ...demo, participants: demo.participants + (isJoined ? 1 : 0), ranking, isJoined }
}

export function joinGroup(id) {
  const store = loadStore()
  if (!store.joined.includes(id)) saveStore({ ...store, joined: [...store.joined, id] })
}

export function leaveGroup(id) {
  const store = loadStore()
  saveStore({ joined: store.joined.filter((item) => item !== id), created: store.created.filter((group) => group.id !== id) })
}

export function createGroup({ name, intro, isPublic, image }) {
  const store = loadStore()
  const group = { id: `own-${Date.now()}`, name, intro, isPublic, image, category: '운동', icon: 'people' }
  saveStore({ ...store, created: [...store.created, group] })
  return group
}
