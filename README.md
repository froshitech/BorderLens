# BorderLens

BorderLens is a local-first Windows photobooth application for webcam and DSLR capture, template compositing, silent printing, and LAN-based mobile sharing. It runs entirely on the booth computer by default, with optional Cloudinary sharing for guests using mobile data.

## Highlights

- Webcam and digiCamControl DSLR capture
- Multi-shot sessions with countdowns and individual shot retakes
- PNG template overlays with alpha-channel photo-slot detection
- Real-time Normal, B&W, Bright, Vintage, and Warm Film filters
- Animated multi-shot boomerang preview
- Silent 4R printing through Electron
- Local Express sharing portal with QR codes for phones on the same LAN
- Optional Cloudinary QR sharing that works over mobile data, with automatic 7-day cleanup
- Gallery session browsing and deletion
- Configurable output directory and persistent camera preferences
- Built-in Classic, Floral, and Neon templates

## Tech stack

- Electron 43
- Electron Forge 7
- React 19
- Sharp 0.35
- Express 5
- Webpack
- digiCamControl integration for supported DSLR workflows

## Requirements

- Windows 10 or later
- Node.js 20 or newer recommended
- A webcam, or a supported camera configured in digiCamControl
- A configured printer for silent 4R output
- Phones and the booth computer on the same LAN for QR sharing

DSLR capture is optional. If digiCamControl is not installed in one of the standard locations, choose its installation directory from Operator Settings.

## Local development

```bash
npm install
npm start
```

The application stores generated photos outside the repository. By default it uses `D:\photobooth_output` when that drive is available, otherwise it uses the user's Pictures folder. The output location can be changed from Operator Settings.

## Building distributions

Build the packaged application:

```bash
npm run package
```

Build Windows release artifacts for GitHub Releases:

```bash
npm run make
```

The Windows build produces a Squirrel `Setup.exe` installer and a Windows portable ZIP in the `out/` directory. Sharp's native modules are configured to unpack correctly when packaged.

## LAN sharing

The local sharing server listens on port `3001`. The QR code points to a LAN URL containing the session's final strip, individual shots, and boomerang download. No external upload or cloud storage is used.

## Optional Cloudinary sharing

Operator Settings supports an Online Cloud QR mode. Cloudinary credentials stay in the
local `.env` file. The app uploads the final strip, raw shots, and boomerang for each
session. Set `CLOUDINARY_VIEWER_URL` to the public URL of `src/public/viewer.html`
(for example, a GitHub Pages deployment) to make the QR open the multi-asset mobile
gallery. The QR passes only signed public asset URLs, never credentials. If the viewer
URL is empty, the QR safely falls back to the direct Cloudinary final-strip URL.

Cloudinary credentials are stored locally in the Electron user-data directory and are
not committed to the repository. Uploaded resources are tagged as photobooth sessions
and the application attempts to remove resources older than seven days at startup,
after uploads, and from the Settings connection test. If Cloudinary is unavailable,
the Result and Gallery screens fall back to the existing local LAN QR link.

## Project structure

```text
src/App.jsx       React workflow and studio UI
src/main.js       Electron main process, capture, processing, printing, and LAN server
src/preload.js    Secure renderer IPC bridge
src/templates.js  Built-in template generation
src/index.css     Studio theme and layout
forge.config.js   Electron Forge packaging configuration
```

## License

This project is released under the MIT license.
