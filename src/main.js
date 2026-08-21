import './style.css'
import './explanation.css'
import './calculation.css'
import './option-evidence.css'
import './korean-wrap.css'
import './quiz.css'
import { examSets, questions } from './data/examSets.js'
import taxonomy from './data/taxonomy.json'
import { FREQUENCY_ANALYSIS_NOTE, frequencyAnalysis, frequencyEntryForProblem, frequencySubjectSummaries } from './data/frequencyAnalysis.js'

const app = document.querySelector('#app')
const subjects = taxonomy.subjects
const subjectName = (id) => subjects.find((subject) => subject.id === id)?.name || id
const topicOptions = (subjectId) => subjects.find((subject) => subject.id === subjectId)?.chapters.flatMap((chapter) => chapter.topics?.length ? chapter.topics : [chapter]) || []
const topicName = (id) => topicOptions(id.split('.')[0]).find((topic) => topic.id === id)?.name || id
const saved = JSON.parse(localStorage.getItem('jaekyung-study-state') || '{}')
const state = {
  page: 'home',
  currentId: saved.currentId || questions[0]?.id,
  favorites: saved.favorites || [],
  attempts: saved.attempts || {},
  wrongQuestionIds: saved.wrongQuestionIds || [],
  evidence: false,
  direction: false,
  explanation: false,
  filter: 'all',
  topicFilter: 'all',
  topOnly: false,
  frequencyRank: null,
  frequencySubject: 'FR',
  examMonth: saved.examMonth || '2025-01',
  studiedFrequencyKeys: saved.studiedFrequencyKeys || [],
}

