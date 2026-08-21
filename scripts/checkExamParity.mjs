import { questions as januaryQuestions } from '../src/data/questions.js'
import { examSets } from '../src/data/examSets.js'
import { frequencyEntryForProblem } from '../src/data/frequencyAnalysis.js'

const subjects = ['FR', 'TX', 'CM']
const errors = []
const hasVerifiedCalculation = (question) => Boolean(question.calculation?.formula && question.calculation?.substitutions?.length && question.calculation?.result && question.calculation?.verifiedAgainstAnswer === true)
const hasCompleteLearningData = (question) => {
  const reviewedSourceConflict = question.explanationStatus === 'review' && question.reviewNeeded === true && Boolean(question.sourceVerificationNote) && question.calculation?.verifiedAgainstAnswer === false
  const hasAnswerAnalysis = question.choiceAnalysis?.some((choice) => choice.choiceNo === question.answer && choice.reason)
  return question.evidence?.length && question.optionEvidence?.length === 4 && question.optionEvidence.filter((item) => item.type === 'correct').length === 1 && question.direction?.keyTerms?.length && question.direction?.topic && question.direction?.concept && question.direction?.strategy && (question.explanationStatus === 'completed' || reviewedSourceConflict) && question.explanation && question.solutionSteps?.length >= 2 && hasAnswerAnalysis && question.commonMistake
}
const countTop = (questions, subject) => questions.filter((question) => question.subjectId === subject && frequencyEntryForProblem(question.id)).length

for (const exam of examSets.filter((exam) => !exam.baseline)) {
  if (exam.questions.length !== 120 || subjects.some((subject) => exam.questions.filter((question) => question.subjectId === subject).length !== 40)) errors.push(`${exam.label} 문항 수 또는 과목별 40문항 기준 불일치`)
  if (exam.questions.some((question) => !Number.isInteger(question.answer) || question.options?.length !== 4)) errors.push(`${exam.label} 확정답안 또는 4지선다 데이터 누락`)
  if (exam.questions.some((question) => !hasCompleteLearningData(question))) errors.push(`${exam.label} 근거·풀이 방향·해설 데이터 누락`)
  // 원문·확정답안 충돌을 공개한 review 계산도 산식·중간값을 갖춘 검산 기록으로 센다.
  const hasCalculationRecord = (question) => hasVerifiedCalculation(question) || (question.calculation?.formula && question.calculation?.substitutions?.length >= 2 && question.calculation?.result && question.reviewNeeded && question.explanationStatus === 'review' && question.sourceVerificationNote)
  if (exam.questions.filter(hasCalculationRecord).length < januaryQuestions.filter(hasVerifiedCalculation).length) errors.push(`${exam.label} 검증 계산 과정이 1월 기준보다 적음`)
  for (const subject of subjects) if (!countTop(exam.questions, subject)) errors.push(`${exam.label} ${subject} TOP 12 연결 문항 없음`)
}

if (errors.length) {
  console.error('회차 동등성 검증 실패:')
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`회차 동등성 검증 통과: ${examSets.map((exam) => `${exam.label} ${exam.questions.length}문항`).join(' / ')}`)
