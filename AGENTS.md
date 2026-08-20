# 재경관리사 기출 노트 작업 지침

## 프로젝트 기준

- 운영 사이트: https://jaekyung-study.vercel.app
- GitHub: https://github.com/soonchul0408-spec/jaekyung-study
- 기본 브랜치: `main`
- 등록 회차: 2025년 1월·3월·5월. 각 회차는 과목별 40문항, 총 120문항이다.
- 새 회차는 기존 1월 화면·기능·해설 품질과 동등해야 한다. 일부 기능만 연결한 상태로 배포하지 않는다.

## 데이터·화면 구조

| 파일 | 역할 |
|---|---|
| `src/data/examSets.js` | 모든 회차의 단일 등록 목록. 새 회차를 여기 등록해야 월별·항목별·검사가 함께 동작한다. |
| `src/data/questions.js` | 2025년 1월 기준 데이터 |
| `src/data/questions-2025-03.js` | 2025년 3월 데이터 |
| `src/data/questions-2025-05.js` | 2025년 5월 데이터 |
| `scripts/buildMarchExamData.mjs` | `EXAM_MONTH`를 받는 공용 추출기와 계산형 풀이 데이터 |
| `src/data/frequencyAnalysis.js` | TOP 12 빈출 기준과 실제 `problemId` 연결 |
| `src/main.js` | 월별 선택, 문제 도구, 근거·풀이 방향·해설 화면 |

## 새 회차 추가 규칙

1. 공식 문제지와 확정답안만 원본으로 사용한다.
2. 문제·정답을 각각 `/private/tmp/jaekyung-YYYY-MM-questions.txt`, `...-answers.txt`로 추출한다.
3. `EXAM_MONTH=YYYY-MM node scripts/buildMarchExamData.mjs`로 데이터를 만든다.
4. `src/data/examSets.js`에 회차를 등록한다.
5. `src/data/frequencyAnalysis.js`에는 실제 존재하고 확인된 문제 ID만 연결한다.
6. 계산형에는 `formula`, 서로 다른 두 단계 이상의 `substitutions`, `result`, `verifiedAgainstAnswer: true`를 원문·확정답안 기준으로 작성한다.
7. ‘옳지 않은 것’은 정답 선택지의 틀린 문구와 올바른 기준을 연결해 설명한다.
8. 풀이 방향은 지문·보기의 실제 표현, 구체 개념, 적용 순서를 모두 포함한다.

상세 품질 기준은 `docs/QUALITY_CHECKLIST.md`, 해설 형식은 `docs/EXPLANATION_QUALITY_STANDARD.md`를 따른다.

## 필수 검증

아래는 새 회차 추가·해설 수정 후 모두 통과해야 한다.

```bash
npm run check:frequency
npm run check:exam-quality
npm run check:explanations
npm run check:exam-parity
npm run build
```

## 긴 작업의 종료 규칙

완료 조건이 남아 있거나 위 검사가 실패한 상태에서는 최종 응답을 보내지 않는다. 진행 상황이 필요하면 `commentary`만 사용한다. 빈 최종 응답도 턴을 종료하므로 사용하지 않는다.

최종 응답 전에는 다음을 한 번에 확인한다.

1. 남은 문항·누락 필드가 없는지 확인
2. 필수 검증 전체 통과
3. `git status` 확인
4. 요청된 경우 커밋·GitHub 푸시·Vercel 배포까지 완료

## 배포

```bash
npx vercel --prod
```

권한 오류가 나면 `npx vercel login` 후 재시도한다.
