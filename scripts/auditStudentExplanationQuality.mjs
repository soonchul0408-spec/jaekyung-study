import { examSets } from '../src/data/examSets.js'
import { detailedChoiceAnalyses } from '../src/data/detailedChoiceAnalyses.js'

const genericChoicePatterns = [
  /지문의 조건·예외와 대조합니다/,
  /공식 확정답안 .*번과 일치하지 않습니다/,
  /핵심 기준과 맞는지 다시 확인하세요/,
]
const genericDirectionPatterns = [
  /정의와 적용 요건을 확인합니다/,
  /기준을 적용합니다/,
  /문제의 요건·예외·인식 시점을 찾은 뒤 각 선택지에 차례로 대입합니다/,
]
const calculationPattern = /계산하면|계산할|얼마인가|금액은 얼마|수량은 얼마|몇 원|최대금액/

const report = []
for (const exam of examSets) {
  const questions = exam.questions
  const genericChoiceQuestions = questions.filter((question) => {
    const answerAnalysis = question.choiceAnalysis?.find((choice) => choice.choiceNo === question.answer)
    return !answerAnalysis || genericChoicePatterns.some((pattern) => pattern.test(answerAnalysis.reason))
  })
  const genericDirectionQuestions = questions.filter((question) => genericDirectionPatterns.some((pattern) => pattern.test(question.direction?.concept || '') || pattern.test(question.direction?.strategy || '')))
  const calculationQuestions = questions.filter((question) => calculationPattern.test(question.stem))
  const calculationWithoutNumericWork = calculationQuestions.filter((question) => {
    const calculation = question.calculation
    const body = [calculation?.formula, ...(calculation?.substitutions || []), calculation?.result].join(' ')
    return !/\d/.test(body)
  })
  const shortAnswerAnalysis = questions.filter((question) => {
    const answerAnalysis = question.choiceAnalysis?.find((choice) => choice.choiceNo === question.answer)
    return !answerAnalysis || answerAnalysis.reason.length < 90
  })
  const missingManualChoiceAnalysis = questions
    .filter((question) => ['2025-01', '2025-03', '2025-05', '2025-06', '2025-07'].includes(question.examMonth) && !detailedChoiceAnalyses[question.id])
    .map((question) => question.id)
  report.push({
    exam: exam.id,
    total: questions.length,
    genericChoiceQuestions: genericChoiceQuestions.map((question) => question.id),
    genericDirectionQuestions: genericDirectionQuestions.map((question) => question.id),
    calculationWithoutNumericWork: calculationWithoutNumericWork.map((question) => question.id),
    shortAnswerAnalysis: shortAnswerAnalysis.map((question) => question.id),
    missingManualChoiceAnalysis,
  })
}

console.log(JSON.stringify(report, null, 2))
const totals = report.reduce((sum, item) => ({
  total: sum.total + item.total,
  genericChoiceQuestions: sum.genericChoiceQuestions + item.genericChoiceQuestions.length,
  genericDirectionQuestions: sum.genericDirectionQuestions + item.genericDirectionQuestions.length,
  calculationWithoutNumericWork: sum.calculationWithoutNumericWork + item.calculationWithoutNumericWork.length,
  shortAnswerAnalysis: sum.shortAnswerAnalysis + item.shortAnswerAnalysis.length,
  missingManualChoiceAnalysis: sum.missingManualChoiceAnalysis + item.missingManualChoiceAnalysis.length,
}), { total: 0, genericChoiceQuestions: 0, genericDirectionQuestions: 0, calculationWithoutNumericWork: 0, shortAnswerAnalysis: 0, missingManualChoiceAnalysis: 0 })
console.log(`SUMMARY ${JSON.stringify(totals)}`)
if (totals.genericChoiceQuestions || totals.genericDirectionQuestions || totals.calculationWithoutNumericWork || totals.shortAnswerAnalysis || totals.missingManualChoiceAnalysis) {
  console.error('수험생 관점 해설 품질 검증 실패: 공통 템플릿·짧은 선택지 해설·계산형 적합성 보완이 필요합니다.')
  process.exitCode = 1
}
