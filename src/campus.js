import { api } from './api/client.js'
import { readStorage } from './workoutPlan.js'

// 충북대학교 단과대별 학과 목록. 학과를 입력하면 이 표로 단과대를 찾아요.
// (학교 학사 편제가 바뀌면 이 표만 고치면 돼요)
export const colleges = {
  인문대학: ['국어국문학과', '중어중문학과', '영어영문학과', '독일언어문화학과', '프랑스언어문화학과', '러시아언어문화학과', '철학과', '사학과', '고고미술사학과'],
  사회과학대학: ['사회학과', '심리학과', '행정학과', '정치외교학과', '경제학과'],
  자연과학대학: ['수학과', '정보통계학과', '물리학과', '화학과', '생물학과', '미생물학과', '생화학과', '천문우주학과', '지구환경과학과'],
  경영대학: ['경영학부', '국제경영학과', '경영정보학과'],
  공과대학: ['토목공학부', '기계공학부', '화학공학과', '신소재공학과', '건축공학과', '안전공학과', '환경공학과', '공업화학과', '도시공학과', '건축학과'],
  전자정보대학: ['전기공학과', '전자공학부', '정보통신공학부', '컴퓨터공학과', '소프트웨어학부', '지능로봇공학과', '반도체공학부'],
  농업생명환경대학: ['산림학과', '지역건설공학과', '바이오시스템공학과', '목재종이과학과', '농업경제학과', '식물자원학과', '환경생명화학과', '축산학과', '식품생명공학과', '특용식물학과', '원예과학과', '식물의학과'],
  사범대학: ['교육학과', '국어교육과', '영어교육과', '역사교육과', '지리교육과', '사회교육과', '윤리교육과', '물리교육과', '화학교육과', '생물교육과', '지구과학교육과', '수학교육과', '체육교육과'],
  생활과학대학: ['식품영양학과', '아동복지학과', '의류학과', '주거환경학과', '소비자학과'],
  수의과대학: ['수의예과', '수의학과'],
  약학대학: ['약학과', '제약학과'],
  의과대학: ['의예과', '의학과', '간호학과'],
}

export const departments = Object.values(colleges).flat()

const normalize = (text) => text.replace(/[\s·.]/g, '')
// '컴퓨터공학과'는 '컴퓨터공학', '컴퓨터공'으로 줄여 써도 찾을 수 있게 해요.
const shortForms = (name) => {
  const full = normalize(name)
  return [full, full.replace(/(과|부)$/, ''), full.replace(/(학과|학부|과|부)$/, '')]
}

// 입력한 학과 이름으로 단과대를 찾아요. 띄어쓰기나 '학과/학부' 생략은 봐줘요.
export function findCollege(input) {
  const value = normalize(input ?? '')
  if (!value) return null

  for (const [college, names] of Object.entries(colleges)) {
    const match = names.find((name) => shortForms(name).includes(value))
    if (match) return { college, department: match }
  }
  return null
}

// ---- 서버 연동 ----
// 학과는 가입할 때만 정할 수 있어요(POST /user). 단과대학은 서버가 학과로 채워요.
const CAMPUS_KEY = 'demo-campus'

export function loadCampus() {
  const value = readStorage(CAMPUS_KEY, null)
  return { department: value?.department ?? null, college: value?.college ?? null }
}

export function saveCampus({ department, college }) {
  try {
    localStorage.setItem(CAMPUS_KEY, JSON.stringify({ department: department ?? null, college: college ?? null }))
  } catch {
    // 저장하지 못해도 다음 로그인 때 서버에서 다시 받아요.
  }
}

// 단과대학별 이번 주 수행률 순위 (오늘까지의 운동만 세요)
export async function loadDashboard() {
  const data = await api('/dashboard')
  const colleges = data.colleges ?? []
  return {
    myCollege: data.my_college,
    colleges,
    mine: colleges.find((item) => item.college === data.my_college) ?? null,
  }
}

// 그룹 탐색 화면의 예시 그룹 (그룹 기능은 아직 서버에 없어요)
export const demoGroups = [
  { id: 'running', name: '우왕코치 러닝크루', tag: '운동 그룹', description: '함께 달리며 운동 습관을 만드는 그룹', participants: 15, rate: 88 },
  { id: 'morning', name: '아침 7시 기상 운동', tag: '운동 그룹', description: '수업 전에 가볍게 운동해요', participants: 21, rate: 74 },
  { id: 'dorm', name: '기숙사 홈트 모임', tag: '운동 그룹', description: '헬스장 없이 방에서 하는 운동', participants: 12, rate: 69 },
]
