# Публикация на GitHub Pages из PowerShell

В проект уже добавлен `.github/workflows/pages.yml`. GitHub собирает сайт, проверяет логику теста и публикует `dist` при обновлении ветки `main`. Папку `dist` вручную в Git добавлять не нужно.

Команды ниже предназначены для первой публикации этой папки в **новый публичный репозиторий**. Git и GitHub CLI уже установлены на текущем компьютере. Выполняйте блоки по порядку в одном терминале PowerShell. Если команда завершилась ошибкой, сначала устраните ее, затем продолжайте.

## 1. Войти в GitHub

```powershell
Set-Location 'C:\Users\Admin\Documents\VibeCode\test2'
gh auth login --hostname github.com --git-protocol https --web --scopes workflow
gh auth setup-git
```

GitHub CLI предложит открыть браузер и подтвердить вход в ваш аккаунт.

## 2. Создать репозиторий и загрузить проект

`doctor_scheglova` — имя репозитория проекта. Команды первой настройки ниже нужны только для новой копии без Git и удаленного репозитория.

```powershell
$ghAccount = gh api user | ConvertFrom-Json
$ghOwner = $ghAccount.login
$pagesRepo = 'doctor_scheglova'
$pagesFullName = "$ghOwner/$pagesRepo"

git init -b main
git config user.name "$ghOwner"
git config user.email "$($ghAccount.id)+$ghOwner@users.noreply.github.com"
git add .
git commit -m 'Initial website [skip ci]'

gh repo create $pagesFullName --public --source=. --remote=origin --push
```

Git использует имя аккаунта и служебный email GitHub для подписания коммитов. Настройки сохраняются только в этом проекте. `[skip ci]` пропускает автоматическую первую сборку: сначала следующими командами включается Pages.

## 3. Включить Pages и запустить публикацию

```powershell
gh api --method POST "repos/$pagesFullName/pages" -f build_type=workflow
gh workflow run pages.yml --repo $pagesFullName --ref main
```

Посмотреть запуски:

```powershell
gh run list --repo $pagesFullName --workflow pages.yml --limit 5
```

Запуск может появиться в списке через несколько секунд. Дождаться окончания, выбрав активный запуск из предложенного списка:

```powershell
gh run watch --repo $pagesFullName --exit-status
```

Получить адрес сайта:

```powershell
gh api "repos/$pagesFullName/pages" --jq .html_url
```

Адрес проекта: `https://cylaro.github.io/doctor_scheglova/`. Изменять `base: './'` не требуется: приложение использует относительные пути и навигацию через `#`.

## Обновления

После изменения фото, контактов, текстов или оформления выполните из папки проекта:

```powershell
git add .
git commit -m 'Update website'
git push
```

GitHub сам выполнит `npm ci`, `npm test` и `npm run build`, затем опубликует обновленный сайт. Локальный сервер для публикации запускать не нужно. Если Git сообщает `nothing to commit`, сохраненных изменений нет.

## Фотография

Текущий файл: `public/doctor.jpg`. В `public/site-config.js` он подключен так:

```js
avatar: 'doctor.jpg',
```

Папка `public` при сборке становится корнем сайта, поэтому писать `public/doctor.jpg` в настройке не нужно. Если перенесете фото в `public/assets/doctor.jpg`, измените настройку на `assets/doctor.jpg`. Регистр букв и расширение должны совпадать с именем файла. После замены фото при необходимости обновите страницу через Ctrl+F5.

Основание настройки: [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [GitHub Pages API](https://docs.github.com/en/rest/pages/pages#create-a-github-pages-site).
