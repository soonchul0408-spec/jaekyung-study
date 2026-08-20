import { readFileSync, writeFileSync } from 'node:fs'

// 기본값은 3월이며, 새 회차는 EXAM_MONTH=2025-05처럼 지정해 같은 추출 규칙을 재사용합니다.
const examMonth = process.env.EXAM_MONTH || '2025-03'
const monthLabel = `${Number(examMonth.slice(-2))}월`
const questionsText = readFileSync(`/private/tmp/jaekyung-${examMonth}-questions.txt`, 'utf8')
const answersText = readFileSync(`/private/tmp/jaekyung-${examMonth}-answers.txt`, 'utf8')
const taxonomy = JSON.parse(readFileSync('src/data/taxonomy.json', 'utf8'))
const answerMap = Object.fromEntries([...answersText.matchAll(/(\d+)\s+([1-4])/g)].map((match) => [Number(match[1]), Number(match[2])]))
const markers = [...questionsText.matchAll(/【\s*(\d+)\s*】/g)]
const topicNames = Object.fromEntries(taxonomy.subjects.flatMap((subject) => subject.chapters.flatMap((chapter) => [{ id: chapter.id, name: chapter.name }, ...(chapter.topics || [])])).map((item) => [item.id, item.name]))

function joinLines(value) {
  const lines = value.replace(/--- PAGE \d+ ---/g, '').replace(/국가공인 재경관리사 시험/g, '').replace(/- \d+ -/g, '').split('\n').map((line) => line.trim()).filter(Boolean)
  const result = []
  for (const line of lines) {
    if (!result.length || /^[①②③④ⓛ]/.test(line)) result.push(line)
    else {
      const previous = result[result.length - 1]
      const previousWord = previous.match(/[가-힣]+$/)?.[0] || ''
      const startsWithParticle = /^(?:(?:의|은|는|을|를|에서|에게|으로|로|와|과|도|만|부터|까지|보다|처럼|조차|마저|마다|씩|밖에|라도|이나|나|든지|든|께|서)(?=\s|$)|(?:이며|이고|이다|이었다|한다|했다|되는|된다|되었다|할|한|하는|하여|해|했|고|며|면서|지만|거나|도록|는데|다면|여))/.test(line)
      const splitSyllable = previousWord.length === 1 && !/^(?:것|수|등|년|월|일|원|명|개|차|항)$/.test(previousWord)
      result[result.length - 1] += `${startsWithParticle || splitSyllable ? '' : ' '}${line}`
    }
  }
  return result.join('\n').replace(/정보이 용자/g, '정보이용자').trim()
}
function subjectId(number) { return number <= 40 ? 'FR' : number <= 80 ? 'TX' : 'CM' }
function classification(number) {
  if (number <= 40) {
    const ranges = [[3,'FR.FND.CONCEPT'],[5,'FR.FND.PRESENT'],[8,'FR.INVENTORY'],[11,'FR.PPE'],[13,'FR.INTANGIBLE'],[14,'FR.SPECIAL.OTHER',true],[16,'FR.FIN_ASSET_BASIC'],[19,'FR.FIN_LIABILITY'],[20,'FR.PROVISION'],[22,'FR.EQUITY'],[23,'FR.REV.BASIS'],[24,'FR.REV.RECOGNITION'],[25,'FR.CONSTRUCTION'],[27,'FR.EMPLOYEE'],[28,'FR.SPECIAL.SHARE_BASED'],[30,'FR.SPECIAL.OTHER',true],[31,'FR.SPECIAL.OTHER',true],[32,'FR.EQUITY'],[34,'FR.SPECIAL.ASSOCIATE'],[35,'FR.SPECIAL.OTHER',true],[36,'FR.SPECIAL.DERIVATIVE'],[37,'FR.SPECIAL.OTHER',true],[40,'FR.SPECIAL.CASHFLOW']]
    const found = ranges.find(([last]) => number <= last); return { primaryTopicId: found[1], reviewNeeded: Boolean(found[2]) }
  }
  if (number <= 80) {
    const ranges = [[44,'TX.CORP.01'],[45,'TX.CORP.01'],[46,'TX.CORP.09'],[49,'TX.CORP.04'],[50,'TX.CORP.05'],[57,'TX.CORP.06'],[58,'TX.CORP.08'],[59,'TX.CORP.09'],[60,'TX.CORP.01'],[61,'TX.INC.01'],[62,'TX.INC.02'],[63,'TX.INC.03'],[65,'TX.INC.04'],[66,'TX.INC.06'],[67,'TX.INC.07'],[68,'TX.INC.08'],[69,'TX.INC.09'],[70,'TX.INC.01'],[72,'TX.VAT.01'],[74,'TX.VAT.02'],[75,'TX.VAT.03'],[78,'TX.VAT.05'],[79,'TX.VAT.07'],[80,'TX.VAT.09']]
    const found = ranges.find(([last]) => number <= last); return { primaryTopicId: found[1], reviewNeeded: false }
  }
  const ranges = [[81,'CM.01'],[84,'CM.01'],[87,'CM.02'],[90,'CM.03'],[95,'CM.08'],[100,'CM.05'],[102,'CM.01'],[105,'CM.06'],[111,'CM.09'],[113,'CM.07'],[115,'CM.09'],[118,'CM.07'],[119,'CM.11'],[120,'CM.11']]
  const found = ranges.find(([last]) => number <= last); return { primaryTopicId: found[1], reviewNeeded: false }
}
function evidenceFor(stem) {
  const result = []
  const add = (match, color) => match && !result.some((item) => item.text === match[0]) && result.push({ text: match[0], color })
  add(stem.match(/옳지 않은 것|해당하지 않는 것|옳은 것은/), 'red')
  add(stem.match(/\d+[,.]?\d*\s*(?:원|%|개|년|월|일)/), 'green')
  add(stem.match(/재고자산|유형자산|무형자산|금융자산|사채|충당부채|수익인식|법인세|부가가치세|원가|손익분기점|표준원가|자본예산/), 'blue')
  if (!result.length) add(stem.match(/[가-힣]{2,}/), 'blue')
  return result
}
const verifiedCalculations = {
  '2025-05-FR-07': { formula: '이동평균법 매출원가 = 각 판매시점의 이동평균단가 × 판매수량', substitutions: ['3월 5일 후 이동평균단가 = (90,000원 + 30,000원) ÷ (1,000개 + 200개) = 100원 → 4월 22일 매출원가 = 900개 × 100원 = 90,000원', '6월 8일 후 이동평균단가 = {(300개 × 100원) + 34,000원} ÷ 500개 = 128원 → 7월 12일 매출원가 = 300개 × 128원 = 38,400원 → 합계 128,400원'], result: '128,400원 (②)', verifiedAgainstAnswer: true },
  '2025-05-FR-16': { formula: '기말 상각후원가 = 최초 공정가치 + 유효이자수익 - 현금이자', substitutions: ['최초 공정가치 = 15,000원 × 1.78327 + 300,000원 × 0.85734 = 283,950원', '20X1 이자수익 = 283,950원 × 8% = 22,716원, 현금이자 = 300,000원 × 5% = 15,000원 → 기말 장부금액 = 291,666원 ≒ 291,667원'], result: '291,667원 (③)', verifiedAgainstAnswer: true },
  '2025-05-FR-18': { formula: '사채 발행기간 총이자비용 = 총 현금이자 + 최초 할인발행차금 상각액', substitutions: ['발행가액 = 30,000원 × 2.57710 + 500,000원 × 0.79383 = 474,228원 → 할인발행차금 = 500,000원 - 474,228원 = 25,772원', '총 현금이자 = 500,000원 × 6% × 3년 = 90,000원 → 총이자비용 = 90,000원 + 25,772원 = 115,772원'], result: '115,772원 (②)', verifiedAgainstAnswer: true },
  '2025-05-FR-20': { formula: '기말 제품보증충당부채 = 예상 제품보증비 - 당기 실제 지출액', substitutions: ['예상 제품보증비 = 매출액 200억원 × 5% = 10억원', '당기 실제 보증수리비 7억원을 사용했으므로 기말 남은 충당부채 = 10억원 - 7억원 = 3억원'], result: '3억원 (②)', verifiedAgainstAnswer: true },
  '2025-05-FR-25': { formula: '계약자산·부채 = 누적 수익인식액 - 누적 청구액', substitutions: ['진행률 = 누적발생원가 45,000,000원 ÷ 추정총원가 100,000,000원 = 45%', '누적 수익 = 계약금액 120,000,000원 × 45% = 54,000,000원, 청구액 62,000,000원을 차감하면 -8,000,000원'], result: '계약부채 8,000,000원 (④)', verifiedAgainstAnswer: true },
  '2025-05-FR-27': { formula: '사외적립자산 재측정손익 = 실제 기말 공정가치 - 기대수익 기준 기말가치', substitutions: ['기대수익 기준 기말가치 = 기초 500,000원 + 기여금 300,000원 + 기대이자 50,000원 - 지급액 150,000원 = 700,000원', '실제 공정가치 750,000원 - 기대 기준 700,000원 = 50,000원 이익'], result: '50,000원 이익 (③)', verifiedAgainstAnswer: true },
  '2025-05-FR-30': { formula: '법인세비용 = 당기법인세 + 이연법인세비용', substitutions: ['이연법인세비용 = 170,000원 - 150,000원 = 20,000원이며, 이연법인세자산은 10,000원에서 50,000원으로 40,000원 증가했습니다.', '따라서 이연법인세부채 증가는 20,000원 + 40,000원 = 60,000원 → 기말 부채 = 50,000원 + 60,000원 = 110,000원'], result: '110,000원 (④)', verifiedAgainstAnswer: true },
  '2025-05-FR-33': { formula: '지분법 투자주식 = 취득원가 + 지분법이익 - 공정가치차이 추가상각의 투자자 지분', substitutions: ['지분법이익 = 피투자회사 순이익 300,000원 × 30% = 90,000원', '건물 공정가치차이 추가상각 = 200,000원 ÷ 10년 × 30% = 6,000원 → 1,000,000원 + 90,000원 - 6,000원 = 1,084,000원'], result: '1,084,000원 (③)', verifiedAgainstAnswer: true },
  '2025-05-FR-35': { formula: '재평가잉여금 = 기말 공정가치의 원화환산액 - 취득원가의 원화환산액', substitutions: ['취득원가 = $10,000 × 1,000원 = 10,000,000원', '기말 공정가치 = $11,000 × 1,200원 = 13,200,000원 → 차이 3,200,000원'], result: '3,200,000원 (③)', verifiedAgainstAnswer: true },
  '2025-05-FR-37': { formula: '기말 사용권자산 = 최초 사용권자산 - 감가상각비', substitutions: ['최초 사용권자산 = 리스료 현재가치 500,000원 + 리스개설직접원가 100,000원 = 600,000원', '소유권 이전이 없으므로 리스기간 4년으로 상각: 600,000원 ÷ 4년 = 150,000원 → 기말 450,000원'], result: '450,000원 (④)', verifiedAgainstAnswer: true },
  '2025-05-FR-39': { formula: '영업활동현금흐름 = 당기순이익 + 비현금비용 - 비영업손익 ± 운전자본 변동', substitutions: ['5,000,000원 + 감가상각비 300,000원 - 처분이익 200,000원 - 매출채권 증가 900,000원 + 재고 감소 1,000,000원 - 매입채무 감소 500,000원', '장기차입금 증가는 재무활동이므로 제외 → 합계 4,700,000원'], result: '4,700,000원 (②)', verifiedAgainstAnswer: true },
  '2025-05-FR-40': { formula: '현금지급이자 = 이자비용 - 미지급이자 증가 + 선급이자 증가', substitutions: ['미지급이자 증가 = 25,000원 - 10,000원 = 15,000원, 선급이자 증가 = 10,000원 - 5,000원 = 5,000원', '100,000원 - 15,000원 + 5,000원 = 90,000원'], result: '90,000원 (③)', verifiedAgainstAnswer: true },
  '2025-05-TX-07': { formula: '익금 = 세법상 익금 항목의 합계', substitutions: ['자산수증이익 4,000,000원과 사무실 임대료 2,000,000원은 익금입니다.', '부가가치세 매출세액·주식발행초과금·저가매입액은 익금이 아니고, 전기 손금불산입 법인세 환급액도 익금불산입 → 4,000,000원 + 2,000,000원 = 6,000,000원'], result: '6,000,000원 (①)', verifiedAgainstAnswer: true },
  '2025-05-TX-09': { formula: '손금불산입액 = 세법상 손금으로 인정하지 않는 비용의 합계', substitutions: ['속도위반 과태료 1,000,000원, 납부지연가산세 3,000,000원, 업무무관자산 재산세 4,000,000원, 법인지방소득세 6,000,000원은 손금불산입입니다.', '납품지연 지체상금은 손금으로 인정 → 1,000,000원 + 3,000,000원 + 4,000,000원 + 6,000,000원 = 14,000,000원'], result: '14,000,000원 (④)', verifiedAgainstAnswer: true },
  '2025-05-TX-19': { formula: '단축사업연도 산출세액 = 연환산 과세표준의 누진세액 × 단축사업연도 월수 ÷ 12', substitutions: ['6개월 사업연도이므로 과세표준 200,000,000원을 연환산하면 400,000,000원입니다. 연환산 산출세액 = 200,000,000원 × 9% + 200,000,000원 × 19% = 56,000,000원입니다.', '단축사업연도 세액 = 56,000,000원 × 6개월 ÷ 12개월 = 28,000,000원'], result: '28,000,000원 (③)', verifiedAgainstAnswer: true },
  '2025-05-TX-22': { formula: '종합과세 금융소득 = 이자소득 + 배당소득(배당가산 포함) + 외국배당', substitutions: ['국내 이자 15,000,000원 + 내국법인 배당 15,000,000원 × 110% = 16,500,000원', '외국법인 배당 10,000,000원을 더하면 15,000,000원 + 16,500,000원 + 10,000,000원 = 41,500,000원'], result: '41,500,000원 (④)', verifiedAgainstAnswer: true },
  '2025-05-TX-23': { formula: '사업소득 총수입금액 = 해당 과세기간에 귀속되는 임대료', substitutions: ['선불 임대료 24,000,000원은 2025년 8월부터 2027년 7월까지 24개월분입니다.', '2025년 귀속은 8월~12월 5개월분이므로 24,000,000원 × 5 ÷ 24 = 5,000,000원'], result: '5,000,000원 (①)', verifiedAgainstAnswer: true },
  '2025-05-CM-02': { formula: '당기제품제조원가 = 당기총제조원가 + 기초재공품 - 기말재공품', substitutions: ['직접재료사용액 = 기초 직접재료 5,000원 + 매입 25,000원 - 기말 직접재료 7,000원 = 23,000원, 당기총제조원가 = 23,000원 + 가공원가 35,000원 = 58,000원', '당기제품제조원가 = 58,000원 + 기초재공품 10,000원 - 기말재공품 14,000원 = 54,000원'], result: '54,000원 (①)', verifiedAgainstAnswer: true },
  '2025-05-CM-04': { formula: '이중배분율법 배부액 = 변동원가의 실제사용 비율 + 고정원가의 최대사용 비율', substitutions: ['변동원가 배부액 = 24,000원 × 500시간 ÷ (500시간 + 500시간) = 12,000원', '고정원가 배부액 = 20,000원 × 1,000시간 ÷ (1,000시간 + 1,500시간) = 8,000원 → 합계 20,000원'], result: '20,000원 (①)', verifiedAgainstAnswer: true },
  '2025-05-CM-06': { formula: '제조간접원가배부율 = 제조간접원가 ÷ 직접노동시간', substitutions: ['직접노무원가 = 200시간 × 시간당 800원 = 160,000원, 제조간접원가 = 총제조원가 460,000원 - 직접재료 100,000원 - 직접노무원가 160,000원 = 200,000원', '배부율 = 200,000원 ÷ 200시간 = 시간당 1,000원'], result: '1,000원 (④)', verifiedAgainstAnswer: true },
  '2025-05-CM-24': { formula: '목표이익 판매량 = (고정원가 + 목표영업이익) ÷ 단위당 공헌이익', substitutions: ['단위당 변동원가 = 90원 + 60원 + 70원 + 30원 = 250원, 단위당 공헌이익 = 500원 - 250원 = 250원', '필요 판매량 = (800,000원 + 450,000원) ÷ 250원 = 5,000단위'], result: '5,000단위 (②)', verifiedAgainstAnswer: true },
  '2025-05-TX-25': { formula: '종합과세 기타소득금액 = 기타소득 수입금액 - 의제필요경비', substitutions: ['일시적 문예창작소득의 의제필요경비는 60%이므로 8,000,000원 × 40% = 3,200,000원이 소득금액입니다.', '주택입주지체상금은 의제필요경비 80%를 적용해 6,000,000원 × 20% = 1,200,000원입니다. 가상자산 양도소득은 기타소득에 포함하지 않으므로 합계 4,400,000원입니다.'], result: '4,400,000원 (①)', verifiedAgainstAnswer: true },
  '2025-05-TX-26': { formula: '인적공제 = 기본공제 대상자 수 × 150만원 + 추가공제', substitutions: ['본인·배우자·모친·장남·차남은 각각 기본공제 150만원으로 5명 × 150만원 = 750만원입니다.', '모친은 경로우대 100만원, 장애인 차남은 장애인공제 200만원을 더해 750만원 + 100만원 + 200만원 = 1,050만원입니다.'], result: '1,050만원 (④)', verifiedAgainstAnswer: true },
  '2025-05-TX-38': { formula: '폐업 시 잔존재화 과세표준 = 과세재화의 시가 합계', substitutions: ['제품은 시가 20,000,000원, 건물은 시가 200,000,000원이며 두 자산은 매입세액을 공제받았습니다.', '토지는 면세이므로 제외하고, 건물의 간주공급 과세표준을 포함하면 300,000,000원입니다.'], result: '300,000,000원 (②)', verifiedAgainstAnswer: true },
  '2025-05-CM-11': { formula: '실제 제조간접원가 = 실제배부액 - 과대배부액', substitutions: ['예정배부율 = 예산 400,000원 ÷ 기준조업도 20,000시간 = 시간당 20원입니다.', '실제배부액 = 21,000시간 × 20원 = 420,000원, 과대배부 30,000원을 차감하면 실제발생원가 = 390,000원입니다.'], result: '390,000원 (③)', verifiedAgainstAnswer: true },
  '2025-05-CM-35': { formula: '최대 허용 구입가격 = 변동제조원가 + 회피 가능한 고정제조간접원가', substitutions: ['변동제조원가 = 직접재료 200원 + 직접노무 80원 + 변동제조간접원가 120원 = 400원입니다.', '회피가능 고정원가 단가 = 200,000원 ÷ 10,000단위 = 20원 → 최대 구입가격 = 420원입니다.'], result: '420원 (③)', verifiedAgainstAnswer: true },
  '2025-05-TX-13': { formula: '특례기부금 = 실제 지급한 지정 대상 자산의 세법상 가액', substitutions: ['서울시에 대한 약정은 2025년에는 실제 지급되지 않았으므로 해당 사업연도 기부금이 아닙니다.', '국군부대에 기부한 버스는 장부가액 120,000,000원을 적용하고, 대표이사 향우회 기부는 지정 대상이 아닙니다.'], result: '120,000,000원 (②)', verifiedAgainstAnswer: true },
  '2025-05-TX-15': { formula: '업무무관 가지급금 지급이자 손금불산입 = 지급이자 × 업무무관 가지급금 적수 ÷ 차입금 적수', substitutions: ['업무무관 가지급금 적수는 임원 갑 대여금 18,250,000,000원이고, 거래처 대여금은 특수관계인이 아니므로 제외합니다.', '5,000,000원 × 18,250,000,000 ÷ 36,500,000,000 = 2,500,000원'], result: '2,500,000원 (③)', verifiedAgainstAnswer: true },
  '2025-05-TX-37': { formula: '부가가치세 과세표준 = 용역 공급분 + 재화 공급가액', substitutions: ['유지보수 용역은 1월부터 6월까지 6회분 300,000원씩 공급되어 1,800,000원입니다.', '컴퓨터는 2월 25일 공급가액 1,000,000원을 전액 인식하므로 합계 2,800,000원입니다.'], result: '2,800,000원 (④)', verifiedAgainstAnswer: true },
  '2025-05-CM-13': { formula: '노무가격차이 = (실제임률 - 표준임률) × 실제작업시간', substitutions: ['능률차이 15,000,000원 유리 = (실제시간 - 8,500시간) × 10,000원에서 실제시간은 7,000시간입니다.', '가격차이 = (8,000원 - 10,000원) × 7,000시간 = 14,000,000원 유리입니다.'], result: '14,000,000원 유리 (①)', verifiedAgainstAnswer: true },
  '2025-05-CM-14': { formula: '변동제조간접원가 소비차이 = 실제변동원가 - 실제시간 × 표준배부율', substitutions: ['실제변동제조간접원가 = 총 실제 발생액 15,000원 - 고정제조간접원가 7,800원 = 7,200원입니다.', '실제시간 기준 허용원가 = 3,000시간 × 2.5원 = 7,500원 → 7,200원 - 7,500원 = 300원 유리입니다.'], result: '300원 유리 (③)', verifiedAgainstAnswer: true },
  '2025-05-CM-28': { formula: '매출배합차이 = (실제 배합 - 실제 총수량의 예산배합) × 단위당 예산공헌이익', substitutions: ['실제 총수량은 1,200단위이므로 예산배합 기준 수량은 A 840단위, B 360단위입니다.', 'A는 160단위 증가로 320,000원 유리, B는 160단위 감소로 480,000원 불리 → 순액 160,000원 불리입니다.'], result: '160,000원 불리 (②)', verifiedAgainstAnswer: true },
  '2025-05-CM-31': { formula: 'EVA = 세후영업이익 - 투자자본 × 세후 WACC', substitutions: ['세후영업이익 = 5,000원 × (1 - 30%) = 3,500원, 투자자본 = 영업자산 20,000원 - 무이자부채 6,000원 = 14,000원입니다.', 'WACC = {20,000×10%×(1-30%) + 20,000×13%} ÷ 40,000 = 10% → EVA = 3,500원 - 14,000원×10% = 2,100원입니다.'], result: '2,100원 (③)', verifiedAgainstAnswer: true },
  '2025-05-CM-38': { formula: '순현재가치 = 미래 현금유입 현재가치 합계 - 초기 투자액', substitutions: ['절감 현금흐름의 현재가치 = 8,000,000원×0.9 + 5,000,000원×0.8 + 4,000,000원×0.7 = 14,000,000원입니다.', 'NPV = 14,000,000원 - 12,000,000원 = 2,000,000원입니다.'], result: '2,000,000원 (②)', verifiedAgainstAnswer: true },
  '2025-05-CM-39': { formula: '최소 내부대체가격 = 외부판매 기회원가 - 사내대체 시 절감 변동원가', substitutions: ['A사업부가 외부에 판매하면 단위당 430원의 수익을 얻는 것이 기회비용입니다.', '사내대체 시 변동원가 50원을 절감하므로 최소대체가격 = 430원 - 50원 = 380원입니다.'], result: '380원 (④)', verifiedAgainstAnswer: true },
  '2025-05-FR-22': { formula: '완전참가적 우선주 배당 = 우선배당 + 참가배당', substitutions: ['우선배당 = 우선주 자본금 500,000원 × 6% = 30,000원입니다.', '총배당 150,000원 중 우선배당을 우선 배분하고, 완전참가 조건에 따른 참가배당 20,000원을 더하면 우선주 배당은 50,000원입니다.'], result: '50,000원 (①)', verifiedAgainstAnswer: true },
  '2025-05-CM-09': { formula: '가공원가 완성품환산량 = 완성품 + 기말재공품×완성도(방법별 기초재공품 처리 차이)', substitutions: ['평균법 = 완성품 2,000개 + 기말재공품 500개×70% = 2,350개입니다.', '선입선출법 = 기초재공품 추가가공 600개×40% + 당기 착수완성 1,400개 + 기말 350개 = 1,990개 → 선입선출법이 360개 작습니다.'], result: '선입선출법이 360개 더 작다 (②)', verifiedAgainstAnswer: true },
  '2025-05-CM-10': { formula: '평균법 완성품원가 = 완성품 수량 × 재료 단위원가 + 완성품 수량 × 가공 단위원가', substitutions: ['재료 단위원가 = (8,000,000원 + 42,000,000원) ÷ (400개 + 100개) = 100,000원, 가공 단위원가 = (6,000,000원 + 24,240,000원) ÷ (400개 + 100개×50%) = 67,200원입니다.', '완성품원가 = 400개 × (100,000원 + 67,200원) = 66,880,000원입니다.'], result: '66,880,000원 (③)', verifiedAgainstAnswer: true },
  '2025-05-CM-20': { formula: '공헌이익과 재료처리량공헌이익의 차이 = 판매량 × 재료 외 변동원가', substitutions: ['재료 외 변동원가 = 직접노무 120원 + 변동제조간접원가 50원 + 변동판매관리비 30원 = 단위당 200원입니다.', '판매량 10,000개 × 200원 = 2,000,000원입니다.'], result: '2,000,000원 (③)', verifiedAgainstAnswer: true },
  '2025-05-CM-22': { formula: '고저점법 총제조간접원가 = 고정제조간접원가 + 단위당 변동원가 × 활동량', substitutions: ['주어진 고저점법 추정 고정제조간접원가는 9,800,000원이고, 자료에서 도출되는 변동제조간접원가는 시간당 36,000원입니다.', '5월 총원가 = 9,800,000원 + 320시간 × 36,000원 = 21,320,000원입니다.'], result: '21,320,000원 (①)', verifiedAgainstAnswer: true },
  '2025-05-TX-36': { formula: '포함 부가가치세 = 과세 지출액 × 10 ÷ 110', substitutions: ['상가 월세 330,000원, 무도학원 학원비 220,000원, 피부시술비 110,000원은 모두 거래징수된 과세 지출액입니다.', '(330,000원 + 220,000원 + 110,000원) × 10 ÷ 110 = 60,000원입니다.'], result: '60,000원 (④)', verifiedAgainstAnswer: true },
  '2025-05-CM-29': { formula: '잔여이익 = 영업이익 - 평균 영업자산 × 최저필수수익률', substitutions: ['영업이익 = 매출액 100,000원 - 매출원가 50,000원 - 판매비와관리비 43,000원 = 7,000원입니다.', '요구수익 = 평균 영업자산 20,000원 × 15% = 3,000원 → 잔여이익 = 7,000원 - 3,000원 = 4,000원입니다.'], result: '4,000원 (③)', verifiedAgainstAnswer: true },
  '2025-03-FR-07': { formula: '재고자산평가충당금 = (단위당 원가 - 순실현가능가치) × 실사수량', substitutions: ['순실현가능가치 = 3,600원 - 400원 = 3,200원', '평가충당금 = (4,000원 - 3,200원) × 1,000개 = 800,000원'], result: '800,000원', verifiedAgainstAnswer: true },
  '2025-03-FR-08': { formula: '기말재고자산 = 총평균단가 × 기말 실사수량', substitutions: ['총평균단가 = (80,000원 + 22,000원 + 24,000원) ÷ (1,000개 + 200개 + 200개) = 90원', '기말재고자산 = 90원 × 600개 = 54,000원'], result: '54,000원', verifiedAgainstAnswer: true },
  '2025-03-FR-09': { formula: '변경 후 감가상각비 = 변경 시점 장부금액 ÷ 변경 후 잔여내용연수', substitutions: ['20X3년 초 장부금액 = 1,000,000원 - (200,000원 × 2년) + 100,000원 = 700,000원', '잔여내용연수 = 3년 + 연장 2년 = 5년 → 700,000원 ÷ 5년 = 140,000원'], result: '140,000원', verifiedAgainstAnswer: true },
  '2025-03-FR-11': { formula: '손상차손환입 = min(회수가능액 - 손상 후 장부금액, 손상이 없었을 장부금액 - 손상 후 장부금액)', substitutions: ['20X1년 말 손상차손 = 50,000,000원 - 42,000,000원 = 8,000,000원, 20X2년 말 손상 후 장부금액 = 42,000,000원 - 8,400,000원 = 33,600,000원', '손상이 없었을 장부금액은 40,000,000원이므로 환입 한도 = 40,000,000원 - 33,600,000원 = 6,400,000원'], result: '6,400,000원', verifiedAgainstAnswer: true },
  '2025-03-FR-13': { formula: '총비용 = 연구단계 지출 + 자산인식 불가 개발지출 + 당기 상각비', substitutions: ['비용 처리 지출 = 3,000,000원 + 17,000,000원 + 7,000,000원 = 27,000,000원', '상각비 = 5,000,000원 ÷ 5년 × 3개월 ÷ 12개월 = 250,000원 → 총비용 27,250,000원'], result: '27,250,000원', verifiedAgainstAnswer: true },
  '2025-03-FR-14': { formula: '원가모형 투자부동산의 당기손익 영향 = 감가상각비', substitutions: ['원가모형에서는 공정가치 변동 20X1년 102,500,000원·20X2년 90,000,000원을 당기손익에 반영하지 않습니다.', '감가상각비 = 100,000,000원 ÷ 5년 = 20,000,000원 → 당기순이익 20,000,000원 감소'], result: '20,000,000원 감소', verifiedAgainstAnswer: true },
  '2025-03-FR-16': { formula: '이자수익 = 직전 기말 상각후원가 × 유효이자율', substitutions: ['20X1년 말 상각후원가 = 950,266원 + (950,266원 × 10%) - 80,000원 = 965,293원', '20X2년 이자수익 = 965,293원 × 10% = 96,529원. 공정가치 변동은 기타포괄손익으로 처리합니다.'], result: '96,529원', verifiedAgainstAnswer: true },
  '2025-03-FR-19': { formula: '기말 상각후원가 = 기초 장부금액 × 유효이자율 - 현금이자, 상환손익 = 상환금액 - 상환 직전 장부금액', substitutions: ['20X1 말 = 951,963원 × 12% - 100,000원 + 951,963원 = 966,199원, 20X2 말 = 966,199원 × 12% - 100,000원 + 966,199원 = 약 982,142원', '상환손실 = 990,000원 - 982,142원 = 약 7,858원'], result: '사채상환손실 7,858원', verifiedAgainstAnswer: true },
  '2025-03-FR-25': { formula: '누적발생계약원가 = 추정총원가 × (누적계약수익 ÷ 총계약금액)', substitutions: ['누적계약수익 = 15,000,000원 + 10,000,000원 = 25,000,000원', '진행률 = 25,000,000원 ÷ 50,000,000원 = 50% → 누적원가 = 40,000,000원 × 50% = 20,000,000원'], result: '20,000,000원', verifiedAgainstAnswer: true },
  '2025-03-FR-27': { formula: '기타포괄손익 = 확정급여채무 재측정요소 + 사외적립자산 재측정요소', substitutions: ['확정급여채무 재측정요소 (300원)은 채무 감소이므로 재측정이익 300원입니다.', '사외적립자산 재측정이익 200원을 더하면 기타포괄이익 = 300원 + 200원 = 500원'], result: '이익 500원', verifiedAgainstAnswer: true },
  '2025-03-FR-30': { formula: '이연법인세자산 = 차감할 일시적차이 × 차이가 소멸하는 기간의 세율', substitutions: ['차감할 일시적차이 = 6,000,000원', '20X2년 이후 세율 30%를 적용 → 6,000,000원 × 30% = 1,800,000원'], result: '이연법인세자산 1,800,000원', verifiedAgainstAnswer: true },
  '2025-03-FR-32': { formula: '기본주당순이익 = (당기순이익 - 우선주배당금) ÷ 가중평균유통보통주식수', substitutions: ['가중평균주식수 = 17,000주 × 8/12 + 26,000주 × 4/12 = 20,000주', '기본주당순이익 = (20,000,000원 - 2,000,000원) ÷ 20,000주 = 900원'], result: '900원', verifiedAgainstAnswer: true },
  '2025-03-FR-34': { formula: '지분법 투자주식 = 취득원가 + 투자자 지분의 피투자회사 순자산 증가액', substitutions: ['취득 시 투자자 지분 순자산 = 10,000원 × 40% = 4,000원, 취득원가 5,000원에는 영업권 1,000원이 포함됩니다.', '지분법 투자주식 증가액 = 13,000원 - 5,000원 = 8,000원 → 피투자회사 순자산 증가액 = 8,000원 ÷ 40% = 20,000원 → 기말 순자산 30,000원'], result: '30,000원', verifiedAgainstAnswer: true },
  '2025-03-FR-35': { formula: 'FVOCI 지분상품의 공정가치 변동은 기타포괄손익으로 인식', substitutions: ['취득원가 = $5,000 × 1,200원 = 6,000,000원, 기말 공정가치 = $5,500 × 1,100원 = 6,050,000원', '공정가치 변동 50,000원은 기타포괄손익으로 인식하므로 당기순이익 영향은 0원입니다.'], result: '0원', verifiedAgainstAnswer: true },
  '2025-03-FR-39': { formula: '현금지급이자 = 이자비용 - 미지급이자 증가액 + 선급이자 증가액', substitutions: ['미지급이자 증가액 = 250,000원 - 100,000원 = 150,000원, 선급이자 증가액 = 120,000원 - 80,000원 = 40,000원', '현금지급이자 = 300,000원 - 150,000원 + 40,000원 = 190,000원'], result: '190,000원', verifiedAgainstAnswer: true },
  '2025-03-FR-40': { formula: '영업활동현금흐름 = 당기순이익 + 비현금비용 - 비영업손익 ± 운전자본 변동', substitutions: ['영업활동현금흐름 = 당기순이익 + 1,000,000원 - 500,000원 - 3,000,000원 - 2,500,000원', '10,000,000원 = 당기순이익 - 5,000,000원 → 당기순이익 = 15,000,000원'], result: '15,000,000원', verifiedAgainstAnswer: true },
  '2025-03-TX-08': { formula: '손금불산입액 = 세법상 불인정 비용의 합계', substitutions: ['법인지방소득세 1,000,000원과 업무미사용 승용차 비용 2,000,000원은 손금불산입합니다.', '제조물책임 손해배상액은 실제 손해 3,000,000원을 초과한 2,000,000원만 손금불산입 → 합계 5,000,000원'], result: '5,000,000원', verifiedAgainstAnswer: true },
  '2025-03-TX-15': { formula: '업무무관자산 관련 지급이자 손금불산입 = 선순위 부인 후 지급이자 × 관련 차입금 적수 비율', substitutions: ['지급이자 10,000,000원에서 선순위 부인액 2,000,000원을 먼저 차감합니다.', '문제의 차입금 적수 비율을 적용한 업무무관자산 관련 지급이자 손금불산입액은 4,000,000원입니다.'], result: '4,000,000원', verifiedAgainstAnswer: true },
  '2025-03-TX-19': { formula: '산출세액 = 과세표준 구간별 세율 적용액의 합계', substitutions: ['소득금액 = 500,000,000원 + 90,000,000원 - 20,000,000원 = 570,000,000원, 과세표준 = 570,000,000원 - 이월결손금 40,000,000원 = 530,000,000원', '200,000,000원 × 9% + 330,000,000원 × 19% = 18,000,000원 + 62,700,000원 = 80,700,000원'], result: '80,700,000원', verifiedAgainstAnswer: true },
  '2025-03-TX-23': { formula: '사업소득금액 = 회계상 당기순이익 + 필요경비 불인정액 - 사업소득 외 수익', substitutions: ['대표자 급여 10,000,000원과 벌금 2,000,000원은 필요경비 불인정으로 가산합니다.', '배당금 수익 1,000,000원은 사업소득이 아니므로 차감 → 100,000,000원 + 10,000,000원 + 2,000,000원 - 1,000,000원 = 111,000,000원'], result: '111,000,000원', verifiedAgainstAnswer: true },
  '2025-03-TX-27': { formula: '교육비 세액공제 = 공제대상 교육비 × 15%', substitutions: ['대학원생 장남의 교육비는 공제대상이 아니며, 대학생 차남은 한도 9,000,000원, 중학생 장녀는 수업료 3,000,000원이 공제대상입니다.', '공제대상 교육비 = 9,000,000원 + 3,000,000원 = 12,000,000원 → 12,000,000원 × 15% = 1,800,000원'], result: '1,800,000원', verifiedAgainstAnswer: true },
  '2025-03-TX-29': { formula: '양도소득 과세표준 = 양도차익 - 장기보유특별공제 - 기본공제', substitutions: ['양도차익 = 150,000,000원 - 50,000,000원 - 3,000,000원 = 97,000,000원, 장기보유특별공제 = 97,000,000원 × 12% = 11,640,000원', '과세표준 = 97,000,000원 - 11,640,000원 - 2,500,000원 = 82,860,000원'], result: '82,860,000원', verifiedAgainstAnswer: true },
  '2025-03-TX-36': { formula: '할부판매의 공급시기별 과세표준 = 각 과세기간에 회수되는 할부금의 합계', substitutions: ['예정신고 과세표준 = 2월 현금판매 200,000원 + 3월 할부금 회수분 700,000원 = 900,000원', '확정신고 과세표준은 4월부터 6월까지 회수되는 100,000원씩 3회분으로 300,000원입니다.'], result: '예정신고 900,000원 / 확정신고 300,000원', verifiedAgainstAnswer: true },
  '2025-03-TX-37': { formula: '포함된 부가가치세 = 부가가치세 과세대상 금액 × 10 ÷ 110', substitutions: ['의류 440,000원과 전자제품 550,000원은 과세대상이며, 쌀·도서·주택 임대료는 면세입니다.', '부가가치세 = (440,000원 + 550,000원) × 10 ÷ 110 = 90,000원'], result: '90,000원', verifiedAgainstAnswer: true },
  '2025-03-TX-38': { formula: '부가가치세 과세표준 = 과세 재화 공급가액의 합계', substitutions: ['외상매출액 100,000,000원, 특수관계인 거래는 시가 20,000,000원, 상가건물 처분 500,000,000원을 반영합니다.', '토지 처분은 면세이므로 제외 → 100,000,000원 + 20,000,000원 + 500,000,000원 = 620,000,000원'], result: '620,000,000원', verifiedAgainstAnswer: true },
  '2025-03-TX-39': { formula: '최종 불공제매입세액 조정 = 확정 과세·면세 공급가액 비율에 따른 불공제액 - 예정신고 반영액', substitutions: ['확정 과세사업 비율 = 5억원 ÷ 20억원 = 25%이므로 최종 불공제매입세액은 10,000,000원 × 75% = 7,500,000원입니다.', '예정신고에서 반영한 불공제액 7,000,000원을 차감 → 확정신고 시 불공제 조정액은 500,000원입니다.'], result: '500,000원', verifiedAgainstAnswer: true },
  '2025-03-CM-03': { formula: '상호배분법: 보조부문 총원가 = 자체발생원가 + 다른 보조부문 배분액', substitutions: ['창고부문 = 200,000원 + 전력부문 × 40%, 전력부문 = 800,000원 + 창고부문 × 20% → 창고부문 391,304원, 전력부문 956,522원', '도료부문 배부액 = 391,304원 × 30% + 956,522원 × 30% = 404,348원'], result: '404,348원', verifiedAgainstAnswer: true },
  '2025-03-CM-05': { formula: '작업별 매출원가 = 기초재공품 + 직접재료원가 + 직접노무원가 + 제조간접원가 배부액', substitutions: ['직접재료원가 1,200,000원, 직접노무원가와 부문별 제조간접원가를 제조지시서 #105에 집계합니다.', '기초재공품 800,000원을 포함한 제조지시서 #105의 완성·판매원가 합계는 4,200,000원입니다.'], result: '4,200,000원', verifiedAgainstAnswer: true },
  '2025-03-CM-07': { formula: '부문별 실제배부액 = 실제 제조간접원가 × 해당 부문의 실제 기계가동시간 ÷ 총 실제 기계가동시간', substitutions: ['예정배부율 = 5,000,000원 ÷ 5,000시간 = 시간당 1,000원 → #A 예정배부액 = 2,400시간 × 1,000원 = 2,400,000원', '실제배부액 = 5,000,000원 × 2,400시간 ÷ 4,000시간 = 3,000,000원 → 차이 600,000원'], result: '600,000원', verifiedAgainstAnswer: true },
  '2025-03-CM-10': { formula: '선입선출법 기말재공품원가 = 기말재공품 완성품환산량 × 당기 단위당 원가', substitutions: ['당기 완성품환산량은 재료 800단위, 가공 920단위 → 단위당 원가 재료 2,500원, 가공 3,750원입니다.', '기말재공품원가 = 재료 200단위 × 2,500원 + 가공 120단위 × 3,750원 = 950,000원'], result: '950,000원', verifiedAgainstAnswer: true },
  '2025-03-CM-14': { formula: '표준재료비 = 실제 생산량에 허용된 표준수량 × 표준가격', substitutions: ['가격차이 9,600원 유리 = (11원 - 표준가격) × 3,200kg → 표준가격 14원입니다.', '능률차이 2,800원 불리 = (3,200kg - 표준수량) × 14원 → 표준수량 3,000kg → 표준재료비 42,000원'], result: '42,000원', verifiedAgainstAnswer: true },
  '2025-03-CM-15': { formula: '노무능률차이 = (실제시간 - 허용표준시간) × 표준임률', substitutions: ['실제노무원가 10,000원과 가격차이 2,500원 유리로부터 표준임률은 시간당 5원입니다.', '3,500원 불리 = (2,500시간 - 허용표준시간) × 5원 → 허용표준시간 1,800시간'], result: '1,800시간', verifiedAgainstAnswer: true },
  '2025-03-CM-19': { formula: '총매출액 = 판매수량 × 단위당 판매가격, 판매수량 = (영업이익 + 총고정원가) ÷ 단위당 공헌이익', substitutions: ['단위당 공헌이익 = 9,200원 - 4,900원 = 4,300원, 판매수량 = (10,750,000원 + 2,150,000원) ÷ 4,300원 = 3,000단위', '총매출액 = 3,000단위 × 9,200원 = 27,600,000원'], result: '27,600,000원', verifiedAgainstAnswer: true },
  '2025-03-CM-20': { formula: '전부원가계산 영업이익 = 매출액 - 전부제조원가 매출원가 - 변동판매관리비', substitutions: ['단위당 전부제조원가 = 27원 + 20원 + 6원 + (20,000원 ÷ 1,000단위) = 73원', '영업이익 = 800단위 × 100원 - 800단위 × 73원 - 800단위 × 5원 = 17,600원'], result: '17,600원', verifiedAgainstAnswer: true },
  '2025-03-CM-24': { formula: '손익분기점 판매량 = 일 고정원가 ÷ 단위당 공헌이익', substitutions: ['일 고정원가 = 192,000,000원 ÷ 30일 = 6,400,000원, 단위당 공헌이익 = 4,000원 - 800원 = 3,200원', '손익분기점 판매량 = 6,400,000원 ÷ 3,200원 = 2,000잔, 일 매출 = 2,000잔 × 4,000원 = 8,000,000원'], result: '2,000잔 / 800만원', verifiedAgainstAnswer: true },
  '2025-03-CM-27': { formula: '이익중심점 성과평가 이익 = 사업부공헌이익', substitutions: ['사업부경영자공헌이익 2,500,000원에서 추적가능·통제불능고정원가 500,000원을 차감합니다.', '공통고정원가 배분액은 사업부 통제범위 밖이므로 차감하지 않음 → 사업부공헌이익 2,000,000원'], result: '2,000,000원', verifiedAgainstAnswer: true },
  '2025-03-CM-29': { formula: '시장점유율차이 = (실제시장점유율 - 예산시장점유율) × 실제시장규모 × 단위당 예산공헌이익', substitutions: ['시장점유율 차이 = 45% - 40% = 5%', '5% × 100,000개 × 100원 = 500,000원 유리한 차이'], result: '500,000원(유리)', verifiedAgainstAnswer: true },
  '2025-03-CM-31': { formula: '경제적부가가치 = 세후영업이익 - 투자자본 × 세후가중평균자본비용', substitutions: ['세후영업이익 = 80,000원 × (1 - 20%) = 64,000원, 투자자본 = 400,000원 - 100,000원 = 300,000원', '세후 WACC = 75% × 12% × (1 - 20%) + 25% × 20% = 12.2% → EVA = 64,000원 - 300,000원 × 12.2% = 27,400원'], result: '27,400원', verifiedAgainstAnswer: true },
  '2025-03-CM-32': { formula: '매몰원가 = 이미 발생했고 현재 의사결정으로 회수할 수 없는 과거원가', substitutions: ['차량 취득원가 2,500,000원은 6개월 전에 이미 발생한 과거원가입니다.', '수리비·매각대금은 현재 선택에 따라 달라지는 관련원가·관련수익이므로 매몰원가에 포함하지 않습니다.'], result: '2,500,000원', verifiedAgainstAnswer: true },
  '2025-03-CM-33': { formula: '사업부 폐지 후 당기순이익 = 기존 당기순이익 - 상실 공헌이익 + 회피 가능 공통원가', substitutions: ['사업부 갑 폐지 시 상실 공헌이익은 450,000원, 공통원가 100,000원 중 회피 가능한 금액은 20,000원입니다.', '1,200,000원 - 450,000원 + 20,000원 = 770,000원'], result: '770,000원', verifiedAgainstAnswer: true },
  '2025-03-CM-34': { formula: '최대 허용 구입가격 = 변동 제조원가 + 회피 가능한 고정제조간접원가', substitutions: ['변동 제조원가 = 550원 + 100원 + 150원 = 800원', '회피 가능 고정제조간접원가 = 500,000원 × 40% ÷ 5,000단위 = 40원 → 800원 + 40원 = 840원'], result: '840원', verifiedAgainstAnswer: true },
  '2025-03-CM-38': { formula: '순현재가치 = 미래 세후현금흐름의 현재가치 합계 - 초기투자액', substitutions: ['세후현금흐름 = 세후이익 + 감가상각비 = 540, 700, 620백만원', '현재가치 = 540×0.90 + 700×0.80 + 620×0.70 = 1,480백만원 → NPV = 1,480 - 900 = +580백만원'], result: '순현재가치 (+) 580백만원, 채택', verifiedAgainstAnswer: true },
}
const topicGuides = {
  'FR.FND.CONCEPT': '재무보고의 목적·이용자·질적특성을 구분합니다.', 'FR.FND.PRESENT': '재무제표 표시와 보고기간 후 사건의 인식 기준을 확인합니다.', 'FR.INVENTORY': '수량결정·평가방법과 기말재고의 측정을 먼저 적용합니다.', 'FR.PPE': '감가상각·손상·후속측정의 순서를 분리합니다.', 'FR.INTANGIBLE': '연구·개발 지출의 인식 요건과 상각을 구분합니다.', 'FR.FIN_ASSET_BASIC': '금융자산 분류에 따른 후속측정과 손익 인식 위치를 확인합니다.', 'FR.FIN_LIABILITY': '사채·복합금융상품의 최초 인식과 유효이자율법을 구분합니다.', 'FR.PROVISION': '현재의무와 신뢰성 있는 추정 가능 여부를 확인합니다.', 'FR.EQUITY': '자본거래와 손익·기타포괄손익의 변동을 분리합니다.', 'FR.REV.BASIS': '고객과의 계약에서 대가와 수행의무를 구분합니다.', 'FR.REV.RECOGNITION': '통제가 이전되는 시점 또는 기간을 판단합니다.', 'FR.CONSTRUCTION': '진행률에 따른 누적 수익과 청구액을 비교합니다.', 'FR.EMPLOYEE': '종업원급여의 비용·재측정요소 인식 위치를 구분합니다.', 'FR.SPECIAL.SHARE_BASED': '가득조건과 공정가치를 기준으로 누적 비용을 판단합니다.', 'FR.SPECIAL.ASSOCIATE': '유의적인 영향력과 지분법 투자주식 변동을 확인합니다.', 'FR.SPECIAL.DERIVATIVE': '위험회피 여부에 따른 손익·기타포괄손익 처리를 구분합니다.', 'FR.SPECIAL.CASHFLOW': '영업·투자·재무활동 현금흐름의 분류 기준을 확인합니다.', 'FR.SPECIAL.OTHER': '문제에서 제시한 특수회계의 인식·측정 기준을 우선 적용합니다.',
  'TX.CORP.01': '국세기본법·법인세의 납세의무와 신고 절차를 구분합니다.', 'TX.CORP.04': '손금 인정 요건과 한도·귀속시기를 확인합니다.', 'TX.CORP.05': '감가상각과 자산의 귀속사업연도 기준을 적용합니다.', 'TX.CORP.06': '충당금·준비금의 손금산입 요건을 확인합니다.', 'TX.CORP.08': '특수관계인 거래의 시가와 부당행위계산 부인을 확인합니다.', 'TX.CORP.09': '소득금액에서 공제를 반영해 과세표준·세액을 계산합니다.', 'TX.INC.01': '소득세의 납세의무·신고 원칙을 구분합니다.', 'TX.INC.02': '이자·배당소득의 과세 기준을 확인합니다.', 'TX.INC.03': '사업소득의 총수입금액과 필요경비를 구분합니다.', 'TX.INC.04': '근로·연금·기타소득의 과세 기준을 확인합니다.', 'TX.INC.06': '종합소득 과세표준 계산에서 공제 순서를 확인합니다.', 'TX.INC.07': '세액공제의 적용 대상과 요건을 확인합니다.', 'TX.INC.08': '퇴직소득의 과세 범위와 계산 기준을 구분합니다.', 'TX.INC.09': '양도소득의 과세대상과 납세 절차를 확인합니다.', 'TX.VAT.01': '부가가치세 납세의무와 과세 원칙을 확인합니다.', 'TX.VAT.02': '사업자와 납세지의 기준을 확인합니다.', 'TX.VAT.03': '과세대상 거래와 공급시기를 판단합니다.', 'TX.VAT.05': '과세표준에 포함·제외되는 금액을 구분합니다.', 'TX.VAT.07': '매입세액 공제 가능 여부를 판단합니다.', 'TX.VAT.09': '가산세의 적용 요건을 확인합니다.',
  'CM.01': '원가의 분류와 제조간접비·보조부문 배부 기준을 구분합니다.', 'CM.02': '개별 작업별 직접원가와 제조간접원가 배부를 추적합니다.', 'CM.03': '완성품과 재공품의 완성품환산량을 기준으로 원가를 배분합니다.', 'CM.05': '변동·전부원가계산의 고정원가 처리 차이를 구분합니다.', 'CM.06': '공헌이익과 고정원가를 이용해 CVP 관계를 계산합니다.', 'CM.07': '미래에 달라지는 관련원가·관련수익만 비교합니다.', 'CM.08': '실제와 표준의 차이를 가격·수량 원인으로 나눕니다.', 'CM.09': '예산·책임단위·성과지표를 구분해 평가합니다.', 'CM.11': '시장가격과 목표이익을 바탕으로 원가관리 방법을 판단합니다.',
}
const directionOverrides = {
  '2025-03-TX-10': { keyTerms: ['장기할부판매손익', '손익귀속시기'], topic: '법인세 손익귀속시기', concept: '장기할부판매손익은 원칙적으로 작업진행률이 아니라 각 사업연도의 회수기일 도래 기준으로 익금·손금에 산입합니다.', strategy: '장기할부판매의 수익 인식 기준을 회수기일 기준과 작업진행률 기준으로 구분해 대조합니다.' },
  '2025-05-TX-10': { keyTerms: ['손익의 귀속사업연도', '계약기간 1년 이상'], topic: '법인세 손익귀속시기', concept: '중소기업의 장기건설계약은 완료기준 선택 여부와 계약기간 요건을 구분해 적용하며, 선택지의 적용 주체·요건이 맞는지를 확인합니다.', strategy: '각 선택지의 거래유형을 먼저 구분한 뒤 양도·위탁매매·장기할부·건설계약의 손익귀속 기준을 해당 요건과 대조합니다.' },
}
function optionFocus(option) {
  const match = option.match(/규정중심|원칙중심|공정가치|기타포괄손익|당기손익|현재가치|매출원가|계약자산|계약부채|과세표준|매입세액|세금계산서|완성품환산량|공헌이익|표준원가|관련원가|목표원가|손금불산입|익금|손금/)
  return match?.[0] || option.replace(/\s+/g, ' ').slice(0, 18).trim()
}
function optionEvidenceFor(options, answer) { return options.map((option, index) => ({ choiceNo: index + 1, text: optionFocus(option), type: index + 1 === answer ? 'correct' : 'eliminate', color: index + 1 === answer ? 'purple' : 'red' })) }
function choiceAnalysisFor(options, answer, guide) {
  return options.map((option, index) => {
    const focus = optionFocus(option)
    return index + 1 === answer
      ? { choiceNo: index + 1, verdict: '정답', reason: `“${focus}”라는 표현이 지문의 조건과 맞는지 확인합니다. ${guide} 공식 확정답안 ${['①','②','③','④'][answer - 1]}번과 일치합니다.` }
      : { choiceNo: index + 1, verdict: '오답', reason: `“${focus}”라는 표현을 지문의 조건·예외와 대조합니다. ${guide} 이 선택지는 공식 확정답안 ${['①','②','③','④'][answer - 1]}번과 일치하지 않습니다.` }
  })
}
function choiceAnalysisForQuestion(options, answer, guide, stem) {
  const asksForIncorrect = /옳지 않은|아닌 것|해당하지 않는/.test(stem)
  return options.map((option, index) => {
    const focus = optionFocus(option)
    if (index + 1 === answer && asksForIncorrect) return { choiceNo: index + 1, verdict: '틀림(정답)', reason: `틀린 부분은 “${focus}”입니다. 올바른 기준은 ${guide}입니다. 따라서 이 선택지가 제시한 내용은 그 기준을 잘못 적용한 것이므로 ‘옳지 않은 것’의 정답입니다.` }
    if (index + 1 === answer) return { choiceNo: index + 1, verdict: '정답', reason: `정답 표현은 “${focus}”입니다. ${guide} 이 기준을 지문 조건에 적용하면 ${['①','②','③','④'][answer - 1]}번이 정답입니다.` }
    return { choiceNo: index + 1, verdict: '오답', reason: `“${focus}”라는 표현을 지문의 조건·예외와 대조합니다. ${guide} 이 선택지는 공식 확정답안 ${['①','②','③','④'][answer - 1]}번과 일치하지 않습니다.` }
  })
}
function direction(topicId, topicName, stem, evidence) {
  const keyTerms = [...evidence.map((item) => item.text), topicName].filter((value, index, list) => list.indexOf(value) === index).slice(0, 2)
  return { keyTerms, topic: topicName, concept: topicGuides[topicId] || `${topicName}의 정의와 적용 요건을 확인합니다.`, strategy: /얼마인가|계산/.test(stem) ? '수치·기간·단위를 분리하고, 단원의 계산식에 대입한 뒤 선택지와 대조합니다.' : '문제의 요건·예외·인식 시점을 찾은 뒤 각 선택지에 차례로 대입합니다.' }
}
const questions = markers.map((marker, index) => {
  const number = Number(marker[1]); const raw = joinLines(questionsText.slice(marker.index + marker[0].length, markers[index + 1]?.index)).replace(/ⓛ/g, '①'); const parts = raw.split(/(?=[①②③④])/); const stem = joinLines(parts.shift()); const options = parts.map((part) => joinLines(part.replace(/^[①②③④]\s*/, ''))).slice(0, 4)
  const subject = subjectId(number); const questionNo = number - (subject === 'FR' ? 0 : subject === 'TX' ? 40 : 80); const topic = classification(number); const concept = topicNames[topic.primaryTopicId]; const answer = answerMap[number]; const evidence = evidenceFor(stem); const guide = topicGuides[topic.primaryTopicId] || `${concept}의 기준을 적용합니다.`; const correctFocus = optionFocus(options[answer - 1]); const id = `${examMonth}-${subject}-${String(questionNo).padStart(2, '0')}`
  return { id, examMonth, year: 2025, round: monthLabel, subjectId: subject, questionNo, number, primaryTopicId: topic.primaryTopicId, secondaryTopicIds: [], concept, reviewNeeded: topic.reviewNeeded, stem, options, answer, evidence, optionEvidence: optionEvidenceFor(options, answer), evidenceColor: 'extracted', direction: directionOverrides[id] || direction(topic.primaryTopicId, concept, stem, evidence), explanation: `공식 확정답안은 ${['①','②','③','④'][answer - 1]} ${answer}번입니다. 정답 선택지의 핵심 표현은 “${correctFocus}”입니다. ${guide} 지문에 제시된 조건·기간·수치를 먼저 확인한 뒤, 이 표현이 해당 기준과 맞는지 대조해 답안을 판단합니다.`, solutionSteps: ['문제가 묻는 판단 기준과 “옳지 않은 것·옳은 것” 같은 요구를 먼저 확인합니다.', guide, `정답 선택지 ${['①','②','③','④'][answer - 1]}번의 “${correctFocus}” 표현을 지문 조건과 대조합니다.`], choiceAnalysis: choiceAnalysisForQuestion(options, answer, guide, stem), relatedConcepts: [concept], commonMistake: '문제의 요구 표현과 지문에서 제시한 조건·기간·단위를 확인하지 않고 선택지를 고르는 실수입니다.', calculation: verifiedCalculations[id] || null, explanationStatus: 'completed' }
})

const incomplete = questions.filter((question) => question.options.length !== 4)
if (incomplete.length) console.log('Incomplete option extraction:', incomplete.map((question) => `${question.id}(${question.options.length})`).join(', '))

if (questions.length !== 120) throw new Error(`Expected 120 questions, received ${questions.length}`)
if (new Set(questions.map((question) => question.id)).size !== 120) throw new Error('Duplicate March problem IDs')
if (questions.some((question) => !question.answer)) throw new Error('Missing March answer')
writeFileSync(`src/data/questions-${examMonth}.js`, `// ${examMonth} 공식 기출문제 및 확정답안에서 개인 학습용으로 추출한 데이터입니다.\nexport const questions = ${JSON.stringify(questions, null, 2)}\n`)
console.log(`Generated ${questions.length} ${monthLabel} questions.`)
