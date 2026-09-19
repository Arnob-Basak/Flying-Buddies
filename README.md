# Flying Buddies

## 🎮 Play Online

👉 **[https://flying-buddies.netlify.app/](https://flying-buddies.netlify.app/)** 🐦✨

A mobile-friendly Flappy Bird-style game made with **HTML, CSS, JavaScript and Canvas 2D**, using your five supplied images. No framework, npm installation, CDN, external font, API key, or internet connection is needed for local play.

## How to Play

### 🌐 Option 1: Play online (easiest)

Open **https://flying-buddies.netlify.app/** in any modern browser on your phone, tablet or laptop. There is nothing to download or install. Choose **Mithai** or **Riaan**, press **Play**, then tap, click or press Space to fly.

### 💻 Option 2: Run it on your own computer

1. Get the project from GitHub: click **Code → Download ZIP**, or clone it:
   ```bash
   git clone https://github.com/Arnob-Basak/Flying-Buddies.git
   ```
2. If you downloaded the ZIP, right-click it and choose **Extract All**. Do not run the game directly from inside the ZIP.
3. Double-click **index.html** in the extracted folder. It will open in Chrome, Edge, Firefox or Safari.
4. Choose **Mithai** or **Riaan** and press **Play**. Then click or press Space to fly.

`index.html`, the CSS/JS files and the `assets` folder must be kept together. If you move only the HTML file to another folder, the images will not load.

## Controls

| Action | Phone / tablet | Laptop |
|---|---|---|
| Flap / first takeoff | Tap the game area | Click, Space, ↑ or W |
| Pause / resume | Pause button | Pause button, P or Esc |
| Retry | Fly again | Fly again |
| Switch buddy | Choose a buddy / home | Choose a buddy / home |

Pressing **Play** on the home screen opens the ready screen. The flight starts on the first tap/click/Space. Passing a pipe pair completely earns **1 point**. The flight ends when the character's core hitbox touches a pipe, the top of the screen, or the ground. The hitbox does not extend to the tips of the character's arms and legs, so the game is a little easier to play on a phone.

## Features

- Your supplied logo on the loading screen and home screen.
- Mithai (girl) and Riaan (boy), using your original transparent PNGs.
- Two original background images, alternating **every 20 seconds of active flight** (0–20s: image 1, 20–40s: image 2, 40–60s: image 1…). Pausing also pauses this timer. A short crossfade begins at each switch; Gentle motion makes it instant.
- Touch and keyboard controls with frame-rate-independent physics.
- Easy, Classic and Hard: both characters play by identical rules.
- Score, elapsed flight time, per-character/per-difficulty best, and all-time best.
- Pause, restart, character switch, and automatic pause when the tab loses focus.
- Sound effects, gentle motion, fullscreen when supported, and confirmed score reset.
- No login, tracking, data upload or external service.

## Browser database / high scores

**IndexedDB** database: `FlyingBuddies`, object store: `saves`, key: `player`.

The game keeps a synchronous **localStorage** mirror under `flying-buddies-save-v1`. This also serves as the fallback when a browser restricts IndexedDB on `file://`. Scores are saved as each pipe is passed, so closing an unfinished flight still preserves its best score. Settings and selected buddy are remembered.

Scores stay on the **same browser, profile and origin**. Another browser/phone or another address has a separate score history. Clearing site data deletes scores. Browser behavior for local files varies, and moving the folder may change which save is used. For reliable repeated use on a fixed address, use the live site above or the optional local server below. If both storage methods are blocked, the game displays a notice and uses temporary scores for the current session. Private browsing may clear scores when you close it.

## Optional local server

This is optional. Directly opening `index.html` is enough to play.

If Python is installed, open a terminal in this folder:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

On Windows, if `python` is unavailable but the Python launcher exists:

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

Then open **http://localhost:8000**. Alternatively open the folder in VS Code and choose **Open with Live Server** on `index.html`. Keep using the same address and port for the same score history.

## Testing a local copy on your phone

The easiest way to play on a phone is the online link above. This section is only for testing a local copy of the game from your laptop.

1. Connect the laptop and phone to the same Wi-Fi.
2. Open a terminal in the game folder and run:

```powershell
py -m http.server 8000 --bind 0.0.0.0
```

If needed, replace `py` with `python`.

3. In the Windows terminal, type `ipconfig` and look at the **IPv4 Address** of the Wi-Fi adapter.
4. Open `http://YOUR-LAPTOP-IP:8000` in your phone's browser. For example, if the IP is `192.168.1.7`, the address will be `http://192.168.1.7:8000`.
5. If a Windows Firewall prompt appears, allow it for your private/home network.
6. To stop the server, press **Ctrl+C** in the terminal.

Playing in portrait is the most convenient. Fullscreen support varies by browser, especially on iPhone. When the orientation/size changes, a running flight is paused and the score is kept; if needed, empty space may appear beside the game view. A new flight is created to match the new screen size.

## Files and customization

| File | Purpose |
|---|---|
| `index.html` | Loading, home, game overlays and settings |
| `styles.css` | Responsive layout, colors and UI |
| `engine.js` | Physics, collision, pipe generation, scoring and 20s scene timer |
| `storage.js` | IndexedDB, localStorage fallback and save validation |
| `game.js` | Canvas drawing, image/audio loading, controls and UI events |
| `assets/background-1.png` | Your first picture |
| `assets/background-2.png` | Your second picture |
| `assets/mithai.png` | Your third picture — Mithai |
| `assets/riaan.png` | Your fourth picture — Riaan |
| `assets/logo.png` | Your fifth picture — logo |

All five original files are included without edits. Backgrounds use proportional **cover** rendering: they do not stretch, but screen shapes may crop the sides or top/bottom. Character images are scaled proportionally. A smaller in-memory character copy is used for rendering; the supplied PNG files remain unchanged.

Change speed/gap/spacing in `MODES` in `engine.js`; gravity and flap impulse are nearby. Change colors in `styles.css`. Keep asset filenames or update their references in HTML, CSS and `game.js`.

## Deployment

This folder is a static website, and the game is already live at **https://flying-buddies.netlify.app/**. No backend build step is needed. To host your own copy, upload the complete contents of this folder to any static website host, with `index.html` at the site root. High scores remain local to each player's browser; this is not a shared online leaderboard.

## Validation

The package was checked for JavaScript syntax, image references, source-image integrity, and scripted game/storage scenarios. Automated checks cover scoring, collision, pause timing, both 20-second background changes, deterministic fixed-step play, high-score persistence/fallback and reset. Live browser/device testing was not performed in this environment.
