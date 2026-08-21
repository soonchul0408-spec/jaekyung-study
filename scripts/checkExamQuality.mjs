import { examSets } from '../src/data/examSets.js'
import { detailedIncorrectChoiceReasons } from '../src/data/detailedIncorrectChoiceReasons.js'

const errors = []
const genericPatterns = [/공식 확정답안의 정답 선택지가 아닙니다/, /지문의 조건과 보기의 핵심 표현을 대조해 답안을 확인하세요/]
const incompleteIncorrectReasonPatterns = [/단원 기준과 맞는지 확인/, /판단 기준과 충돌하기 때문/, /기준서·세법·원가관리 원칙과 대조해야/]
const calculationPattern = /계산하면|계산할|얼마인가|얼마인\s*가|금액은 얼마|수량은 얼마|몇 원|최대금액/
const incorrectQuestionPattern = /옳지 않은|아닌 것|해당하지 않는|가장 옳지 않은/
const baseline = examSets.find((exam) => exam.baseline)

for (const exam of examSets) {
  const calculationQuestions = exam.questions.filter((question) => calculationPattern.test(question.stem))
  for (const question of exam.questions) {
    const directionSource = `${question.stem} ${question.options.join(' ')}`
    if (!question.direction?.keyTerms?.length || !question.direction.keyTerms.some((term) => directionSource.includes(term)) || !question.direction.topic || !question.direction.concept || !question.direction.strategy || /정의와 적용 요건을 확인합니다|기준을 적용합니다/.test(question.direction.concept)) errors.push(`${exam.id} ${question.id}: 지문·선택지와 연결된 구체적 풀이 방향 누락`)
    if (!exam.baseline) {
    const correctOption = question.options[question.answer - 1] || ''
    const correctEvidence = question.optionEvidence?.find((item) => item.type === 'correct')?.text
    if (!question.explanation || question.explanation.length < 90) errors.push(`${exam.id} ${question.id}: 답안 설명이 충분하지 않음`)
    if (!correctEvidence || !correctOption.includes(correctEvidence) || !question.explanation.includes(correctEvidence)) errors.push(`${exam.id} ${question.id}: 답안 설명에 정답 선택지의 실제 표현이 없음`)
    if (!question.direction?.keyTerms?.some((term) => question.stem.includes(term))) errors.push(`${exam.id} ${question.id}: 풀이 방향의 찾을 표현이 지문에 연결되지 않음`)
    if (question.choiceAnalysis?.length !== 4 || question.choiceAnalysis.some((item) => item.reason.length < 55 || genericPatterns.some((pattern) => pattern.test(item.reason)))) errors.push(`${exam.id} ${question.id}: 보기별 설명이 부족하거나 공통 템플릿임`)
    if (genericPatterns.some((pattern) => pattern.test(question.explanation))) errors.push(`${exam.id} ${question.id}: 공통 템플릿 해설 사용`)
    }
    if (incorrectQuestionPattern.test(question.stem)) {
      const answerAnalysis = question.choiceAnalysis?.find((item) => item.choiceNo === question.answer)
      const detailedReason = detailedIncorrectChoiceReasons[question.id]
      if (!detailedReason || !answerAnalysis || !/틀림|옳지|잘못|맞지 않|반대/.test(answerAnalysis.verdict) || answerAnalysis.reason !== detailedReason || detailedReason.length < 90 || incompleteIncorrectReasonPatterns.some((pattern) => pattern.test(detailedReason))) errors.push(`${exam.id} ${question.id}: ‘옳지 않은 것’ 정답의 문항별 상세 오답 이유 누락`)
    }
  }
  for (const question of calculationQuestions) {
    const calculation = question.calculation
    if (!calculation?.formula || calculation.substitutions?.length < 2 || !calculation.result || calculation.verifiedAgainstAnswer !== true || !calculation.teachingExplanation || !/무엇을 구하는지|중간값|최종값|확정답안/.test(calculation.teachingExplanation)) errors.push(`${exam.id} ${question.id}: 전문가 수준의 계산식·수치 대입·결과·검산·수험생용 설명 누락`)
  }
}

if (errors.length) {
  console.error('문항 품질 검증 실패:')
  errors.slice(0, 30).forEach((error) => console.error(`- ${error}`))
  if (errors.length > 30) console.error(`- 외 ${errors.length - 30}건`)
  process.exit(1)
}

console.log(`문항 품질 검증 통과: 기준 회차 ${baseline.id}, 검사 회차 ${examSets.map((item) => item.id).join(', ')}`)
