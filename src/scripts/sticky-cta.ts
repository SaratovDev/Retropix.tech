/**
 * Sticky CTA на страницах статей.
 * - Две кнопки → открывают попап с формой
 * - Тип заявки передаётся в скрытое поле
 * - Заголовок и подзаголовок попапа меняются в зависимости от типа
 */

const MODAL_TEXTS: Record<string, { title: string; lead: string }> = {
  'site-development': {
    title: 'Заказать разработку сайта',
    lead: 'Опишите задачу — отвечу в течение рабочего дня.',
  },
  'individual-training': {
    title: 'Индивидуальное обучение',
    lead: 'Расскажите, чему хотите научиться — подберу формат.',
  },
};

export function initStickyCta() {
  const cta = document.querySelector<HTMLElement>('[data-sticky-cta]');
  const modal = document.querySelector<HTMLElement>('[data-sticky-modal]');
  if (!cta || !modal) return;

  const openButtons = cta.querySelectorAll<HTMLButtonElement>('[data-sticky-cta-open]');
  const closeButtons = modal.querySelectorAll<HTMLElement>('[data-sticky-close]');
  const titleEl = modal.querySelector<HTMLElement>('[data-sticky-modal-title]');
  const leadEl = modal.querySelector<HTMLElement>('[data-sticky-modal-lead]');
  const typeField = modal.querySelector<HTMLInputElement>('[data-sticky-type-field]');

  function openModal(type: string) {
    const texts = MODAL_TEXTS[type] ?? MODAL_TEXTS['site-development'];

    if (titleEl) titleEl.textContent = texts.title;
    if (leadEl) leadEl.textContent = texts.lead;
    if (typeField) typeField.value = type;

    modal!.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    // Фокус на первое поле
    setTimeout(() => {
      modal!.querySelector<HTMLInputElement>('.field__input')?.focus();
    }, 100);
  }

  function closeModal() {
    modal!.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  openButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.stickyCtaOpen ?? 'site-development';
      openModal(type);
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