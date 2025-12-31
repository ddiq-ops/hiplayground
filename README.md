Create a web-based mini game playground for elementary school students.

Requirements:
- Target: elementary school kids
- Domain concept: "hiplayground.com" (friendly online playground)
- Tech: HTML, CSS, JavaScript only
- No backend yet
- Responsive design
- Main page with game categories
- Game list page
- Individual game play page
- Simple, colorful, kid-friendly UI
- No external paid assets
- Placeholder mini games (simple click, memory, puzzle games)

Focus on clean structure and scalability.


You are building a kid-friendly mini game website called "Hi Playground" for elementary school students.

Goal:
- Create a complete static website (HTML/CSS/JS only) that can host many mini games.
- No backend yet.
- Must be scalable: add 100+ games later with minimal changes.
- Use the following file tree exactly and generate the initial code for each file.

File Tree:
hiplayground/
  README.md
  index.html
  assets/css/base.css
  assets/css/theme.css
  assets/css/components.css
  assets/js/app.js
  assets/js/router.js
  assets/js/storage.js
  assets/js/i18n.js
  assets/js/analytics.js
  data/games.json
  data/categories.json
  data/i18n/ko.json
  data/i18n/en.json
  pages/games.html
  pages/category.html
  pages/play.html
  pages/parents.html
  pages/about.html
  pages/privacy.html
  pages/terms.html
  pages/404.html
  games/clicker/game.js
  games/clicker/game.css
  games/clicker/manifest.json
  games/memory/game.js
  games/memory/game.css
  games/memory/manifest.json
  games/math-quiz/game.js
  games/math-quiz/game.css
  games/math-quiz/manifest.json
  shared/game-shell.js
  shared/game-shell.css
  shared/ui.js

Functional Requirements:
1) Kid-friendly UI: big buttons, clear icons, bright but not harsh colors.
2) Main page (index.html):
   - Show categories, featured games, "Continue playing", and a search box.
3) Games list (pages/games.html):
   - Load games from data/games.json
   - Filter by category and difficulty, sort by "popular" and "new"
4) Category page (pages/category.html?c=...):
   - Show games in a category
5) Play page (pages/play.html?id=GAME_ID):
   - Use shared/game-shell.js as a wrapper
   - Dynamically load games/<id>/game.js and game.css
   - Show a common top bar: Back, Title, Reset, Fullscreen, Mute
6) Local storage:
   - Save last played game, simple progress per game, favorites
7) i18n:
   - Default language: Korean
   - Prepare English but keep UI in Korean for now
8) Provide 3 sample games:
   - clicker: simple reaction/click score game
   - memory: card matching game
   - math-quiz: quick math quiz for kids
9) Create privacy.html and terms.html with kid-safety/ads-friendly text placeholders (Korean).
10) Ensure everything works by opening index.html locally (no build step).

Output:
- Generate full code for all files.
- Keep code clean and commented.
- No copyrighted assets. Use simple SVG/emoji placeholders if needed.

