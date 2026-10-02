# Pip's Playroom

A toddler learning app for iPad and iPhone Safari. It has 13 activities: Balloons, Paint, Color Sort, Count, Bubbles, Rocket, Find It!, Peekaboo, Body Parts, Shapes, Xylophone, Drums and Animal Band. All the art and sound is generated in the browser, and Pip speaks with the device voice or a free natural voice pack (see `VOICE.md`).

## Publish with GitHub Pages
1. Push this repo to GitHub.
2. Go to Settings → Pages → Build and deployment → Deploy from a branch → `main` / **`/docs`**.
3. On the iPad, open the Pages URL in Safari, then tap Share → **Add to Home Screen**. The app opens full-screen and works offline after the first visit.

## Grown-up settings
Press and hold the gear on the home screen for 2 seconds. From there you can:
- add his name
- choose the voice (natural pack or device voice)
- set the volume and background music
- set the challenge level
- choose how the home button works in games (tap twice by default)
- set a play timer — Pip plays a lullaby and says bye-bye; hold the moon to keep playing
- hide activities
- reset stickers

**Lock the iPad into the app:** go to Settings → Accessibility → Guided Access, turn it on, then triple-click the top button inside the app.

## Working on it
See `CLAUDE.md` for the code layout and build and test commands, and `GAME_API.md` for how activities are built.
