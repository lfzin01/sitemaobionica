// ============================================================
// FONTSIZE.JS — Controle global de tamanho de fonte
// Compartilhado entre index.html, perfil.html, simulador.html...
// ============================================================
(function () {
  const FONT_SIZES = [14, 16, 18, 20, 22]; // px (5 níveis)
  const DEFAULT_INDEX = 1;                 // 16px (padrão)
  const STORAGE_KEY = 'tcc_font_size_index';

  function getIndex() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (!isNaN(idx) && idx >= 0 && idx < FONT_SIZES.length) return idx;
    }
    return DEFAULT_INDEX;
  }

  function updateUI(index) {
    const size = FONT_SIZES[index];

    // Labels de valor (ex: "16px")
    document.querySelectorAll('[data-font-size-label]').forEach((el) => {
      el.textContent = size + 'px';
    });

    // Botões de diminuir
    document.querySelectorAll('[data-font-decrease]').forEach((btn) => {
      btn.disabled = index <= 0;
    });

    // Botões de aumentar
    document.querySelectorAll('[data-font-increase]').forEach((btn) => {
      btn.disabled = index >= FONT_SIZES.length - 1;
    });
  }

  function apply(index) {
    document.documentElement.style.fontSize = FONT_SIZES[index] + 'px';
    document.documentElement.setAttribute('data-font-size', String(index));
    updateUI(index);
  }

  function set(index) {
    if (index < 0 || index >= FONT_SIZES.length) return;
    localStorage.setItem(STORAGE_KEY, index);
    apply(index);
  }

  function increase() { set(getIndex() + 1); }
  function decrease() { set(getIndex() - 1); }

  function bind() {
    document.querySelectorAll('[data-font-increase]').forEach((btn) => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        increase();
      });
    });

    document.querySelectorAll('[data-font-decrease]').forEach((btn) => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        decrease();
      });
    });

    // Sincroniza estado visual dos botões
    updateUI(getIndex());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  // API global (opcional, para debug ou integração)
  window.fontSize = { increase, decrease, set, getIndex, apply };
})();