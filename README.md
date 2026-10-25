<p align="center">
  <img src="assets/borderlens-wordmark-light-cropped.png" alt="BorderLens Logo" width="460" />
</p>

<p align="center">
  <strong>Enterprise-Grade, Local-First Photobooth Studio for Windows</strong><br />
  Engineered for live events, weddings, corporate activations, and unattended kiosk operations.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=flat-square&logo=windows" alt="Platform" />
  <img src="https://img.shields.io/badge/Electron-v43.4-47848F?style=flat-square&logo=electron" alt="Electron" />
  <img src="https://img.shields.io/badge/React-v19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-v20%2B-339933?style=flat-square&logo=node.js" alt="Node" />
  <img src="https://img.shields.io/badge/Architecture-x64-blueviolet?style=flat-square" alt="Arch" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

<p align="center">
  <a href="https://github.com/froshitech/BorderLens/releases/latest">
    <img src="https://img.shields.io/badge/Download-Installer%20(.exe)-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Download Installer" />
  </a>
  &nbsp;
  <a href="https://github.com/froshitech/BorderLens/releases/latest">
    <img src="https://img.shields.io/badge/Download-Portable%20(.zip)-6f42c1?style=for-the-badge&logo=windows&logoColor=white" alt="Download Portable ZIP" />
  </a>
  &nbsp;
  <a href="https://github.com/froshitech/BorderLens/releases">
    <img src="https://img.shields.io/badge/Releases-v1.0.0-24292e?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Releases" />
  </a>
