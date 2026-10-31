/**
 * Кнопка «Копировать» для компонента LiveDemo.
 * Копирует содержимое <textarea> рядом с кнопкой.
 */

export function initLiveDemo() {
  const demos = document.querySelectorAll<HTMLElement>('[data-live-demo]');

  demos.forEach((demo) => {
    const button = demo.querySelector<HTMLButtonElement>('[data-live-demo-copy]');
    const source = demo.querySelector<HTMLTextAreaElement>('.live-demo__source');

    if (!button || !source) return;

    // Защита от повторной инициализации
    if (button.dataset.initialized === 'true') return;
    button.dataset.initialized = 'true';

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(source.value);
        const original = button.textContent;
        button.textContent = 'Скопировано';
        button.classList.add('is-copied');
        setTimeout(() => {
          button.textContent = original;
          button.classList.remove('is-copied');
        }, 2000);
      } catch {
        button.textContent = 'Ошибка';
        setTimeout(() => {
          button.textContent = 'Копировать';
        }, 2000);
      }
    });
  });
}