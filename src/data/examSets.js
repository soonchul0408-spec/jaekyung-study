import { questions as januaryQuestions } from './questions.js'
import { questions as marchQuestions } from './questions-2025-03.js'
import { questions as mayQuestions } from './questions-2025-05.js'
import { questions as juneQuestions } from './questions-2025-06.js'
import { questions as julyQuestions } from './questions-2025-07.js'
import { questions as septemberQuestions } from './questions-2025-09.js'
import { questions as novemberQuestions } from './questions-2025-11.js'
import { questions as decemberQuestions } from './questions-2025-12.js'
import { applyConceptTags } from './conceptTags.js'
import { detailedIncorrectChoiceReasons } from './detailedIncorrectChoiceReasons.js'

// PDF 페이지 머리말이 마지막 선택지로 섞인 기존 추출값과, 가로 표의 행 순서가
// 합쳐진 문항을 원문 레이아웃 대조 결과로 정리한다. ID·정답·분류는 변경하지 않는다.
const sourceOptionOverrides = {
  '2025-01-CM-17': [
    '기본목적: 변동원가계산은 내부계획과 통제 등 경영관리 / 전부원가계산은 외부보고',
    '제품원가: 변동원가계산은 직접재료원가·직접노무원가·변동제조간접원가 / 전부원가계산은 여기에 고정제조간접원가를 더한 금액',
    '보고양식: 변동원가계산은 공헌이익접근법 손익계산서 / 전부원가계산은 전통적 손익계산서',
    '이익결정요인: 변동원가계산은 생산량 및 판매량 / 전부원가계산은 생산량',
  ],
}
const removePdfArtifacts = (value) => typeof value === 'string'
  ? value.replace(/\s*<\s*(?:세무회계|원가관리회계)\s*>(?:\s*[\s\S]*)?$/g, '').trim()
  : value
function cleanDeep(value) {
  if (Array.isArray(value)) return value.map(cleanDeep)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanDeep(item)]))
  return removePdfArtifacts(value)
}
function applySourceCorrections(question) {
  const cleaned = cleanDeep(question)
  const options = sourceOptionOverrides[question.id]
  const corrected = options ? { ...cleaned, options } : cleaned
  return {
    ...corrected,
    optionEvidence: corrected.optionEvidence?.map((item) => {
      const option = corrected.options[item.choiceNo - 1] || ''
      return option.includes(item.text) ? item : { ...item, text: option.slice(0, 18).trim() }
    }),
  }
}

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

// 생성 파일을 다시 만들기 전에도, 검증을 거친 문항별 '옳지 않은 것' 근거가
// 화면과 검사에 같은 문장으로 반영되게 한다. 정답·문항·선택지는 변경하지 않는다.
function applyVerifiedIncorrectReason(question) {
  const reason = detailedIncorrectChoiceReasons[question.id]
  if (!reason) return question
  return {
    ...question,
    choiceAnalysis: question.choiceAnalysis.map((choice) => choice.choiceNo === question.answer
      ? { ...choice, verdict: /옳지 않은|아닌 것|해당하지 않는/.test(question.stem) ? '틀림(정답)' : choice.verdict, reason }
      : choice),
  }
}

// 새 회차는 반드시 이 목록에 등록한다. 품질·동등성 검사도 이 목록 전체를 검사한다.
const enrichQuestions = (rows) => rows.map(applySourceCorrections).map(enrichCalculationTeaching).map(applyVerifiedIncorrectReason).map(applyConceptTags)

export const examSets = [
  { id: '2025-01', label: '2025년 1월', questions: enrichQuestions(januaryQuestions), baseline: true },
  { id: '2025-03', label: '2025년 3월', questions: enrichQuestions(marchQuestions) },
  { id: '2025-05', label: '2025년 5월', questions: enrichQuestions(mayQuestions) },
  { id: '2025-06', label: '2025년 6월', questions: enrichQuestions(juneQuestions) },
  { id: '2025-07', label: '2025년 7월', questions: enrichQuestions(julyQuestions) },
  { id: '2025-09', label: '2025년 9월', questions: enrichQuestions(septemberQuestions) },
  { id: '2025-11', label: '2025년 11월', questions: enrichQuestions(novemberQuestions) },
  { id: '2025-12', label: '2025년 12월', questions: enrichQuestions(decemberQuestions) },
]

export const questions = examSets.flatMap((exam) => exam.questions)
