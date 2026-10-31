---
title: "Как правильно подключать стили и скрипты в WordPress"
description: "Разбираю wp_enqueue_style и wp_enqueue_script в functions.php: правильный хук, пути, дочерние темы, условная загрузка и частые ошибки."
pubDate: 2026-10-16
cover: "/images/blog/podklyuchenie-stilej-i-skriptov-v-wordpress-cover.png"
coverAlt: "Файл functions.php в редакторе кода с функцией wp_enqueue_script"
tags: ["wordpress", "beginners"]
draft: false
---

**Никогда не вставляйте `<link>` или `<script>` напрямую в `header.php`.** Правильный способ подключения стилей и скриптов в WordPress — использовать функции `wp_enqueue_style()` и `wp_enqueue_script()`, привязанные к хуку `wp_enqueue_scripts`, в файле `functions.php`.

**Почему это важно.** В WordPress работает не только ваша тема, но и куча плагинов. Если вы вручную подключите jQuery, а плагин сделает то же самое — страница загрузит его дважды. Это замедлит сайт и может вызвать конфликты. Механизм `enqueue` позволяет WordPress управлять всеми ресурсами централизованно: кто от кого зависит, что загружать первым — система разберётся сама.

Разберём по шагам, как подключить стили и скрипты правильно.

## Шаг 1. Две основные функции

### wp_enqueue_style() — подключение стилей

Базовый синтаксис:

```php
wp_enqueue_style( $handle, $src, $deps, $ver, $media );
```

| Параметр | Назначение | Обязателен |
|---|---|---|
| `$handle` | Уникальное имя стиля, не должно повторяться | **Да** |
| `$src` | Путь к файлу — обычно через `get_stylesheet_uri()` или `get_template_directory_uri()` | Нет |
| `$deps` | Массив handle'ов стилей, от которых зависит этот | Нет |
| `$ver` | Версия файла — для сброса кэша | Нет |
| `$media` | Тип медиа: `all`, `screen`, `print` | Нет |

**Простейший вариант** — подключение `style.css` из корня темы:

```php
wp_enqueue_style( 'my-theme-style', get_stylesheet_uri() );
```

`get_stylesheet_uri()` автоматически возвращает полный URL к `style.css` текущей темы (или дочерней темы).

### wp_enqueue_script() — подключение JavaScript

Базовый синтаксис:

```php
wp_enqueue_script( $handle, $src, $deps, $ver, $in_footer );
```

Почти всё как у стилей, но есть ключевой параметр `$in_footer`:

- **`true`** — скрипт выводится перед `</body>`. **Рекомендуется**, не блокирует отрисовку страницы.
- **`false`** — скрипт выводится в `<head>`. Нужен только для редких скриптов, которые должны загрузиться раньше.

Если ваш скрипт зависит от jQuery, укажите в `$deps` массив `array( 'jquery' )`. Встроенный jQuery WordPress подгрузится автоматически — не нужно подключать его вручную.

<div class="callout">
  <span class="callout__label">Важно</span>
  <p>Имя хука — <code>wp_enqueue_scripts</code>. Оно вводит в заблуждение: несмотря на слово «scripts», этот хук используется <strong>и для стилей, и для скриптов</strong>. Это одна из самых частых ошибок новичков.</p>
</div>

## Шаг 2. Привязка к правильному хуку

Функция написана, но если не привязать её к хуку — WordPress её просто не вызовет.

```php
function my_theme_enqueue_assets() {
    // Подключаем стили
    wp_enqueue_style( 'my-style', get_stylesheet_uri() );

    // Подключаем скрипт, зависит от jQuery, в футере
    wp_enqueue_script(
        'my-script',
        get_template_directory_uri() . '/js/script.js',
        array( 'jquery' ),
        '1.0.0',
        true
    );
}
add_action( 'wp_enqueue_scripts', 'my_theme_enqueue_assets' );
```

**Ключевой момент:** `wp_enqueue_scripts` — это **имя хука**, а не функции. Через `add_action()` вы говорите WordPress: «когда сработает хук `wp_enqueue_scripts`, вызови мою функцию `my_theme_enqueue_assets`».

## Шаг 3. Функции путей — самое частое место ошибок

В `functions.php` **нельзя указывать относительные пути** к файлам. Нужно собирать путь через специальные функции WordPress.

| Функция | Что возвращает | Когда использовать |
|---|---|---|
| `get_stylesheet_uri()` | URL к `style.css` текущей темы | Подключение `style.css` текущей темы |
| `get_stylesheet_directory_uri()` | URL корня **текущей** темы (дочерней) | В дочерней теме — для своих файлов |
| `get_template_directory_uri()` | URL корня **родительской** темы | В дочерней теме — для файлов родителя; в обычной теме — для доп. файлов |
| `plugins_url()` | URL директории плагина | Внутри плагина |

![functions.php в редакторе темы WordPress](/images/blog/podklyuchenie-stilej-i-skriptov-v-wordpress-01.png)

**Самая частая ошибка:** в дочерней теме пытаются подключить свой JS через `get_template_directory_uri()` — а он указывает на **родительскую** тему. Файл не находится. Нужно использовать `get_stylesheet_directory_uri()`.

## Полный пример: обычная тема

