export const FREQUENCY_ANALYSIS_NOTE = '2025년 공개기출 8회분 분석 기준'

export const frequencySubjectSummaries = {
  FR: { average: 87.2, minimum: 82.5, twoMistakesMinimum: 77.5 },
  TX: { average: 86.3, minimum: 82.5, twoMistakesMinimum: 77.5 },
  CM: { average: 93.1, minimum: 87.5, twoMistakesMinimum: 82.5 },
}

// questionCount는 8회 공개기출 분석 기준이며, problemIds에는 현재 화면에 실제 존재하는 문항만 연결합니다.
export const frequencyAnalysis = [
  { subject: 'FR', rank: 1, topicName: 'K-IFRS·개념체계·표시', problemIds: ['2025-01-FR-01', '2025-01-FR-02', '2025-01-FR-03', '2025-01-FR-04', '2025-01-FR-05', '2025-03-FR-01', '2025-03-FR-02', '2025-03-FR-03', '2025-03-FR-04', '2025-03-FR-05'], questionCount: 11, note: '개념체계와 재무제표 표시 판단을 함께 확인합니다.' },
  { subject: 'FR', rank: 2, topicName: '유형자산: 취득·감가·재평가', problemIds: ['2025-01-FR-09', '2025-01-FR-10', '2025-01-FR-11', '2025-03-FR-09', '2025-03-FR-10', '2025-03-FR-11'], questionCount: 9, note: '취득원가·손상·재평가를 구분합니다.' },
  { subject: 'FR', rank: 3, topicName: '재고자산', problemIds: ['2025-01-FR-06', '2025-01-FR-07', '2025-01-FR-08', '2025-03-FR-06', '2025-03-FR-07', '2025-03-FR-08'], questionCount: 8, note: '취득원가와 평가·매출원가 계산을 포함합니다.' },
  { subject: 'FR', rank: 4, topicName: '자본·주식기준보상', problemIds: ['2025-01-FR-21', '2025-01-FR-22', '2025-01-FR-27', '2025-01-FR-31', '2025-03-FR-21', '2025-03-FR-22', '2025-03-FR-28', '2025-03-FR-32'], questionCount: 8, note: '우선주·자본변동·주식기준보상을 확인합니다.' },
  { subject: 'FR', rank: 5, topicName: '현금흐름·파생상품·특수', problemIds: ['2025-01-FR-35', '2025-01-FR-38', '2025-01-FR-39', '2025-01-FR-40', '2025-03-FR-36', '2025-03-FR-38', '2025-03-FR-39', '2025-03-FR-40'], questionCount: 7, note: '현금흐름 분류와 파생상품 판단을 포함합니다.' },
  { subject: 'FR', rank: 6, topicName: '무형자산·손상', problemIds: ['2025-01-FR-12', '2025-01-FR-13', '2025-03-FR-12', '2025-03-FR-13'], questionCount: 6, note: '연구·개발과 상각·손상을 구분합니다.' },
  { subject: 'FR', rank: 7, topicName: '사채·복합금융상품', problemIds: ['2025-01-FR-17', '2025-01-FR-18', '2025-01-FR-19', '2025-03-FR-17', '2025-03-FR-18', '2025-03-FR-19'], questionCount: 6, note: '상각후원가와 전환사채를 포함합니다.' },
  { subject: 'FR', rank: 8, topicName: '수익인식', problemIds: ['2025-01-FR-23', '2025-01-FR-24', '2025-01-FR-25', '2025-03-FR-23', '2025-03-FR-24', '2025-03-FR-25'], questionCount: 6, note: '수행의무와 기간별 수익인식을 확인합니다.' },
  { subject: 'FR', rank: 9, topicName: '법인세·외화환산', problemIds: ['2025-01-FR-28', '2025-01-FR-29', '2025-01-FR-34', '2025-03-FR-29', '2025-03-FR-30', '2025-03-FR-35'], questionCount: 5, note: '이연법인세와 환산 기준을 포함합니다.' },
  { subject: 'FR', rank: 10, topicName: '관계기업·연결·사업결합', problemIds: ['2025-01-FR-32', '2025-01-FR-33', '2025-03-FR-33', '2025-03-FR-34'], questionCount: 5, note: '관계기업·연결 관련 문제를 직접 연결합니다.' },
  { subject: 'FR', rank: 11, topicName: '리스', problemIds: ['2025-01-FR-36', '2025-01-FR-37', '2025-03-FR-37'], questionCount: 4, note: '할인율과 리스부채 측정을 확인합니다.' },
  { subject: 'FR', rank: 12, topicName: '매출채권·대손 또는 금융자산 세부유형', problemIds: ['2025-01-FR-15', '2025-01-FR-16', '2025-03-FR-15', '2025-03-FR-16'], questionCount: 4, note: '금융자산 분류·처분 문제를 직접 연결합니다.' },

  { subject: 'TX', rank: 1, topicName: '법인세: 손금·기부금·접대비', problemIds: ['2025-01-TX-08', '2025-01-TX-09', '2025-01-TX-13', '2025-01-TX-14', '2025-01-TX-15', '2025-01-TX-16', '2025-01-TX-17'], questionCount: 10, note: '손금 인정과 부인 사유를 포함합니다.' },
  { subject: 'TX', rank: 2, topicName: '국세기본법: 납세의무·불복', problemIds: [], questionCount: 8, note: '현재 2025년 1월 화면에는 직접 연결할 문항이 없습니다.' },
  { subject: 'TX', rank: 3, topicName: '종합소득: 소득금액', problemIds: ['2025-01-TX-21', '2025-01-TX-22', '2025-01-TX-23', '2025-01-TX-26'], questionCount: 8, note: '소득 구분과 종합소득 과세표준을 포함합니다.' },
  { subject: 'TX', rank: 4, topicName: '법인세: 과세표준·세액공제', problemIds: ['2025-01-TX-19', '2025-01-TX-27'], questionCount: 7, note: '과세표준 계산과 세액공제를 확인합니다.' },
  { subject: 'TX', rank: 5, topicName: '법인세: 사업연도·신고', problemIds: ['2025-01-TX-01', '2025-01-TX-02', '2025-01-TX-03', '2025-01-TX-04', '2025-01-TX-05', '2025-01-TX-20'], questionCount: 7, note: '현재 회차의 법인세 총설 문항을 연결합니다.' },
  { subject: 'TX', rank: 6, topicName: '법인세: 소득처분', problemIds: ['2025-01-TX-06'], questionCount: 6, note: '세무조정과 소득처분을 확인합니다.' },
  { subject: 'TX', rank: 7, topicName: '부가가치세: 세금계산서·매입세액', problemIds: ['2025-01-TX-32', '2025-01-TX-39'], questionCount: 6, note: '매입세액 공제와 세금계산서를 포함합니다.' },
  { subject: 'TX', rank: 8, topicName: '부가가치세: 과세·면세·영세율', problemIds: ['2025-01-TX-34', '2025-01-TX-35', '2025-01-TX-37', '2025-01-TX-38'], questionCount: 6, note: '과세거래와 영세율·면세를 포함합니다.' },
  { subject: 'TX', rank: 9, topicName: '근로소득·연말정산·원천징수', problemIds: ['2025-01-TX-24', '2025-01-TX-25', '2025-01-TX-28', '2025-01-TX-30'], questionCount: 5, note: '근로소득과 소득세법 총설의 원천징수 논점을 포함합니다.' },
  { subject: 'TX', rank: 10, topicName: '퇴직·양도소득', problemIds: ['2025-01-TX-29'], questionCount: 5, note: '현재 회차에서는 양도소득 납세절차만 직접 연결됩니다.' },
  { subject: 'TX', rank: 11, topicName: '법인세: 익금', problemIds: ['2025-01-TX-07'], questionCount: 4, note: '익금 산입 여부를 확인합니다.' },
  { subject: 'TX', rank: 12, topicName: '부가가치세: 사업장·납세지 또는 공급시기·거래', problemIds: ['2025-01-TX-33', '2025-01-TX-36', '2025-01-TX-40'], questionCount: 4, note: '현재 회차에서는 납세절차와 과세표준 문제를 직접 연결합니다.' },

  { subject: 'CM', rank: 1, topicName: '원가개념·원가분류', problemIds: [], questionCount: 10, note: '현재 2025년 1월 화면에는 직접 연결할 문항이 없습니다.' },
  { subject: 'CM', rank: 2, topicName: '변동·전부원가계산', problemIds: ['2025-01-CM-01', '2025-01-CM-16', '2025-01-CM-17', '2025-01-CM-18', '2025-01-CM-19', '2025-01-CM-20'], questionCount: 9, note: '원가계산 방식별 이익 차이를 확인합니다.' },
  { subject: 'CM', rank: 3, topicName: '제조간접비·보조부문 배부', problemIds: ['2025-01-CM-03', '2025-01-CM-04', '2025-01-CM-21', '2025-01-CM-22'], questionCount: 8, note: '배부기준과 활동기준원가를 포함합니다.' },
  { subject: 'CM', rank: 4, topicName: 'CVP·손익분기점', problemIds: ['2025-01-CM-23', '2025-01-CM-24', '2025-01-CM-25', '2025-01-CM-26'], questionCount: 8, note: '공헌이익과 손익분기점 계산을 확인합니다.' },
  { subject: 'CM', rank: 5, topicName: '단기 의사결정', problemIds: ['2025-01-CM-32', '2025-01-CM-33', '2025-01-CM-34', '2025-01-CM-36', '2025-01-CM-37', '2025-01-CM-38'], questionCount: 7, note: '관련원가와 특별주문 판단을 포함합니다.' },
  { subject: 'CM', rank: 6, topicName: '책임회계·성과평가', problemIds: ['2025-01-CM-27', '2025-01-CM-28', '2025-01-CM-29', '2025-01-CM-30', '2025-01-CM-31', '2025-01-CM-35'], questionCount: 7, note: '판매부문·투자중심점 성과평가를 포함합니다.' },
  { subject: 'CM', rank: 7, topicName: '자본예산·장기 의사결정', problemIds: [], questionCount: 6, note: '현재 2025년 1월 화면에는 직접 연결할 문항이 없습니다.' },
  { subject: 'CM', rank: 8, topicName: '원가흐름·제조원가명세', problemIds: [], questionCount: 5, note: '현재 2025년 1월 화면에는 직접 연결할 문항이 없습니다.' },
  { subject: 'CM', rank: 9, topicName: '종합원가: 완성품환산량', problemIds: ['2025-01-CM-08', '2025-01-CM-09', '2025-01-CM-10'], questionCount: 5, note: '완성품환산량과 원가배분을 확인합니다.' },
  { subject: 'CM', rank: 10, topicName: '표준원가: 재료·노무 차이', problemIds: ['2025-01-CM-11', '2025-01-CM-12', '2025-01-CM-13', '2025-01-CM-14', '2025-01-CM-15'], questionCount: 5, note: '표준원가 차이 분석을 포함합니다.' },
  { subject: 'CM', rank: 11, topicName: '개별원가계산', problemIds: ['2025-01-CM-02', '2025-01-CM-05', '2025-01-CM-06', '2025-01-CM-07'], questionCount: 4, note: '작업별 원가 배부를 확인합니다.' },
  { subject: 'CM', rank: 12, topicName: '결합원가·부산물·공손 또는 현대원가관리·품질원가', problemIds: ['2025-01-CM-39', '2025-01-CM-40'], questionCount: 4, note: '현재 회차에서는 사내대체·전략적 원가관리 문제만 직접 연결됩니다.' },
]

