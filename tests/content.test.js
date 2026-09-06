import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, stages, getResult } from '../src/content.js';

function* combinations(index = 0, answers = []) {
  if (index === questions.length) { yield answers; return; }
  for (const option of questions[index].options) yield* combinations(index + 1, [...answers, option.id]);
}

test('all reachable answers return complete guidance and respect stage boundaries', () => {
  let count = 0;
  for (const answers of combinations()) {
    const result = getResult(answers);
    const [age, cycle, sleep, body] = answers;
    assert.ok(['reproductive', 'perimenopause', 'postmenopause', 'uncertain'].includes(result.key));
    for (const field of ['title', 'summary', 'note']) assert.ok(result[field].length > 20);
    assert.equal(result.reasons.length, 3);
    assert.equal(result.steps.length, 3);
    for (const step of result.steps) assert.ok(step.title && step.text);
    assert.equal(result.key === 'postmenopause', age === '45plus' && cycle === 'absent12');
    if (cycle === 'context' || (age !== '45plus' && cycle !== 'regular')) assert.equal(result.key, 'uncertain');
    if (cycle === 'regular' && (sleep === 'sleep_strong' || body === 'body_strong')) assert.equal(result.key, 'uncertain');
    if (cycle === 'regular') assert.notEqual(result.key, 'postmenopause');
    count++;
  }
  assert.equal(count, 1536);
});

test('hormone analysis answers never determine the stage', () => {
  for (const answers of combinations()) {
    const control = getResult([...answers.slice(0, 4), 'labs_no']);
    assert.equal(getResult(answers).key, control.key);
  }
});

test('typical cases produce conservative, distinct results', () => {
  const result = (age, cycle) => getResult([age, cycle, 'sleep_ok', 'body_none', 'labs_no']);
  assert.equal(result('35to39', 'regular').key, 'reproductive');
  assert.equal(result('45plus', 'changed').key, 'perimenopause');
  assert.equal(result('45plus', 'absent3to11').key, 'perimenopause');
  assert.equal(result('40to44', 'absent12').key, 'uncertain');
  assert.equal(result('45plus', 'absent12').key, 'postmenopause');
});

test('symptoms and labs personalize advice without corrupting shared stage content', () => {
  const before = JSON.stringify(stages);
  const neutral = getResult(['45plus', 'changed', 'sleep_ok', 'body_none', 'labs_no']);
  const strong = getResult(['45plus', 'changed', 'sleep_strong', 'body_strong', 'labs_no']);
  const labs = getResult(['45plus', 'changed', 'sleep_ok', 'body_none', 'labs_unsure']);
  assert.notEqual(strong.reasons[1], neutral.reasons[1]);
  assert.notEqual(strong.steps[1].text, neutral.steps[1].text);
  assert.notEqual(labs.reasons[2], neutral.reasons[2]);
  assert.match(labs.steps[1].text, /анализы/);
  neutral.steps[0].title = 'External mutation';
  assert.equal(JSON.stringify(stages), before);
});

test('invalid, incomplete, reordered and sparse answers are rejected', () => {
  const valid = ['45plus', 'regular', 'sleep_ok', 'body_none', 'labs_no'];
  const invalid = [undefined, null, {}, '', [], valid.slice(0, 4), [...valid, 'extra'],
    ['regular', '45plus', 'sleep_ok', 'body_none', 'labs_no'],
    ['45plus', 'regular', 'sleep_ok', 'body_none', 'made-up'], new Array(5)];
  for (const answers of invalid) assert.throws(() => getResult(answers), TypeError);
});
