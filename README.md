# retropix.tech — блог о веб-разработке и разработка сайтов

Личный сайт Вадима Шабанова: блог о Tilda, WordPress, HTML+CSS, SEO и Astro JS + услуги разработки + обучающие игры с таблицей лидеров.

**Стек:** Astro 7, MDX, Supabase (лидерборд), Resend (email), Vercel.

---

## Быстрый старт

```bash
npm install
cp .env.example .env

npm run dev

src/
├── content/blog/        # статьи в Markdown/MDX
├── pages/               # роутинг (файлы = URL)
│   ├── index.astro      # главная
│   ├── blog/            # список + статьи + теги
│   ├── services.astro   # услуги
│   ├── about.astro      # обо мне
│   ├── contact.astro    # контакты + форма
│   ├── learn.astro      # обучение
│   ├── leaderboard.astro
│   ├── api/lead.ts      # отправка заявок (Resend)
│   └── rss.xml.ts       # RSS-фид
├── components/          # переиспользуемые блоки
├── layouts/BaseLayout.astro
├── scripts/             # клиентский JS (игры, формы, слайдер)
├── lib/                 # Supabase, лидерборд, rate-limit
└── styles/              # CSS (tokens, reset, base, layout, components, prose)

Лицензия
Код — MIT. Контент (тексты статей, фото) — © Вадим Шабанов, все права защищены. Копирование без разрешения запрещено.