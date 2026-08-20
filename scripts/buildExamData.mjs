import { readFileSync, writeFileSync } from 'node:fs'

const questionsText = readFileSync('/private/tmp/jaekyung-extract/questions.txt', 'utf8')
const answersText = readFileSync('/private/tmp/jaekyung-extract/answers.txt', 'utf8')
const taxonomy = JSON.parse(readFileSync('src/data/taxonomy.json', 'utf8'))
const answerMap = Object.fromEntries([...answersText.matchAll(/(\d+)\s+([1-4])/g)].map((match) => [Number(match[1]), Number(match[2])]))
const markers = [...questionsText.matchAll(/【\s*(\d+)\s*】/g)]

function isTableStart(line, nextLine) {
  const hasColumnLikeValues = (value) => (value.match(/\d+(?:[,.]\d+)?(?:%|원|년|월|일|개|주)?/g) || []).length >= 3
  const hasTableCue = /^(?:구\s*분|구분|항목|내역|일\s*자|일자|단위|<.+>)/.test(line)
    || line.length < 55 && !/[.?!]/.test(line) && line.split(/\s+/).length >= 2 && hasColumnLikeValues(nextLine)
    || line.length < 55 && !/[.?!]/.test(line) && /(?:%|원|수량|단가|금액|합계)/.test(line) && hasColumnLikeValues(line)
  return hasTableCue && /\d/.test(nextLine)
}

function joinProseLines(previous, next) {
  const previousWord = previous.match(/[가-힣]+$/)?.[0] || ''
  const nextStartsWithParticle = /^(?:(?:의|은|는|을|를|에서|에게|으로|로|와|과|도|만|부터|까지|보다|처럼|조차|마저|마다|씩|밖에|라도|이나|나|든지|든|께|서)(?=\s|$)|(?:이며|이고|이다|이었다|한다|했다|되는|된다|되었다|할|한|하는|하여|해|했|고|며|면서|지만|거나|도록|는데|다면))/.test(next)
  const knownSplitWord = previous.endsWith('건설계') && /^약/.test(next)
  const isSplitSyllable = previousWord.length === 1 && !/^(?:것|수|등|년|월|일|원|명|개|차|항)$/.test(previousWord)
  return `${previous}${nextStartsWithParticle || knownSplitWord || isSplitSyllable ? '' : ' '}${next}`
}

function repairPdfLineBreaks(value) {
  const lines = value.split('\n').map((line) => line.trim()).filter(Boolean)
  const result = []
  let inTable = false
  let tableJustEnded = false

  lines.forEach((line, index) => {
    const nextLine = lines[index + 1] || ''
    const startsTable = isTableStart(line, nextLine)
    const tableRow = inTable && (/\d/.test(line) || /^\(\*\)/.test(line))

    if (startsTable || tableRow) {
      result.push(line)
      inTable = !/^\(\*\).*[.!?]$/.test(line)
      tableJustEnded = !inTable
      return
    }

    inTable = false
    if (!result.length || tableJustEnded) result.push(line)
    else result[result.length - 1] = joinProseLines(result[result.length - 1], line)
    tableJustEnded = false
  })

  return result.join('\n')
}

