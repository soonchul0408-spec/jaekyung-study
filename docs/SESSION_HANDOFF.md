# 재경관리사 기출 노트 인수인계

최종 갱신: 2026-08-20

## 현재 상태

- 운영 사이트: https://jaekyung-study.vercel.app
- GitHub: https://github.com/soonchul0408-spec/jaekyung-study
- 기본 브랜치: `main`
- 최신 커밋: `3207fb8 Refine May calculation explanations`
- 등록 회차: 2025년 1월, 3월, 5월 (각 120문항, 총 360문항)

## 핵심 구조

| 영역 | 파일 | 역할 |
|---|---|---|
| 회차 등록 | `src/data/examSets.js` | 모든 회차를 한 목록으로 통합한다. 새 회차는 여기 등록해야 월별·항목별·검사가 함께 동작한다. |
| 1월 데이터 | `src/data/questions.js` | 기준 회차 데이터 |
| 3월·5월 추출 | `scripts/buildMarchExamData.mjs` | `EXAM_MONTH`로 월을 지정하는 공용 추출기. 5월은 `npm run generate:may-data`로 재생성한다. |
| 3월 데이터 | `src/data/questions-2025-03.js` | 생성 결과 |
| 5월 데이터 | `src/data/questions-2025-05.js` | 생성 결과 |
| 빈출 기준 | `src/data/frequencyAnalysis.js` | TOP 12와 실제 `problemId` 연결 |
| 화면 | `src/main.js` | 월별 선택, 문제 도구, 근거·풀이 방향·해설 렌더링 |

## 새 회차 추가 절차

1. 공식 문제 PDF와 확정답안을 원본으로 사용한다.
2. PDF 텍스트를 `/private/tmp/jaekyung-YYYY-MM-questions.txt`, `...-answers.txt`로 추출한다.
3. `EXAM_MONTH=YYYY-MM node scripts/buildMarchExamData.mjs`로 데이터 파일을 생성한다.
4. `src/data/examSets.js`에 새 회차를 등록한다.
5. `src/data/frequencyAnalysis.js`에 확인된 실제 문제 ID만 연결한다.
6. 계산형은 추출기 안의 `verifiedCalculations`에 반드시 다음을 작성한다.
   - `formula`
   - 서로 다른 두 단계 이상의 `substitutions`
   - `result`
   - `verifiedAgainstAnswer: true`
7. 필요하면 `directionOverrides`에 지문·보기와 직접 연결되는 풀이 방향을 추가한다.
8. 아래 검사를 모두 통과한 뒤에만 커밋·배포한다.

```bash
npm run check:frequency
npm run check:exam-quality
npm run check:explanations
npm run check:exam-parity
npm run build
```

상세 기준은 [QUALITY_CHECKLIST.md](QUALITY_CHECKLIST.md), 해설 기준은 [EXPLANATION_QUALITY_STANDARD.md](EXPLANATION_QUALITY_STANDARD.md)를 따른다.

## 5월 완료 내역

- 120문항·과목별 40문항·4지선다·확정답안 등록 완료
- TOP 12 빈출 매핑 포함
- 계산형 40문항에 계산식·수치대입·정답 검산·수험생용 풀이 설명 추가
- `check:frequency`, `check:exam-quality`, `check:explanations`, `check:exam-parity`, `build` 통과

## 배포

```bash
npx vercel --prod
```

이 프로젝트는 Vercel 프로젝트 `jaekyung-study`에 연결돼 있다. 권한 오류가 나면 `npx vercel login` 후 다시 실행한다.

## 이번 세션의 반복 종료 현상 분석

### 확인한 로그

- 세션 로그: `/Users/baeksoonchul/.codex/sessions/2026/08/20/rollout-2026-08-20T10-18-42-01a01cbf-b97b-7103-8d87-3f7a1c725d5e.jsonl`
- 설정: `/Users/baeksoonchul/.codex/config.toml`

### 로그상 확인된 사실

세션 로그에는 여러 차례 다음 순서가 반복된다.

1. `AgentMessage`의 `phase`가 `final_answer`로 기록됨
2. 직후 `task_complete` 이벤트가 기록됨
3. 다음 작업은 새 사용자 입력 후에만 시작됨

예를 들어 로그 ordinal 2224~2227은 계산형을 `12/40 → 15/40`으로 보완한 뒤 에이전트가 `final_answer`를 보냈고, 즉시 `task_complete`가 발생한 사례다. 이는 실행 중인 stop hook이 작업을 끊은 기록이 아니라, 에이전트가 최종 응답을 보내 턴을 스스로 종료한 기록이다.

`config.toml`에는 명시적인 `stop hook` 설정이 없다. 다만 `notify = [..., "turn-ended"]`가 있으며, 이는 턴 종료를 알리는 데스크톱 알림 설정이다. 현재 확보한 증거로는 이 설정이 작업 종료를 유발했다고 판단할 근거가 없다.

### 결론과 다음 세션 권장사항

- 확인된 직접 원인: 완료 전 `final_answer`를 반복적으로 전송해 `task_complete`를 발생시킨 작업 흐름.
- 확인되지 않은 가설: stop hook 자체가 중단을 강제했다는 가설. 현재 로그·설정에서는 이를 뒷받침하는 이벤트나 설정을 찾지 못했다.
- 긴 작업은 중간 진행 보고를 `commentary`로만 하고, 실제 완료·검사·커밋·배포까지 한 턴에서 처리한 뒤 `final`을 한 번만 전송한다.
- 추가 조사 시에는 위 JSONL에서 `phase:"final_answer"`와 직후 `task_complete`의 쌍을 먼저 확인한다. hook 관련 별도 오류 이벤트가 나타날 때만 hook 원인을 재검토한다.