```php
function mytheme_enqueue_assets() {
    wp_enqueue_style( 'mytheme-main', get_stylesheet_uri() );

    wp_enqueue_style(
        'mytheme-extra',
        get_template_directory_uri() . '/css/extra.css',
        array( 'mytheme-main' ),
        '1.0.0'
    );

    wp_enqueue_script(
        'mytheme-app',
        get_template_directory_uri() . '/js/app.js',
        array( 'jquery' ),
        '1.0.0',
        true
    );
}
add_action( 'wp_enqueue_scripts', 'mytheme_enqueue_assets' );
```

**Что тут:**
- Основной `style.css` — через `get_stylesheet_uri()`
- Дополнительный CSS `css/extra.css` — зависит от `mytheme-main`, поэтому загрузится после
- JS `js/app.js` — зависит от `jquery`, загружается в футере

## Полный пример: дочерняя тема

У дочерней темы особая ситуация: **`style.css` родительской темы не загружается автоматически**, его нужно подключать вручную. И порядок нельзя нарушать: сначала стили родителя, потом стили дочерней темы, чтобы она могла их перекрывать.

```php
function mychild_enqueue_styles() {
    // Сначала стили родительской темы
    wp_enqueue_style(
        'parent-style',
        get_template_directory_uri() . '/style.css'
    );

    // Потом стили дочерней, зависимость от parent-style гарантирует порядок
    wp_enqueue_style(
        'child-style',
        get_stylesheet_uri(),
        array( 'parent-style' ),
        wp_get_theme()->get( 'Version' )
    );
}
add_action( 'wp_enqueue_scripts', 'mychild_enqueue_styles' );
```

**Ключевые моменты:**

- **`get_template_directory_uri()`** — указывает на **родителя**
- **`get_stylesheet_uri()`** — указывает на `style.css` **дочерней** темы
- В `$deps` дочернего стиля **обязательно** `array( 'parent-style' )` — иначе порядок загрузки может перевернуться и перекрытие перестанет работать
- **`wp_get_theme()->get( 'Version' )`** — автоматически берёт версию темы из `style.css` для сброса кэша

<div class="callout">
  <span class="callout__label">Ошибка</span>
  <p>После активации дочерней темы вёрстка «разваливается» — чаще всего потому, что забыли подключить <code>style.css</code> родителя. Он не загружается автоматически.</p>
</div>

## Условная загрузка: только на нужных страницах

Не каждой странице нужны все ресурсы. С помощью **условных тегов** WordPress можно подключать файлы только там, где они действительно нужны.

```php
function mytheme_conditional_assets() {
    wp_enqueue_style( 'mytheme-main', get_stylesheet_uri() );

    // Только на главной — стили и скрипт слайдера
    if ( is_front_page() ) {
        wp_enqueue_style(
            'mytheme-slider',
            get_template_directory_uri() . '/css/slider.css',
            array( 'mytheme-main' ),
            '1.0.0'
        );
        wp_enqueue_script(
            'mytheme-slider-js',
            get_template_directory_uri() . '/js/slider.js',
            array( 'jquery' ),
            '1.0.0',
            true
        );
    }

    // Только на странице записи — скрипт комментариев
    if ( is_single() ) {
        wp_enqueue_script(
            'mytheme-comments',
            get_template_directory_uri() . '/js/comments.js',
            array(),
            '1.0.0',
            true
        );
    }
}
add_action( 'wp_enqueue_scripts', 'mytheme_conditional_assets' );
```

**Часто используемые условные теги:**

- **`is_front_page()`** — главная страница
- **`is_single()`** — страница отдельной записи
- **`is_page()`** — статическая страница
- **`is_archive()`** — архив (категория, метка, автор)
- **`is_404()`** — страница 404

Условная загрузка **сокращает лишние HTTP-запросы**, что напрямую влияет на скорость загрузки и Core Web Vitals.

## Пять частых ошибок

| # | Ошибка | Что не так |
|---|---|---|
| 1 | **Неверный хук.** Использован `wp_print_styles` или `init` | Ресурсы не загружаются или загружаются не вовремя. Для фронтенда — только `wp_enqueue_scripts` |
| 2 | **Неверный путь в дочерней теме** | Для своих файлов использован `get_template_directory_uri()` — путь ведёт в родительскую тему. Нужен `get_stylesheet_directory_uri()` |
| 3 | **Забыли подключить стили родителя** | После активации дочерней темы вёрстка «развалилась». Нужно подключить `style.css` родителя вручную |
| 4 | **`$in_footer = false`, а скрипт работает с DOM** | Скрипт выполняется в `<head>`, DOM ещё не построен → ошибка. Либо `true`, либо оборачивать в `DOMContentLoaded` |
| 5 | **Конфликт handle'ов** | Использован `'jquery'` как свой handle, или handle слишком общий и совпал с плагином. Добавляйте префикс темы: `mytheme-main` |

![DevTools: подключённые стили и скрипты на странице](/images/blog/podklyuchenie-stilej-i-skriptov-v-wordpress-02.png)

## Итоговый принцип

Вся логика `enqueue` сводится к одной фразе:

**В `functions.php` определяете функцию, привязываете её к хуку `wp_enqueue_scripts`, а пути собираете через правильные функции WordPress.**

Всё остальное — зависимости, версии, условная загрузка — это оптимизация поверх этого каркаса.

Если пишете новую тему, приведённый код можно вставить в `functions.php` как минимально рабочий модуль загрузки ресурсов. Для дочерней темы помните: **стили родителя загружаются первыми, стили дочерней зависят от них**.