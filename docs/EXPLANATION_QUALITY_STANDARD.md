# 재경관리사 기출 해설 작성·검증 기준

이 문서는 2025년 1월 이후 모든 회차(2025-03, 05, 06, 07, 09, 11, 12 포함)에 동일하게 적용한다.

## 공통 원칙

- `answer`는 공식 확정답안만 사용한다.
- 해설은 반드시 `AI 학습용 해설`로 표기한다. 공식 해설처럼 표시하지 않는다.
- `primaryTopicId`는 taxonomy에 있는 가장 좁은 직접 논점으로 지정한다.
- 분류가 애매하면 `reviewNeeded: true`로 두되, 답안·해설 공개 여부와 혼동하지 않는다.
- 해설이 확정답안과 충돌하거나 근거가 부족하면 자동 공개하지 않고 `reviewNeeded: true` 및 `explanationStatus: review`로 둔다.

## 이론형 문항 필수 필드

- `explanation`: 정답 원리와 결론을 2~3문장으로 작성한다.
- `solutionSteps`: 문제 요구 확인 → 판단 기준 → 정답 대조 순서로 2~3단계 작성한다.
- `choiceAnalysis`: ①~④ 각각에 맞음/틀림과 한 줄 이유를 작성한다.
- 말문제의 오답 선택지는 반드시 `틀린 문구 → 올바른 기준` 순서로 쓴다. 예: “유형별로”가 틀렸고, “모든 투자부동산에 일관 적용”이 올바른 기준이다.
- “옳지 않은 것” 유형은 정답 선택지에 `틀림(정답)`을 표시하고, 보기 원문에서 틀린 표현을 인용한 뒤 단원 기준과 연결한다.
- `relatedConcepts`: taxonomy의 `primaryTopicId`에 대응하는 한국어 단원명을 넣는다.
- `commonMistake`: 부정 표현, 예외, 인식 시점 등 실제 혼동 지점을 한 줄로 쓴다.
- `direction`: `keyTerms`, `topic`, `concept`, `strategy`를 반드시 작성한다. 지문에서 찾을 단어를 taxonomy 단원과 핵심 개념으로 연결하고, 선택지에 적용하는 순서를 쓴다.
- `optionEvidence`: ①~④ 각각에 짧은 근거 표현을 하나씩 지정한다. 정답 선택지는 `correct`, 오답 선택지는 `eliminate`로 표시하며, 원문 선택지에 실제 포함된 표현만 쓴다.

## 계산형 문항 추가 필수 필드

계산형으로 판단되는 문항은 `calculation` 객체가 없으면 공개 완료로 처리하지 않는다.

```js
calculation: {
  formula: '매출원가 = 기초재고 + 당기매입 - 기말재고',
  substitutions: ['142,000원 - 22,000원', '= 120,000원'],
  result: '120,000원',
  verifiedAgainstAnswer: true,
}
```

검증 순서:

1. 지문에서 숫자·기간·단위를 빠짐없이 추출한다.
2. 적용 기준과 식을 문항에 맞게 선택한다.
3. 각 숫자를 식에 대입하고 중간값을 남긴다.
4. 결과가 `answer`가 가리키는 선택지와 같은지 확인한다.
5. 다르거나 수치가 불명확하면 `verifiedAgainstAnswer: false`, `reviewNeeded: true`로 두고 공개하지 않는다.

## 신규 회차 등록 체크리스트

1. 공식 문제지와 확정답안을 입력한다.
2. 과목별 40문항, 총 120문항인지 확인한다.
3. taxonomy ID와 `reviewNeeded`를 지정한다.
4. 이론형·계산형 해설 필드를 작성한다.
5. `npm run check:explanations`을 실행한다.
6. 실패 문항을 수정한 뒤에만 `npm run build` 및 배포한다.
