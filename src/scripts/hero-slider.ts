/**
 * Hero-слайдер: автопрокрутка, стрелки, свайпы, пауза при ховере.
 */

export function initHeroSlider() {
  const slider = document.querySelector<HTMLElement>('[data-hero-slider]');
  if (!slider) return;

  const slides = slider.querySelectorAll<HTMLElement>('[data-hero-slide]');
  const prevBtn = slider.querySelector<HTMLButtonElement>('[data-hero-slider-prev]');
  const nextBtn = slider.querySelector<HTMLButtonElement>('[data-hero-slider-next]');
  const currentEl = slider.querySelector<HTMLElement>('[data-hero-slider-current]');

  if (slides.length === 0) return;

  const autoplayDelay = parseInt(slider.dataset.autoplay || '3000', 10);
  let currentIndex = 0;
  let autoplayTimer: number | null = null;
  let isPaused = false;

  function goToSlide(index: number) {
    const slidesArr = Array.from(slides);
    const oldIndex = currentIndex;

    // Циклический переход
    currentIndex = (index + slidesArr.length) % slidesArr.length;

    slidesArr.forEach((slide, i) => {
      slide.classList.remove('is-active', 'is-prev');

      if (i === currentIndex) {
        slide.classList.add('is-active');
      } else if (i === oldIndex) {
        slide.classList.add('is-prev');
      }
    });

    // Обновляем счётчик
    if (currentEl) {
      currentEl.textContent = String(currentIndex + 1).padStart(2, '0');
    }
  }

  function next() {
    goToSlide(currentIndex + 1);
  }

  function prev() {
    goToSlide(currentIndex - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = window.setInterval(() => {
      if (!isPaused) next();
    }, autoplayDelay);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  // Клики по стрелкам
  nextBtn?.addEventListener('click', () => {
    next();
    startAutoplay();
  });

  prevBtn?.addEventListener('click', () => {
    prev();
    startAutoplay();
  });

  // Пауза при наведении
  slider.addEventListener('mouseenter', () => {
    isPaused = true;
  });

  slider.addEventListener('mouseleave', () => {
    isPaused = false;
  });

  // Свайпы на мобилке
  let touchStartX = 0;

  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
      startAutoplay();
    }
  }, { passive: true });

  // Запуск автопрокрутки
  startAutoplay();
}