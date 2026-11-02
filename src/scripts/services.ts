export function initServices() {
  // === 1. Тултипы работают всегда ===
  const tooltips = document.querySelectorAll<HTMLElement>('[data-tooltip]');
  let tooltipEl: HTMLDivElement | null = null;

  function createTooltip() {
    if (tooltipEl) return tooltipEl;
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip';
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  tooltips.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      const text = el.dataset.tooltip;
      if (!text) return;
      const tip = createTooltip();
      tip.textContent = text;
      tip.classList.add('is-visible');
      const rect = el.getBoundingClientRect();
      tip.style.left = `${rect.left + rect.width / 2}px`;
      tip.style.top = `${rect.bottom + 8}px`;
    });
    el.addEventListener('mouseleave', () => {
      tooltipEl?.classList.remove('is-visible');
    });
  });

  // === 2. Попап заказа — только если он есть на странице ===
  const modal = document.querySelector<HTMLElement>('[data-modal]');

  if (modal) {
    const modalService = modal.querySelector<HTMLElement>('[data-modal-service]');
    const modalServiceField = modal.querySelector<HTMLInputElement>('[data-service-field]');
    const orderButtons = document.querySelectorAll<HTMLButtonElement>('[data-order-service]');

    function openModal(serviceTitle: string) {
      modal!.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
      if (modalService) modalService.textContent = serviceTitle;
      if (modalServiceField) modalServiceField.value = serviceTitle;

      setTimeout(() => {
        modal!.querySelector<HTMLInputElement>('.field__input')?.focus();
      }, 100);
    }

    function closeModal() {
      modal!.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }

    orderButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const service = btn.dataset.orderService ?? '';
        openModal(service);
      });
    });

    modal.querySelectorAll<HTMLElement>('[data-modal-close]').forEach((el) => {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
        closeModal();
      }
    });
  }

  // === 3. Переключатель способа связи — работает всегда ===
  const METHOD_CONFIG = {
    telegram: { label: 'Ваш ник или телефон в Telegram', placeholder: '@username или +7...' },
    phone:    { label: 'Ваш номер телефона',             placeholder: '+7 XXX XXX-XX-XX' },
    max:      { label: 'Ваш номер или ник в MAX',        placeholder: '+7 XXX XXX-XX-XX' },
  } as const;

  const forms = document.querySelectorAll<HTMLFormElement>('[data-contact-form]');
  forms.forEach((form) => {
    const radios = form.querySelectorAll<HTMLInputElement>('[data-method]');
    const valueLabel = form.querySelector<HTMLLabelElement>('[data-value-label]');
    const valueInput = form.querySelector<HTMLInputElement>('[data-value-input]');

    if (!valueLabel || !valueInput) return;

    radios.forEach((radio) => {
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        const config = METHOD_CONFIG[radio.value as keyof typeof METHOD_CONFIG];
        if (!config) return;
        valueLabel.textContent = config.label;
        valueInput.placeholder = config.placeholder;
        valueInput.value = '';
        valueInput.focus();
      });
    });
  });
  
}

