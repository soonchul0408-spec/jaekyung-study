import { questions as januaryQuestions } from '../src/data/questions.js'
import { questions as marchQuestions } from '../src/data/questions-2025-03.js'
import { frequencyEntryForProblem } from '../src/data/frequencyAnalysis.js'

const subjects = ['FR', 'TX', 'CM']
const errors = []
const hasVerifiedCalculation = (question) => Boolean(question.calculation?.formula && question.calculation?.substitutions?.length && question.calculation?.result && question.calculation?.verifiedAgainstAnswer === true)
const hasCompleteLearningData = (question) => question.evidence?.length && question.optionEvidence?.length === 4 && question.optionEvidence.filter((item) => item.type === 'correct').length === 1 && question.direction?.keyTerms?.length && question.direction?.topic && question.direction?.concept && question.direction?.strategy && question.explanationStatus === 'completed' && question.explanation && question.solutionSteps?.length >= 2 && question.choiceAnalysis?.length === 4 && question.commonMistake
const countTop = (questions, subject) => questions.filter((question) => question.subjectId === subject && frequencyEntryForProblem(question.id)).length

if (marchQuestions.length !== 120 || subjects.some((subject) => marchQuestions.filter((question) => question.subjectId === subject).length !== 40)) errors.push('3월 문항 수 또는 과목별 40문항 기준 불일치')
if (marchQuestions.some((question) => !Number.isInteger(question.answer) || question.options?.length !== 4)) errors.push('3월 확정답안 또는 4지선다 데이터 누락')
if (marchQuestions.some((question) => !hasCompleteLearningData(question))) errors.push('3월 근거·풀이 방향·해설 데이터 누락')
if (marchQuestions.filter(hasVerifiedCalculation).length < januaryQuestions.filter(hasVerifiedCalculation).length) errors.push('3월 검증 계산 과정이 1월 기준보다 적음')
for (const subject of subjects) {
  if (!countTop(marchQuestions, subject)) errors.push(`3월 ${subject} TOP 12 연결 문항 없음`)
}

if (errors.length) {
  console.error('회차 동등성 검증 실패:')
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`회차 동등성 검증 통과: 3월 120문항, 검증 계산 ${marchQuestions.filter(hasVerifiedCalculation).length}건, TOP 12 ${subjects.map((subject) => `${subject} ${countTop(marchQuestions, subject)}건`).join(' / ')}`)
