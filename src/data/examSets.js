import { questions as januaryQuestions } from './questions.js'
import { questions as marchQuestions } from './questions-2025-03.js'

// 새 회차는 반드시 이 목록에 등록한다. 품질·동등성 검사도 이 목록 전체를 검사한다.
export const examSets = [
  { id: '2025-01', label: '2025년 1월', questions: januaryQuestions, baseline: true },
  { id: '2025-03', label: '2025년 3월', questions: marchQuestions },
]

export const questions = examSets.flatMap((exam) => exam.questions)