// 2025년 3월 원문을 분류 기준과 대조해 확인한 실제 문항 ID입니다.
// 확신할 수 없는 세무회계 보충 논점은 억지로 TOP 12에 넣지 않습니다.
const marchFrequencyProblemIds = {
  TX: {
    1: ['2025-03-TX-09', '2025-03-TX-15', '2025-03-TX-16', '2025-03-TX-17'],
    2: ['2025-03-TX-01', '2025-03-TX-02', '2025-03-TX-03', '2025-03-TX-04'],
    3: ['2025-03-TX-21', '2025-03-TX-22', '2025-03-TX-23', '2025-03-TX-26', '2025-03-TX-30'],
    4: ['2025-03-TX-06', '2025-03-TX-19'],
    5: ['2025-03-TX-05', '2025-03-TX-10', '2025-03-TX-20'],
    6: ['2025-03-TX-18'],
    7: ['2025-03-TX-39'],
    8: ['2025-03-TX-31', '2025-03-TX-32', '2025-03-TX-35', '2025-03-TX-36', '2025-03-TX-37', '2025-03-TX-38'],
    9: ['2025-03-TX-24', '2025-03-TX-25', '2025-03-TX-27'],
    10: ['2025-03-TX-28', '2025-03-TX-29'],
    11: ['2025-03-TX-07', '2025-03-TX-08'],
    12: ['2025-03-TX-33', '2025-03-TX-34'],
  },
  CM: {
    1: ['2025-03-CM-01', '2025-03-CM-02', '2025-03-CM-22'],
    2: ['2025-03-CM-16', '2025-03-CM-17', '2025-03-CM-18', '2025-03-CM-19', '2025-03-CM-20'],
    3: ['2025-03-CM-03', '2025-03-CM-04', '2025-03-CM-07', '2025-03-CM-21'],
    4: ['2025-03-CM-23', '2025-03-CM-24', '2025-03-CM-25'],
    5: ['2025-03-CM-32', '2025-03-CM-33', '2025-03-CM-34'],
    6: ['2025-03-CM-26', '2025-03-CM-27', '2025-03-CM-28', '2025-03-CM-29', '2025-03-CM-30', '2025-03-CM-31', '2025-03-CM-35'],
    7: ['2025-03-CM-36', '2025-03-CM-37', '2025-03-CM-38'],
    8: [],
    9: ['2025-03-CM-08', '2025-03-CM-09', '2025-03-CM-10'],
    10: ['2025-03-CM-11', '2025-03-CM-12', '2025-03-CM-13', '2025-03-CM-14', '2025-03-CM-15'],
    11: ['2025-03-CM-05', '2025-03-CM-06'],
    12: ['2025-03-CM-39', '2025-03-CM-40'],
  },
}

