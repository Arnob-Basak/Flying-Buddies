# Flying Buddies

A mobile-friendly Flappy Bird-style game made with **HTML, CSS, JavaScript and Canvas 2D**, using your five supplied images. No framework, npm installation, CDN, external font, API key, or internet connection is needed for local play.

## Laptop-এ সবচেয়ে সহজে চালানো

1. `Flying-Buddies.zip` download করো।
2. ZIP-এর ওপর right-click → **Extract All** করো। ZIP-এর ভেতর থেকে সরাসরি চালাবে না।
3. Extract করা `Flying-Buddies` folder-এর **index.html** double-click করো। Chrome, Edge, Firefox বা Safari-তে খুলবে।
4. **Mithai** অথবা **Riaan** choose করে **Play** চাপো। এরপর click বা Space দিয়ে উড়বে।

`index.html`, CSS/JS files ও `assets` folder একসঙ্গে রাখতে হবে। শুধু HTML file অন্য folder-এ নিলে ছবিগুলো load হবে না।

## Controls

| Action | Phone / tablet | Laptop |
|---|---|---|
| Flap / first takeoff | Tap the game area | Click, Space, ↑ or W |
| Pause / resume | Pause button | Pause button, P or Esc |
| Retry | Fly again | Fly again |
| Switch buddy | Choose a buddy / home | Choose a buddy / home |

Home-এর **Play** চাপলে ready screen আসবে। প্রথম tap/click/Space-এ flight শুরু হবে। প্রতিটি pipe pair পুরো পার করলে **১ point**। Pipe, screen-এর top, বা ground-এ character-এর core hitbox লাগলে flight শেষ। Character-এর হাত-পায়ের প্রান্তে hitbox নেই, যাতে phone-এ খেলা একটু সহজ হয়।

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

Then open **http://localhost:8000**. Alternatively open the folder in VS Code and choose **Open with Live Server** on `index.html`. Keep using the same address and port for the same score history.

## Phone-এ laptop থেকে খেলা

1. Laptop ও phone একই Wi-Fi-তে connect করো।
2. Game folder-এ terminal খুলে চালাও:

```powershell
py -m http.server 8000 --bind 0.0.0.0
```

If needed, replace `py` with `python`.

3. Windows terminal-এ `ipconfig` লিখে Wi-Fi adapter-এর **IPv4 Address** দেখো।
4. Phone-এর browser-এ `http://YOUR-LAPTOP-IP:8000` খোলো। যেমন IP যদি `192.168.1.7` হয়, address হবে `http://192.168.1.7:8000`।
5. Windows Firewall prompt এলে নিজের private/home network-এর জন্য allow করো।
6. Server বন্ধ করতে terminal-এ **Ctrl+C** চাপো।

Portrait-এ খেলা সবচেয়ে সুবিধাজনক। Fullscreen support browser অনুযায়ী আলাদা, বিশেষত iPhone-এ। Orientation/size বদলালে running flight pause হয়, score থাকে, প্রয়োজন হলে game view-এর পাশে ফাঁকা জায়গা দেখা যায়। নতুন flight নতুন screen size অনুযায়ী তৈরি হয়।

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

## Putting it on a website later

This folder is a static website. Upload its complete contents to any static website host, with `index.html` at the site root. No backend build step is needed. This ZIP does not itself publish the game online. High scores remain local to each player's browser; this is not a shared online leaderboard.

## Validation

The package was checked for JavaScript syntax, image references, source-image integrity, and scripted game/storage scenarios. Automated checks cover scoring, collision, pause timing, both 20-second background changes, deterministic fixed-step play, high-score persistence/fallback and reset. Live browser/device testing was not performed in this environment.
