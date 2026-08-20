import { questions } from '../src/data/questions.js'

const calculationPattern = /계산하면|계산할|얼마인가|금액은 얼마|수량은 얼마|몇 원|최대금액/
const failures = []

for (const question of questions) {
  if (!question.explanation || question.solutionSteps.length < 2 || question.choiceAnalysis.length !== 4 || !question.commonMistake) {
    failures.push(`${question.id}: 공통 해설 필드가 부족합니다.`)
  }
  if (question.optionEvidence?.length !== 4 || question.optionEvidence?.filter((item) => item.type === 'correct').length !== 1 || question.optionEvidence?.some((item) => !question.options[item.choiceNo - 1]?.includes(item.text))) {
    failures.push(`${question.id}: 보기별 근거 표현과 정답·오답 구분을 확인하세요.`)
  }
  if (calculationPattern.test(question.stem)) {
    const calculation = question.calculation
    if (!calculation?.formula || !calculation?.substitutions?.length || !calculation.result || calculation.verifiedAgainstAnswer !== true) {
      failures.push(`${question.id}: 계산식·수치 대입·결과·정답 대조가 모두 필요합니다.`)
    }
  }
}

if (failures.length) {
  console.error(`해설 품질 검증 실패: ${failures.length}건`)
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log(`해설 품질 검증 통과: ${questions.length}문항`)
