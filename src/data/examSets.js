import { questions as januaryQuestions } from './questions.js'
import { questions as marchQuestions } from './questions-2025-03.js'
import { questions as mayQuestions } from './questions-2025-05.js'

// 계산식만 나열하지 않고, 수험생이 풀이의 흐름을 따라갈 수 있는 설명을 모든 회차에 동일하게 덧붙인다.
function enrichCalculationTeaching(question) {
  if (!question.calculation) return question
  const { formula, substitutions, result } = question.calculation
  return {
    ...question,
    calculation: {
      ...question.calculation,
      teachingExplanation: `이 문제는 바로 선택지를 고르기보다 ‘무엇을 구하는지’를 먼저 ${formula}로 정리하는 것이 핵심입니다. 다음으로 지문 수치를 식에 한 번씩 대입해 중간값을 확인합니다. ${substitutions.join(' ')} 따라서 최종값은 ${result}이며, 단위·기간·포함 여부를 바꿔 읽지 않았는지 확정답안과 마지막으로 대조합니다.`,
    },
  }
}

// 새 회차는 반드시 이 목록에 등록한다. 품질·동등성 검사도 이 목록 전체를 검사한다.
export const examSets = [
  { id: '2025-01', label: '2025년 1월', questions: januaryQuestions.map(enrichCalculationTeaching), baseline: true },
  { id: '2025-03', label: '2025년 3월', questions: marchQuestions.map(enrichCalculationTeaching) },
  { id: '2025-05', label: '2025년 5월', questions: mayQuestions.map(enrichCalculationTeaching) },
]

export const questions = examSets.flatMap((exam) => exam.questions)