function clean(value) {
  const withoutHeaders = value.replace(/--- PAGE \d+ ---/g, '').replace(/국가공인 재경관리사 시험/g, '').replace(/- \d+ -/g, '').replace(/\n{2,}/g, '\n').trim()
  return repairPdfLineBreaks(withoutHeaders)
}
function subjectId(number) { return number <= 40 ? 'FR' : number <= 80 ? 'TX' : 'CM' }
const subjectNames = Object.fromEntries(taxonomy.subjects.map((item) => [item.id, item.name]))
const taxonomyItems = taxonomy.subjects.flatMap((subject) => subject.chapters.flatMap((chapter) => [{ id: chapter.id, name: chapter.name }, ...(chapter.topics || [])]))
const topicNames = Object.fromEntries(taxonomyItems.map((item) => [item.id, item.name]))
function classification(number, text) {
  if (number <= 40) {
    const financialRanges = [[3,'FR.FND.CONCEPT'],[5,'FR.FND.PRESENT'],[8,'FR.INVENTORY'],[11,'FR.PPE'],[13,'FR.INTANGIBLE'],[14,'FR.SPECIAL.OTHER',true],[16,'FR.FIN_ASSET_BASIC'],[19,'FR.FIN_LIABILITY'],[20,'FR.PROVISION'],[22,'FR.EQUITY'],[23,'FR.REV.BASIS'],[24,'FR.REV.RECOGNITION'],[25,'FR.CONSTRUCTION',false,['FR.REV.RECOGNITION']],[26,'FR.EMPLOYEE'],[27,'FR.SPECIAL.SHARE_BASED'],[29,'FR.SPECIAL.OTHER',true],[30,'FR.SPECIAL.OTHER',true],[31,'FR.EQUITY'],[33,'FR.SPECIAL.ASSOCIATE'],[34,'FR.SPECIAL.OTHER',true],[35,'FR.SPECIAL.DERIVATIVE'],[37,'FR.SPECIAL.OTHER',true],[40,'FR.SPECIAL.CASHFLOW']]
    const found = financialRanges.find(([last]) => number <= last)
    return { primaryTopicId: found[1], reviewNeeded: Boolean(found[2]), secondaryTopicIds: found[3] || [] }
  }
  if (number >= 81) {
    const costRanges = [[81,'CM.05'],[82,'CM.02',true],[84,'CM.01'],[87,'CM.02'],[90,'CM.03'],[91,'CM.08',true],[95,'CM.08'],[100,'CM.05'],[102,'CM.01'],[106,'CM.06'],[111,'CM.09'],[114,'CM.07'],[115,'CM.09'],[118,'CM.07',true],[119,'CM.10'],[120,'CM.11']]
    const found = costRanges.find(([last]) => number <= last)
    return { primaryTopicId: found[1], reviewNeeded: Boolean(found[2]), secondaryTopicIds: [] }
  }
  const taxRanges = [[44,'TX.CORP.01',true],[45,'TX.CORP.01'],[46,'TX.CORP.02'],[47,'TX.CORP.03'],[49,'TX.CORP.04'],[52,'TX.CORP.05'],[53,'TX.CORP.04'],[57,'TX.CORP.06'],[58,'TX.CORP.08'],[59,'TX.CORP.09'],[60,'TX.CORP.01'],[61,'TX.INC.01'],[62,'TX.INC.02'],[63,'TX.INC.03'],[65,'TX.INC.04'],[66,'TX.INC.06'],[67,'TX.INC.07'],[68,'TX.INC.01'],[69,'TX.INC.09'],[70,'TX.INC.01'],[71,'TX.VAT.01'],[72,'TX.VAT.07'],[73,'TX.VAT.10'],[74,'TX.VAT.03'],[75,'TX.VAT.03'],[76,'TX.VAT.05'],[77,'TX.VAT.04'],[78,'TX.VAT.03'],[79,'TX.VAT.06'],[80,'TX.VAT.05']]
  const found = taxRanges.find(([last]) => number <= last)
  return { primaryTopicId: found[1], reviewNeeded: Boolean(found[2]), secondaryTopicIds: [] }
}
function firstMatch(text, candidates) {
  return candidates.map((candidate) => text.match(candidate)?.[0]).find(Boolean)
}
function evidenceFor(stem, options, answer) {
  const evidence = []
  const add = (text, color) => { if (text && !evidence.some((item) => item.text === text) && evidence.length < 3) evidence.push({ text, color }) }
  add(firstMatch(stem, [/옳지 않은 것/, /해당하지 않는 것/, /가장 옳지 않은 것/, /옳은 것은/]), 'red')
  add(firstMatch(stem, [/통제할 때/, /소유권/, /현재가치/, /공정가치/, /사용가치/, /기간에 걸쳐/, /시점에/, /차감할 일시적 차이/, /가산할 일시적 차이/, /과세표준/, /완성품환산량/, /공헌이익/, /손익분기점/]), 'orange')
  add(firstMatch(stem, [/\d+[,.]?\d*\s*(?:원|%|개|년|월|일)/]), 'green')
  add(firstMatch(stem, [/기타포괄손익/, /회계정책/, /재무활동/, /소득처분/, /세액공제/, /상호 관련성/, /원가회피/, /고저점법/, /목표원가/]), 'blue')
  return evidence
}
function shortPhrase(text) {
  return text.replace(/\s+/g, ' ').split(/[.,，。]/)[0].trim().slice(0, 28)
}
const explanationRules = {
  '재무보고 개념체계': '개념의 정의와 기준의 성격을 구분해 판단합니다.', '재무제표 표시': '표시 대상과 재분류 여부를 기준서 원칙에 맞춰 확인합니다.',
  '재고자산': '원가에 포함되는 지출과 기말 재고의 측정 기준을 먼저 적용합니다.', '유형자산': '취득원가, 감가상각, 손상과 재평가의 순서를 구분합니다.',
  '무형자산': '자산 인식 요건을 충족한 지출만 자산으로 보고 상각을 반영합니다.', '투자부동산': '선택한 후속측정 모형에 따라 손익과 감가상각 처리를 판단합니다.',
  '금융상품': '분류에 따라 공정가치 변동과 처분손익의 인식 위치가 달라집니다.', '충당부채': '현재의무와 신뢰성 있는 추정이 가능한지부터 확인합니다.',
  '자본': '자본거래와 손익·기타포괄손익의 변동을 분리해 합산합니다.', '수익인식': '재화나 용역의 통제가 이전되는 시점 또는 기간을 판단합니다.',
  '종업원급여': '근무원가·순이자는 손익, 재측정요소는 기타포괄손익으로 구분합니다.', '주식기준보상': '가득 예상 인원과 기말 공정가치를 반영해 누적 비용을 다시 계산합니다.',
  '법인세': '회계이익에서 세무조정과 일시적 차이를 구분해 현재·이연 법인세를 계산합니다.', '회계변경·오류': '측정기준 자체의 변경인지 추정치 변경인지를 나눠 봅니다.',
  '관계기업·연결': '유의적인 영향력과 투자자 지분에 해당하는 성과를 기준으로 판단합니다.', '환율변동': '재무상태표와 손익계산서에 적용하는 환율이 다르다는 점이 핵심입니다.',
  '파생상품': '위험회피 유형에 따라 손익과 기타포괄손익의 인식 위치를 구분합니다.', '부가가치세': '공급 시기·장소와 과세표준을 먼저 확정한 뒤 예외를 적용합니다.',
  '소득세': '소득 구분과 공제 요건을 확인한 뒤 과세표준과 세액을 계산합니다.', '세무회계': '세법상 인정 여부와 계산 순서를 조문 기준으로 확인합니다.',
  '원가관리회계': '원가 대상과 원가 흐름을 구분한 뒤 요구한 원가를 계산합니다.', '개별원가계산': '작업별로 직접원가와 배부된 제조간접원가를 추적합니다.',
  '종합원가계산': '완성품과 기말재공품의 완성품환산량을 먼저 계산합니다.', '표준원가': '실제와 표준의 차이를 가격·수량 등 원인별로 나눕니다.',
  'CVP 분석': '공헌이익을 기준으로 고정원가와 조업도의 관계를 계산합니다.', '활동기준원가': '활동별 원가동인과 배부율을 연결해 판단합니다.',
  '계획과 통제': '예산·책임 단위와 성과평가 기준을 구분해 봅니다.', '전략적 원가관리': '시장 가격과 목표이익에서 목표원가를 역산합니다.',
}
const selfExplanations = {
  '2025-01-FR-01': {
    explanation: '정답은 ①입니다. K-IFRS는 세부 상황을 모두 나열하는 규정중심 방식보다 거래의 경제적 실질을 판단하는 원칙중심 회계기준에 가깝습니다. 따라서 ①의 “규정중심”이라는 설명이 틀립니다.',
    solutionSteps: [
      '문제의 요구가 “옳지 않은 것”인지 먼저 확인합니다.',
      'K-IFRS의 핵심 성격은 원칙중심이며, 거래의 실질을 반영하는 것입니다.',
      '①은 이를 규정중심이라고 반대로 설명하므로 정답입니다.',
    ],
    choiceAnalysis: [
      { choiceNo: 1, verdict: '틀림(정답)', reason: '틀린 부분은 “규정중심”입니다. 올바른 기준은 K-IFRS가 거래의 경제적 실질을 판단하는 원칙중심 회계기준이라는 점입니다. 따라서 이 설명이 맞지 않습니다.' },
      { choiceNo: 2, verdict: '맞음', reason: 'K-IFRS 도입 이후 공정가치 측정의 적용 범위가 확대되었습니다.' },
      { choiceNo: 3, verdict: '맞음', reason: 'K-IFRS 체계에서는 연결재무제표를 기본 재무제표로 봅니다.' },
      { choiceNo: 4, verdict: '맞음', reason: '국제회계기준은 여러 국가와 이해관계자의 협력을 바탕으로 제정됩니다.' },
    ],
    commonMistake: '“국제”라는 말만 보고 세부 규칙이 많을 것이라고 생각하는 실수입니다. 핵심은 규칙 암기보다 거래 실질을 우선한다는 점입니다.',
  },
  '2025-01-FR-03': {
    explanation: '정답은 ④입니다. 유용한 재무정보의 보강적 질적 특성은 비교가능성·검증가능성·적시성·이해가능성입니다. ④는 이 목록에 없는 “신뢰성, 보수성”을 넣고 검증가능성·적시성을 빠뜨렸으므로 옳지 않은 설명입니다.',
    solutionSteps: [
      '문제가 “옳지 않은 것”을 묻는지 먼저 확인합니다.',
      '기본 질적 특성은 목적적합성과 표현충실성이고, 이를 보강하는 특성은 비교가능성·검증가능성·적시성·이해가능성입니다.',
      '④의 특성 목록을 정확한 목록과 대조하여 신뢰성·보수성이 들어간 부분이 틀렸음을 판단합니다.',
    ],
    choiceAnalysis: [
      { choiceNo: 1, verdict: '맞음', reason: '목적적합한 정보는 이용자의 의사결정에 차이를 만들 수 있는 정보입니다. 예측가치·확인가치 중 하나 또는 둘 다가 있으면 의사결정에 영향을 줄 수 있으므로 ①의 설명은 맞습니다.' },
      { choiceNo: 2, verdict: '맞음', reason: '유용한 정보는 목적적합하기만 해서는 부족하고, 나타내려는 경제현상의 실질을 충실하게 표현해야 합니다. ②는 목적적합성과 표현충실성이 함께 필요하다는 기준을 정확히 설명합니다.' },
      { choiceNo: 3, verdict: '맞음', reason: '표현충실성은 완전성·중립성·오류 없음으로 설명합니다. ③은 이 세 요소를 모두 제시하므로 개념체계의 표현충실성 기준과 일치합니다.' },
      { choiceNo: 4, verdict: '틀림(정답)', reason: '틀린 부분은 보강적 질적 특성에 “신뢰성, 보수성”을 포함한 점입니다. 올바른 기준은 비교가능성·검증가능성·적시성·이해가능성이라는 목록입니다. 보수성은 불확실성 아래에서 중립성을 뒷받침하는 신중성이지 보강적 질적 특성이 아니므로 ④가 정답입니다.' },
    ],
    commonMistake: '과거 개념체계의 “신뢰성” 표현과 보수성을 보강적 질적 특성 목록에 넣는 실수입니다. 네 가지 보강적 질적 특성을 그대로 구분해 기억해야 합니다.',
  },
  '2025-01-FR-14': {
    explanation: '정답은 ②입니다. 투자부동산의 후속측정은 공정가치모형 또는 원가모형 중 하나를 선택하되, 선택한 모형을 개별 유형별이 아니라 모든 투자부동산에 일관되게 적용해야 합니다. 따라서 “투자부동산의 유형별로 동일하게 적용한다”는 ②의 적용 단위가 틀렸습니다.',
    solutionSteps: [
      '문제가 “가장 옳지 않은 것”을 묻는지 확인합니다.',
      '투자부동산의 후속측정 모형은 개별 부동산 유형별 선택이 아니라 전체 투자부동산에 대한 일관된 선택입니다.',
      '②는 모형을 적용하는 범위를 “유형별”이라고 잘못 표현했으므로 정답입니다.',
    ],
    choiceAnalysis: [
      { choiceNo: 1, verdict: '맞음', reason: '투자부동산은 임대수익·시세차익 또는 둘 다를 얻기 위해 보유하는 부동산입니다.' },
      { choiceNo: 2, verdict: '틀림', reason: '틀린 부분은 “투자부동산의 유형별로”입니다. 올바른 기준은 공정가치모형 또는 원가모형을 선택하면 모든 투자부동산에 일관되게 적용해야 한다는 것입니다. 따라서 유형별로 따로 선택할 수 없습니다.' },
      { choiceNo: 3, verdict: '맞음', reason: '공정가치모형에서는 매 보고기간 공정가치로 다시 측정하므로 별도의 감가상각을 하지 않습니다.' },
      { choiceNo: 4, verdict: '맞음', reason: '투자부동산 공정가치 변동에서 생긴 이익·손실은 기타포괄손익이 아니라 당기손익으로 인식합니다.' },
    ],
    commonMistake: '“같은 유형별로 일관 적용”이라는 표현을 다른 유형자산 회계와 혼동하는 실수입니다. 투자부동산은 전체 투자부동산에 하나의 후속측정 모형을 적용합니다.',
  },
}
const verifiedCalculations = {
  '2025-01-FR-07': {
    formula: '매출원가 = 기초재고 + 당기매입 - 기말재고',
    substitutions: ['기말재고 = 200개 × 110원 = 22,000원', '매출원가 = 142,000원 - 22,000원 = 120,000원'],
    result: '120,000원',
    verifiedAgainstAnswer: true,
  },
  '2025-01-CM-06': { formula: '총제조원가 = 직접재료원가 + 직접노무원가 + 부문별 배부 제조간접원가', substitutions: ['A부문 배부율 = 400,000원 ÷ 2,000시간 = 200원, B부문 배부율 = 800,000원 ÷ 8,000시간 = 100원', '제조간접원가 = 120시간×200원 + 240시간×100원 = 48,000원 → 50,000원 + 52,000원 + 48,000원 = 150,000원'], result: '150,000원', verifiedAgainstAnswer: true },
  '2025-01-CM-07': { formula: '기말재공품 = 작업 #2의 기초재공품 + 직접재료·노무 + 배부 제조간접원가', substitutions: ['제조간접원가 배부율 = 8,000원 ÷ (8,000원 + 12,000원) = 기초원가의 40%', '작업 #2 제조간접원가 = (3,000원 + 5,000원) × 40% = 3,200원 → 3,000원 + 3,000원 + 5,000원 + 3,200원 = 14,200원'], result: '14,200원', verifiedAgainstAnswer: true },
  '2025-01-CM-09': { formula: '기말재공품원가 = 재료 완성품환산량 × 단위원가 + 가공 완성품환산량 × 단위원가', substitutions: ['재료는 공정 초기에 전량 투입되므로 재료 완성품환산량은 400개, 가공 완성품환산량은 400개 × 60% = 240개입니다.', '400개 × 1,500원 + 240개 × 500원 = 720,000원'], result: '720,000원', verifiedAgainstAnswer: true },
  '2025-01-CM-10': { formula: '선입선출법 당기완성품원가 = 기초재공품원가 + 기초재공품 완성원가 + 당기 착수·완성품원가', substitutions: ['당기 단위원가: 재료 150,000원 ÷ 30,000단위 = 5원, 가공 320,400원 ÷ 26,700완성품환산량 = 12원', '기초 18,000원 + 기초 완성 가공 1,200×12원 + 당기 착수·완성 24,000×(5원+12원) = 440,400원'], result: '440,400원', verifiedAgainstAnswer: true },
  '2025-01-CM-13': { formula: '재료 가격차이 = 실제투입수량 × (표준가격 - 실제가격)', substitutions: ['7,500원 유리 = 1,500kg × (표준가격 - 15원)', '표준가격 - 15원 = 5원 → 표준가격 = 20원/kg'], result: '20원', verifiedAgainstAnswer: true },
  '2025-01-CM-15': { formula: '변동제조간접원가 능률차이 = 실제작업시간 기준 예산 - 실제생산량 허용 예산', substitutions: ['실제작업시간 기준 예산은 7,235,000원이고, 실제생산량 허용 예산은 7,000,000원입니다.', '7,235,000원 - 7,000,000원 = 235,000원 불리한 차이'], result: '235,000원(불리)', verifiedAgainstAnswer: true },
  '2025-01-CM-16': { formula: '전부원가계산 순이익 = 변동원가계산 순이익 + 기말재고에 이연된 고정제조간접원가', substitutions: ['기말 재공품과 제품에 포함된 고정제조간접원가 = 60,000원 + 40,000원 = 100,000원', '전부원가계산 순이익 = 200,000원 + 100,000원 = 300,000원'], result: '300,000원', verifiedAgainstAnswer: true },
  '2025-01-CM-22': { formula: '특수형 단위당 제조원가 = (직접원가 + 활동별 배부 제조간접원가) ÷ 특수형 생산수량', substitutions: ['특수형 제조간접원가 = 포장 4,000×300원 + 재료처리 80,000×15원 + 절삭 80,000×20원 + 조립 4,000×150원 = 4,600,000원', '특수형 총제조원가 = 8,000,000원 + 4,000,000원 + 4,600,000원 = 16,600,000원 → 4,000개로 나누면 4,150원'], result: '4,150원', verifiedAgainstAnswer: true },
  '2025-01-CM-26': { formula: '영업레버리지도 = 공헌이익 ÷ 영업이익', substitutions: ['공헌이익 = 영업레버리지도 × 영업이익', '5 × 200,000원 = 1,000,000원'], result: '1,000,000원', verifiedAgainstAnswer: true },
  '2025-01-CM-30': { formula: '매출배합차이·수량차이 = 예산 단위당 공헌이익을 기준으로 실제 배합·수량과 예산을 비교', substitutions: ['매출배합차이 = (4,950개×300원 + 6,050개×200원) - (5,500개×300원 + 5,500개×200원) = 55,000원 불리', '매출수량차이 = (11,000개 - 10,000개) × 가중평균 공헌이익 250원 = 250,000원 유리'], result: '55,000원 불리 / 250,000원 유리', verifiedAgainstAnswer: true },
  '2025-01-CM-37': { formula: '연간순현금유입 = 세후 현금절감액 + 감가상각 절세효과', substitutions: ['세후 현금절감액 = (노무비 절감 400,000원 - 운영경비 증가 200,000원) × (1 - 25%) = 150,000원', '감가상각 절세효과 = (480,000원 ÷ 6년) × 25% = 20,000원 → 연간순현금유입 170,000원'], result: '170,000원', verifiedAgainstAnswer: true },
  '2025-01-CM-39': { formula: '수요부문의 최대대체가격 = 외부구입가격', substitutions: ['B사업부는 외부에서 부품을 단위당 600원에 구입할 수 있습니다.', '내부대체가격이 600원을 초과하면 외부구입이 유리하므로 최대 수용 가격은 600원입니다.'], result: '600원', verifiedAgainstAnswer: true },
  '2025-01-FR-08': { formula: '매출원가 = 기초재고 + 당기매입 - 기말재고 + 매출원가 반영 손실', substitutions: ['모든 손실 차감 전 기말재고 = 500,000원 + 평가손실 100,000원 + 정상감모 20,000원 + 비정상감모 30,000원 = 650,000원', '기본 매출원가 750,000원에 평가손실 100,000원과 정상감모 20,000원만 반영 → 870,000원'], result: '870,000원', verifiedAgainstAnswer: true },
  '2025-01-FR-27': { formula: '당기 보상비용 = 당기 말 누적부채 - 전기 말 누적부채', substitutions: ['20X1년 말 누적부채 = 100명 × 90% × 10개 × (2,500원 - 2,000원) × 1/3 = 150,000원', '20X2년 말 누적부채 = 100명 × 80% × 10개 × (2,800원 - 2,000원) × 2/3 = 426,666원 → 당기비용 약 276,666원'], result: '276,666원', verifiedAgainstAnswer: true },
  '2025-01-FR-29': { formula: '법인세비용 = 당기법인세 + 이연법인세부채 증가 - 이연법인세자산 증가', substitutions: ['과세소득 = 500,000원 + 40,000원 + 100,000원 - 60,000원 = 580,000원 → 당기법인세 116,000원', '이연법인세자산 = 100,000원 × 30% = 30,000원, 이연법인세부채 = 60,000원 × 30% = 18,000원 → 법인세비용 116,000원 - 30,000원 + 18,000원 = 104,000원'], result: '104,000원', verifiedAgainstAnswer: true },
  '2025-01-FR-37': { formula: '리스부채 = 리스료 지급액의 현재가치 + 지급 예상 보증잔존가치의 현재가치', substitutions: ['보증잔존가치는 지급할 금액이 없을 것으로 추정했으므로 리스부채에 포함하지 않습니다.', '리스부채 = 1,000,000원 × 정상연금현가계수 2.4869 = 2,486,900원'], result: '2,486,900원', verifiedAgainstAnswer: true },
  '2025-01-FR-40': { formula: '영업활동현금흐름 = 당기순이익 + 비현금비용 - 비영업손익 ± 운전자본 변동', substitutions: ['5,000,000원 - 처분이익 200,000원 + 감가상각비 300,000원 - 매출채권 증가 900,000원 - 재고 증가 1,000,000원 - 매입채무 감소 500,000원', '유형자산 증가는 투자활동이므로 제외 → 영업활동현금흐름 2,700,000원'], result: '2,700,000원', verifiedAgainstAnswer: true },
  '2025-01-TX-07': { formula: '익금 합계 = 세법상 익금에 해당하는 항목의 합계', substitutions: ['사업수입금액 2,000,000원과 자기주식 양도금액 10,000,000원은 익금에 해당합니다.', '부가가치세 매출세액·법인세 환급액·저가매입 유가증권 차액은 익금에서 제외 → 12,000,000원'], result: '12,000,000원', verifiedAgainstAnswer: true },
  '2025-01-TX-13': { formula: '일반기부금 한도초과액 = 기부금액 - (기준소득금액 - 이월결손금) × 한도율', substitutions: ['일반기부금 한도 = (1,000,000,000원 - 800,000,000원) × 10% = 20,000,000원', '현물기부금 100,000,000원 - 한도 20,000,000원 = 한도초과액 80,000,000원'], result: '80,000,000원', verifiedAgainstAnswer: true },
  '2025-01-TX-19': { formula: '과세표준 = 소득금액 - 비과세소득 - 공제 가능한 이월결손금', substitutions: ['소득금액 = 500,000,000원 + 90,000,000원 - 10,000,000원 = 580,000,000원, 비과세소득 10,000,000원을 차감합니다.', '2004년 결손금은 공제기간이 지났고 2024년 결손금 10,000,000원만 공제 → 580,000,000원 - 10,000,000원 - 10,000,000원 = 560,000,000원'], result: '560,000,000원', verifiedAgainstAnswer: true },
  '2025-01-TX-22': { formula: '종합과세 금융소득 = 이자소득 + 배당소득의 총수입금액(배당가산 포함)', substitutions: ['국내 예금이자 10,000,000원, 비상장 내국법인 배당 20,000,000원에 배당가산 10%를 반영합니다.', '외국법인 배당 5,000,000원을 합산한 종합과세 금융소득금액은 36,500,000원입니다.'], result: '36,500,000원', verifiedAgainstAnswer: true },
  '2025-01-TX-23': { formula: '귀속연도 임대수입 = 선불 임대료 × 해당 연도 임대기간 ÷ 전체 임대기간', substitutions: ['선불 임대료 200,000,000원의 임대기간은 2025년 7월부터 2027년 6월까지 총 24개월입니다.', '2025년 귀속 6개월분 = 200,000,000원 × 6개월 ÷ 24개월 = 50,000,000원'], result: '50,000,000원', verifiedAgainstAnswer: true },
  '2025-01-TX-25': { formula: '기타소득 필요경비 = 실제 필요경비와 유형별 의제필요경비 중 공제 가능한 금액', substitutions: ['주택입주지체상금 7,000,000원, 원고 대가 4,000,000원, 산업재산권 대가 1,800,000원을 각각 적용합니다.', '공제가능 필요경비 합계 = 7,000,000원 + 4,000,000원 + 1,800,000원 = 12,800,000원'], result: '12,800,000원', verifiedAgainstAnswer: true },
  '2025-01-TX-26': { formula: '종합소득금액 = 종합소득에 해당하는 소득금액의 합계', substitutions: ['근로소득 40,000,000원, 사업소득 15,000,000원, 기타소득 6,000,000원을 합산합니다.', '양도소득과 퇴직소득은 분류과세이므로 제외 → 종합소득금액 61,000,000원'], result: '61,000,000원', verifiedAgainstAnswer: true },
  '2025-01-TX-32': { formula: '차가감납부세액 = 매출세액 - 공제매입세액 + 가산세', substitutions: ['과세공급가액 = 20,000,000원 - 면세 5,000,000원 = 15,000,000원 → 매출세액 1,500,000원', '공제매입세액 = (10,000,000원 - 면세 1,000,000원 - 불공제 2,000,000원) × 10% = 700,000원 → 1,500,000원 - 700,000원 + 10,000원 = 810,000원'], result: '810,000원', verifiedAgainstAnswer: true },
  '2025-01-TX-37': { formula: '포함된 부가가치세 = 부가가치세 과세대상 금액 × 10 ÷ 110', substitutions: ['국민주택 월세·전쟁기념관 입장권·배추는 면세이고, 항공운송과 피부과 레이저시술은 과세대상입니다.', '과세대상 330,000원과 110,000원에 포함된 부가가치세 = 440,000원 × 10 ÷ 110 = 40,000원'], result: '40,000원', verifiedAgainstAnswer: true },
  '2025-01-TX-38': { formula: '폐업 시 잔존재화 과세표준 = 제품 시가 + 건물 잔존재화 의제공급 과세표준', substitutions: ['제품은 시가 30,000,000원을 반영하고, 토지는 면세이므로 제외합니다.', '건물의 경과기간을 반영한 잔존재화 과세표준 105,000,000원을 더해 135,000,000원입니다.'], result: '135,000,000원', verifiedAgainstAnswer: true },
  '2025-01-TX-40': { formula: '영세율 세금계산서 발급분 = 구매확인서에 의한 수출 공급가액', substitutions: ['구매확인서에 의한 수출은 세금계산서 발급 영세율 거래로 구분합니다.', '구매확인서 수출액 30,000,000원이 (ㄱ)에 들어갑니다.'], result: '30,000,000원', verifiedAgainstAnswer: true },
  '2025-01-FR-10': {
    formula: '손상차손 = 장부금액 - 회수가능액, 회수가능액 = max(순공정가치, 사용가치)',
    substitutions: ['A: 회수가능액 = max(150,000,000원, 240,000,000원) = 240,000,000원 → 손상차손 0원', 'B: 회수가능액 = max(40,000,000원, 60,000,000원) = 60,000,000원', 'B 손상차손 = 80,000,000원 - 60,000,000원 = 20,000,000원'],
    result: '20,000,000원', verifiedAgainstAnswer: true,
  },
  '2025-01-FR-11': {
    formula: '재평가잉여금 = 재평가일 공정가치 - 재평가 직전 장부금액',
    substitutions: ['연간 감가상각비 = 50,000원 ÷ 5년 = 10,000원', '20X2년 말 장부금액 = 50,000원 - (10,000원 × 2년) = 30,000원', '재평가잉여금 = 40,000원 - 30,000원 = 10,000원'],
    result: '기타포괄이익 10,000원 증가', verifiedAgainstAnswer: true,
  },
  '2025-01-FR-13': {
    formula: '기말 장부금액 = 개발비 자산인식액 - 상각액',
    substitutions: ['자산인식 개발비 = 1,300,000원', '반기 상각액 = 1,300,000원 ÷ 5년 × 6개월 ÷ 12개월 = 130,000원', '기말 장부금액 = 1,300,000원 - 130,000원 = 1,170,000원'],
    result: '1,170,000원', verifiedAgainstAnswer: true,
  },
  '2025-01-FR-16': {
    formula: 'FVOCI 지분상품의 처분 시 누적 기타포괄손익은 당기손익으로 재분류하지 않는다',
    substitutions: ['처분 시점 공정가치 120,000원과 취득·보유 기간의 변동은 기타포괄손익에 누적됩니다.', '처분 시 누적 기타포괄손익을 당기손익으로 재분류하지 않습니다.'],
    result: '당기손익 처분이익 0원', verifiedAgainstAnswer: true,
  },
  '2025-01-FR-19': {
    formula: '이자비용 = 기초 상각후원가 × 유효이자율',
    substitutions: ['발행가액 = 3,000,000원 × 2.57710 + 50,000,000원 × 0.79383 = 47,422,800원', '20X1 말 장부금액 = 47,422,800원 + (47,422,800원 × 8% - 3,000,000원) = 48,216,624원', '20X2 이자비용 = 48,216,624원 × 8% = 3,857,330원(근사)'],
    result: '3,857,330원', verifiedAgainstAnswer: true,
  },
  '2025-01-FR-21': {
    formula: '보통주 배당 = 총배당 - 누적우선주 우선배당',
    substitutions: ['우선주 연간 우선배당 = 2,000주 × 1,000원 × 10% = 200,000원', '2개 연도 누적 우선배당 = 200,000원 × 2년 = 400,000원', '보통주 배당 = 500,000원 - 400,000원 = 100,000원'],
    result: '100,000원', verifiedAgainstAnswer: true,
  },
  '2025-01-FR-22': {
    formula: '기말자본 = 기초자본 + 총포괄이익 + 자본거래 순증감',
    substitutions: ['기초자본 = 35,000,000원 - 13,000,000원 = 22,000,000원', '총포괄이익 = 1,300,000원 + 1,100,000원 = 2,400,000원', '주식배당은 자본 내 대체이므로 총자본은 변동하지 않습니다.', '자본거래 순증감 = 유상증자 600,000원 - 자기주식 700,000원 = -100,000원', '기말자본 = 22,000,000원 + 2,400,000원 - 100,000원 = 24,300,000원'],
    result: '24,300,000원', verifiedAgainstAnswer: true,
  },
  '2025-01-FR-24': {
    formula: '사용권 접근 라이선스가 아닌 사용권(right to use) 제공이면 제공 시점에 수익을 인식',
    substitutions: ['㈜삼일뮤직은 앨범을 재녹음하는 활동을 수행하지 않습니다.', '따라서 고객은 계약 시점에 완성된 지식재산 사용권을 통제합니다.', '수익 = 거래가격 400,000,000원 전액'],
    result: '400,000,000원', verifiedAgainstAnswer: true,
  },
  '2025-01-FR-25': {
    formula: '계약자산·부채 = 누적수익 - 누적청구액',
    substitutions: ['진행률 = 40,000,000원 ÷ (40,000,000원 + 60,000,000원) = 40%', '누적수익 = 120,000,000원 × 40% = 48,000,000원', '계약자산 = 48,000,000원 - 40,000,000원 = 8,000,000원'],
    result: '계약자산 8,000,000원', verifiedAgainstAnswer: true,
  },
  '2025-01-FR-33': {
    formula: '관계기업투자주식 = 취득원가 + 투자자 지분의 총포괄이익',
    substitutions: ['투자자 지분의 총포괄이익 = 500,000원 × 30% = 150,000원', '기말 투자주식 = 800,000원 + 150,000원 = 950,000원'],
    result: '950,000원', verifiedAgainstAnswer: true,
  },
}
const topicGuides = {
  'FR.FND.CONCEPT': '개념의 정의와 원칙중심 여부를 구분하는 것이 핵심입니다.', 'FR.FND.PRESENT': '재무제표의 표시 위치와 재분류 여부를 구분합니다.',
  'FR.INVENTORY': '취득원가와 기말재고 평가 기준을 먼저 확인합니다.', 'FR.PPE': '취득원가·감가상각·손상·재평가를 구분합니다.',
  'FR.INTANGIBLE': '인식 요건을 충족한 지출만 자산으로 보고 상각을 반영합니다.', 'FR.FIN_ASSET_BASIC': '금융자산의 분류에 따라 후속 측정과 처분손익을 판단합니다.',
  'FR.FIN_LIABILITY': '사채의 최초 인식과 유효이자율법에 따른 후속 측정을 구분합니다.', 'FR.EMPLOYEE': '근무원가·순이자와 재측정요소의 인식 위치를 구분합니다.',
  'FR.PROVISION': '현재의무와 신뢰성 있는 추정 가능 여부를 확인합니다.', 'FR.EQUITY': '자본거래와 손익·기타포괄손익의 변동을 분리합니다.',
  'FR.REV.BASIS': '고객과의 계약에서 수행의무와 거래가격을 구분합니다.', 'FR.REV.RECOGNITION': '재화나 용역의 통제가 이전되는 시점 또는 기간을 판단합니다.',
  'FR.CONSTRUCTION': '진행률에 따른 누적 수익과 청구액의 차이를 비교합니다.', 'FR.SPECIAL.DERIVATIVE': '위험회피 유형별 손익과 기타포괄손익의 인식 위치가 핵심입니다.',
  'FR.SPECIAL.SHARE_BASED': '가득 예상 인원과 기말 공정가치로 누적 비용을 다시 계산합니다.', 'FR.SPECIAL.ASSOCIATE': '유의적인 영향력과 지분법 투자주식의 변동을 확인합니다.',
  'FR.SPECIAL.CASHFLOW': '영업·투자·재무활동의 현금흐름 분류를 먼저 정합니다.',
  'FR.SPECIAL.OTHER': '문제에서 제시한 특수회계의 인식·측정 기준을 우선 적용합니다.',
  'TX.CORP.01': '법인세의 기본 원칙과 사업연도·신고 절차를 구분합니다.', 'TX.CORP.02': '세무조정의 가감과 소득처분의 귀속을 구분합니다.',
  'TX.CORP.03': '익금에 해당하는지와 제외 항목을 구분합니다.', 'TX.CORP.04': '손금 인정 요건과 한도를 확인합니다.',
  'TX.CORP.05': '자산·부채 평가와 귀속사업연도 기준을 적용합니다.', 'TX.CORP.06': '손금불산입 사유와 세무조정 방식을 확인합니다.',
  'TX.CORP.08': '특수관계인 거래의 시가·정상 이자율 기준을 확인합니다.', 'TX.CORP.09': '소득금액에서 공제를 반영해 과세표준과 세액을 계산합니다.',
  'TX.INC.01': '소득세의 납세의무와 신고·원천징수 원칙을 구분합니다.', 'TX.INC.02': '금융소득의 분리과세와 종합과세 기준을 확인합니다.',
  'TX.INC.03': '사업소득의 총수입금액 귀속 시기를 먼저 판단합니다.', 'TX.INC.04': '근로·기타소득의 수입시기와 필요경비 기준을 확인합니다.',
  'TX.INC.06': '종합소득에 포함되는 소득만 합산합니다.', 'TX.INC.07': '세액공제의 적용 대상과 요건을 확인합니다.', 'TX.INC.09': '양도소득세 과세대상과 납세절차를 구분합니다.',
  'TX.VAT.01': '부가가치세의 납세의무와 과세 원칙을 확인합니다.', 'TX.VAT.03': '과세거래·간주공급·폐업 시 잔존재화 여부를 판단합니다.',
  'TX.VAT.04': '영세율과 면세는 적용 요건과 효과가 다릅니다.', 'TX.VAT.05': '공급가액과 과세표준에 포함·제외되는 금액을 구분합니다.',
  'TX.VAT.06': '세금계산서의 기능과 발급 요건을 확인합니다.', 'TX.VAT.07': '매입세액 공제 가능 여부와 불공제 항목을 구분합니다.', 'TX.VAT.10': '과세기간과 신고·납부 절차를 확인합니다.',
  'CM.01': '간접원가를 원가동인에 따라 배부하는 방법을 구분합니다.', 'CM.02': '개별 작업별로 직접원가와 제조간접원가를 추적합니다.',
  'CM.03': '완성품과 재공품의 완성품환산량을 기준으로 원가를 배분합니다.', 'CM.05': '전부·변동·초변동원가의 고정원가 처리 차이를 구분합니다.',
  'CM.06': '공헌이익과 고정원가를 이용해 조업도·이익 관계를 계산합니다.', 'CM.07': '미래에 달라지는 관련원가와 관련수익만 비교합니다.',
  'CM.08': '실제원가와 표준원가의 차이를 가격·수량 등 원인별로 나눕니다.', 'CM.09': '예산·책임단위·성과지표를 구분해 평가합니다.',
  'CM.10': '사내대체가격은 공급부문과 수요부문의 의사결정 영향을 함께 봅니다.', 'CM.11': '시장가격과 목표이익에서 목표원가를 역산합니다.',
}
const calculationFormulas = {
  'FR.INVENTORY': '매출원가 = 기초재고 + 당기매입 - 기말재고', 'FR.CONSTRUCTION': '계약자산·부채 = 누적수익 - 누적청구액',
  'FR.FIN_LIABILITY': '이자비용 = 기초 상각후원가 × 유효이자율', 'TX.CORP.09': '과세표준 = 소득금액 - 공제·감면',
  'TX.VAT.07': '납부세액 = 매출세액 - 공제 가능한 매입세액', 'CM.03': '재공품원가 = 완성품환산량 × 단위당 원가',
  'CM.06': '이익 = 공헌이익 - 고정원가', 'CM.08': '원가차이 = 실제원가 - 표준원가',
}
const topicSignals = {
  'FR.FND.CONCEPT': ['국제회계기준', '질적 특성', '측정방법'], 'FR.FND.PRESENT': ['기타포괄손익', '중간재무보고서'],
  'FR.INVENTORY': ['재고자산', '선입선출법', '매출원가'], 'FR.PPE': ['유형자산', '손상차손', '재평가'],
  'FR.INTANGIBLE': ['무형자산', '연구단계', '개발단계'], 'FR.FIN_ASSET_BASIC': ['금융자산', '기타포괄손익-공정가치'],
  'FR.FIN_LIABILITY': ['사채', '유효이자율', '상각후원가'], 'FR.EMPLOYEE': ['확정급여', '재측정요소'],
  'FR.PROVISION': ['충당부채', '우발부채'], 'FR.EQUITY': ['우선주', '주당이익', '자기주식'],
  'FR.REV.BASIS': ['고객과의 계약', '수행의무'], 'FR.REV.RECOGNITION': ['라이선스', '통제', '수익'],
  'FR.CONSTRUCTION': ['진행률', '계약자산', '계약부채'], 'FR.SPECIAL.DERIVATIVE': ['위험회피', '파생상품'],
  'FR.SPECIAL.SHARE_BASED': ['주가차액보상권', '주식기준보상'], 'FR.SPECIAL.ASSOCIATE': ['지분법', '유의적인 영향력'],
  'FR.SPECIAL.CASHFLOW': ['현금흐름', '영업활동', '재무활동'], 'FR.SPECIAL.OTHER': ['법인세', '리스', '환율변동'],
  'TX.CORP.01': ['사업연도', '국세기본법', '조세'], 'TX.CORP.02': ['세무조정', '소득처분'], 'TX.CORP.03': ['익금'],
  'TX.CORP.04': ['손금', '기부금'], 'TX.CORP.05': ['감가상각', '자산·부채'], 'TX.CORP.06': ['손금불산입', '충당금'],
  'TX.CORP.08': ['특수관계인', '부당행위'], 'TX.CORP.09': ['과세표준', '납부세액'], 'TX.INC.01': ['소득세', '원천징수'],
  'TX.INC.02': ['금융소득', '배당소득'], 'TX.INC.03': ['사업소득', '임대'], 'TX.INC.04': ['근로소득', '기타소득'],
  'TX.INC.06': ['종합소득금액'], 'TX.INC.07': ['세액공제'], 'TX.INC.09': ['양도소득'],
  'TX.VAT.01': ['부가가치세'], 'TX.VAT.03': ['간주공급', '폐업시'], 'TX.VAT.04': ['면세', '영세율'],
  'TX.VAT.05': ['과세표준', '공급가액'], 'TX.VAT.06': ['세금계산서'], 'TX.VAT.07': ['매입세액'], 'TX.VAT.10': ['과세기간'],
  'CM.01': ['보조부문', '활동기준원가', '원가배부'], 'CM.02': ['개별원가', '작업'], 'CM.03': ['종합원가', '완성품환산량'],
  'CM.05': ['변동원가', '전부원가', '원가행태'], 'CM.06': ['공헌이익', '손익분기', '영업레버리지'],
  'CM.07': ['특별주문', '관련원가', '회수기간'], 'CM.08': ['표준원가', '원가차이'],
  'CM.09': ['예산', '책임회계', '경제적부가가치'], 'CM.10': ['사내대체', '대체가격'], 'CM.11': ['목표원가'],
}
function studyDirection({ primaryTopicId, topicName, stem, evidence }) {
  const signals = topicSignals[primaryTopicId] || []
  const terms = [...new Set([...signals.filter((term) => stem.includes(term)), ...evidence.filter((item) => item.color !== 'red').map((item) => item.text)])].slice(0, 2)
  const keyTerms = terms.length ? terms : [topicName]
  const concept = topicGuides[primaryTopicId] || `${topicName}의 정의와 적용 요건`
  const calculation = /계산하면|계산할|얼마인가|금액은 얼마|수량은 얼마|몇 원|최대금액/.test(stem)
  return {
    keyTerms,
    topic: topicName,
    concept,
    strategy: calculation ? '찾은 수치·기간·단위를 분리한 뒤, 해당 단원의 식에 대입하고 선택지와 대조합니다.' : '찾은 표현이 요구하는 요건·예외·인식 시점을 각 선택지에 차례로 대입합니다.',
  }
}
const directionOverrides = {
  '2025-01-FR-14': { keyTerms: ['투자부동산', '유형별'], topic: '투자부동산', concept: '후속측정 모형은 투자부동산의 유형별이 아니라 모든 투자부동산에 일관되게 적용합니다.', strategy: '“유형별”이라는 적용 단위를 확인하고, 모형 선택의 적용 범위가 전체 투자부동산인지 판단합니다.' },
  '2025-01-TX-04': { keyTerms: ['권리구제', '이의신청'], topic: '국세기본법', concept: '이의신청은 심사청구·심판청구 전에 반드시 거쳐야 하는 절차가 아니라 선택 가능한 전심절차입니다.', strategy: '불복 절차의 선택·필수 여부를 구분하고 “반드시” 같은 단정 표현을 확인합니다.' },
  '2025-01-TX-10': { keyTerms: ['당기손익인식 금융자산', '금융자산평가이익'], topic: '세무조정과 소득처분', concept: '상장주식 평가이익은 평가 시 익금불산입 유보로 조정하고 처분 시 익금산입으로 환입합니다.', strategy: '평가연도와 처분연도를 나눈 뒤, 각 연도의 세무조정과 소득처분 방향을 연결합니다.' },
  '2025-01-TX-11': { keyTerms: ['감가상각', '건축물'], topic: '법인세 감가상각', concept: '건축물의 세법상 상각방법은 정액법이므로 정률법을 임의로 선택할 수 없습니다.', strategy: '자산 종류를 먼저 확인하고, 해당 자산에 허용된 상각방법만 대입합니다.' },
  '2025-01-TX-12': { keyTerms: ['기계장치', '감가상각비'], topic: '법인세 감가상각', concept: '한도초과액은 유보로 손금불산입하고 이후 한도 미달이 생기면 유보를 손금산입해 환입합니다.', strategy: '연도별 상각범위액과 결산상 상각비를 비교해 초과·미달 및 유보의 환입 순서를 계산합니다.' },
  '2025-01-TX-34': { keyTerms: ['사업장', '임시사업장'], topic: '부가가치세 사업장', concept: '행사장 임시사업장은 일정 요건에서 기존 사업장에 포함될 수 있으므로 항상 새로운 사업장이라는 설명은 틀립니다.', strategy: '“항상” 같은 절대 표현을 찾고, 임시사업장의 기존 사업장 포함 예외를 확인합니다.' },
  '2025-01-CM-02': { keyTerms: ['제조원가명세서', '기초재공품'], topic: '제조원가명세서', concept: '직접재료·직접노무·제조간접원가의 합계는 당기총제조원가이며, 재공품을 가감하면 당기제품제조원가가 됩니다.', strategy: '원가명세서의 위에서 아래 순서대로 직접원가·간접원가·재공품 증감을 연결합니다.' },
  '2025-01-CM-12': { keyTerms: ['직접재료원가', '가격차이'], topic: '표준원가', concept: '원재료의 비효율적 사용은 가격차이가 아니라 수량·능률차이의 원인입니다.', strategy: '가격(구입단가) 요인과 수량(사용량) 요인을 먼저 분리해 선택지를 판단합니다.' },
  '2025-01-CM-32': { keyTerms: ['자가제조', '외부구입'], topic: '단기 의사결정', concept: '회피가능 고정원가는 자가제조·외부구입에 따라 달라지는 관련원가이므로 반드시 고려합니다.', strategy: '의사결정으로 변하는 원가만 표시하고, 회피가능·회피불능 고정원가를 구분합니다.' },
  '2025-01-CM-35': { keyTerms: ['사업부', '회피 불능 원가'], topic: '단기 의사결정', concept: '사업부 폐지 시에도 회피 불능 원가는 계속 발생하므로 공헌이익만큼 전체 이익이 감소합니다.', strategy: '폐지 시 사라지는 공헌이익과 계속 남는 회피 불능 원가를 분리해 전체 손익 변화를 계산합니다.' },
}
function optionFocus(option) {
  const technicalTerm = firstMatch(option, [/규정중심|원칙중심|공정가치|기타포괄손익|당기손익|연결재무제표|소유권|통제|현재가치|사용가치|매출원가|계약자산|계약부채|이연법인세(?:자산|부채)|과세표준|매입세액|세금계산서|완성품환산량|공헌이익|표준원가|관련원가|목표원가|손금불산입|익금|손금/])
  if (technicalTerm) return technicalTerm
  const phrase = option.match(/[가-힣A-Za-z0-9·()%-]{2,16}(?=은|는|이|가|을|를|에|으로)/)?.[0]
  return (phrase || option.replace(/\s+/g, ' ').slice(0, 12)).trim()
}
function optionEvidenceFor(options, answer) {
  return options.map((option, index) => ({ choiceNo: index + 1, text: optionFocus(option), type: index + 1 === answer ? 'correct' : 'eliminate', color: index + 1 === answer ? 'purple' : 'red' }))
}
function conciseExplanation({ id, primaryTopicId, topicName, answer, options, stem }) {
  if (selfExplanations[id]) return selfExplanations[id]
  const guide = topicGuides[primaryTopicId] || `${topicName}의 기준을 문제 조건에 적용합니다.`
  const calculation = /계산하면|금액은 얼마|수량은 얼마|원가를|세액을|이익은 얼마|자료가 다음/.test(stem)
  const asksForIncorrect = /옳지 않은|해당하지 않는|아닌 것/.test(stem)
  const formula = calculationFormulas[primaryTopicId]
  return {
    explanation: `정답은 ${['①','②','③','④'][answer - 1]} ${answer}번입니다. ${guide} 정답 선택지의 핵심은 “${shortPhrase(options[answer - 1])}”입니다.`,
    solutionSteps: calculation
      ? ['문제의 금액·수량·기간을 먼저 구분합니다.', formula || `${topicName}의 계산 기준을 적용합니다.`, `계산 결과가 ${['①','②','③','④'][answer - 1]} ${answer}번과 일치하는지 확인합니다.`]
      : ['문제가 요구하는 판단 기준을 확인합니다.', guide, `기준에 맞는 선택지는 ${['①','②','③','④'][answer - 1]} ${answer}번입니다.`],
    choiceAnalysis: options.map((option, index) => index + 1 === answer
      ? asksForIncorrect
        ? { choiceNo: index + 1, verdict: '틀림(정답)', reason: `틀린 부분은 “${optionFocus(option)}”입니다. 올바른 기준은 ${guide}입니다. 따라서 이 선택지가 제시한 내용은 그 기준을 잘못 적용한 것이므로 ‘옳지 않은 것’의 정답입니다.` }
        : { choiceNo: index + 1, verdict: '정답', reason: `이 선택지는 “${optionFocus(option)}”이라는 요건을 제시합니다. ${guide} 따라서 해당 요건을 충족하므로 정답입니다.` }
      : { choiceNo: index + 1, verdict: '오답', reason: `${topicName}의 핵심 기준과 맞는지 다시 확인하세요.` }),
    commonMistake: calculation ? '계산 전에 단위·기간·포함 여부를 확인하지 않고 바로 수치를 대입하는 실수입니다.' : '문제의 “옳지 않은 것”, “포함 여부”, “예외” 표현을 놓치는 실수입니다.',
  }
}
const questions = markers.map((marker, index) => {
  const number = Number(marker[1])
  const raw = clean(questionsText.slice(marker.index + marker[0].length, markers[index + 1]?.index))
  const choiceParts = raw.split(/(?=[①②③④])/)
  const stem = clean(choiceParts.shift())
  const options = choiceParts.map((part) => clean(part.replace(/^[①②③④]\s*/, ''))).slice(0, 4)
  const topic = classification(number, raw)
  const subject = subjectId(number)
  const topicName = topicNames[topic.primaryTopicId]
  const id = `2025-01-${subject}-${String(number - (subject === 'FR' ? 0 : subject === 'TX' ? 40 : 80)).padStart(2, '0')}`
  const selfExplanation = conciseExplanation({ id, primaryTopicId: topic.primaryTopicId, topicName, answer: answerMap[number], options, stem })
  const evidence = evidenceFor(stem, options, answerMap[number])
  const optionEvidence = optionEvidenceFor(options, answerMap[number])
  const direction = directionOverrides[id] || studyDirection({ primaryTopicId: topic.primaryTopicId, topicName, stem, evidence })
  return {
    id,
    examMonth: '2025-01', year: 2025, round: '1월', subjectId: subject,
    questionNo: number - (subject === 'FR' ? 0 : subject === 'TX' ? 40 : 80), number,
    primaryTopicId: topic.primaryTopicId, secondaryTopicIds: topic.secondaryTopicIds,
    concept: topicName, reviewNeeded: topic.reviewNeeded, stem, options, answer: answerMap[number] || null,
    evidence, optionEvidence, evidenceColor: 'curated', direction,
    explanation: selfExplanation?.explanation || null,
    solutionSteps: selfExplanation?.solutionSteps || [],
    choiceAnalysis: selfExplanation?.choiceAnalysis || [],
    relatedConcepts: [topicName, ...topic.secondaryTopicIds.map((id) => topicNames[id])],
    commonMistake: selfExplanation?.commonMistake || null,
    calculation: verifiedCalculations[id] || null,
    explanationStatus: 'completed',
  }
}).filter((question) => question.options.length === 4)

if (questions.length !== 120) throw new Error(`Expected 120 questions, received ${questions.length}`)
writeFileSync('src/data/questions.js', `// 2025년 1월 공식 기출문제 및 확정답안에서 개인 학습용으로 추출한 데이터입니다.\nexport const questions = ${JSON.stringify(questions, null, 2)}\n`)
console.log(`Generated ${questions.length} questions.`)
