import './styles.css';
import { questions, stages, getResult, sources } from './content.js';
import { config, bookingHref } from './config.js';
import { icon } from './icons.js';

const $ = (selector) => document.querySelector(selector);
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const external = (url) => /^https?:/.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
const link = (url, label, className = '') => `<a class="${className}" href="${escape(url)}"${external(url)}>${escape(label)}</a>`;
let answers = Array(questions.length).fill(null);
let questionIndex = 0;
let toastTimer;

const avatar = () => `<span class="avatar">${icon('leaf')}${config.doctor.avatar ? `<img src="${escape(config.doctor.avatar)}" alt="${escape(config.doctor.name || 'Фото специалиста')}" width="56" height="56" />` : ''}</span>`;
const doctorName = config.doctor.name || config.brandName;

function contactLinks() {
  return [
    config.phoneHref && link(config.phoneHref, config.phone),
    config.telegram && link(config.telegram, config.telegramLabel),
    config.whatsapp && link(config.whatsapp, 'WhatsApp'),
    config.emailHref && link(config.emailHref, config.email),
  ].filter(Boolean).join('');
}

function author() {
  return `<aside class="author" aria-label="О специалисте">
    ${avatar()}<div class="author-info"><strong>${escape(doctorName)}</strong>
    <p>${escape(config.doctor.specialty || 'Цикл, самочувствие и менопауза')}</p>
    ${config.doctor.description ? `<p>${escape(config.doctor.description)}</p>` : ''}
    ${contactLinks() ? `<div class="contact-links">${contactLinks()}</div>` : ''}
    ${config.address ? `<p class="address">${escape(config.address)}</p>` : ''}</div>
  </aside>`;
}

function chrome() {
  $('#site-header').innerHTML = `<a class="brand" href="#" aria-label="${escape(doctorName)} — на главную"><span class="brand-mark">${icon('leaf')}</span><span>${escape(doctorName)}</span></a>
    ${bookingHref ? link(bookingHref, 'Связаться', 'header-link') : '<span class="header-note">5 вопросов · 2 минуты</span>'}`;
  $('#site-footer').innerHTML = `<span>Информация для заботы о себе.<br class="mobile-break" /> Не заменяет консультацию врача.</span><a href="#privacy">О ваших данных</a>`;
  document.title = `Гормональные изменения — ${doctorName}`;
  $('meta[property="og:title"]').content = `Тест о гормональных изменениях | ${doctorName}`;
  if (config.siteUrl) {
    const canonical = document.createElement('link');
    canonical.rel = 'canonical'; canonical.href = config.siteUrl;
    document.head.append(canonical);
  }
}

function stageRows() {
  return stages.map((stage) => `<a class="stage-row" href="#stage/${stage.key}">
    <span class="stage-number">${stage.number}</span><span class="stage-copy"><strong>${escape(stage.title)}</strong><span>${escape(stage.summary)}</span></span>${icon('arrow')}
  </a>`).join('');
}

function home() {
  const started = answers.some(Boolean);
  return `<div class="home-screen">
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-art" aria-hidden="true"></div>
      <div class="hero-content">
        <div class="eyebrow hero-eyebrow"><span class="eyebrow-line"></span> ЖЕНСКОЕ ЗДОРОВЬЕ</div>
        <h1 id="page-title" tabindex="-1">На каком этапе <br />гормональных <br /><em>изменений вы сейчас?</em></h1>
        <p class="hero-description">Пять вопросов о цикле и самочувствии,<br class="desktop-break" /> чтобы лучше понять, что происходит с вами.</p>
        <div class="symptoms" aria-label="Возможные изменения"><span>${icon('moon')} Сон</span><span>${icon('wave')} Настроение</span><span>${icon('drop')} Ощущения в теле</span></div>
        <p class="hero-reassurance">Вы можете чувствовать себя иначе. <br />Давайте разберёмся, на что обратить внимание.</p>
        <div class="hero-action"><button class="button button-cream" data-action="start">${started ? 'Продолжить тест' : 'Пройти тест'}${icon('arrow')}</button><span class="time-note">${icon('clock')} Около 2 минут</span></div>
        <p class="privacy-note">${icon('lock')} Без регистрации. Результат сразу.</p>
        <a class="hero-secondary" href="#stages">Я уже знаю свой этап${icon('arrow')}</a>
      </div>
    </section>

    <section class="intro-section" aria-labelledby="intro-title">
      <div class="section-kicker">НЕМНОГО КОНТЕКСТА</div>
      <h2 id="intro-title">У изменений нет <br /><em>единого расписания</em></h2>
      <p>Возраст — только один из ориентиров. Не менее важно, как меняется цикл и что вы чувствуете. У каждой женщины этот период проходит по-своему.</p>
      <div class="stage-list">${stageRows()}</div>
      <div class="soft-note">${icon('info')}<p>Тест поможет подготовиться к разговору с врачом. Он не определяет уровень гормонов и не ставит диагноз.</p></div>
    </section>
    ${author()}
  </div>`;
}

