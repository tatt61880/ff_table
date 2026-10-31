(function () {
  'use strict';

  const STORAGE_KEY = 'ff-table-settings-v1';
  const state = {
    base: 16,
    includeZero: false,
    practice: false,
    row: 1,
    column: 1,
    revealed: false,
  };
  const elems = {};
  const cells = [];
  const headings = [];

  window.addEventListener('DOMContentLoaded', init, false);

  function init() {
    elems.table = document.getElementById('multiplication-table');
    elems.equation = document.getElementById('equation');
    elems.equationLabel = document.getElementById('equation-label');
    elems.comparison = document.getElementById('comparison');
    elems.reveal = document.getElementById('reveal-answer');
    elems.zero = document.getElementById('include-zero');
    elems.practice = document.getElementById('practice-mode');
    elems.bases = document.querySelectorAll('input[name="base"]');

    restoreSettings();
    elems.zero.checked = state.includeZero;
    elems.practice.checked = state.practice;
    elems.bases.forEach((input) => {
      input.checked = Number(input.value) === state.base;
      input.addEventListener('change', () => {
        state.base = Number(input.value);
        settingsChanged();
      });
    });
    elems.zero.addEventListener('change', () => {
      state.includeZero = elems.zero.checked;
      const minimum = state.includeZero ? 0 : 1;
      const row = Math.max(minimum, state.row);
      const column = Math.max(minimum, state.column);
      if (row !== state.row || column !== state.column) state.revealed = false;
      state.row = row;
      state.column = column;
      settingsChanged();
    });
    elems.practice.addEventListener('change', () => {
      state.practice = elems.practice.checked;
      state.revealed = false;
      settingsChanged();
    });
    elems.reveal.addEventListener('click', toggleAnswer);
    elems.table.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-row]');
      if (button) selectCell(Number(button.dataset.row), Number(button.dataset.column));
    });
    elems.table.addEventListener('focusin', (event) => {
      const button = event.target.closest('button[data-row]');
      if (button) selectCell(Number(button.dataset.row), Number(button.dataset.column));
    });
    elems.table.addEventListener('keydown', onKeyDown);
    elems.table.addEventListener('pointerover', (event) => {
      const button = event.target.closest('button[data-row]');
      if (!state.practice && event.pointerType === 'mouse' && button) {
        highlight(Number(button.dataset.row), Number(button.dataset.column));
      }
    });
    elems.table.addEventListener('pointerleave', () => highlight(state.row, state.column));
    renderTable();
    document.getElementById('table-app').hidden = false;
  }

  function restoreSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || typeof saved !== 'object') return;
      if (saved.base === 10 || saved.base === 16) state.base = saved.base;
      if (typeof saved.includeZero === 'boolean') state.includeZero = saved.includeZero;
      if (typeof saved.practice === 'boolean') state.practice = saved.practice;
    } catch {
      // 保存データが壊れている場合や、保存領域を使えない場合も表を使えるようにする。
    }
  }

  function settingsChanged() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        base: state.base,
        includeZero: state.includeZero,
        practice: state.practice,
      }));
    } catch {
      // 保存できなくても、このページ内での設定変更は反映する。
    }
    renderTable();
  }

  function format(value, base = state.base) {
    return value.toString(base).toUpperCase();
  }

  function equation(row, column, base, showAnswer) {
    return `${format(row, base)} × ${format(column, base)} = ${showAnswer ? format(row * column, base) : '?'}`;
  }

  function renderTable() {
    const first = state.includeZero ? 0 : 1;
    const fragment = document.createDocumentFragment();
    const caption = document.createElement('caption');
    caption.className = 'visually-hidden';
    caption.textContent = `${state.base}進数の掛け算表`;
    fragment.appendChild(caption);
    cells.length = 0;
    headings.length = 0;

    const head = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const corner = document.createElement('th');
    corner.textContent = '×';
    corner.setAttribute('scope', 'col');
    corner.setAttribute('aria-label', '行かける列');
    corner.className = 'corner';
    headerRow.appendChild(corner);
    for (let column = first; column <= 15; column++) {
      headerRow.appendChild(createHeading(column, 'col'));
    }
    head.appendChild(headerRow);
    fragment.appendChild(head);

    const body = document.createElement('tbody');
    for (let row = first; row <= 15; row++) {
      const tr = document.createElement('tr');
      tr.appendChild(createHeading(row, 'row'));
      for (let column = first; column <= 15; column++) {
        const cell = document.createElement('td');
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.row = row;
        button.dataset.column = column;
        button.className = 'cell-button';
        button.setAttribute('aria-describedby', 'keyboard-help');
        button.tabIndex = -1;
        cell.classList.toggle('is-square', row === column);
        cell.classList.toggle('group-end-column', column % 5 === 0 && column !== 15);
        cell.classList.toggle('group-end-row', row % 5 === 0 && row !== 15);
        cell.appendChild(button);
        tr.appendChild(cell);
        cells.push({ row, column, cell, button });
      }
      body.appendChild(tr);
    }
    fragment.appendChild(body);
    elems.table.replaceChildren(fragment);
    elems.table.classList.toggle('practice-mode', state.practice);
    document.getElementById('table-description').textContent = `${format(first)}〜${format(15)}の掛け算`;
    document.getElementById('practice-help').hidden = !state.practice;
    elems.reveal.hidden = !state.practice;
    updateCells();
    highlight(state.row, state.column);
  }

  function createHeading(value, scope) {
    const th = document.createElement('th');
    th.scope = scope;
    th.textContent = format(value);
    const axis = scope === 'row' ? 'row' : 'column';
    th.classList.toggle(`group-end-${axis}`, value % 5 === 0 && value !== 15);
    headings.push({ th, value, axis });
    return th;
  }

  function updateCells() {
    for (const { row, column, button, cell } of cells) {
      const selected = row === state.row && column === state.column;
      const visible = !state.practice || (selected && state.revealed);
      button.textContent = visible ? format(row * column) : '?';
      button.setAttribute('aria-label', `${state.base}進数：${equation(row, column, state.base, visible)}`);
      button.setAttribute('aria-pressed', String(selected));
      button.tabIndex = selected ? 0 : -1;
      cell.classList.toggle('is-selected', selected);
    }
    elems.reveal.textContent = state.revealed ? '答えを隠す' : '答えを見る';
    elems.reveal.setAttribute('aria-expanded', String(state.revealed));
  }

  function highlight(row, column) {
    for (const item of cells) {
      item.cell.classList.toggle('is-crosshair', item.row === row || item.column === column);
      item.cell.classList.toggle('is-current', item.row === row && item.column === column);
    }
    for (const { th, value, axis } of headings) {
      th.classList.toggle('is-highlighted', value === (axis === 'row' ? row : column));
    }
    const visible = !state.practice || state.revealed;
    elems.equationLabel.textContent = `${state.base}進数${state.practice ? ' · 暗記モード' : ''}`;
    elems.equation.textContent = equation(row, column, state.base, visible);
    const alternateBase = state.base === 16 ? 10 : 16;
    elems.comparison.textContent = visible
      ? `${alternateBase}進数：${equation(row, column, alternateBase, true)}`
      : '答えを考えてから、確認してみましょう。';
  }

  function selectCell(row, column) {
    if (row !== state.row || column !== state.column) state.revealed = false;
    state.row = row;
    state.column = column;
    updateCells();
    highlight(row, column);
  }

  function toggleAnswer() {
    if (!state.practice) return;
    state.revealed = !state.revealed;
    updateCells();
    highlight(state.row, state.column);
  }

  function onKeyDown(event) {
    const button = event.target.closest('button[data-row]');
    if (!button || event.altKey || event.metaKey) return;
    let row = Number(button.dataset.row);
    let column = Number(button.dataset.column);
    const first = state.includeZero ? 0 : 1;
    switch (event.key) {
      case 'ArrowUp': row--; break;
      case 'ArrowDown': row++; break;
      case 'ArrowLeft': column--; break;
      case 'ArrowRight': column++; break;
      case 'Home':
        column = first;
        if (event.ctrlKey) row = first;
        break;
      case 'End':
        column = 15;
        if (event.ctrlKey) row = 15;
        break;
      case 'Enter':
      case ' ':
        if (!state.practice) return;
        event.preventDefault();
        if (!event.repeat) toggleAnswer();
        return;
      default: return;
    }
    event.preventDefault();
    row = Math.max(first, Math.min(15, row));
    column = Math.max(first, Math.min(15, column));
    selectCell(row, column);
    const target = cells.find((item) => item.row === row && item.column === column).button;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
})();
