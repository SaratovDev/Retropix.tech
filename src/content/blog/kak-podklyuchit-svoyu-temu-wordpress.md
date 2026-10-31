---
title: "Как создать свою тему WordPress: пошаговая инструкция"
description: "Создаём кастомную тему WordPress с нуля: обязательные файлы, style.css с заголовком, index.php с циклом, functions.php, иерархия шаблонов."
pubDate: 2026-10-17
cover: "/images/blog/kak-podklyuchit-svoyu-temu-wordpress-cover.png"
coverAlt: "Структура файлов кастомной темы WordPress в редакторе кода"
tags: ["wordpress", "beginners"]
draft: false
---

Создание собственной темы WordPress с нуля — это самый прямой путь понять, как устроен WordPress изнутри. Но новичок обычно застревает на одном месте: он сверстал HTML/CSS, открыл папку `wp-content/themes/`, создал папку, положил туда файлы — и ничего не работает.

Тема не появляется в админке, страница белая, стили не подключаются. Причина в том, что WordPress требует **особую структуру файлов** и **обязательный заголовок в `style.css`**. Без этого он просто не распознаёт вашу папку как тему.

Разберём весь процесс по шагам: от минимального набора файлов до рабочей темы, которая выводит записи.

## Два файла, без которых темы не существует

WordPress распознаёт тему по двум обязательным файлам в её папке:

| Файл | Назначение |
|---|---|
| **`style.css`** | Главная таблица стилей. **Обязательно** должен содержать специальный заголовок-комментарий, иначе WordPress не увидит тему |
| **`index.php`** | Основной шаблон. Служит запасным вариантом, если для конкретной страницы нет более специфичного шаблона |

Без `index.php` тема тоже не активируется. Это минимальный порог входа.

На практике к этим двум файлам добавляют ещё несколько, чтобы тема была удобной. `functions.php` **не обязателен** для распознавания темы, но без него вы не сможете правильно подключить стили и скрипты.

## Шаг 1. Создаём папку и style.css с заголовком

В `wp-content/themes/` создайте папку, например `my-custom-theme`. Внутри — файл `style.css`.

Первое, что вы пишете в `style.css` — это **не CSS**, а комментарий-заголовок:

```css
/*
Theme Name: My Custom Theme
Theme URI: https://example.com/my-custom-theme
Author: Ваше имя
Author URI: https://example.com
Description: Моя первая кастомная тема для WordPress
Version: 1.0
License: GNU General Public License v2 or later
Text Domain: my-custom-theme
*/
```

Без этого блока WordPress не покажет тему в разделе **«Внешний вид → Темы»**. Поле **`Theme Name`** — обязательное, остальное можно заполнить или оставить пустым.

После заголовка уже идёт обычный CSS. Начните с базовых стилей — сброс отступов, типографика, цвета.

## Шаг 2. index.php и цикл WordPress

`index.php` — сердце темы. Именно здесь WordPress выводит содержимое страницы. Минимальный рабочий `index.php`:

```php
<?php get_header(); ?>

<main>
    <?php if ( have_posts() ) : ?>
        <?php while ( have_posts() ) : the_post(); ?>
            <article>
                <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                <div><?php the_excerpt(); ?></div>
            </article>
        <?php endwhile; ?>
    <?php else : ?>
        <p>Записей пока нет.</p>
    <?php endif; ?>
</main>

<?php get_footer(); ?>
```

Здесь важно понять **цикл WordPress** (`have_posts()` / `the_post()`). Это механизм, которым WordPress перебирает записи и выводит их. Функции `the_title()`, `the_permalink()`, `the_excerpt()` выводят заголовок, ссылку и краткое описание каждой записи.

<div class="callout">
  <span class="callout__label">Важно</span>
  <p><code>get_header()</code> и <code>get_footer()</code> — это не просто функции. Они подключают файлы <code>header.php</code> и <code>footer.php</code> из вашей темы. Если этих файлов нет — WordPress ничего не выведет на их месте, но ошибки не будет.</p>
</div>

## Шаг 3. header.php и footer.php — разбиваем вёрстку

Вы уже сверстали HTML. Теперь его нужно **разрезать на части**, чтобы WordPress мог собирать страницы из модулей.

`header.php` начинается с открывающих тегов и заканчивается там, где начинается уникальный контент каждой страницы:

```php
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<header class="site-header">
    <h1><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php bloginfo( 'name' ); ?></a></h1>

    <?php
    wp_nav_menu( array(
        'theme_location'  => 'header-menu',
        'container'       => 'nav',
        'container_class' => 'main-nav',
    ) );
    ?>
</header>
```

**`wp_head()`** — критически важная функция. WordPress и плагины подключают через неё свои стили и скрипты. Если её не вызвать, половина функциональности WordPress не будет работать.

**`body_class()`** добавляет в тег `<body>` CSS-классы, зависящие от типа страницы. Удобно для стилизации отдельных страниц.

`footer.php` завершает разметку:

```php
<footer class="site-footer">
    <p>Copyright © <?php echo date( 'Y' ); ?></p>
</footer>

<?php wp_footer(); ?>
</body>
</html>
```

**`wp_footer()`** — аналог `wp_head()`, но для скриптов, которые должны загружаться перед закрытием `</body>`. Плагины и WordPress используют его для вставки кода в футер.

<div class="callout">
  <span class="callout__label">Не забудьте</span>
  <p>Без <code>wp_head()</code> не работают многие плагины, не подключаются стили админ-панели, не выводится <code>title</code>. Без <code>wp_footer()</code> — не работают скрипты, зависящие от DOM.</p>
