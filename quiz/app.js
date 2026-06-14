// ===== App config =====
const SECTION_META = {
  1: { title: '一、單選題', desc: '單選題，共 174 題，每 10 題為一份', color: 1 },
  2: { title: '二、多選題', desc: '多選題（可能有多個正確答案），共 17 題', color: 2 },
  3: { title: '三、題組題', desc: '閱讀資料後回答多個子題（單選），共 7 題', color: 3 },
  4: { title: '四、非選題', desc: '閱讀資料後作答問答題，共 1 題', color: 4 },
  5: { title: '五、混合題', desc: '閱讀資料後回答選擇＋問答題，共 11 題', color: 5 },
};

const app = document.getElementById('app');

function chunkByNumber(list, size) {
  const sorted = [...list].sort((a, b) => a.number - b.number);
  const chunks = [];
  for (let i = 0; i < sorted.length; i += size) {
    chunks.push(sorted.slice(i, i + size));
  }
  return chunks;
}

function buildSections() {
  const sections = {};
  for (const sec of Object.keys(SECTION_META)) {
    const list = QUESTIONS.filter(q => String(q.section) === String(sec));
    sections[sec] = chunkByNumber(list, 10);
  }
  return sections;
}

let SECTIONS = null;

function renderHome() {
  SECTIONS = buildSections();
  app.innerHTML = '';
  for (const secKey of Object.keys(SECTION_META)) {
    const meta = SECTION_META[secKey];
    const chunks = SECTIONS[secKey] || [];
    const block = document.createElement('div');
    block.className = 'section-block';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = meta.title;
    block.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'section-desc';
    desc.textContent = meta.desc;
    block.appendChild(desc);

    const grid = document.createElement('div');
    grid.className = 'chip-grid';

    chunks.forEach((chunk, idx) => {
      if (!chunk.length) return;
      const first = chunk[0].number;
      const last = chunk[chunk.length - 1].number;
      const chip = document.createElement('button');
      chip.className = 'chip';
      const label = document.createElement('span');
      label.textContent = first === last ? `第 ${first} 題` : `第 ${first}–${last} 題`;
      const sub = document.createElement('span');
      sub.className = 'chip-sub';
      sub.textContent = `${chunk.length} 題`;
      chip.appendChild(label);
      chip.appendChild(sub);
      chip.addEventListener('click', () => renderQuiz(secKey, idx));
      grid.appendChild(chip);
    });

    block.appendChild(grid);
    app.appendChild(block);
  }
}

// ===== Quiz rendering =====
function renderQuiz(secKey, chunkIdx) {
  const meta = SECTION_META[secKey];
  const chunks = SECTIONS[secKey];
  const chunk = chunks[chunkIdx];

  app.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'quiz-header';

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.textContent = '← 回首頁';
  backBtn.addEventListener('click', renderHome);
  header.appendChild(backBtn);

  const title = document.createElement('div');
  title.className = 'quiz-title';
  const first = chunk[0].number, last = chunk[chunk.length - 1].number;
  title.textContent = `${meta.title}　第 ${first}${first !== last ? '–' + last : ''} 題`;
  header.appendChild(title);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'reset-btn';
  resetBtn.textContent = '重新作答';
  resetBtn.addEventListener('click', () => renderQuiz(secKey, chunkIdx));
  header.appendChild(resetBtn);

  app.appendChild(header);

  // score board (for mc-checkable items)
  const scoreBoard = document.createElement('div');
  scoreBoard.className = 'score-board';
  scoreBoard.textContent = '完成作答後可查看本份成績';
  app.appendChild(scoreBoard);

  const state = { total: 0, correct: 0, checked: 0 };

  chunk.forEach(q => {
    const card = buildQuestionCard(q, state, scoreBoard);
    app.appendChild(card);
  });

  // bottom nav
  const bottomNav = document.createElement('div');
  bottomNav.className = 'bottom-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'nav-btn';
  prevBtn.textContent = '⬅ 上一份';
  prevBtn.disabled = chunkIdx <= 0;
  prevBtn.style.opacity = chunkIdx <= 0 ? '0.4' : '1';
  prevBtn.addEventListener('click', () => { if (chunkIdx > 0) renderQuiz(secKey, chunkIdx - 1); });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'nav-btn';
  nextBtn.textContent = '下一份 ➡';
  nextBtn.disabled = chunkIdx >= chunks.length - 1;
  nextBtn.style.opacity = chunkIdx >= chunks.length - 1 ? '0.4' : '1';
  nextBtn.addEventListener('click', () => { if (chunkIdx < chunks.length - 1) renderQuiz(secKey, chunkIdx + 1); });

  bottomNav.appendChild(prevBtn);
  bottomNav.appendChild(nextBtn);
  app.appendChild(bottomNav);

  updateScoreBoard(scoreBoard, state);
}

