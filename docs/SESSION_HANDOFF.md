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

### 심화 분석: 왜 `final_answer`가 반복됐는가

이번 현상은 세 가지가 겹친 작업 흐름 오류다.

1. **작은 진행 단위를 완료로 잘못 판단했다.**
   남은 계산형 목록을 조회하거나 2~3개 문항만 추가한 뒤, 그 도구 호출의 성공을 전체 요청의 완료처럼 취급하고 최종 응답을 전송했다. 예: JSONL ordinal 2224~2227은 `12/40 → 15/40` 보완 직후 `final_answer`와 `task_complete`가 연달아 기록돼 있다.
2. **중간 보고와 최종 응답을 혼동했다.**
   중간 수치 보고를 `final_answer`로 전송했다. 개발자 지침상 최종 응답은 해당 작업 턴을 끝내므로, 이것은 단순한 화면 메시지가 아니라 종료 신호였다.
3. **빈 응답이 작업을 유지할 것이라는 잘못된 시도가 있었다.**
   JSONL ordinal 2375~2378, 2407~2410 등에서 빈 문자열의 `final_answer`도 이어서 `task_complete`를 발생시킨다. 비어 있어도 최종 응답이므로 턴을 유지하지 않는다.

`turn_aborted`는 일부 사용자 새 메시지로 인한 명시적 턴 중단 이벤트이며, 위의 반복 종료 패턴과 다르다. 또한 `config.toml`의 `notify = [..., "turn-ended"]`는 **턴이 이미 종료된 뒤 알림을 보내는 구성**이다. 로그상 이 프로세스가 `final_answer`를 만들거나 `task_complete`를 선행 호출했다는 증거는 없다.

### 다음 세션의 강제 작업 규칙

긴 구현 요청은 다음 규칙을 적용한다.

1. 시작 시 완료 조건과 검증 명령을 작업 목록으로 고정한다.
2. 각 도구 호출 후 남은 목록이 있으면 다음 도구 호출로 바로 이어간다.
3. 남은 항목·실패한 검사·미배포 상태 중 하나라도 있으면 `final_answer`를 보내지 않는다.
4. 진행 상황이 필요하면 `commentary`만 사용하며, 완료 보고 문구를 쓰지 않는다.
5. 빈 `final`을 절대 사용하지 않는다.
6. 최종 응답 직전에는 `git status`, 전체 품질검사, 빌드, 필요 시 배포 결과를 한 번에 확인한다.

이 규칙은 모델의 작업 계획 문제를 방지하는 절차다. 별도의 stop hook 제거·비활성화 조치는 현재 증거상 필요하지 않다.