for (const entry of frequencyAnalysis) {
  entry.problemIds.push(...(marchFrequencyProblemIds[entry.subject]?.[entry.rank] || []))
}

// 5월 원문을 같은 TOP 12 분류 기준으로 직접 대조한 문항 ID입니다.
const mayFrequencyQuestionNos = {
  FR: { 1: [1,2,3,4,5], 2: [9,10,11], 3: [6,7,8], 4: [21,22,27,28,32], 5: [36,38,39,40], 6: [12,13], 7: [17,18,19], 8: [23,24,25,26], 9: [29,30,35], 10: [33,34], 11: [37], 12: [15,16] },
  TX: { 1: [9,13,14,15,16,17], 2: [1,2,3,4], 3: [22,23,25,26,30], 4: [19,27], 5: [5,10,18,20], 6: [6], 7: [39], 8: [35,36,37,38], 9: [24], 10: [28,29], 11: [7,8], 12: [31,32,33,34,40] },
  CM: { 1: [1,2], 2: [16,17,18,19,20], 3: [3,4,7,21,22], 4: [23,24,25], 5: [32,33,34,35,39], 6: [26,27,28,29,30,31], 7: [36,37,38], 8: [], 9: [8,9,10], 10: [11,12,13,14,15], 11: [5,6], 12: [40] },
}

