import { examSets } from '../src/data/examSets.js'
import { expertFactReviewedQuestionIds } from '../src/data/expertFactReview.js'

const targetMonths = new Set(['2025-01', '2025-03', '2025-05', '2025-06', '2025-07', '2025-09', '2025-11', '2025-12'])
const targetQuestions = examSets.flatMap((exam) => exam.questions).filter((question) => targetMonths.has(question.examMonth))
const errors = []
for (const question of targetQuestions) {
  if (!expertFactReviewedQuestionIds.has(question.id)) errors.push(`${question.id}: 전문가 사실감수 기록 없음`)
  const answerAnalysis = question.choiceAnalysis?.find((choice) => choice.choiceNo === question.answer)
  if (!answerAnalysis?.reason) errors.push(`${question.id}: 정답 근거 없음`)
  if (question.calculation?.verifiedAgainstAnswer === false && !question.sourceVerificationNote) errors.push(`${question.id}: 계산 충돌 안내 없음`)
}

console.log(`전문가 사실감수 기록: ${expertFactReviewedQuestionIds.size}/${targetQuestions.length}문항`)
if (errors.length) {
  console.error(`전문가 사실감수 미완료: ${errors.length}건`)
  errors.slice(0, 40).forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}
console.log('전문가 사실감수 검증 통과')