function quiz(index) {
  questionIndex = index;
  const q = questions[index];
  return `<section class="quiz-screen content-screen" aria-labelledby="page-title">
    <div class="quiz-top"><a class="text-back" href="${index ? `#test/${index}` : '#'}">${icon('back')} ${index ? 'Назад' : 'На главную'}</a><span class="quiet">Тест о вашем самочувствии</span></div>
    <div class="progress-label"><span>Вопрос <strong>${index + 1}</strong> из ${questions.length}</span><span>${['Возраст', 'Цикл', 'Сон и настроение', 'Ощущения в теле', 'Анализы'][index]}</span></div>
    <div class="progress" role="progressbar" aria-label="Прогресс теста" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${index + 1}" aria-valuetext="Вопрос ${index + 1} из 5">${questions.map((_, i) => `<span class="${i <= index ? 'filled' : ''}"></span>`).join('')}</div>
    <form id="quiz-form">
      <h1 id="page-title" tabindex="-1">${escape(q.title)}</h1>
      <p id="question-hint" class="question-hint">${escape(q.hint)}</p>
      <fieldset class="options" aria-describedby="question-hint"><legend class="sr-only">${escape(q.title)}</legend>
      ${q.options.map((option) => `<label class="option"><input type="radio" name="answer" value="${option.id}" ${answers[index] === option.id ? 'checked' : ''} required /><span class="radio-mark">${icon('check')}</span><span class="option-copy"><strong>${escape(option.label)}</strong>${option.description ? `<span>${escape(option.description)}</span>` : ''}</span></label>`).join('')}
      </fieldset>
      <div class="quiz-actions"><span class="selection-hint">${answers[index] ? 'Ответ можно изменить' : 'Выберите один ответ'}</span><button type="submit" class="button button-teal" ${answers[index] ? '' : 'disabled'}>${index === questions.length - 1 ? 'Посмотреть результат' : 'Продолжить'}${icon('arrow')}</button></div>
    </form>
    <p class="quiz-privacy">${icon('lock')} Ответы не отправляются на сервер</p>
  </section>`;
}

function stepsMarkup(steps) {
  return `<ol class="steps">${steps.map((step, i) => `<li><span class="step-index">0${i + 1}</span><div><h3>${escape(step.title)}</h3><p>${escape(step.text)}</p></div></li>`).join('')}</ol>`;
}

function sourceDetails() {
  return `<details class="disclosure sources"><summary>На чём основана информация${icon('plus')}</summary><div class="disclosure-body"><p>Медицинские ориентиры: рекомендации NICE и материалы NHS для пациентов. Этот опрос — информационный инструмент, а не клиническая шкала.</p><ul>${sources.map((source) => `<li>${link(source.url, source.label)}</li>`).join('')}</ul></div></details>`;
}

function consultation(fromQuiz) {
  return `<aside class="consultation"><span class="section-kicker">СЛЕДУЮЩИЙ ШАГ</span><h2>${bookingHref ? 'Обсудим то, что вас беспокоит' : 'Подготовьтесь к разговору с врачом'}</h2><p>${bookingHref ? 'На консультации можно разобраться в причинах изменений и подобрать помощь с учётом вашего самочувствия.' : 'Вспомните, когда появились изменения, запишите даты менструаций и названия препаратов, которые принимаете.'}</p>
    ${bookingHref ? link(bookingHref, 'Записаться на консультацию', 'button button-teal') : fromQuiz ? `<button class="button button-teal" data-action="save">${icon('download')} Сохранить результат</button>` : ''}
  </aside>`;
}

function result() {
  const result = getResult(answers);
  const stage = stages.find((item) => item.key === result.key);
  return `<section class="result-screen" aria-labelledby="page-title">
    <div class="result-intro"><div class="result-top"><span class="eyebrow">ВАШ РЕЗУЛЬТАТ</span><span class="completion">${icon('check')} 5 из 5</span></div>
    <span class="result-symbol">${icon(result.key === 'uncertain' ? 'info' : 'leaf')}</span>
    <h1 id="page-title" tabindex="-1">${escape(result.title)}</h1><p class="result-summary">${escape(result.summary)}</p><span class="result-caption">Ориентир по вашим ответам</span></div>
    <div class="result-body"><section class="result-section"><h2>На что указывают ответы</h2><ul class="reasons">${result.reasons.map((reason) => `<li>${escape(reason)}</li>`).join('')}</ul></section>
    <section class="result-section"><h2>Что можно сделать сейчас</h2>${stepsMarkup(result.steps)}</section>
    <div class="soft-note">${icon('info')}<p>${escape(result.note)}</p></div>
    <details class="disclosure"><summary>Ваши ответы${icon('plus')}</summary><div class="disclosure-body"><dl class="answer-summary">${questions.map((q, i) => `<div><dt>${escape(q.title)}</dt><dd>${escape(q.options.find((o) => o.id === answers[i]).label)} <a href="#test/${i + 1}" aria-label="Изменить ответ: ${escape(q.title)}">Изменить</a></dd></div>`).join('')}</dl></div></details>
    ${stage ? `<a class="related-stage" href="#stage/${stage.key}"><span>Подробнее об этом периоде</span>${icon('arrow')}</a>` : '<a class="related-stage" href="#stages"><span>Почитать об этапах</span>' + icon('arrow') + '</a>'}
    ${consultation(true)}
    <div class="result-tools">${bookingHref ? `<button class="text-button" data-action="save">${icon('download')} Сохранить результат</button>` : ''}<button class="text-button" data-action="share">${icon('share')} Поделиться тестом</button></div>
    <div id="share-fallback" hidden></div>
    ${sourceDetails()}<div class="end-navigation"><button class="text-button" data-action="restart">Пройти заново</button><a href="#">На главную</a></div></div>
    ${author()}
  </section>`;
}

function stagePicker() {
  return `<section class="content-screen stages-screen"><a class="text-back" href="#">${icon('back')} На главную</a><div class="section-kicker">ТРИ ПЕРИОДА</div><h1 id="page-title" tabindex="-1">Лучше понимать<br /><em>своё тело</em></h1><p class="page-lead">Выберите период, о котором хотите узнать больше. Если пока не уверены, начните с теста.</p><div class="stage-list">${stageRows()}</div><button class="button button-teal" data-action="start">${answers.some(Boolean) ? 'Продолжить тест' : 'Пройти тест'}${icon('arrow')}</button></section>${author()}`;
}

function stageDetail(key) {
  const stage = stages.find((item) => item.key === key);
  return `<article class="content-screen stage-detail"><a class="text-back" href="#stages">${icon('back')} Все периоды</a><div class="section-kicker">${stage.number} / ${escape(stage.label)}</div><h1 id="page-title" tabindex="-1">${escape(stage.title)}</h1><p class="page-lead">${escape(stage.summary)}</p><section class="result-section"><h2>Что происходит</h2>${stage.paragraphs.map((paragraph) => `<p>${escape(paragraph)}</p>`).join('')}</section><section class="result-section"><h2>На что обратить внимание</h2>${stepsMarkup(stage.steps)}</section><div class="soft-note">${icon('info')}<p>${escape(stage.note)}</p></div>${consultation(false)}${sourceDetails()}${answers.every(Boolean) ? '<a class="related-stage" href="#result">Вернуться к результату' + icon('arrow') + '</a>' : '<button class="text-button" data-action="start">Пройти тест' + icon('arrow') + '</button>'}</article>${author()}`;
}

function privacy() {
  return `<article class="content-screen privacy-screen"><a class="text-back" href="#">${icon('back')} На главную</a><div class="section-kicker">КОНФИДЕНЦИАЛЬНОСТЬ</div><h1 id="page-title" tabindex="-1">О ваших данных</h1><h2>Ответы остаются у вас</h2><p>Тест работает в браузере. Ответы не отправляются на сервер, не записываются в cookie или хранилище браузера. После обновления или закрытия страницы они исчезнут.</p><h2>Сохранение и отправка</h2><p>Кнопка «Сохранить результат» скачивает текстовый файл с результатом и ответами на ваше устройство. При нажатии «Поделиться тестом» передаётся только ссылка на тест, без ваших ответов и результата.</p><h2>Переход по контактам</h2><p>При переходе в мессенджер, почту или сервис записи действуют правила выбранного сервиса. Ответы из теста в эти ссылки не добавляются.</p><h2>Загрузка сайта</h2><p>На сайте нет встроенной аналитики и рекламных трекеров. Сервер размещения может вести технические журналы запросов, например записывать IP-адрес и время посещения. Ответов на вопросы в этих запросах нет.</p></article>`;
}

function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function render() {
  clearTimeout(toastTimer);
  $('#announcement').classList.remove('visible');
  $('#announcement').textContent = '';
  const route = location.hash.slice(1);
  let content;
  if (route.startsWith('test/')) {
    const requested = Number(route.split('/')[1]) - 1;
    const firstMissing = answers.findIndex((a) => !a);
    const maxAllowed = firstMissing === -1 ? questions.length - 1 : firstMissing;
    const index = Number.isInteger(requested) && requested >= 0 ? Math.min(requested, maxAllowed) : 0;
    if (route !== `test/${index + 1}`) history.replaceState(null, '', `#test/${index + 1}`);
    content = quiz(index);
  } else if (route === 'result' && answers.every(Boolean)) content = result();
  else if (route === 'stages') content = stagePicker();
  else if (route.startsWith('stage/') && stages.some((s) => s.key === route.split('/')[1])) content = stageDetail(route.split('/')[1]);
  else if (route === 'privacy') content = privacy();
  else {
    if (route && route !== 'main') history.replaceState(null, '', location.pathname + location.search);
    content = home();
  }
  $('#main').innerHTML = content;
  document.querySelectorAll('.avatar img').forEach((img) => img.addEventListener('error', () => img.remove(), { once: true }));
  window.scrollTo({ top: 0, behavior: 'instant' });
  $('#page-title')?.focus({ preventScroll: true });
}