function updateScoreBoard(scoreBoard, state) {
  if (state.total === 0) {
    scoreBoard.textContent = '本份沒有選擇題，閱讀資料並寫下你的想法吧 ✏️';
    return;
  }
  scoreBoard.textContent = `📊 已對答案：${state.checked} / ${state.total}　｜　答對：${state.correct} 題`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Build a single question card. Handles types: single, multi, group, essay, mixed
function buildQuestionCard(q, state, scoreBoard) {
  const card = document.createElement('div');
  card.className = 'qcard';

  const stemEl = document.createElement('div');
  stemEl.className = 'qstem';
  const numSpan = `<span class="qnum">${q.number}.</span>`;

  if (q.passage) {
    const passageBox = document.createElement('div');
    passageBox.className = 'passage-box';
    passageBox.innerHTML = numSpan + ' ' + escapeHtml(q.passage).replace(/\n/g, '<br>');
    card.appendChild(passageBox);
  }

  if (q.type === 'single' || q.type === 'multi') {
    stemEl.innerHTML = numSpan + ' ' + escapeHtml(q.stem).replace(/\n/g, '<br>');
    card.appendChild(stemEl);
    buildMcBlock(card, q, q.options, q.answer, q.type === 'multi', state, scoreBoard, q.explanation);
  } else if (q.type === 'group') {
    if (!q.passage) {
      stemEl.innerHTML = numSpan + ' ' + escapeHtml(q.stem || '').replace(/\n/g, '<br>');
      card.appendChild(stemEl);
    }
    q.parts.forEach(part => {
      const sub = document.createElement('div');
      sub.className = 'subq-block';
      const subStem = document.createElement('div');
      subStem.className = 'qstem';
      subStem.innerHTML = `<span class="subq-label">${escapeHtml(part.label)}</span>` + escapeHtml(part.stem).replace(/\n/g, '<br>');
      sub.appendChild(subStem);
      buildMcBlock(sub, q, part.options, part.answer, false, state, scoreBoard, null);
      card.appendChild(sub);
    });
    if (q.explanation) appendExplanation(card, q.explanation);
  } else if (q.type === 'essay' || q.type === 'mixed') {
    if (!q.passage && q.stem) {
      stemEl.innerHTML = numSpan + ' ' + escapeHtml(q.stem).replace(/\n/g, '<br>');
      card.appendChild(stemEl);
    } else if (!card.querySelector('.passage-box') && q.number) {
      const tag = document.createElement('div');
      tag.innerHTML = numSpan;
      card.appendChild(tag);
    }
    (q.parts || []).forEach(part => {
      const sub = document.createElement('div');
      sub.className = 'subq-block';
      const subStem = document.createElement('div');
      subStem.className = 'qstem';
      subStem.innerHTML = `<span class="subq-label">${escapeHtml(part.label)}</span>` + escapeHtml(part.stem).replace(/\n/g, '<br>');
      sub.appendChild(subStem);

      if (part.kind === 'mc') {
        buildMcBlock(sub, q, part.options, part.answer, false, state, scoreBoard, null);
      } else if (part.kind === 'text') {
        buildTextBlock(sub, part);
      }
      card.appendChild(sub);
    });
    if (q.explanation) appendExplanation(card, q.explanation);
  }

  return card;
}

function buildTextBlock(container, part) {
  const textarea = document.createElement('textarea');
  textarea.className = 'answer-input';
  textarea.placeholder = '在這裡寫下你的答案...';
  container.appendChild(textarea);

  const actions = document.createElement('div');
  actions.className = 'qcard-actions';
  const revealBtn = document.createElement('button');
  revealBtn.className = 'reveal-btn';
  revealBtn.textContent = '📖 對照參考答案';
  actions.appendChild(revealBtn);
  container.appendChild(actions);

  const refBox = document.createElement('div');
  refBox.className = 'ref-answer';
  refBox.style.display = 'none';
  let html = `<strong>參考答案：</strong><br>${escapeHtml(part.referenceAnswer || '（無）').replace(/\n/g, '<br>')}`;
  if (part.rubric) {
    html += `<div class="rubric"><strong>評分標準：</strong><br>${escapeHtml(part.rubric).replace(/\n/g, '<br>')}</div>`;
  }
  refBox.innerHTML = html;
  container.appendChild(refBox);

  revealBtn.addEventListener('click', () => {
    const showing = refBox.style.display !== 'none';
    refBox.style.display = showing ? 'none' : 'block';
    revealBtn.textContent = showing ? '📖 對照參考答案' : '🙈 隱藏參考答案';
  });
}

// Build multiple-choice block (single or multi-select), with check button
function buildMcBlock(container, q, options, answer, isMulti, state, scoreBoard, explanation) {
  if (!options) return;
  const optWrap = document.createElement('div');
  optWrap.className = 'options';

  const selected = new Set();
  const keys = Object.keys(options);

  keys.forEach(key => {
    const opt = document.createElement('div');
    opt.className = 'option';
    opt.dataset.key = key;
    opt.innerHTML = `<span class="option-label">${key}</span><span>${escapeHtml(options[key])}</span>`;
    opt.addEventListener('click', () => {
      if (opt.classList.contains('locked')) return;
      if (isMulti) {
        if (selected.has(key)) {
          selected.delete(key);
          opt.classList.remove('selected');
        } else {
          selected.add(key);
          opt.classList.add('selected');
        }
      } else {
        optWrap.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
        selected.clear();
        selected.add(key);
        opt.classList.add('selected');
      }
    });
    optWrap.appendChild(opt);
  });

  container.appendChild(optWrap);

  const actions = document.createElement('div');
  actions.className = 'qcard-actions';
  const checkBtn = document.createElement('button');
  checkBtn.className = 'check-btn';
  checkBtn.textContent = '✅ 對答案';
  actions.appendChild(checkBtn);

  let explBtn = null;
  let explBox = null;
  if (explanation) {
    explBtn = document.createElement('button');
    explBtn.className = 'reveal-btn';
    explBtn.textContent = '💡 顯示解析';
    actions.appendChild(explBtn);
  }
  container.appendChild(actions);

  if (explanation) {
    explBox = document.createElement('div');
    explBox.className = 'explanation';
    explBox.innerHTML = `<strong>解析：</strong><br>${escapeHtml(explanation).replace(/\n/g, '<br>')}`;
    container.appendChild(explBox);
    explBtn.addEventListener('click', () => {
      explBox.classList.toggle('show');
      explBtn.textContent = explBox.classList.contains('show') ? '🙈 隱藏解析' : '💡 顯示解析';
    });
  }

  let counted = false;
  state.total += 1;

  checkBtn.addEventListener('click', () => {
    if (selected.size === 0) {
      alert('請先選擇答案！');
      return;
    }
    const correctSet = new Set(answer.split(''));
    let isCorrect = correctSet.size === selected.size && [...selected].every(k => correctSet.has(k));

    optWrap.querySelectorAll('.option').forEach(o => {
      o.classList.add('locked', 'disabled');
      const k = o.dataset.key;
      if (correctSet.has(k)) {
        o.classList.add('correct');
      } else if (selected.has(k)) {
        o.classList.add('wrong');
      }
    });

    const fb = document.createElement('span');
    fb.className = 'feedback-icon ' + (isCorrect ? 'correct' : 'wrong');
    fb.textContent = isCorrect ? '✔ 答對了！' : `✘ 答錯了，正確答案：${answer}`;
    checkBtn.replaceWith(fb);

    if (!counted) {
      counted = true;
      state.checked += 1;
      if (isCorrect) state.correct += 1;
      updateScoreBoard(scoreBoard, state);
    }
  });
}

function appendExplanation(card, explanation) {
  const actions = document.createElement('div');
  actions.className = 'qcard-actions';
  const explBtn = document.createElement('button');
  explBtn.className = 'reveal-btn';
  explBtn.textContent = '💡 顯示解析';
  actions.appendChild(explBtn);
  card.appendChild(actions);

  const explBox = document.createElement('div');
  explBox.className = 'explanation';
  explBox.innerHTML = `<strong>解析：</strong><br>${escapeHtml(explanation).replace(/\n/g, '<br>')}`;
  card.appendChild(explBox);

  explBtn.addEventListener('click', () => {
    explBox.classList.toggle('show');
    explBtn.textContent = explBox.classList.contains('show') ? '🙈 隱藏解析' : '💡 顯示解析';
  });
}

// init
renderHome();