</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System & Hardware Requirements](#-system--hardware-requirements)
- [Installation & Download Guide (Windows)](#-installation--download-guide-windows)
- [Quick Start Guide (For Event Day Operators)](#-quick-start-guide-for-event-day-operators)
- [Developer Guide (Building from Source)](#-developer-guide-building-from-source)
- [Packaging & Generating Windows `.exe`](#-packaging--generating-windows-exe)
- [Feature Walkthrough](#-feature-walkthrough)
  - [Mobile Remote Shutter (Hands-Free LAN Control)](#1-mobile-remote-shutter-hands-free-lan-control)
  - [Visual Template Editor & Layouts](#2-visual-template-editor--layouts)
  - [Dual-Mode QR Sharing (Local Wi-Fi vs Cloud)](#3-dual-mode-qr-sharing-local-wi-fi-vs-cloud)
  - [Silent Printing Engine](#4-silent-printing-engine)
- [Event-Day Operator Checklist](#-event-day-operator-checklist)
- [Project Architecture](#-project-architecture)
- [Configuration Reference (`.env`)](#-configuration-reference-env)
- [Troubleshooting & FAQ](#-troubleshooting--faq)
- [License](#-license)

---

## 💡 Overview

**BorderLens** is a local-first Windows photobooth application designed to combine the speed and visual polish of modern web software with the reliability of direct hardware control.

Traditional photobooth software often relies on expensive monthly subscriptions, slow cloud dependencies, or dated interfaces. BorderLens solves this by running **100% offline** on your local machine, compositing multi-shot strips in real-time, executing background silent printing, and hosting its own local Wi-Fi mobile distribution server. When internet is available, operators can optionally enable single-tap Cloudinary synchronization for guests using mobile cellular data.

---

## ✨ Key Features

| Capability | Description |
| :--- | :--- |
| 📸 **Dual Camera Engines** | High-performance USB webcam stream or DSLR capture via [digiCamControl](https://digicamcontrol.com/) (Canon, Nikon, Sony). |
| 🎨 **Visual Template Editor** | Built-in canvas to inspect PNG overlays, auto-detect transparent photo cutouts, add slots manually, and configure portrait/landscape aspect ratios. |
| 🎞️ **Real-Time Live Filters** | Five curated filters: **Normal**, **B&W**, **Bright Studio**, **Vintage**, and **Warm Film** applied live to previews and final prints. |
| 🔄 **Multi-Shot & Retake** | Configurable countdown timers (3s, 5s, 10s), mirror toggle, screen flash, and individual frame retakes prior to compositing. |
| 📱 **Mobile Remote Shutter** | Attendants or ITSC staff can trigger countdowns and select templates remotely from any smartphone connected to the booth's Wi-Fi (`:3001/remote`). |
| 🖨️ **Silent Direct Printing** | Background 4R (4x6") printing via Windows driver spooler without popup dialogs. Supports 1–5 copy selection with automatic strip count calculation. |
| 🌐 **Zero-Cloud LAN Sharing** | Local Express microserver generates instant QR codes for guests on booth Wi-Fi to download final strips, raw shots, and boomerang GIFs. |
| ☁️ **Cloud QR Fallback** | Optional Cloudinary sync with 7-day auto-purge for guests using mobile data (4G/5G). Includes privacy eye toggles to shield credentials. |
| 🗃️ **Session Gallery & Bulk Delete** | Browse past sessions, view individual shots, trigger reprints, and use the multi-select tool to bulk delete old sessions safely. |
| ⚡ **Hardware Accelerated UI** | High-framerate CSS and SVG animations with automatic splash screen transitions and light/dark studio themes. |

---

## 🖥 System & Hardware Requirements

### Booth PC Specifications
| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Operating System** | Windows 10 (64-bit) | Windows 11 (64-bit) |
| **Processor** | Intel Core i3 / AMD Ryzen 3 (4-core) | Intel Core i5 / AMD Ryzen 5 or better |
| **Memory (RAM)** | 8 GB RAM | 16 GB RAM |
| **Storage** | 5 GB free disk space | 20+ GB SSD space (Works on `C:\` or any drive) |
| **Display** | 1280 × 720 resolution | 1920 × 1080 Full HD touchscreen |

### Supported Hardware
- **Webcams**: Standard USB UVC webcams (Logitech Brio, C920, C922, Razer Kiyo, etc.)
- **DSLR Cameras**: Canon EOS, Nikon D/Z-series, Sony Alpha supported through [digiCamControl](https://digicamcontrol.com/)
- **Printers**: Dye-sublimation or inkjet photo printers supporting 4x6" (4R) media (DNP DS620A, RX1HS, Citizen CY-02, Epson L-series, Canon SELPHY)

---

## 📥 Installation & Download Guide (Windows)

BorderLens is distributed as pre-packaged, self-contained Windows 64-bit binaries with zero runtime dependencies. You do **not** need Node.js, npm, or Git installed.

| Distribution Package | Target File | Recommended Use Case | Download Link |
| :--- | :--- | :--- | :--- |
| **Windows Installer** | `BorderLens-1.0.0 Setup.exe` | **Recommended**. Automated 1-click install, creates Desktop & Start Menu shortcuts, manages auto-updates. | [**Download Setup.exe**](https://github.com/froshitech/BorderLens/releases/latest) |
| **Portable Edition** | `BorderLens-win32-x64-1.0.0.zip` | Zero installation. Run directly from USB drives or guest accounts without admin privileges. | [**Download Portable ZIP**](https://github.com/froshitech/BorderLens/releases/latest) |

👉 **[View All Releases & Assets on GitHub Releases](https://github.com/froshitech/BorderLens/releases/latest)**

---

### Option 1: Automated Windows Installer (`Setup.exe`) — Recommended

This installs BorderLens on your system, creates a **Desktop shortcut**, registers the app in your **Start Menu**, and automatically manages future updates.

1. **Download the Installer**:
   - Go to **[GitHub Releases](https://github.com/froshitech/BorderLens/releases/latest)** and download **`BorderLens-1.0.0 Setup.exe`**.
2. **Run the Installer**:
   - Double-click `BorderLens-1.0.0 Setup.exe`.
3. **Windows SmartScreen (If Prompted)**:
   - If Windows displays *"Windows protected your PC"* (standard for open-source applications without a purchased EV code-signing certificate):
     1. Click **More info**.
     2. Click **Run anyway**.
4. **1-Click Launch**:
   - BorderLens installs quietly into `%LOCALAPPDATA%\borderlens\`, places a **BorderLens** icon on your Desktop, and immediately launches into the photo booth studio.
   - For all future sessions, double-click the **BorderLens** shortcut on your Desktop or search for it in your Windows Start Menu.

---

### Option 2: Portable ZIP Package (Zero Installation Required)

Ideal for running from a USB thumb drive, portable external SSD, or on computers with restricted administrative privileges:

1. **Download the ZIP**:
   - Go to **[GitHub Releases](https://github.com/froshitech/BorderLens/releases/latest)** and download **`BorderLens-win32-x64-1.0.0.zip`**.
2. **Extract**:
   - Right-click the `.zip` file and select **Extract All...** to any folder (e.g., `C:\BorderLens` or your USB drive).
3. **Run**:
   - Open the extracted folder and double-click **`BorderLens.exe`**. It runs immediately with no installation required.

---

### 🔄 Updating BorderLens
- When a new version is released, simply download and run the new `BorderLens-x.x.x Setup.exe`. It automatically upgrades the app while preserving all your captured photos, custom overlays, and operator settings.

### 🗑️ Uninstallation
- To uninstall BorderLens, open Windows **Settings** > **Apps** > **Installed apps**, find **BorderLens**, and click **Uninstall**.
- Your captured photo session directory (`D:\photobooth_output` or `Pictures\photobooth_output`) is preserved and never deleted during uninstall.

---

## 🚀 Quick Start Guide (For Event Day Operators)

Once BorderLens is installed, follow these simple steps to start operating:

1. **Connect Hardware**:
   - Plug in your webcam or DSLR via USB.
   - Connect your photo printer and ensure it is powered on and loaded with 4x6" paper.
2. **Launch BorderLens**:
   - Open the application. The system will start maximized and show the template selection canvas.
3. **Verify Settings (Gear Icon)**:
   - Click the **Settings** gear icon in the top right to verify your camera selection, output directory, and printer.
4. **Storage Directory (No `D:\` drive required)**:
   - All high-resolution strips, raw captures, and boomerang GIFs are automatically saved to your PC:
     - **If a `D:\` drive is present**: Defaults to `D:\photobooth_output\`.
     - **On single-drive computers (`C:\` only)**: Automatically defaults to your user folder at `Pictures\photobooth_output\`.
     - You can also choose any custom folder or external USB drive anytime from **Operator Settings**.

---

## 💻 Developer Guide (Building from Source)

### 1. Prerequisites
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) v20 LTS or newer
- [npm](https://www.npmjs.com/) v10 or newer
- Windows 10 or 11 with Visual Studio C++ Build Tools (required for compiling native module `sharp` if prebuilts are not pulled)

### 2. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/froshitech/BorderLens.git
cd BorderLens

# Install all dependencies
npm install
```

### 3. Launch Development Server
```bash
npm start
```
Electron Forge will start Webpack Dev Server, compile both the main and renderer processes, and launch the BorderLens studio window with Hot Module Replacement (HMR).

---

## 📦 Packaging & Generating Windows `.exe`

BorderLens uses Electron Forge with Webpack and ASAR native-module unpacking to generate clean, self-contained Windows distributions.

> [!IMPORTANT]
> **Before building**: Always close any active development instances (`npm start`) to prevent Windows file-system locking on the `.webpack/` directory.

### Build Executable & Installers:
```bash
npm run make
```

### Output Artifacts (located in `out/`):
- **Windows Setup Installer (`.exe`)**:
  `out/make/squirrel.windows/x64/BorderLens-1.0.0 Setup.exe`
  *Self-extracting Squirrel installer that manages installation and desktop shortcuts.*
- **Portable ZIP Package (`.zip`)**:
  `out/make/zip/win32/x64/BorderLens-win32-x64-1.0.0.zip`
  *Unzip and run `BorderLens.exe` on any Windows PC without installation.*
- **Unpacked Binary Folder**:
  `out/BorderLens-win32-x64/BorderLens.exe`
  *Standalone application folder ready for immediate execution.*

---

## 🔍 Feature Walkthrough

### 1. Mobile Remote Shutter (Hands-Free LAN Control)
Allow attendants, event coordinators, or guests to trigger sessions remotely:
1. Connect the booth computer and mobile device to the same Wi-Fi router.
2. In BorderLens, click **Settings** (gear icon) > **Remote & Network**.
3. Scan the QR code or enter the URL in any mobile browser:
   ```text
   http://<BOOTH-IP>:3001/remote
   ```
4. Attendants can switch between templates, monitor booth live state, and fire the countdown without touching the main touchscreen.

### 2. Visual Template Editor & Layouts
1. Go to **Settings** > **Templates & Overlays** > **Open Visual Template Editor**.
2. Import any transparent PNG overlay (`1200×1800` for 4x6 4R or `600×1800` for 2x6 strips).
3. Click **Auto-Detect Slots** to automatically locate transparent cutout holes, or draw custom photo regions manually.
4. Set the template orientation (Portrait / Landscape) and assign slot order.

### 3. Dual-Mode QR Sharing (Local Wi-Fi vs Cloud)
- **Local Wi-Fi Mode (Default, Offline)**:
  - Generates a local QR code: `http://<BOOTH-IP>:3001/share/<session-id>`.
  - Guests connected to the booth network download their high-resolution strip, individual raw captures, and boomerang GIF directly from the PC.
- **Online Cloud QR Mode**:
  - In **Settings** > **Remote & Network**, select **Online Cloud QR**.
  - Enter your Cloudinary credentials (click the eye icon to shield sensitive values).
  - Sessions upload automatically and produce a universal QR code that guests can scan on cellular data (4G/5G).
  - Uploaded assets automatically expire and clean up after **7 days**.

### 4. Silent Printing Engine
- Configured directly through Windows printing spoolers.
- Adjust **Print Quantity** (1 to 5 copies) on the result screen.
- For 2x6 photo strips, BorderLens prints two duplicate strips per 4x6 sheet, automatically displaying total strip yields (e.g., *2 Copies = 4 Strips on 4x6*).

### 5. Session Gallery & Bulk Deletion
- Click **Gallery** in the top navigation bar to review all past event sessions.
- **Inspect**: Click any session card to review the composited strip, raw photo frames, animated boomerang GIF, and trigger reprints.
- **Bulk Selection & Cleanup**:
  1. Click **Select / Bulk Delete** in the top-right corner of the gallery.
  2. Select individual sessions via the circular card checkboxes, or click **Select All**.
  3. Click **Delete Selected (N)** to permanently remove the chosen sessions, raw captures, and composite files from the hard drive with a single confirmation.

---

## 📋 Event-Day Operator Checklist

Follow this quick pre-event checklist to ensure smooth booth operations:

- [ ] **Power & Display**: Plug in booth PC, test touch input, and ensure Windows Display Scaling is set to 100%.
- [ ] **Printer Ready**: Load photo paper and ribbon. Turn on the printer and verify Windows printer status is *Ready*.
- [ ] **Camera Connected**: 
  - If using a **Webcam**: Confirm it appears in **Settings** > **Camera**.
  - If using a **DSLR**: Launch digiCamControl, verify camera connection, and set Mode to `DSLR` in BorderLens.
- [ ] **Output Folder**: Verify free disk space (defaults to `Pictures\photobooth_output` on `C:\` or `D:\` if available; customizable in Settings).
- [ ] **Test Session**: Run one full test cycle (Template Selection ➔ 3 Shots ➔ Result Screen ➔ Test Print ➔ Scan QR Code).
- [ ] **Remote Shutter**: Connect attendant phone to local Wi-Fi and verify `/remote` connectivity.

---

## 🏗 Project Architecture

```text
BorderLens/
├── assets/                     # Application icons (.ico, .png)
├── public/                     # Static distribution assets (remote.html, viewer.html)
├── src/
│   ├── assets/                 # Vector wordmarks, logos, and UI graphics
│   ├── components/             # React view components
│   │   ├── TemplateSelect.jsx  # Primary template picker
│   │   ├── CameraView.jsx      # Live viewfinder, countdown, shot retake HUD
│   │   ├── ReviewView.jsx      # Multi-shot preview & filter selection
│   │   ├── ResultView.jsx      # Final strip display, print stepper, QR share
│   │   ├── GalleryView.jsx     # Session archive browser & print manager
│   │   ├── SettingsView.jsx    # Hardware, cloud credentials, layout configs
│   │   └── TemplateEditorView.jsx # Visual canvas slot detection & editor
│   ├── hooks/
│   │   └── useBooth.js         # Centralized state management & device lifecycle
│   ├── utils/
│   │   └── helpers.js          # Image filters, storage keys, formatters
│   ├── themes.js               # Studio color themes & dynamic styles
│   ├── App.jsx                 # Top-level workflow router & studio shell
│   ├── main.js                 # Electron main process, IPC handlers, Sharp rendering, Express LAN server
│   ├── preload.js              # Context-isolated secure IPC bridge
│   ├── renderer.js             # React DOM root entry
│   ├── templates.js            # Template initialization & Sharp thumbnail generator
│   ├── index.html              # Full-bleed SVG animated splash screen
│   └── index.css               # Design system tokens, layouts, and responsive CSS
├── forge.config.js             # Electron Forge packaging & native module ASAR unpack configuration
├── webpack.main.config.js      # Main process Webpack build rules
├── webpack.renderer.config.js  # Renderer Webpack build rules
└── package.json                # Project dependencies, build targets, and scripts
```

---

## ⚙️ Configuration Reference (`.env`)

You can create a `.env` file in the project root to configure default values:

```env
# Optional Cloudinary Credentials (can also be configured via Operator Settings UI)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional hosted mobile web viewer URL (e.g. GitHub Pages or Vercel)
CLOUDINARY_VIEWER_URL=https://your-username.github.io/BorderLens/viewer.html

# Local server port (Default: 3001)
PORT=3001
```

---

## ❓ Troubleshooting & FAQ

#### 1. The DSLR camera is not capturing
- Ensure digiCamControl is running in the background with the camera powered on.
- Check USB cable connection and verify Windows recognizes the camera in Device Manager.
- In BorderLens **Settings**, verify the digiCamControl path is correctly located.

#### 2. The QR Code does not open on phones
- **Local Wi-Fi Mode**: Ensure the phone is connected to the exact same Wi-Fi router as the booth computer. Ensure Windows Firewall is not blocking port `3001`.
- **Online Cloud Mode**: Check your internet connection and verify your credentials using the **Test Cloud Connection** button in Settings.

#### 3. Photos are not printing silently
- Verify the printer driver is installed and set as the default printer in Windows.
- Ensure the printer paper size is set to 4x6" (100x150mm) in Windows Printer Properties.

#### 4. The packaging command (`npm run make`) fails with `EPERM`
- This occurs if an active instance of BorderLens (`npm start`) is running and locking `.webpack`. Close the application and terminal, then re-run `npm run make`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
