/**
 * Обёртка для блоков кода в статьях.
 * - Находит все <pre><code> внутри .prose
 * - Оборачивает в контейнер с панелью (язык + кнопка копирования)
 * - Навешивает обработчик копирования в буфер обмена
 */

export function initCopyCode() {
  const proseBlocks = document.querySelectorAll<HTMLElement>('.prose pre');

  proseBlocks.forEach((pre) => {
    // Пропускаем, если уже обёрнуто (защита от повторной инициализации)
    if (pre.parentElement?.classList.contains('code-block')) return;

    // Определяем язык из класса <code> (Astro добавляет class="language-html")
    const codeEl = pre.querySelector('code');
    const langClass = Array.from(codeEl?.classList ?? []).find((c) =>
      c.startsWith('language-')
    );
    const lang = langClass ? langClass.replace('language-', '') : 'code';

    // Создаём обёртку
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';

    // Панель: язык + кнопка
    const header = document.createElement('div');
    header.className = 'code-block__header';

    const langEl = document.createElement('span');
    langEl.className = 'code-block__lang';
    langEl.textContent = lang.toUpperCase();

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-block__copy';
    button.setAttribute('aria-label', 'Копировать код');
    button.textContent = 'Копировать';

    header.appendChild(langEl);
    header.appendChild(button);

    // Оборачиваем <pre>
    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);

    // Обработчик копирования
    button.addEventListener('click', async () => {
      const text = codeEl?.textContent ?? '';
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Скопировано';
        button.classList.add('is-copied');
        setTimeout(() => {
          button.textContent = 'Копировать';
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