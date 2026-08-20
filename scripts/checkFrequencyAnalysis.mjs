import { questions as januaryQuestions } from '../src/data/questions.js'
import { questions as marchQuestions } from '../src/data/questions-2025-03.js'
import { frequencyAnalysis, frequencyEntryForProblem, validateFrequencyAnalysis } from '../src/data/frequencyAnalysis.js'

const questions = [...januaryQuestions, ...marchQuestions]
const validation = validateFrequencyAnalysis(questions)
const topQuestions = questions.filter((question) => frequencyEntryForProblem(question.id))
const subjectCounts = Object.fromEntries(['FR', 'TX', 'CM'].map((subject) => [subject, frequencyAnalysis.filter((entry) => entry.subject === subject).length]))

if (Object.values(subjectCounts).some((count) => count !== 12)) validation.errors.push(`과목별 TOP 12 항목 수 오류: ${JSON.stringify(subjectCounts)}`)
if (!topQuestions.length || topQuestions.length >= questions.length) validation.errors.push(`TOP 12 필터 결과 오류: 전체 ${questions.length}문제 중 ${topQuestions.length}문제`)

if (validation.errors.length) {
  console.error('빈출 분석 검증 실패:')
  validation.errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`빈출 분석 검증 통과: ${topQuestions.length}/${questions.length}문제 매핑, ${questions.length - topQuestions.length}문제 보완 유형`)