function notify(message) {
  clearTimeout(toastTimer);
  $('#announcement').textContent = message;
  $('#announcement').classList.add('visible');
  toastTimer = setTimeout(() => $('#announcement').classList.remove('visible'), 4500);
}

function saveResult() {
  if (!answers.every(Boolean)) return;
  const result = getResult(answers);
  const text = [config.brandName, result.title, result.summary, '', 'НА ЧТО УКАЗЫВАЮТ ОТВЕТЫ', ...result.reasons.map((s) => `• ${s}`), '', 'ЧТО МОЖНО СДЕЛАТЬ', ...result.steps.map((s, i) => `${i + 1}. ${s.title}\n${s.text}`), '', 'ВАШИ ОТВЕТЫ', ...questions.map((q, i) => `${q.title}\n${q.options.find((o) => o.id === answers[i]).label}`), '', result.note, '', ...sources.map((s) => `${s.label}: ${s.url}`), config.doctor.name, config.doctor.specialty, config.phoneHref ? config.phone : '', config.telegram, config.whatsapp, config.emailHref ? config.email : '', config.bookingUrl, config.address].join('\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'rezultat-testa.txt';
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  notify('Файл с результатом подготовлен для сохранения');
}

async function shareQuiz() {
  const url = new URL(config.siteUrl || location.href);
  url.hash = ''; url.search = '';
  try {
    if (navigator.share) {
      await navigator.share({ title: `Тест о женском здоровье | ${doctorName}`, text: 'Пять вопросов о цикле и самочувствии.', url: url.href });
      return;
    }
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(url.href);
    notify('Ссылка на тест скопирована');
  } catch (error) {
    if (error.name === 'AbortError') return;
    const fallback = $('#share-fallback');
    if (!fallback) return;
    fallback.hidden = false;
    fallback.innerHTML = `<label for="share-url">Скопируйте ссылку на тест</label><input id="share-url" type="url" readonly value="${escape(url.href)}" />`;
    $('#share-url').focus(); $('#share-url').select();
  }
}

document.addEventListener('change', (event) => {
  if (!event.target.matches('input[name="answer"]')) return;
  const value = event.target.value;
  if (!questions[questionIndex].options.some((o) => o.id === value)) return;
  answers[questionIndex] = value;
  $('#quiz-form button[type="submit"]').disabled = false;
  $('.selection-hint').textContent = 'Ответ можно изменить';
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'quiz-form') return;
  event.preventDefault();
  if (!answers[questionIndex]) return;
  navigate(questionIndex === questions.length - 1 ? '#result' : `#test/${questionIndex + 2}`);
});

document.addEventListener('click', (event) => {
  if (event.target.closest('.skip-link')) {
    event.preventDefault();
    $('#main').focus();
    $('#main').scrollIntoView({ block: 'start' });
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'start') {
    const firstMissing = answers.findIndex((a) => !a);
    navigate(firstMissing === -1 ? '#result' : `#test/${firstMissing + 1}`);
  }
  if (action === 'restart') { answers = Array(questions.length).fill(null); navigate('#test/1'); }
  if (action === 'save') saveResult();
  if (action === 'share') shareQuiz();
});

window.addEventListener('hashchange', render);
chrome();
render();