</div>

## Шаг 4. functions.php — подключаем стили правильно

`functions.php` — файл, который WordPress загружает автоматически при инициализации темы. Он работает как плагин: код в нём доступен глобально, и именно здесь регистрируются возможности темы.

Для минимальной темы в `functions.php` нужно три вещи:

```php
<?php
// 1. Подключаем стили через правильный механизм
function mytheme_enqueue_styles() {
    wp_enqueue_style( 'mytheme-style', get_stylesheet_uri() );
}
add_action( 'wp_enqueue_scripts', 'mytheme_enqueue_styles' );

// 2. Регистрируем возможности темы и меню
function mytheme_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );

    register_nav_menus( array(
        'header-menu' => __( 'Header Menu', 'my-custom-theme' ),
    ) );
}
add_action( 'after_setup_theme', 'mytheme_setup' );
```

**Не подключайте `style.css` через `<link>` в `header.php`** — это классическая ошибка. Правильный способ — `wp_enqueue_style()` в `functions.php`. Тогда WordPress управляет порядком загрузки, кэшированием и зависимостями.

Подробнее про `wp_enqueue_style` и `wp_enqueue_script` — в отдельной статье: [Как правильно подключать стили и скрипты в WordPress](/blog/podklyuchenie-stilej-i-skriptov-v-wordpress).

`add_theme_support( 'title-tag' )` позволяет WordPress автоматически выводить `<title>` для каждой страницы. Без этого пришлось бы вручную прописывать title в `header.php` — неудобно и неправильно.

## Шаг 5. Иерархия шаблонов — как WordPress решает, какой файл использовать

Когда пользователь открывает страницу, WordPress проходит по **иерархии шаблонов** и ищет самый подходящий файл. Если специфичного файла нет, он спускается на уровень ниже, пока не дойдёт до `index.php`.

Упрощённая логика для самых частых случаев:

| Что открыто | Порядок поиска файлов |
|---|---|
| Главная страница блога | `front-page.php` → `home.php` → `index.php` |
| Одна запись | `single-post.php` → `single.php` → `index.php` |
| Одна страница | `page-{slug}.php` → `page-{id}.php` → `page.php` → `index.php` |
| Категория | `category-{slug}.php` → `category-{id}.php` → `category.php` → `archive.php` → `index.php` |
| Страница 404 | `404.php` → `index.php` |

**Практический вывод:** `index.php` — универсальный запасной вариант. Пока в теме есть только он, всё работает. Но когда вы захотите разные макеты для записей и страниц — создаёте `single.php` и `page.php`, и WordPress автоматически начнёт их использовать.

**Пример:** вы хотите, чтобы конкретная страница «О нас» выглядела иначе. Создаёте файл `page-o-nas.php` (по slug страницы) — и WordPress подхватит его **только** для этой страницы. Остальные продолжат использовать `page.php` или `index.php`.

## Пять частых ошибок новичков

**1. Неправильный заголовок в `style.css`.** Пропущено двоеточие, неверное имя поля или комментарий не в начале файла. Тема не появляется в админке. Проверьте, что блок `/* Theme Name: ... */` — **самое первое**, что есть в файле.

**2. Подключение стилей через `<link>` в `header.php`.** Работает, но ломает совместимость с плагинами и кэширование. Используйте `wp_enqueue_style()` в `functions.php`.

**3. Отсутствие `wp_head()` и `wp_footer()`.** Без `wp_head()` не работают плагины, не выводятся стили админки и title. Без `wp_footer()` — не работают скрипты, зависящие от DOM.

**4. Неправильные пути.** Для файлов темы используйте `get_stylesheet_directory_uri()` или `get_template_directory_uri()`, а не относительные пути. В дочерней теме `get_stylesheet_directory_uri()` указывает на дочернюю, `get_template_directory_uri()` — на родительскую.

**5. Правка темы напрямую без дочерней темы.** Если дорабатываете чужую тему, любое обновление снесёт ваши изменения. Для кастомизации чужой темы создавайте дочернюю тему, а не правьте исходные файлы.

## Минимальный чек-лист для запуска

Чтобы тема активировалась и отобразила записи, вам нужны:

- [ ] Папка в `wp-content/themes/`
- [ ] `style.css` с заголовком `Theme Name`
- [ ] `index.php` с циклом WordPress
- [ ] `functions.php` с `wp_enqueue_style()` и `add_theme_support( 'title-tag' )`
- [ ] `header.php` с `wp_head()`
- [ ] `footer.php` с `wp_footer()`

После этого зайдите в админку → **«Внешний вид → Темы»** → активируйте свою тему. Если всё сделано правильно — увидите работающий блог с вашей вёрсткой.

## Итог

Создание кастомной темы WordPress — задача не сложная, но требует внимания к структуре. Запомните главное:

1. **`style.css` и `index.php` — обязательные файлы.** Без них WordPress не увидит тему.
2. **Заголовок `Theme Name` в `style.css` — первое, что пишется в файле.**
3. **`wp_head()` и `wp_footer()`** обязательны в `header.php` и `footer.php`.
4. **Стили и скрипты — через `functions.php`**, а не через `<link>` в HTML.
5. **Иерархия шаблонов** определяет, какой файл WordPress использует для каждой страницы. `index.php` — всегда запасной вариант.

Если вы только выбираете между платформами — Tilda или WordPress, — у нас есть подробное сравнение: [Tilda или WordPress: что выбрать для сайта](/blog/tilda-ili-wordpress).