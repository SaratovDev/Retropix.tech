/**
 * Фильтрация постов на странице /blog.
 * - Клик по кнопке-фильтру → показываем только карточки с этим тегом
 * - "Все" → показываем все карточки
 * - Плавная анимация fade + slide
 * - Если ничего не найдено — показываем сообщение
 */

export function initBlogFilter() {
  const filtersContainer = document.querySelector<HTMLElement>('[data-filters]');
  const grid = document.querySelector<HTMLElement>('[data-posts-grid]');
  const emptyMessage = document.querySelector<HTMLElement>('[data-empty-message]');

  if (!filtersContainer || !grid) return;

  const buttons = filtersContainer.querySelectorAll<HTMLButtonElement>('.blog-filters__btn');
  const items = grid.querySelectorAll<HTMLElement>('[data-post-tags]');

  // Плавное скрытие карточки
  function hideItem(item: HTMLElement, delay: number) {
    item.style.transitionDelay = `${delay}ms`;
    item.classList.add('is-hiding');
    setTimeout(() => {
      item.classList.add('is-hidden');
      item.classList.remove('is-hiding');
      item.style.transitionDelay = '';
    }, 300 + delay);
  }

  // Плавное показывание карточки
  function showItem(item: HTMLElement, delay: number) {
    item.classList.remove('is-hidden');
    item.style.transitionDelay = `${delay}ms`;
    requestAnimationFrame(() => {
      item.classList.add('is-hiding'); // временный класс, чтобы transition сработал
      requestAnimationFrame(() => {
        item.classList.remove('is-hiding');
      });
    });
    setTimeout(() => {
      item.style.transitionDelay = '';
    }, 350 + delay);
  }

  function applyFilter(tag: string) {
    let visibleCount = 0;
    let hideIndex = 0;
    let showIndex = 0;

    items.forEach((item) => {
      const tags = (item.dataset.postTags ?? '').split(',');
      const matches = tag === 'all' || tags.includes(tag);

      if (matches) {
        showItem(item, showIndex * 40);
        showIndex++;
        visibleCount++;
      } else {
        hideItem(item, hideIndex * 30);
        hideIndex++;
      }
    });

    // Сообщение, если ничего не найдено
    if (emptyMessage) {
      setTimeout(() => {
        emptyMessage.classList.toggle('is-hidden', visibleCount > 0);
      }, hideIndex * 30 + 350);
    }

    // Обновляем активную кнопку
    buttons.forEach((btn) => {
      const isActive = btn.dataset.filter === tag;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  // Обработчик клика по фильтрам
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.filter;
      if (!tag) return;
      applyFilter(tag);
    });
  });
}