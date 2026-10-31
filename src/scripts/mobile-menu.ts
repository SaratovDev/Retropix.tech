/**
 * Мобильное меню-шторы.
 * - Открывает/закрывает по клику на гамбургер
 * - Закрывает по клику на ссылку (с задержкой 300ms на анимацию)
 * - Закрывает по Escape
 * - Блокирует скролл body при открытом меню
 * - Меняет aria-атрибуты для доступности
 */

const ANIMATION_DURATION = 300; // должно совпадать с CSS var --dur

export function initMobileMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const nav = document.querySelector<HTMLElement>('[data-mobile-nav]');
  const links = document.querySelectorAll<HTMLAnchorElement>('[data-mobile-link]');

  if (!toggle || !nav) return;

  let isOpen = false;

  function open() {
    if (isOpen) return;
    isOpen = true;
    nav!.classList.add('is-open');
    nav!.setAttribute('aria-hidden', 'false');
    toggle!.setAttribute('aria-expanded', 'true');
    toggle!.setAttribute('aria-label', 'Закрыть меню');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    nav!.classList.remove('is-open');
    nav!.setAttribute('aria-hidden', 'true');
    toggle!.setAttribute('aria-expanded', 'false');
    toggle!.setAttribute('aria-label', 'Открыть меню');
    document.body.style.overflow = '';
  }

  // Клик на гамбургер — toggle
  toggle.addEventListener('click', () => {
    if (isOpen) close();
    else open();
  });

  // Клик на ссылку внутри шторы — сначала закрываем, потом переходим
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href) return;

      // Внешние ссылки (Telegram) — открываются в новой вкладке,
      // штору закрываем, но переход не перехватываем
      if (link.target === '_blank') {
        close();
        return;
      }

      // Внутренние ссылки — закрываем штору, потом переходим
      e.preventDefault();
      close();
      setTimeout(() => {
        window.location.href = href;
      }, ANIMATION_DURATION);
    });
  });

  // Escape — закрывает
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) close();
  });
}