for (const entry of frequencyAnalysis) {
  const questionNos = mayFrequencyQuestionNos[entry.subject]?.[entry.rank] || []
  entry.problemIds.push(...questionNos.map((number) => `2025-05-${entry.subject}-${String(number).padStart(2, '0')}`))
}

export function frequencyEntryForProblem(problemId) {
  return frequencyAnalysis.find((entry) => entry.problemIds.includes(problemId)) || null
}

export function validateFrequencyAnalysis(questions) {
  const questionById = new Map(questions.map((question) => [question.id, question]))
  const problems = new Map()
  const errors = []

  for (const entry of frequencyAnalysis) {
    for (const problemId of entry.problemIds) {
      const question = questionById.get(problemId)
      if (!question) errors.push(`존재하지 않는 problemId: ${problemId}`)
      else if (question.subjectId !== entry.subject) errors.push(`과목 불일치: ${problemId}은 ${question.subjectId}인데 ${entry.subject}에 연결됨`)
      if (problems.has(problemId)) errors.push(`중복 problemId: ${problemId} (${problems.get(problemId)} / ${entry.subject} ${entry.rank}순위)`)
      else problems.set(problemId, `${entry.subject} ${entry.rank}순위`)
    }
  }

  return { valid: errors.length === 0, errors, mappedProblemIds: [...problems.keys()] }
}