function persist() {
  localStorage.setItem('jaekyung-study-state', JSON.stringify({ currentId: state.currentId, favorites: state.favorites, attempts: state.attempts, wrongQuestionIds: state.wrongQuestionIds, studiedFrequencyKeys: state.studiedFrequencyKeys, examMonth: state.examMonth }))
}
function current() { return questions.find((question) => question.id === state.currentId) || questions[0] }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]) }
function subjectCount(subjectId, list = questions) { return list.filter((question) => question.subjectId === subjectId).length }
function isFavorite(id) { return state.favorites.includes(id) }
function attemptFor(id) { return state.attempts[id] || null }
function isWrong(id) { return state.wrongQuestionIds.includes(id) }
function frequencyKey(entry) { return `${entry.subject}-${entry.rank}` }
function isFrequencyStudied(entry) { return state.studiedFrequencyKeys.includes(frequencyKey(entry)) }
function frequencyBadge(question) {
  const entry = frequencyEntryForProblem(question.id)
  return entry ? `<span class="frequency-badge frequency-badge--top">핵심 TOP 12 · ${subjectName(entry.subject)} ${entry.rank}순위</span>` : '<span class="frequency-badge frequency-badge--supplement">보완 유형</span>'
}
function reviewBadge(question) {
  if (question.sourceVerificationNote) return '<em>원문·답안 검토 중</em>'
  return question.reviewNeeded ? '<em>분류 검토 필요</em>' : ''
}
function openQuestion(id) { state.currentId = id; state.examMonth = questions.find((question) => question.id === id)?.examMonth || state.examMonth; state.page = 'question'; state.evidence = false; state.direction = false; state.explanation = false; persist(); render() }
function go(page) { state.page = page; render() }
function button(label, action, className = '') { return `<button class="${className}" data-action="${action}">${label}</button>` }
function questionCard(question, compact = false) {
  return `<button class="question-card${compact ? ' compact' : ''}" data-open="${question.id}">
    <span class="question-no">${subjectName(question.subjectId)} · ${question.questionNo}번</span>
    <strong>${escapeHtml(topicName(question.primaryTopicId))}</strong><span>${escapeHtml(question.concept)}</span>${frequencyBadge(question)}
    ${reviewBadge(question)}
  </button>`
}
function collapsibleQuestionList(title, rows, description = '') {
  return `<details class="question-list-disclosure"><summary><span><strong>${title}</strong><small>${description || `${rows.length}문제 · 눌러서 펼치기`}</small></span><b aria-hidden="true">⌄</b></summary><section class="question-list">${rows.map((question) => questionCard(question)).join('')}</section></details>`
}
function home() {
  const resume = current()
  const monthLabel = examSets.map((exam) => exam.label.replace('2025년 ', '')).join('·')
  return `<main class="screen home-screen">
    <p class="eyebrow">개인 학습용 · ${examSets.length}회차 · ${questions.length}문제</p><h1>재경관리사<br/><i>기출 노트</i></h1>
    <p class="intro">정답을 고르기 전에, 문제 안의 판단 근거를 먼저 찾는 연습입니다.</p>
    <section class="continue-card"><span>이어 보기</span><strong>${subjectName(resume.subjectId)} ${resume.questionNo}번</strong><p>${escapeHtml(topicName(resume.primaryTopicId))}</p>${button('마지막 문제 열기 →', 'resume', 'primary')}</section>
    <nav class="home-menu">
      <button data-action="year"><span>01</span><strong>연도별 기출</strong><small>2025년 ${monthLabel} · ${questions.length}문제</small><b>→</b></button>
      <button data-action="review"><span>02</span><strong>항목별 복습</strong><small>과목 · 주제별로 보기</small><b>→</b></button>
      <button data-action="favorites"><span>03</span><strong>헷갈리는 문제</strong><small>${state.favorites.length}문제 저장됨</small><b>→</b></button>
      <button data-action="wrong"><span>04</span><strong>오답 다시 풀기</strong><small>${state.wrongQuestionIds.length}문제 · 틀린 문제만 재도전</small><b>→</b></button>
      <button data-action="frequency"><span>05</span><strong>빈출 분석</strong><small>공개기출 8회분 · 핵심 TOP 12</small><b>→</b></button>
    </nav>
    <p class="source-note">출처: 삼일회계법인 2025년 재경관리사 기출문제 및 확정답안. 문항별 공식 해설은 제공되지 않았습니다.</p>
  </main>`
}
function year() {
  const examQuestions = questions.filter((question) => question.examMonth === state.examMonth)
  const selected = examQuestions.filter((question) => {
    const entry = frequencyEntryForProblem(question.id)
    return (state.filter === 'all' || question.subjectId === state.filter)
      && (state.topicFilter === 'all' || question.primaryTopicId === state.topicFilter)
      && (!state.topOnly || Boolean(entry))
      && (!state.frequencyRank || entry?.rank === state.frequencyRank && entry.subject === state.filter)
  })
  return `<main class="screen"><header class="page-head">${button('‹', 'home', 'icon')}<div><p class="eyebrow">연도별 기출</p><h2>${state.examMonth.replace('-', '년 ')}월</h2></div></header>
    <p class="page-copy">월을 선택한 뒤 과목 또는 번호를 골라 바로 이동하세요.</p>
    <div class="filter-row exam-month-row" aria-label="기출 월 선택">${examSets.map((exam) => `<button data-exam-month="${exam.id}" class="${state.examMonth === exam.id ? 'active' : ''}">${exam.label}</button>`).join('')}</div>
    <div class="filter-row"><button data-filter="all" class="${state.filter === 'all' ? 'active' : ''}">전체 ${examQuestions.length}</button>${subjects.map((subject) => `<button data-filter="${subject.id}" class="${state.filter === subject.id ? 'active' : ''}">${subject.name} ${subjectCount(subject.id, examQuestions)}</button>`).join('')}</div>
    ${state.filter !== 'all' ? `<div class="filter-row topic-row"><button data-topic-filter="all" class="${state.topicFilter === 'all' ? 'active' : ''}">전체 주제</button>${topicOptions(state.filter).map((topic) => `<button data-topic-filter="${topic.id}" class="${state.topicFilter === topic.id ? 'active' : ''}">${topic.name}</button>`).join('')}</div>` : ''}
    <button class="top-filter ${state.topOnly ? 'active' : ''}" data-action="toggle-top-filter">${state.topOnly ? '핵심 TOP 12만 보기 해제' : '핵심 TOP 12만 보기'}</button>
    ${state.frequencyRank ? `<p class="frequency-filter-note">${subjectName(state.filter)} ${state.frequencyRank}순위 유형으로 필터링 중 · <button data-action="clear-frequency-filter">전체 핵심 유형 보기</button></p>` : ''}
    <section class="number-grid">${selected.map((question) => `<button data-open="${question.id}" class="${question.id === state.currentId ? 'current' : ''}">${question.questionNo}</button>`).join('')}</section>
    ${collapsibleQuestionList('문제 목록', selected, `${selected.length}문제 · 제목을 눌러 펼치기`)}
  </main>`
}
function review() {
  const selected = questions.filter((question) => question.subjectId === state.filter && (state.topicFilter === 'all' || question.primaryTopicId === state.topicFilter))
  return `<main class="screen"><header class="page-head">${button('‹', 'home', 'icon')}<div><p class="eyebrow">항목별 복습</p><h2>주제로 고르기</h2></div></header>
    <p class="page-copy">과목을 누르면 세부 주제가 있는 문제 목록을 볼 수 있습니다.</p>
    <section class="subject-list">${subjects.map((subject, index) => {
      const topicList = topicOptions(subject.id).slice(0, 4).map((topic) => topic.name)
      return `<button data-filter-review="${subject.id}"><span>0${index + 1}</span><div><strong>${subject.name}</strong><small>${subjectCount(subject.id)}문제 · ${topicList.join(' · ')}</small></div><b>→</b></button>`
    }).join('')}</section>
    ${state.filter !== 'all' ? `<section class="review-results"><h3>${subjectName(state.filter)}</h3><div class="filter-row topic-row"><button data-topic-filter="all" class="${state.topicFilter === 'all' ? 'active' : ''}">전체</button>${topicOptions(state.filter).map((topic) => `<button data-topic-filter="${topic.id}" class="${state.topicFilter === topic.id ? 'active' : ''}">${topic.name}</button>`).join('')}</div>${collapsibleQuestionList('선택한 주제의 문제', selected, `${selected.length}문제 · 제목을 눌러 펼치기`)}</section>` : ''}
  </main>`
}
function frequency() {
  const subject = state.frequencySubject
  const summary = frequencySubjectSummaries[subject]
  const entries = frequencyAnalysis.filter((entry) => entry.subject === subject)
  return `<main class="screen frequency-screen"><header class="page-head">${button('‹', 'home', 'icon')}<div><p class="eyebrow">FREQUENCY ANALYSIS</p><h2>빈출 분석</h2></div></header>
    <section class="frequency-intro"><strong>${FREQUENCY_ANALYSIS_NOTE}</strong><p>과목별 40문항, 70점 이상이 합격 기준</p><p>TOP 12 유형을 모두 맞힌 가정에서 2문제를 틀려도 합격권을 목표로 합니다.</p></section>
    <div class="frequency-tabs" role="tablist" aria-label="빈출 분석 과목">${subjects.map((item) => `<button role="tab" aria-selected="${item.id === subject}" class="${item.id === subject ? 'active' : ''}" data-action="frequency-subject" data-subject="${item.id}">${item.name}</button>`).join('')}</div>
    <section class="frequency-score"><div><span>평균</span><strong>${summary.average}점</strong></div><div><span>최저</span><strong>${summary.minimum}점</strong></div><div><span>2문제 실수 시 최저</span><strong>${summary.twoMistakesMinimum}점</strong></div></section>
    <p class="frequency-caution">점수는 “공개기출에서 해당 유형 문제를 모두 맞힌 가정”의 분석 기준입니다.</p>
    <section class="frequency-list" aria-label="${subjectName(subject)} 핵심 세부유형 TOP 12">${entries.map((entry) => `<article class="frequency-item"><button class="frequency-item__open" data-action="open-frequency-topic" data-subject="${entry.subject}" data-rank="${entry.rank}"><span class="frequency-rank">${entry.rank}</span><span><strong>${escapeHtml(entry.topicName)}</strong><small>출제 ${entry.questionCount}회 · 현재 연결 ${entry.problemIds.length}문제</small></span><b>문제 보기 →</b></button><p>${escapeHtml(entry.note)}</p><div class="frequency-item__footer"><span class="${isFrequencyStudied(entry) ? 'study-state is-done' : 'study-state'}">${isFrequencyStudied(entry) ? '학습 완료' : '학습 전'}</span><button class="study-toggle" data-action="toggle-frequency-study" data-subject="${entry.subject}" data-rank="${entry.rank}">${isFrequencyStudied(entry) ? '학습 완료 취소' : '학습 완료로 표시'}</button></div></article>`).join('')}</section>
  </main>`
}
function markEvidence(text, items) {
  if (!state.evidence || !items?.length) return escapeHtml(text)
  let result = escapeHtml(text)
  for (const item of items) {
    const safe = escapeHtml(item.text)
    result = result.replace(safe, `<mark class="mark-${item.color}">${safe}</mark>`)
  }
  return result
}
function questionView() {
  const q = current(); const examQuestions = questions.filter((question) => question.examMonth === q.examMonth); const position = examQuestions.indexOf(q); const previous = examQuestions[position - 1]; const next = examQuestions[position + 1]; const attempt = attemptFor(q.id); const answered = Boolean(attempt); const wasCorrect = attempt?.choiceNo === q.answer
  return `<main class="screen question-screen"><header class="question-header">${button('‹', 'year', 'icon')}<span>${q.year}년 ${q.round} · ${subjectName(q.subjectId)}</span><button class="bookmark ${isFavorite(q.id) ? 'saved' : ''}" data-action="favorite">${isFavorite(q.id) ? '★' : '☆'}<small>헷갈림</small></button></header>
    <div class="question-meta"><span>${q.questionNo}번</span><div><b>${escapeHtml(topicName(q.primaryTopicId))}</b><i>${escapeHtml(q.concept)}${q.sourceVerificationNote ? ' · 원문·답안 검토 중' : q.reviewNeeded ? ' · 분류 검토 필요' : ''}</i>${frequencyBadge(q)}</div></div>
    <article class="question-body"><div class="stem">${markEvidence(q.stem, q.evidence)}</div><p class="answer-guide">정답을 고른 뒤 채점하세요. 틀린 문제는 자동으로 오답 다시 풀기에 저장됩니다.</p><ol class="options">${q.options.map((option, index) => { const choiceNo = index + 1; const marks = q.optionEvidence?.filter((item) => item.choiceNo === choiceNo) || []; const marker = marks[0]; const status = answered ? (choiceNo === q.answer ? ' is-correct' : choiceNo === attempt.choiceNo ? ' is-wrong' : '') : ''; return `<li class="option${status}"><button data-choice="${choiceNo}" aria-pressed="${attempt?.choiceNo === choiceNo}"><span>${['①','②','③','④'][index]}</span><div>${markEvidence(option, state.evidence ? marks : [])}${state.evidence && marker ? `<small class="option-evidence ${marker.type}">${marker.type === 'correct' ? '정답 판단 표현' : '오답 확인 표현'}: “${escapeHtml(marker.text)}”</small>` : ''}</div></button></li>` }).join('')}</ol>${answered ? `<p class="answer-result ${wasCorrect ? 'correct' : 'wrong'}"><b>${wasCorrect ? '정답입니다.' : '오답입니다.'}</b> ${wasCorrect ? '정답 논리를 해설에서 다시 확인하세요.' : `정답은 ${['①','②','③','④'][q.answer - 1]} ${q.answer}번이며, 이 문항은 오답 다시 풀기에 저장됐습니다.`}</p>` : ''}</article>
    <section class="learning-tools">
      ${button(state.evidence ? '근거 숨기기' : '근거 보기', 'evidence', state.evidence ? 'tool active-tool' : 'tool')}
      ${button(state.direction ? '풀이 방향 접기' : '풀이 방향 보기', 'direction', state.direction ? 'tool active-tool' : 'tool')}
      ${q.explanationStatus === 'completed' || q.sourceVerificationNote ? button(state.explanation ? '정답 및 해설 접기' : '정답 및 해설 보기', 'explanation', state.explanation ? 'tool active-tool' : 'tool') : '<p class="explanation-pending">AI 학습용 해설은 순서대로 작성 중입니다.</p>'}
    </section>
    ${state.evidence ? `<section class="evidence-key"><b>색상 기준</b><span class="blue">사실관계</span><span class="orange">판단 기준</span><span class="green">숫자·기간</span><span class="red">함정 표현</span><span class="purple">결론 연결</span></section>` : ''}
    ${state.direction ? `<section class="note-panel"><p class="eyebrow">풀이 방향</p><p><b>찾을 표현</b> · ${q.direction.keyTerms.map((term) => `“${escapeHtml(term)}”`).join(', ')}</p><p><b>연결 단원</b> · ${escapeHtml(q.direction.topic)}</p><p><b>핵심 개념</b> · ${escapeHtml(q.direction.concept)}</p><p><b>적용 순서</b> · ${escapeHtml(q.direction.strategy)}</p></section>` : ''}
    ${state.explanation && (q.explanationStatus === 'completed' || q.sourceVerificationNote) ? `<section class="note-panel caution"><p class="eyebrow">AI 학습용 해설</p><p class="answer-line">공식 확정답안: <strong>${['①','②','③','④'][q.answer - 1]} ${q.answer}번</strong></p>${q.sourceVerificationNote ? `<p class="source-verification-note"><b>원문 수치 확인 안내</b> · ${escapeHtml(q.sourceVerificationNote)}</p>` : ''}<p>${escapeHtml(q.explanation)}</p><h3>판단 순서</h3><ol class="solution-steps">${q.solutionSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>${q.calculation ? `<h3>계산 과정</h3><p class="calculation-formula">${escapeHtml(q.calculation.formula)}</p><ol class="solution-steps">${q.calculation.substitutions.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol><p>결과: <strong>${escapeHtml(q.calculation.result)}</strong></p><h3>수험생용 풀이 설명</h3><p>${escapeHtml(q.calculation.teachingExplanation)}</p>` : ''}<h3>정답 해설</h3><ul class="choice-analysis">${q.choiceAnalysis.filter((item) => item.choiceNo === q.answer).map((item) => `<li><b>${['①','②','③','④'][item.choiceNo - 1]} ${item.verdict}</b><span>${escapeHtml(item.reason)}</span></li>`).join('')}</ul><h3>연결 개념</h3><p>${q.relatedConcepts.map(escapeHtml).join(' · ')}</p><h3>자주 하는 실수</h3><p>${escapeHtml(q.commonMistake)}</p><p class="explanation-disclaimer">공식 해설이 아닌, 제공된 지문과 확정답안을 바탕으로 작성한 AI 학습용 해설입니다.</p></section>` : ''}
    <footer class="question-nav">${previous ? `<button data-open="${previous.id}">← 이전 문제</button>` : '<span></span>'}${next ? `<button data-open="${next.id}" class="primary">다음 문제 →</button>` : '<span></span>'}</footer>
  </main>`
}
function favorites() {
  const favoriteQuestions = questions.filter((question) => isFavorite(question.id))
  return `<main class="screen"><header class="page-head">${button('‹', 'home', 'icon')}<div><p class="eyebrow">헷갈리는 문제</p><h2>다시 볼 문제</h2></div></header>
    <p class="page-copy">문제 상세에서 별표를 누르면 이 목록에 저장됩니다.</p>
    ${favoriteQuestions.length ? collapsibleQuestionList('저장한 문제 목록', favoriteQuestions, `${favoriteQuestions.length}문제 · 제목을 눌러 펼치기`) : '<div class="empty-state">아직 저장한 문제가 없습니다.<br/>문제에서 <b>☆ 헷갈림</b>을 눌러보세요.</div>'}
  </main>`
}
function wrong() {
  const wrongQuestions = questions.filter((question) => isWrong(question.id))
  return `<main class="screen"><header class="page-head">${button('‹', 'home', 'icon')}<div><p class="eyebrow">오답 다시 풀기</p><h2>틀린 문제 재도전</h2></div></header>
    <p class="page-copy">정답이 아닌 선택지를 고른 문제만 자동 저장됩니다. 다시 맞히면 이 목록에서 바로 빠집니다.</p>
    ${wrongQuestions.length ? `<section class="retry-card"><strong>${wrongQuestions.length}문제 남음</strong><p>첫 문제부터 다시 풀며 정답 논리를 확인하세요.</p>${button('첫 오답 문제 풀기 →', `open-wrong`, 'primary')}</section>${collapsibleQuestionList('오답 문제 목록', wrongQuestions, `${wrongQuestions.length}문제 · 제목을 눌러 이동`)}` : '<div class="empty-state"><b>현재 저장된 오답이 없습니다.</b><br/>문제를 풀고 틀린 선택지를 고르면 자동으로 이곳에 모입니다.</div>'}
  </main>`
}
function render({ preserveScroll = false } = {}) {
  const scrollPosition = preserveScroll ? window.scrollY : 0
  app.innerHTML = state.page === 'home' ? home() : state.page === 'year' ? year() : state.page === 'review' ? review() : state.page === 'favorites' ? favorites() : state.page === 'wrong' ? wrong() : state.page === 'frequency' ? frequency() : questionView()
  window.requestAnimationFrame(() => window.scrollTo({ top: scrollPosition, behavior: 'auto' }))
}
app.addEventListener('click', (event) => {
  const choice = event.target.closest('[data-choice]')
  if (choice) {
    const q = current(); const choiceNo = Number(choice.dataset.choice); const correct = choiceNo === q.answer
    state.attempts = { ...state.attempts, [q.id]: { choiceNo, correct, attemptedAt: new Date().toISOString() } }
    state.wrongQuestionIds = correct ? state.wrongQuestionIds.filter((id) => id !== q.id) : [...new Set([...state.wrongQuestionIds, q.id])]
    state.explanation = true; persist(); return render({ preserveScroll: true })
  }
  const opener = event.target.closest('[data-open]'); if (opener) return openQuestion(opener.dataset.open)
  const examMonth = event.target.closest('[data-exam-month]'); if (examMonth) { state.examMonth = examMonth.dataset.examMonth; state.filter = 'all'; state.topicFilter = 'all'; state.frequencyRank = null; persist(); return render({ preserveScroll: true }) }
  const filter = event.target.closest('[data-filter]'); if (filter) { state.filter = filter.dataset.filter; state.topicFilter = 'all'; state.frequencyRank = null; return render() }
  const topicFilter = event.target.closest('[data-topic-filter]'); if (topicFilter) { state.topicFilter = topicFilter.dataset.topicFilter; return render() }
  const reviewFilter = event.target.closest('[data-filter-review]'); if (reviewFilter) { state.filter = reviewFilter.dataset.filterReview; state.topicFilter = 'all'; state.page = 'review'; return render() }
  const actionElement = event.target.closest('[data-action]')
  const action = actionElement?.dataset.action
  if (!action) return
  if (action === 'frequency-subject') { state.frequencySubject = actionElement.dataset.subject; return render() }
  if (action === 'open-frequency-topic') { state.filter = actionElement.dataset.subject; state.topicFilter = 'all'; state.topOnly = false; state.frequencyRank = Number(actionElement.dataset.rank); state.page = 'year'; return render() }
  if (action === 'toggle-frequency-study') {
    const key = `${actionElement.dataset.subject}-${actionElement.dataset.rank}`
    state.studiedFrequencyKeys = state.studiedFrequencyKeys.includes(key) ? state.studiedFrequencyKeys.filter((item) => item !== key) : [...state.studiedFrequencyKeys, key]
    persist(); return render({ preserveScroll: true })
  }
  if (action === 'toggle-top-filter') { state.topOnly = !state.topOnly; state.frequencyRank = null; return render({ preserveScroll: true }) }
  if (action === 'clear-frequency-filter') { state.frequencyRank = null; state.topOnly = true; return render({ preserveScroll: true }) }
  if (action === 'resume') return openQuestion(state.currentId)
  if (action === 'open-wrong') { const first = questions.find((question) => isWrong(question.id)); return first ? openQuestion(first.id) : go('wrong') }
  if (action === 'favorite') { state.favorites = isFavorite(current().id) ? state.favorites.filter((id) => id !== current().id) : [...state.favorites, current().id]; persist(); return render() }
  if (['evidence', 'direction', 'explanation'].includes(action)) { state[action] = !state[action]; return render({ preserveScroll: true }) }
  go(action)
})
render()
