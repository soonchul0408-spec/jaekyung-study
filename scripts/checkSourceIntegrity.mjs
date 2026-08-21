import { readFileSync, existsSync } from 'node:fs'
import { examSets } from '../src/data/examSets.js'

// PDF는 표의 읽기 순서를 잃을 수 있으므로, 원문 PDF를 layout 모드로 추출한
// /private/tmp/jaekyung-YYYY-MM-layout-questions.txt를 이 검사 입력으로 사용한다.
// 데이터가 원문 문항 블록보다 지나치게 짧거나 정답 선택지가 원문에 없으면 실패한다.
const normalized = (value = '') => value.replace(/[^\p{L}\p{N}]/gu, '')
const layoutVerifiedOptionOverrides = new Set([
  // 네 칸 표를 가로 읽기 순서로 복원한 선택지. 원문 페이지 이미지와 대조 완료.
  '2025-06-TX-01',
  '2025-06-CM-08',
  '2025-06-CM-27',
  // 퇴직급여충당금 조정명세서의 표 안 ①~⑬ 열 번호가 보기 번호로 오인된다.
  // 레이아웃 원문 표의 마지막 네 줄과 확정답안으로 보기 ①~④를 대조했다.
  '2025-07-TX-16',
  // 두 열 표는 PDF 레이아웃 추출이 행·열을 교차시킨다. 페이지 이미지로 대조했다.
  '2025-01-CM-17',
  '2025-09-FR-21',
  '2025-09-FR-31',
  '2025-09-TX-01',
  // 41번의 가로 표가 PDF 읽기 순서상 42번 블록에 들어가므로, 42번에는
  // 실제 선택지와 무관한 표가 중복되어 길이 비율 검사에서 제외한다.
  '2025-09-TX-02',
  '2025-09-CM-18',
  // 98번 수치표와 118번 선택지표가 각각 다음 문항 블록으로 밀린 경우다.
  '2025-09-CM-19',
  '2025-09-CM-38',
  '2025-09-CM-39',
  // 11월 46번은 조정명세서 열 번호가 보기 번호로 추출되어 실제 네 행을 수동 복원했다.
  '2025-11-TX-06',
])

const errors = []
for (const exam of examSets) {
  const sourcePath = `/private/tmp/jaekyung-${exam.id}-layout-questions.txt`
  if (!existsSync(sourcePath)) {
    errors.push(`${exam.id}: 레이아웃 원문 추출 파일이 없습니다 (${sourcePath})`)
    continue
  }
  const source = readFileSync(sourcePath, 'utf8')
  const markers = [...source.matchAll(/【\s*(\d+)\s*】/g)]
  if (markers.length !== 120) {
    errors.push(`${exam.id}: 원문 문제 번호 ${markers.length}개 (120개 필요)`)
    continue
  }
  for (let index = 0; index < 120; index += 1) {
    const question = exam.questions[index]
    // 과목 전환 머리말과 안내문은 직전 문항의 선택지가 아니라 페이지 장식이다.
    const block = source.slice(markers[index].index, markers[index + 1]?.index).replace(/<\s*(?:세무회계|원가관리회계)\s*>[\s\S]*$/g, '')
    const sourceText = normalized(block)
    const siteText = normalized(`${question.stem}${question.options.join('')}`)
    if (!layoutVerifiedOptionOverrides.has(question.id) && siteText.length / sourceText.length < 0.72) errors.push(`${question.id}: 원문 표·지문 누락 의심 (사이트 ${siteText.length}자 / 원문 ${sourceText.length}자)`)
    if (!layoutVerifiedOptionOverrides.has(question.id)) {
      for (const [optionIndex, option] of question.options.entries()) {
        if (!sourceText.includes(normalized(option))) errors.push(`${question.id}: ${optionIndex + 1}번 선택지 원문 대조 실패`)
      }
    }
  }
}

if (errors.length) {
  console.error('문제 원문 완결성 검증 실패:')
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`문제 원문 완결성 검증 통과: ${examSets.length}회차 / ${examSets.length * 120}문항`)
