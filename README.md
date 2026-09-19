# Flying Buddies

**▶ [Play online: flying-buddies.netlify.app](https://flying-buddies.netlify.app/)**

A mobile-friendly Flappy Bird-style game made with **HTML, CSS, JavaScript and Canvas 2D**. No framework, npm installation, CDN, external font, API key, or internet connection is needed for local play.

## Play online

Open **https://flying-buddies.netlify.app/** in any modern browser. It works on phones, tablets and laptops, and there is nothing to install.

## Run it on your laptop

1. Get the project: click **Code → Download ZIP** on this GitHub page, or clone it:
   ```bash
   git clone https://github.com/Arnob-Basak/Flying-Buddies.git
   ```
2. If you downloaded the ZIP, right-click it and choose **Extract All**. Do not run the game from inside the ZIP.
3. Double-click **index.html** in the extracted `Flying-Buddies` folder. It opens in Chrome, Edge, Firefox or Safari.
4. Choose **Mithai** or **Riaan**, press **Play**, then click or press Space to fly.

`index.html`, the CSS/JS files and the `assets` folder must stay together. If you move only the HTML file to another folder, the images will not load.

## Controls

| Action | Phone / tablet | Laptop |
|---|---|---|
| Flap / first takeoff | Tap the game area | Click, Space, ↑ or W |
| Pause / resume | Pause button | Pause button, P or Esc |
| Retry | Fly again | Fly again |
| Switch buddy | Choose a buddy / home | Choose a buddy / home |

Pressing **Play** on the home screen opens the ready screen. The flight starts on the first tap, click or Space press. Every pipe pair you fully pass earns **1 point**. The flight ends when the character's core hitbox touches a pipe, the top of the screen, or the ground. The hitbox does not extend to the tips of the character's arms and legs, which makes the game a little easier to play on a phone.

## Features

- Custom logo on the loading screen and the home screen.
- Two playable characters, Mithai (girl) and Riaan (boy), using original transparent PNGs.
- Two original background images that alternate **every 20 seconds of active flight** (0–20s: image 1, 20–40s: image 2, 40–60s: image 1…). Pausing also pauses this timer. A short crossfade begins at each switch; Gentle motion makes it instant.
- Touch and keyboard controls with frame-rate-independent physics.
- Easy, Classic and Hard modes: both characters play by identical rules.
- Score, elapsed flight time, per-character/per-difficulty best, and all-time best.
- Pause, restart, character switch, and automatic pause when the tab loses focus.
- Sound effects, gentle motion, fullscreen when supported, and confirmed score reset.
- No login, tracking, data upload or external service.

## Browser database / high scores

**IndexedDB** database: `FlyingBuddies`, object store: `saves`, key: `player`.

The game keeps a synchronous **localStorage** mirror under `flying-buddies-save-v1`. This also serves as the fallback when a browser restricts IndexedDB on `file://`. Scores are saved as each pipe is passed, so closing an unfinished flight still preserves its best score. Settings and the selected buddy are remembered.

Scores stay on the **same browser, profile and origin**. Another browser/phone or another address has a separate score history. Clearing site data deletes scores. Browser behavior for local files varies, and moving the folder may change which save is used. For reliable repeated use on a fixed address, use the optional local server below. If both storage methods are blocked, the game displays a notice and uses temporary scores for the current session. Private browsing may clear scores when you close it.

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

Then open **http://localhost:8000**. Alternatively, open the folder in VS Code and choose **Open with Live Server** on `index.html`. Keep using the same address and port to keep the same score history.

## Playing on your phone from your laptop

1. Connect your laptop and phone to the same Wi-Fi network.
2. Open a terminal in the game folder and run:

```powershell
py -m http.server 8000 --bind 0.0.0.0
```

If needed, replace `py` with `python`.

3. In a Windows terminal, type `ipconfig` and find the **IPv4 Address** of your Wi-Fi adapter.
4. In your phone's browser, open `http://YOUR-LAPTOP-IP:8000`. For example, if the IP is `192.168.1.7`, the address is `http://192.168.1.7:8000`.
5. If Windows Firewall shows a prompt, allow access for your private/home network.
6. To stop the server, press **Ctrl+C** in the terminal.

Portrait orientation is the most comfortable way to play. Fullscreen support varies by browser, especially on iPhone. When the orientation or size changes, a running flight is paused and your score is kept; if needed, empty space may appear beside the game view. A new flight is created for the new screen size.

## Files and customization

| File | Purpose |
|---|---|
| `index.html` | Loading, home, game overlays and settings |
| `styles.css` | Responsive layout, colors and UI |
| `engine.js` | Physics, collision, pipe generation, scoring and the 20s scene timer |
| `storage.js` | IndexedDB, localStorage fallback and save validation |
| `game.js` | Canvas drawing, image/audio loading, controls and UI events |
| `assets/background-1.png` | First background image |
| `assets/background-2.png` | Second background image |
| `assets/mithai.png` | Character image: Mithai |
| `assets/riaan.png` | Character image: Riaan |
| `assets/logo.png` | Game logo |

All five original image files are included without edits. Backgrounds use proportional **cover** rendering: they are not stretched, but depending on the screen shape the sides or the top/bottom may be cropped. Character images are scaled proportionally. A smaller in-memory copy of each character is used for rendering; the original PNG files remain unchanged.

To change speed, gap or spacing, edit `MODES` in `engine.js`; gravity and flap impulse are nearby. To change colors, edit `styles.css`. Keep the asset filenames the same, or update their references in the HTML, CSS and `game.js`.

## Deployment

This project is a static website, so no backend or build step is needed. The live version at **https://flying-buddies.netlify.app/** is hosted on Netlify. To host it yourself, upload the complete contents of this folder to any static website host, with `index.html` at the site root.

High scores stay local to each player's browser; this is not a shared online leaderboard.

## Validation

The package was checked for JavaScript syntax, image references, source-image integrity, and scripted game/storage scenarios. Automated checks cover scoring, collision, pause timing, both 20-second background changes, deterministic fixed-step play, high-score persistence/fallback and reset. Live browser/device testing was not performed in the environment where these automated checks were run.
