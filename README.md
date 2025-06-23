# 📸 Masbox

![npm](https://img.shields.io/npm/v/masbox?color=blue&label=npm)
![license](https://img.shields.io/npm/l/masbox?color=green&label=license)
![size](https://img.shields.io/bundlephobia/minzip/masbox?label=minzipped)

> A lightweight, touch-friendly, and fully customizable JavaScript image lightbox — with zoom, drag, swipe, caption, thumbnails, and more.

---

## 🌟 Features

- ✅ No dependencies (Vanilla JS)
- 🔍 Zoom & drag gesture (mouse + touch)
- 🧭 Swipe navigation (touch support)
- 🖼️ Thumbnails & pagination
- 💬 Captions
- 📲 Share menu
- 🖥️ Fullscreen mode
- ♿ Accessible via keyboard
- 🔄 Loop support
- 🧩 Event hooks (onOpen, onZoom, onClose, onMove, onShare)

---

## 📦 Installation

### Via NPM

```bash
npm install masbox
```

### Via CDN
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/masbox/dist/masbox.min.css" />
<script src="https://cdn.jsdelivr.net/npm/masbox/dist/masbox.umd.min.js"></script>
```


## 🚀 Usage

### 1. Add your gallery HTML:

```html
<a href="image-large.jpg" data-masbox="gallery1" data-caption="Beautiful view">
  <img src="image-thumb.jpg" alt="Thumbnail" />
</a>
```

### 2. Initialize Masbox:
```js
<script>
  Masbox.bind('[data-masbox="gallery1"]', {
    loop: true,
    zoom: true,
    caption: true,
    thumbnails: true
  });
</script>
```

## ⚙️ Options

| Option             | Type     | Default | Description                      |
|--------------------|----------|---------|----------------------------------|
| loop               | Boolean  | false   | Enable infinite loop navigation  |
| zoom               | Boolean  | true    | Enable zoom in/out               |
| caption            | Boolean  | true    | Show image captions              |
| thumbnails         | Boolean  | false   | Display thumbnail navigation     |
| share              | Boolean  | false   | Enable share menu                |
| fullscreen         | Boolean  | false   | Enable fullscreen mode           |
| fullscreenIcon     | Boolean  | false   | Show fullscreen toggle button    |
| fullscreenIconSize | String   | 24px    | Size of fullscreen icon          |
| fullscreenIconTimer| Boolean  | false   | Auto-hide fullscreen icon        |
| minZoom            | Number   | 1       | Minimum zoom scale               |
| maxZoom            | Number   | 2       | Maximum zoom scale               |


## 🧪 Demo
👉 [Live Demo (GitHub Pages)](https://masdian.space)  
Atau clone repositori ini dan buka file `/demo/index.html` secara lokal.


## 📦 Build / Dev

```bash
# Dev mode
npm run dev

# Production build
npm run build
```

## 🛠 Framework Usage

You can use Masbox in React, Vue, or any other framework by:
- Loading it via CDN or NPM
- Initializing in useEffect / mounted lifecycle

### Example: React
```js
useEffect(() => {
  Masbox.bind('[data-masbox="gallery"]');
}, []);
```

## 🧹 File Structure
```bash
masbox/
├── dist/               → compiled & minified output
├── src/                → source JS & CSS
├── demo/               → demo/test page
├── package.json
├── vite.config.js
└── README.md
```
## 📃 License
MIT License © 2025 Dian Aldiansyah




