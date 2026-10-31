/**
 * Формы заявок на сайте:
 * - Переключатель способа связи (Telegram / Телефон / MAX)
 * - Отправка на /api/lead (Resend → email)
 * - Универсальный обработчик для ВСЕХ форм с [data-contact-form]
 */

const METHOD_CONFIG = {
  telegram: {
    label: 'Ваш ник или телефон в Telegram',
    placeholder: '@username или +7...',
  },
  phone: {
    label: 'Ваш номер телефона',
    placeholder: '+7 XXX XXX-XX-XX',
  },
  max: {
    label: 'Ваш номер или ник в MAX',
    placeholder: '+7 XXX XXX-XX-XX',
  },
} as const;

type Method = keyof typeof METHOD_CONFIG;

export function initContactForm() {
  const forms = document.querySelectorAll<HTMLFormElement>('[data-contact-form]');
  if (forms.length === 0) return;

  forms.forEach((form) => {
    // === Переключатель способа связи ===
    const radios = form.querySelectorAll<HTMLInputElement>('[data-method]');
    const valueLabel = form.querySelector<HTMLLabelElement>('[data-value-label]');
    const valueInput = form.querySelector<HTMLInputElement>('[data-value-input]');

    if (valueLabel && valueInput) {
      radios.forEach((radio) => {
        radio.addEventListener('change', () => {
          if (!radio.checked) return;
          const config = METHOD_CONFIG[radio.value as Method];
          if (!config) return;
          valueLabel.textContent = config.label;
          valueInput.placeholder = config.placeholder;
          valueInput.value = '';
          valueInput.focus();
        });
      });
    }

    // === Отправка формы ===
    if (form.dataset.leadInit === 'true') return;
    form.dataset.leadInit = 'true';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (submitBtn?.disabled) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const methodRadio = form.querySelector<HTMLInputElement>('[data-method]:checked');
      const methodValue = methodRadio?.value ?? 'telegram';

      // Контакт может называться по-разному: contact / contact-value / email
      const contactValue = String(
        formData.get('contact') ??
          formData.get('contact-value') ??
          formData.get('email') ??
          ''
      ).trim();

      const nameValue =
        String(formData.get('name') ?? '').trim() || 'Подписчик';

      const payload = {
        name: nameValue,
        contact: contactValue,
        method: methodValue,
        message: String(formData.get('message') ?? '').trim() || undefined,
        source: String(formData.get('source') ?? '').trim() || undefined,
        discount: String(formData.get('discount') ?? '').trim() || undefined,
        level: String(formData.get('level') ?? '').trim() || undefined,
        type: String(formData.get('type') ?? '').trim() || undefined,
        email: String(formData.get('email') ?? '').trim() || undefined,
      };

      const originalText = submitBtn?.innerHTML ?? '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Отправка...';
      }

      // Статус под формой (создаём, если нет)
      let statusEl = form.querySelector<HTMLElement>('[data-form-status]');
      if (!statusEl) {
        statusEl = document.createElement('p');
        statusEl.dataset.formStatus = '';
        statusEl.className = 'contact-form__status';
        statusEl.style.cssText = 'margin-top: 12px; font-size: 14px; line-height: 1.5;';
        form.appendChild(statusEl);
      }
      statusEl.textContent = '';
      statusEl.classList.remove('is-success', 'is-error');
      statusEl.style.color = '';

      try {
        const res = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = (await res.json()) as { ok: boolean; error?: string };

        if (res.ok && json.ok) {
          statusEl.textContent = '✅ Заявка отправлена. Свяжусь с вами в течение рабочего дня.';
          statusEl.classList.add('is-success');
          statusEl.style.color = 'var(--success, #2A7D4F)';
          form.reset();

          // Возвращаем радио «Telegram» по умолчанию
          const defaultRadio = form.querySelector<HTMLInputElement>(
            '[data-method][value="telegram"]'
          );
          if (defaultRadio) {
            defaultRadio.checked = true;
            defaultRadio.dispatchEvent(new Event('change'));
          }
        } else {
          statusEl.textContent = `Ошибка: ${json.error ?? 'не удалось отправить. Попробуйте ещё раз.'}`;
          statusEl.classList.add('is-error');
          statusEl.style.color = 'var(--accent, #F36223)';
        }
      } catch (err) {
        console.error('Lead send error:', err);
        statusEl.textContent = 'Ошибка сети. Проверьте подключение и попробуйте ещё раз.';
        statusEl.classList.add('is-error');
        statusEl.style.color = 'var(--accent, #F36223)';
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  });
}