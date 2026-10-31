/**
 * Секция «Кейсы»:
 * - Анимация появления карточек при скролле
 * - Открытие модалки с деталями кейса
 * - Закрытие по Escape, оверлею, крестику
 */

import { CASES } from '../consts';

// Тип кейса (можно импортировать из consts, но для простоты — inline)
type Case = (typeof CASES)[number];

export function initCases() {
  const section = document.querySelector<HTMLElement>('[data-cases]');
  const modal = document.querySelector<HTMLElement>('[data-case-modal]');
  const modalBody = document.querySelector<HTMLElement>('[data-case-modal-body]');

  if (!section || !modal || !modalBody) return;

  const openButtons = section.querySelectorAll<HTMLButtonElement>('[data-case-open]');
  const closeButtons = modal.querySelectorAll<HTMLElement>('[data-case-close]');

  // === Анимация появления ===
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    section.classList.add('is-visible');
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            section.classList.add('is-visible');
            observer.disconnect();
          }
        });
      },
      { rootMargin: '0px 0px -15% 0px', threshold: 0.15 }
    );

    observer.observe(section);
  }

  // === Рендер контента модалки ===
  function renderCase(c: Case): string {
    const typeLine = c.type ? `${c.type} · ` : '';

    return `
      <h2 class="case-modal__title" id="case-modal-title">${escapeHtml(c.title)}</h2>

      <p class="case-modal__meta">
        ${escapeHtml(c.stack)} · ${escapeHtml(typeLine)}${escapeHtml(c.year)}
      </p>

       <div class="case-modal__block">
        <p class="case-modal__block-label">Задача</p>
        <p class="case-modal__block-text">${escapeHtml(c.task)}</p>
      </div>

      <div class="case-modal__block">
        <p class="case-modal__block-label">Решение</p>
        <p class="case-modal__block-text">${escapeHtml(c.solution)}</p>
      </div>

      <div class="case-modal__block">
        <p class="case-modal__block-label">Результат</p>
        <p class="case-modal__block-text">${escapeHtml(c.result)}</p>
      </div>


      <div class="case-modal__cover">
        <img
          src="${escapeHtml(c.cover)}"
          alt="${escapeHtml(c.coverAlt)}"
          width="1200"
          height="800"
          loading="lazy"
        />
      </div>

     
     
    `;
  }

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // === Открытие / закрытие ===
  function openModal(caseId: string) {
    const c = CASES.find((item) => item.id === caseId);
    if (!c) return;

    modalBody!.innerHTML = renderCase(c as Case);
    modal!.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    // Фокус на крестик — для доступности
    setTimeout(() => {
      modal!.querySelector<HTMLButtonElement>('.case-modal__close')?.focus();
    }, 100);
  }

  function closeModal() {
    modal!.setAttribute('hidden', '');
    modalBody!.innerHTML = '';
    document.body.style.overflow = '';
  }

  openButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const caseId = btn.dataset.caseOpen;
      if (caseId) openModal(caseId);
    });
  });

  closeButtons.forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
      closeModal();
    }
  });
}