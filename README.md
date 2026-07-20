# GenxAI Asset — Login Screen (Expo)

A React Native (Expo) login screen styled after a navy/blue asset-management
theme. Built to run instantly in **Expo Go**.

## Features

- **Colors are pulled directly from your website's CSS variables** (`:root`
  and `.light` in your `globals.css`) — not an approximation. Dark mode uses
  `--bg #0a1426`, `--card #111e37`, `--text-pri #e9eff6`, etc.; light mode
  uses `--bg #eef1f6`, `--card #f2f5f9`, `--text-pri #111827`, etc. See
  `src/theme/colors.js` for the full mapping with comments back to each CSS
  variable.
- **Same fonts as the website**: headings use **Exo 2** (matching
  `.page-title`), body/labels use **DM Sans** (matching `body` font-family).
- **Light/dark theme toggle** (top-right button), using the same
  blue → green brand gradient (`--accent-gradient`) for the logo box, card
  top border, and Sign In button (`--gradient-success`).
- Feature chips (Dual-mode / Full lifecycle / Dynamic RBAC) under the hero
  text, same as the web app.

## Folder structure

```
GenxAssetApp/
├── App.js                     # Entry point, renders LoginScreen
├── app.json                   # Expo app config
├── babel.config.js
├── package.json
├── assets/                    # App icon/splash images (add your own)
└── src/
    ├── screens/
    │   └── LoginScreen.js      # The login screen UI + logic
    ├── components/
    │   ├── InputField.js       # Reusable text input w/ icon + focus state
    │   └── PrimaryButton.js    # Reusable primary action button
    └── theme/
        └── colors.js           # ALL colors, spacing, radius, font sizes
```

## Setup

1. Install [Node.js LTS](https://nodejs.org) if you don't have it.
2. Install the Expo CLI (only needed once globally, or use npx):
   ```bash
   npm install -g expo-cli
   ```
3. Inside the `GenxAssetApp` folder, install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npx expo start
   ```
5. Open the **Expo Go** app on your phone and scan the QR code shown in the
   terminal / browser tab. The app must be on the **same Wi-Fi network** as
   your computer.

## Keeping colors in sync with the website

Every color in the app is centralized in `src/theme/colors.js`, each line
commented with the matching CSS variable name from your website
(e.g. `#0a1426, // --bg`). If your website's `globals.css` changes, update
the hex/rgba values in that one file and the whole app follows.

## Next steps (when you're ready)

- Wire up `handleLogin` in `LoginScreen.js` to your real authentication API
  (replace the `setTimeout` mock with a `fetch`/`axios` call).
- Add a logo image: drop a PNG into `assets/` and use `<Image source={...} />`
  in place of the `Ionicons` icon in the header.
- Add navigation (e.g. `@react-navigation/native`) once you have more than
  one screen.
