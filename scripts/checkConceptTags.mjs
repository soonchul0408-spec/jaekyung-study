import { questions } from '../src/data/examSets.js'

const errors = []
const sourceCounts = new Map()
for (const question of questions) {
  const tags = question.conceptTags || []
  if (tags.length < 2) errors.push(`${question.id}: 태그가 2개 미만입니다.`)
  if (new Set(tags.map((tag) => tag.label)).size !== tags.length) errors.push(`${question.id}: 중복 태그가 있습니다.`)
  if (!tags.some((tag) => tag.source === '용어 사전' || tag.source === '문항 표현')) errors.push(`${question.id}: 세부 개념 태그가 없습니다.`)
  for (const tag of tags) sourceCounts.set(tag.source, (sourceCounts.get(tag.source) || 0) + 1)
}
if (errors.length) throw new Error(`개념 태그 검증 실패\n${errors.join('\n')}`)
console.log(`개념 태그 검증 통과: ${questions.length}문항, 총 ${questions.reduce((sum, question) => sum + question.conceptTags.length, 0)}개 태그`)
console.log(`태그 출처: ${[...sourceCounts.entries()].map(([source, count]) => `${source} ${count}`).join(' / ')}`)
