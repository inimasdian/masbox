(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.Masbox = {}));
})(this, function(exports2) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  const _Masbox = class _Masbox {
    static bind(selector, options = {}) {
      document.querySelectorAll(selector).forEach((el) => {
        const group = el.dataset.masbox || "__masbox-single__";
        el.dataset.masbox = group;
        const exists = _Masbox.bindings.find((b) => b.group === group);
        if (!exists) {
          _Masbox.bindings.push({ group, selector, options });
        }
        if (!el.querySelector(".masbox-zoom-icon") && options.fullscreenIcon !== false) {
          const icon = document.createElement("span");
          const size = options.fullscreenIconSize || "30px";
          icon.className = "masbox-zoom-icon";
          icon.innerHTML = `
					<svg class="fullscreen" width="${parseInt(size)}" height="${parseInt(size)}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="none">
						<path d="M1 7.25V3.5a2.5 2.5 0 0 1 2.5-2.5H7.25M21 14.75V18.5a2.5 2.5 0 0 1-2.5 2.5H14.75M14.75 1H18.5a2.5 2.5 0 0 1 2.5 2.5V7.25M7.25 21H3.5a2.5 2.5 0 0 1-2.5-2.5V14.75" 
						stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				`;
          el.classList.add("masbox-has-icon");
          el.appendChild(icon);
          if (options.fullscreenIconTimer) {
            requestAnimationFrame(() => {
              icon.style.opacity = "1";
            });
            setTimeout(() => {
              icon.style.opacity = "0";
            }, 2e3);
          }
        }
        el.addEventListener("click", (e) => {
          var _a;
          e.preventDefault();
          const gallery = [...document.querySelectorAll(`[data-masbox="${group}"]`)];
          const index = gallery.indexOf(el);
          const config = ((_a = _Masbox.bindings.find((b) => b.group === group)) == null ? void 0 : _a.options) ?? {};
          new _Masbox(gallery, index, config).open();
        });
      });
    }
    constructor(gallery, index = 0, options = {}) {
      this.gallery = gallery;
      this.currentIndex = index;
      this.options = {
        loop: true,
        thumbnails: true,
        zoom: true,
        caption: true,
        fullscreen: true,
        fullscreenIcon: true,
        fullscreenIconTimer: true,
        share: true,
        minZoom: 0.5,
        maxZoom: 3,
        flip: true,
        navigation: true,
        rotate: true,
        ...options
      };
      this.zoom = 1;
      this.imageEl = null;
      this.overlay = null;
      this.isDragging = false;
      this.lastX = 0;
      this.lastY = 0;
      this.offsetX = 0;
      this.offsetY = 0;
      this.thumbnails = null;
      this.captionEl = null;
      this.paginationEl = null;
      this.transform = {
        rotate: 0,
        flipH: 1,
        flipV: 1
      };
      this.hasZoomed = false;
    }
    _createItem(platform = null) {
      var _a, _b, _c;
      const linkEl = (_a = this.gallery) == null ? void 0 : _a[this.currentIndex];
      const image = ((_b = this.imageEl) == null ? void 0 : _b.src) || (linkEl == null ? void 0 : linkEl.href) || "";
      const caption = ((_c = this.captionEl) == null ? void 0 : _c.textContent) || (linkEl == null ? void 0 : linkEl.dataset.caption) || "";
      const url = window.location.href;
      const item = { image, caption, url };
      if (platform) item.platform = platform;
      return item;
    }
    updateImageMaxHeight() {
      var _a, _b;
      let deduction = 0;
      if (this.options.caption && ((_a = this.captionEl) == null ? void 0 : _a.offsetHeight)) {
        deduction += this.captionEl.offsetHeight;
      }
      if (this.options.thumbnails && ((_b = this.thumbnails) == null ? void 0 : _b.offsetHeight)) {
        deduction += this.thumbnails.offsetHeight;
      }
      this.overlay.querySelector(".masbox-viewer").style.maxHeight = `calc(100% - ${deduction + 80}px)`;
    }
    handleKeydown(e) {
      if (!this.isOpen) return;
      switch (e.key) {
        case "ArrowRight":
          this.navigate(1);
          break;
        case "ArrowLeft":
          this.navigate(-1);
          break;
        case "Escape":
          this.close();
          break;
      }
    }
    async open() {
      var _a, _b;
      this.isOpen = true;
      this.buildOverlay();
      document.body.appendChild(this.overlay);
      document.body.style.overflow = "hidden";
      await this.animateOpen();
      this.showImage();
      this._onClickOutside = (e) => {
        const viewer = this.overlay.querySelector(".masbox-viewer");
        const shareMenu = this.overlay.querySelector(".masbox-dropdown-menu");
        const allowedSelectors = [
          ".masbox-image",
          ".masbox-toolbar",
          ".masbox-nav",
          ".masbox-thumbnails",
          ".masbox-caption",
          ".masbox-dropdown-menu",
          ".masbox-toolbar-action.share"
        ];
        const clickedInside = allowedSelectors.some(
          (selector) => e.target.closest(selector)
        );
        const isShareMenuVisible = shareMenu && shareMenu.style.display !== "none";
        const clickedOnShareMenu = e.target.closest(".masbox-dropdown-menu");
        const clickedOnShareButton = e.target.closest(".masbox-toolbar-action.share");
        if (isShareMenuVisible && !clickedOnShareMenu && !clickedOnShareButton) {
          shareMenu.style.display = "none";
          return;
        }
        if (!clickedInside && viewer && viewer.contains(e.target)) {
          this.close();
        }
      };
      document.addEventListener("click", this._onClickOutside);
      requestAnimationFrame(() => {
        this.updateImageMaxHeight();
      });
      this.hasZoomed = false;
      (_b = (_a = this.options).onOpen) == null ? void 0 : _b.call(_a, this._createItem());
      document.addEventListener("keydown", this.handleKeydownBound = this.handleKeydown.bind(this));
    }
    getViewerRect() {
      const viewer = this.overlay.querySelector(".masbox-viewer");
      return viewer.getBoundingClientRect();
    }
    animateOpen() {
      return new Promise((resolve) => {
        this.overlay.classList.add("masbox--fade");
        requestAnimationFrame(() => {
          this.overlay.classList.add("masbox--open");
        });
        this.overlay.addEventListener("transitionend", () => {
          resolve();
        }, { once: true });
      });
    }
    animateClose() {
      return new Promise((resolve) => {
        this.overlay.classList.remove("masbox--open");
        this.overlay.addEventListener("transitionend", () => {
          resolve();
        }, { once: true });
      });
    }
    async close() {
      var _a, _b, _c;
      this.isOpen = false;
      if (document.fullscreenElement === this.overlay) {
        await document.exitFullscreen().catch(() => {
        });
      }
      await this.animateClose();
      if ((_a = this.overlay) == null ? void 0 : _a.parentElement) {
        document.body.removeChild(this.overlay);
        this.overlay = null;
      }
      document.body.style.overflow = "";
      if (this._onClickOutside) {
        document.removeEventListener("click", this._onClickOutside);
        this._onClickOutside = null;
      }
      (_c = (_b = this.options).onClose) == null ? void 0 : _c.call(_b, this._createItem());
      document.removeEventListener("keydown", this.handleKeydownBound);
    }
    buildOverlay() {
      var _a, _b, _c, _d;
      this.overlay = document.createElement("div");
      this.overlay.className = "masbox";
      const inner = document.createElement("div");
      inner.className = "masbox-inner";
      const toolbar = document.createElement("div");
      toolbar.className = "masbox-toolbar";
      const toolbarLeft = document.createElement("div");
      const toolbarCenter = document.createElement("div");
      const toolbarRight = document.createElement("div");
      toolbarLeft.className = "masbox-toolbar-group left";
      toolbarCenter.className = "masbox-toolbar-group center";
      toolbarRight.className = "masbox-toolbar-group right";
      toolbarLeft.innerHTML += `<span class="masbox-toolbar-pagination pagination"></span>`;
      if (this.options.zoom) {
        toolbarCenter.innerHTML += `
				<button class="masbox-toolbar-action zoom-in">
					<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
						<path d="M12.14 7.86a.715.715 0 0 0-.71-.72H8.57V4.29a.714.714 0 0 0-1.43 0v2.85H4.28a.714.714 0 0 0 0 1.43h2.85v2.86a.714.714 0 0 0 1.43 0V8.57h2.86a.715.715 0 0 0 .71-.71ZM7.86 0a7.86 7.86 0 0 1 6.03 12.89l5.9 5.89a.715.715 0 0 1-1.01 1.01l-5.89-5.9a7.86 7.86 0 1 1-5.03-13.9Zm0 1.43a6.43 6.43 0 1 0 0 12.86 6.43 6.43 0 0 0 0-12.86Z"/>
					</svg>
				</button>
				<button class="masbox-toolbar-action zoom-out">
					<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
						<path d="M11.43 7.14a.71.71 0 0 1 0 1.43H4.29a.71.71 0 1 1 0-1.43h7.14Zm4.29.71c0-1.79-.61-3.52-1.73-4.91C12.86 1.55 11.3.58 9.56.19 7.82-.2 5.99.02 4.39.81 2.79 1.6 1.5 2.91.74 4.52c-.76 1.61-.96 3.44-.52 5.18.44 1.74 1.44 3.28 2.86 4.4 1.41 1.12 3.16 1.7 5 1.66 1.79-.03 3.51-.67 4.88-1.82l5.89 5.9a.71.71 0 0 0 1.01-1.01l-5.9-5.89c1.19-1.41 1.83-3.21 1.83-5.09Zm-14.29 0a6.43 6.43 0 1 1 12.86 0 6.43 6.43 0 0 1-12.86 0Z"/>
					</svg>
				</button>
				<button class="masbox-toolbar-action reset">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
						<path d="M6.8 0.53c2.3-0.78 4.8-0.7 7.04 0.23 2.24 0.93 4.07 2.64 5.14 4.82 1.07 2.18 1.31 4.67 0.68 7-0.64 2.33-2.1 4.37-4.12 5.72s-4.46 1.91-6.86 1.6C6.29 19.6 4.08 18.42 2.48 16.59 0.88 14.77 0 12.43 0 10c0-0.32 0.26-0.59 0.59-0.59s0.59 0.26 0.59 0.59c0 2.14 0.78 4.21 2.19 5.82 1.41 1.61 3.36 2.65 5.48 2.93 2.11 0.28 4.26-0.22 6.01-1.41s2.95-3.07 3.5-5.14c0.55-2.07 0.34-4.27-0.61-6.18s-2.56-3.45-4.53-4.26c-1.97-0.82-4.17-0.89-6.2-0.2C5.15 2.33 3.44 3.73 2.37 5.58a0.59 0.59 0 1 1-1.04-0.6C2.56 2.89 4.5 1.3 6.8 0.53Z"/>
						<path d="M1.18 0.59a0.59 0.59 0 0 1 1.18 0v4.12h4.12a0.59 0.59 0 1 1 0 1.18H1.76a0.59 0.59 0 0 1-0.59-0.59V0.59Z"/>
					</svg>
				</button>
			`;
      }
      if (this.options.flip) {
        toolbarCenter.innerHTML += `
				<button class="masbox-toolbar-action flip-vertical">
					<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
					<path d="M1 11H2.53846M5.61538 11H7.15385M10.2308 11H11.7692M14.8462 11H16.3846M19.4615 11H21M4.84615 21L11 14.8462L17.1538 21H4.84615ZM4.84615 1L11 7.15385L17.1538 1H4.84615Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
					</svg>
				</button>
				<button class="masbox-toolbar-action flip-horizontal">
					<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
						<path d="M11 21L11 19.4615M11 16.3846L11 14.8462M11 11.7692L11 10.2308M11 7.15385L11 5.61538M11 2.53846L11 1M1 17.1538L7.15385 11L1 4.84615V17.1538ZM21 17.1538L14.8462 11L21 4.84615V17.1538Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
					</svg>
				</button>
			`;
      }
      if (this.options.rotate) {
        toolbarCenter.innerHTML += `
				<button class="masbox-toolbar-action rotate">
					<svg viewBox="0 0 15 22" xmlns="http://www.w3.org/2000/svg">
						<path d="M14.7801 2.4149L12.5302 0.215099C12.4253 0.112427 12.2917 0.0424898 12.1461 0.0141484C12.0006 -0.014193 11.8497 0.000324438 11.7126 0.055875C11.5755 0.111425 11.4583 0.205503 11.3759 0.326199C11.2935 0.446894 11.2496 0.588782 11.2497 0.733898V2.20046H3.00035C2.40366 2.20046 1.83141 2.43223 1.40949 2.84479C0.987565 3.25735 0.750531 3.8169 0.750531 4.40035V13.1999C0.750531 13.3944 0.829543 13.5809 0.970184 13.7184C1.11083 13.8559 1.30158 13.9332 1.50047 13.9332C1.69937 13.9332 1.89012 13.8559 2.03076 13.7184C2.1714 13.5809 2.25041 13.3944 2.25041 13.1999V4.40035C2.25041 4.20586 2.32942 4.01935 2.47007 3.88183C2.61071 3.74431 2.80146 3.66705 3.00035 3.66705H11.2497V5.13364C11.2496 5.27875 11.2935 5.42064 11.3759 5.54134C11.4583 5.66203 11.5755 5.75611 11.7126 5.81166C11.8497 5.86721 12.0006 5.88173 12.1461 5.85339C12.2917 5.82505 12.4253 5.75511 12.5302 5.65245L14.7801 3.45256C14.8498 3.38446 14.9051 3.30359 14.9428 3.21456C14.9806 3.12554 15 3.03012 15 2.93376C15 2.83739 14.9806 2.74197 14.9428 2.65295C14.9051 2.56393 14.8498 2.48305 14.7801 2.4149ZM3.00035 16.1331C3.19925 16.1331 3.39 16.2103 3.53064 16.3478C3.67128 16.4854 3.7503 16.6719 3.7503 16.8664V18.333H11.9996C12.1985 18.333 12.3893 18.2557 12.5299 18.1182C12.6706 17.9807 12.7496 17.7941 12.7496 17.5997V8.80012C12.7496 8.60563 12.8286 8.41912 12.9692 8.2816C13.1099 8.14408 13.3006 8.06682 13.4995 8.06682C13.6984 8.06682 13.8892 8.14408 14.0298 8.2816C14.1705 8.41912 14.2495 8.60563 14.2495 8.80012V17.5997C14.2495 18.1831 14.0124 18.7426 13.5905 19.1552C13.1686 19.5678 12.5963 19.7995 11.9996 19.7995H3.7503V21.2661C3.75041 21.4112 3.70649 21.5531 3.6241 21.6738C3.5417 21.7945 3.42453 21.8886 3.28742 21.9441C3.15032 21.9997 2.99944 22.0142 2.85389 21.9859C2.70833 21.9575 2.57465 21.8876 2.46977 21.7849L0.219948 19.5851C0.150221 19.5169 0.0949061 19.4361 0.0571659 19.3471C0.0194256 19.258 0 19.1626 0 19.0662C0 18.9699 0.0194256 18.8745 0.0571659 18.7854C0.0949061 18.6964 0.150221 18.6155 0.219948 18.5474L2.46977 16.3476C2.53947 16.2795 2.6222 16.2255 2.71324 16.1887C2.80428 16.1519 2.90184 16.133 3.00035 16.1331Z"
						fill="currentColor"/>
					</svg>
				</button>
			`;
      }
      if (this.options.share) {
        toolbarRight.innerHTML += `
				<div class="masbox-dropdown">
					<button class="masbox-toolbar-action share">
						<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
							<path d="M8.11 2.2a.68.68 0 0 1 .69.69.68.68 0 0 1-.69.69H3.99A2.61 2.61 0 0 0 1.37 6.19v11.82a3 3 0 0 0 3 3h11.83a3 3 0 0 0 3-3v-3.57a.68.68 0 1 1 1.37 0v3.57a4.36 4.36 0 0 1-4.37 4.37H3.99A4.36 4.36 0 0 1 0 18.01V6.19A4.36 4.36 0 0 1 3.99 2.2h4.12Zm4.94-2.14a.68.68 0 0 1 .73.11l7.97 6.74a.69.69 0 0 1-.08 1.1l-7.98 7.29a.69.69 0 0 1-1.18-.5V11.57c-3.54.18-6.12 2.94-7.68 5.07a.69.69 0 0 1-1.2-.38c-.15-2.2.41-5.14 1.91-7.55 1.39-2.29 3.67-4.1 6.97-4.34V.69a.69.69 0 0 1 .54-.65Zm.01 6.47c-3.05.02-5.14 1.62-6.43 3.74-.79 1.36-1.32 3.03-1.44 4.37 1.53-1.64 3.1-2.56 4.62-3.32 1.45-.7 2.84-.88 4.38-.88v2.29l6.25-5.71-6.25-5.28v2.49Z"/>
						</svg>
					</button>
					<div class="masbox-dropdown-menu" style="display: none;">
						<button class="masbox-dropdown-menu__item share-btn share-facebook" data-platform="facebook">
							<svg viewBox="0 0 11 20" xmlns="http://www.w3.org/2000/svg">
								<path fill="currentColor" d="M7 11.5h2.5l1-4H7V5.5c0-1 .2-2 2-2H10.5V0.14C10.2 0.1 9 0 7.64 0 4.93 0 3 1.66 3 4.7V7.5H0v4h3V20h4V11.5Z"/>
							</svg>

							Facebook
						</button>

						<button class="masbox-dropdown-menu__item share-btn share-twitter" data-platform="twitter">
							<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
								<path fill="currentColor" d="M11.9028 8.46875L19.3482 0H17.5837L11.1191 7.35313L5.95554 0H0L7.80819 11.1194L0 20H1.7645L8.59159 12.2348L14.0445 20H20L11.9023 8.46875H11.9028ZM9.48614 11.2172L8.69491 10.11L2.4002 1.29969H5.11034L10.19 8.41L10.9811 9.51719L17.5845 18.7594H14.8746L9.48614 11.2177V11.2172Z"/>
							</svg>
							Twitter
						</button>

						<button class="masbox-dropdown-menu__item share-btn share-linkedin" data-platform="linkedin">
							<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
								<path fill="currentColor" d="M17.778 0C18.367 0 18.932 0.234 19.349 0.651 19.766 1.068 20 1.633 20 2.222V17.778C20 18.367 19.766 18.932 19.349 19.349 18.932 19.766 18.367 20 17.778 20H2.222C1.633 20 1.068 19.766 0.651 19.349 0.234 18.932 0 18.367 0 17.778V2.222C0 1.633 0.234 1.068 0.651 0.651 1.068 0.234 1.633 0 2.222 0H17.778ZM17.222 17.222V11.333C17.222 10.373 16.841 9.451 16.161 8.772 15.482 8.093 14.561 7.711 13.6 7.711 12.656 7.711 11.556 8.289 11.022 9.156V7.922H7.922V17.222H11.022V11.744C11.022 10.889 11.711 10.189 12.567 10.189 12.979 10.189 13.375 10.353 13.667 10.645 13.958 10.936 14.122 11.332 14.122 11.744V17.222H17.222ZM4.311 6.178C4.806 6.178 5.281 5.981 5.631 5.631 5.981 5.281 6.178 4.806 6.178 4.311 6.178 3.278 5.344 2.433 4.311 2.433 3.813 2.433 3.335 2.631 2.983 2.983 2.631 3.335 2.433 3.813 2.433 4.311 2.433 5.344 3.278 6.178 4.311 6.178ZM5.856 17.222V7.922H2.778V17.222H5.856Z"/>
							</svg>

							LinkedIn
						</button>

						<button class="masbox-dropdown-menu__item share-btn share-whatsapp" data-platform="whatsapp">
							<svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.933 11.933 0 0 1-1.587-5.946C.157 5.317 5.48 0 12.078 0c3.19 0 6.167 1.24 8.413 3.487a11.803 11.803 0 0 1 3.493 8.412c-.003 6.598-5.316 11.92-11.916 11.92a11.9 11.9 0 0 1-5.947-1.588L.057 24zm6.597-3.807c1.735.995 3.276 1.591 5.425 1.593 5.448 0 9.884-4.43 9.887-9.881.002-5.462-4.415-9.89-9.881-9.893-5.454 0-9.886 4.433-9.888 9.887a9.876 9.876 0 0 0 1.604 5.291l-.999 3.648 3.852-.945zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.15-1.758-.868-2.03-.967-.272-.099-.47-.148-.669.15-.198.297-.767.967-.94 1.164-.173.198-.347.223-.644.074-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.134.298-.347.446-.52.151-.174.2-.298.3-.497.1-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.21-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.007-1.413.248-.695.248-1.29.173-1.413z"/></svg>
							WhatsApp
						</button>

						<button class="masbox-dropdown-menu__item share-btn share-telegram" data-platform="telegram">
							<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
								<path fill="currentColor" d="M10 0C15.523 0 20 4.477 20 10S15.523 20 10 20 0 15.523 0 10 4.477 0 10 0ZM14.442 6C14.061 6.007 13.476 6.207 10.663 7.362 8.688 8.186 6.719 9.024 4.756 9.874 4.276 10.063 4.025 10.247 4.003 10.427 3.959 10.773 4.463 10.88 5.097 11.084 5.614 11.25 6.31 11.444 6.672 11.452 7 11.459 7.366 11.325 7.77 11.052 10.529 9.212 11.954 8.282 12.043 8.263 12.106 8.249 12.193 8.231 12.253 8.283 12.312 8.335 12.306 8.433 12.299 8.46 12.249 8.671 9.658 10.998 9.509 11.151L9.437 11.223C8.887 11.766 8.332 12.121 9.29 12.744 10.156 13.307 10.66 13.666 11.55 14.244 12.12 14.612 12.567 15.049 13.155 14.996 13.426 14.971 13.705 14.72 13.848 13.97 14.183 12.2 14.843 8.362 14.995 6.78 15.005 6.649 14.999 6.517 14.978 6.387 14.966 6.282 14.914 6.186 14.834 6.117 14.713 6.019 14.525 5.999 14.442 6Z"/>
							</svg>
							Telegram
						</button>

						<button class="masbox-dropdown-menu__item share-btn share-email" data-platform="email">
							<svg viewBox="0 0 25 20" xmlns="http://www.w3.org/2000/svg">
								<path fill="currentColor" d="M0 2.5C0 1.837 0.263 1.201 0.732 0.732 1.201 0.263 1.837 0 2.5 0H22.5C23.163 0 23.799 0.263 24.268 0.732 24.737 1.201 25 1.837 25 2.5V17.5C25 18.163 24.737 18.799 24.268 19.268 23.799 19.737 23.163 20 22.5 20H2.5C1.837 20 1.201 19.737 0.732 19.268 0.263 18.799 0 18.163 0 17.5V2.5ZM4.399 2.5L12.5 9.589 20.601 2.5H4.399ZM22.5 4.161L13.324 12.191C13.096 12.391 12.803 12.501 12.5 12.501S11.904 12.391 11.676 12.191L2.5 4.161V17.5H22.5V4.161Z"/>
							</svg>

							Email
						</button>

						<button class="masbox-dropdown-menu__item share-btn copy-link" data-platform="copy-link">
							<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" fill="none">
								<path d="M7.25 14.75L14.75 7.25M9.75 3.5l.58-.67a7 7 0 0 1 9.84 9.84l-.67.58M12.25 18.5l-.5.67a7 7 0 0 1-9.2-10.34l.67-.58" 
								stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>

							<span>Copy Link</span>
						</button>
						</div>

				</div>
			`;
      }
      if (this.options.thumbnails) {
        toolbarRight.innerHTML += `<button class="masbox-toolbar-action thumbnails">
				<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" fill="none">
					<path d="M18.78 1H3.22C1.99 1 1 1.99 1 3.22v11.11c0 1.23.99 2.22 2.22 2.22h15.56c1.23 0 2.22-.99 2.22-2.22V3.22C21 1.99 20.01 1 18.78 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M2.11 21h1.11M7.67 21h1.11M13.22 21h1.11M18.78 21h1.11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>`;
      }
      if (this.options.fullscreen) {
        toolbarRight.innerHTML += `<button class="masbox-toolbar-action fullscreen">
				<svg class="fullscreen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="none">
					<path d="M1 7.25V3.5a2.5 2.5 0 0 1 2.5-2.5H7.25M21 14.75V18.5a2.5 2.5 0 0 1-2.5 2.5H14.75M14.75 1H18.5a2.5 2.5 0 0 1 2.5 2.5V7.25M7.25 21H3.5a2.5 2.5 0 0 1-2.5-2.5V14.75" 
					stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>`;
      }
      toolbarRight.innerHTML += `<button class="masbox-toolbar-action close">
			<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
  				<path d="M21 21L1 1M21 1L1 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			</svg>
		</button>`;
      toolbar.appendChild(toolbarLeft);
      toolbar.appendChild(toolbarCenter);
      toolbar.appendChild(toolbarRight);
      const viewer = document.createElement("div");
      viewer.className = "masbox-viewer";
      const image = document.createElement("img");
      image.className = "masbox-image";
      viewer.appendChild(image);
      const caption = document.createElement("div");
      caption.className = "masbox-caption";
      const nav = document.createElement("div");
      nav.className = "masbox-navigation";
      if (this.options.navigation) {
        nav.innerHTML = `
				<button class="prev">
					<svg xmlns="http://www.w3.org/2000/svg" width="11" height="20" viewBox="0 0 11 20" fill="none">
						<path d="M10.2 0a.7.7 0 0 1 .5 1.2L2.3 10l8.4 8.8a.7.7 0 1 1-1 1L.8 10.6a.7.7 0 0 1 0-1.2L9.7.2A.7.7 0 0 1 10.2 0Z" fill="white"/>
					</svg>
				</button>
				<button class="next">
					<svg xmlns="http://www.w3.org/2000/svg" width="11" height="20" viewBox="0 0 11 20" fill="none">
						<path d="M0.8 0a.7.7 0 0 1 .5.2l8.9 8.8a.7.7 0 0 1 0 1l-8.9 8.8a.7.7 0 1 1-1-1l8.3-8.3L0.3 1.2A.7.7 0 0 1 0.8 0Z" fill="white"/>
					</svg>
				</button>
			`;
      }
      const thumbs = document.createElement("div");
      thumbs.className = "masbox-thumbnails";
      this.loaderEl = document.createElement("div");
      this.loaderEl.className = "masbox-loader";
      this.loaderEl.hidden = true;
      if (this.gallery.length > 1) {
        inner.append(toolbar, viewer, nav, this.loaderEl);
      } else {
        inner.append(toolbar, viewer, this.loaderEl);
      }
      if (this.options.caption) inner.append(caption);
      if (this.options.thumbnails) inner.append(thumbs);
      this.overlay.append(inner);
      toolbar.querySelector(".close").onclick = () => this.close();
      if (this.options.zoom) {
        toolbar.querySelector(".zoom-in").onclick = () => this.changeZoom(0.25);
        toolbar.querySelector(".zoom-out").onclick = () => this.changeZoom(-0.25);
        toolbar.querySelector(".reset").onclick = () => this.resetZoom();
      }
      if (this.options.fullscreen) {
        toolbar.querySelector(".fullscreen").onclick = () => {
          if (!document.fullscreenElement) {
            this.overlay.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        };
      }
      if (this.options.flip) {
        (_a = toolbar.querySelector(".flip-horizontal")) == null ? void 0 : _a.addEventListener("click", () => {
          this.transform.flipH *= -1;
          this.updateTransform();
        });
        (_b = toolbar.querySelector(".flip-vertical")) == null ? void 0 : _b.addEventListener("click", () => {
          this.transform.flipV *= -1;
          this.updateTransform();
        });
      }
      if (this.options.thumbnails) {
        (_c = toolbar.querySelector(".thumbnails")) == null ? void 0 : _c.addEventListener("click", () => {
          this.toggleThumbnails();
        });
      }
      if (this.options.rotate) {
        (_d = toolbar.querySelector(".rotate")) == null ? void 0 : _d.addEventListener("click", () => {
          this.transform.rotate += 90;
          this.updateTransform();
        });
      }
      if (this.options.share) {
        const shareMenu = toolbar.querySelector(".masbox-dropdown-menu");
        toolbar.querySelector(".share").onclick = () => {
          shareMenu.style.display = shareMenu.style.display === "none" ? "block" : "none";
        };
        const buttons = shareMenu.querySelectorAll(".share-btn");
        buttons.forEach((btn) => {
          const platform = btn.dataset.platform;
          btn.onclick = (e) => {
            var _a2, _b2;
            e.stopPropagation();
            const current = this.gallery[this.currentIndex];
            current.dataset.caption || "";
            current.href || current.src || "";
            const url = location.href;
            if (typeof this.options.onShare === "function") {
              (_b2 = (_a2 = this.options).onShare) == null ? void 0 : _b2.call(_a2, this._createItem(platform));
              if (platform === "copy-link") {
                navigator.clipboard.writeText(url).then(() => {
                  const span = btn.querySelector("span");
                  const originalText = span.textContent;
                  span.textContent = "Link Copied!";
                  setTimeout(() => {
                    span.textContent = originalText;
                  }, 2e3);
                }).catch((err) => {
                  console.error("Failed to copy:", err);
                });
              }
            } else {
              switch (platform) {
                case "facebook":
                  window.open(`https://facebook.com/sharer/sharer.php?u=${url}`, "_blank");
                  break;
                case "twitter":
                  window.open(`https://twitter.com/intent/tweet?url=${url}`, "_blank");
                  break;
                case "linkedin":
                  window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}`, "_blank");
                  break;
                case "whatsapp":
                  window.open(`https://wa.me/?text=${url}`, "_blank");
                  break;
                case "email":
                  window.location.href = `mailto:?subject=Check this out&body=${url}`;
                  break;
                case "copy-link":
                  navigator.clipboard.writeText(url).then(() => {
                    const span = btn.querySelector("span");
                    const originalText = span.textContent;
                    span.textContent = "Copied!";
                    setTimeout(() => {
                      span.textContent = originalText;
                    }, 2e3);
                  }).catch((err) => {
                    console.error("Failed to copy:", err);
                  });
                  break;
                default:
                  console.warn(`No default handler for platform: ${platform}`);
              }
            }
          };
        });
      }
      if (this.options.navigation) {
        nav.querySelector(".prev").onclick = () => this.navigate(-1);
        nav.querySelector(".next").onclick = () => this.navigate(1);
      }
      image.addEventListener("wheel", (e) => this.handleZoomScroll(e));
      image.addEventListener("mousedown", (e) => this.startDrag(e));
      window.addEventListener("mousemove", (e) => this.dragImage(e));
      window.addEventListener("mouseup", () => this.endDrag());
      image.addEventListener("touchstart", (e) => this.startTouch(e), { passive: false });
      image.addEventListener("touchmove", (e) => this.handlePinchZoom(e), { passive: false });
      image.addEventListener("touchend", () => this.endTouch());
      image.addEventListener("dblclick", (e) => this.toggleTapZoom(e));
      let lastTap = 0;
      image.addEventListener("touchend", (e) => {
        const now = (/* @__PURE__ */ new Date()).getTime();
        const delta = now - lastTap;
        if (delta < 300) {
          this.toggleTapZoom(e);
          e.preventDefault();
        }
        lastTap = now;
      });
      image.addEventListener("dragstart", (e) => e.preventDefault());
      this.imageEl = image;
      this.captionEl = caption;
      this.paginationEl = toolbar.querySelector(".pagination");
      this.thumbnails = thumbs;
    }
    toggleThumbnails() {
      const thumbs = this.overlay.querySelector(".masbox-thumbnails");
      const btn = this.overlay.querySelector(".thumbnails");
      if (thumbs) {
        const isHidden = thumbs.classList.toggle("is-hidden");
        btn == null ? void 0 : btn.classList.toggle("is-active", !isHidden);
        setTimeout(() => {
          this.updateImageMaxHeight();
        }, 300);
      }
    }
    updateTransform() {
      const scale = this.zoom || 1;
      const rotate = this.transform.rotate;
      const flipH = this.transform.flipH;
      const flipV = this.transform.flipV;
      const offsetX = this.offsetX || 0;
      const offsetY = this.offsetY || 0;
      const transform = `
			translate(${offsetX}px, ${offsetY}px)
			scale(${scale * flipH}, ${scale * flipV})
			rotate(${rotate}deg)
		`;
      this.imageEl.style.transform = transform.trim();
    }
    toggleTapZoom(e) {
      var _a, _b, _c, _d;
      e.preventDefault();
      const rect = this.imageEl.getBoundingClientRect();
      const x = (e.clientX || (((_b = (_a = e.changedTouches) == null ? void 0 : _a[0]) == null ? void 0 : _b.clientX) ?? 0)) - rect.left;
      const y = (e.clientY || (((_d = (_c = e.changedTouches) == null ? void 0 : _c[0]) == null ? void 0 : _d.clientY) ?? 0)) - rect.top;
      if (this.zoom === 1) {
        this.zoom = this.options.maxZoom;
        this.offsetX = -(x - rect.width / 2);
        this.offsetY = -(y - rect.height / 2);
      } else {
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
      }
      this.setZoom(this.zoom);
    }
    showImage() {
      var _a;
      const current = this.gallery[this.currentIndex];
      this.loaderEl.hidden = false;
      this.imageEl.style.opacity = 0;
      this.imageEl.onload = () => {
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.imageEl.style.height = "auto";
        this.imageEl.style.width = "auto";
        this.loaderEl.hidden = true;
        this.setZoom(1);
        this.imageEl.style.opacity = 1;
      };
      this.imageEl.src = current.href;
      if (this.options.caption && this.captionEl) {
        const rawCaption = ((_a = current.dataset.caption) == null ? void 0 : _a.trim()) || "";
        const isCaptionValid = rawCaption && !/^[.,\-]+$/.test(rawCaption);
        this.captionEl.innerText = isCaptionValid ? rawCaption : "";
      }
      this.updatePagination();
      if (this.options.thumbnails) this.renderThumbnails();
    }
    renderThumbnails() {
      this.thumbnails.innerHTML = "";
      this.gallery.forEach((img, i) => {
        const thumbWrapper = document.createElement("div");
        thumbWrapper.className = "masbox-thumbnails-item";
        const thumb = document.createElement("img");
        thumb.src = img.dataset.thumb || img.href;
        if (i === this.currentIndex) thumbWrapper.classList.add("active");
        thumb.onclick = () => {
          if (i !== this.currentIndex) {
            this.currentIndex = i;
            this.showImage();
            if (typeof this.options.onMove === "function") {
              const el = this.gallery[this.currentIndex];
              const item = {
                image: el.href,
                caption: el.dataset.caption || "",
                url: window.location.href
              };
              this.options.onMove(item);
            }
          }
        };
        thumbWrapper.appendChild(thumb);
        this.thumbnails.appendChild(thumbWrapper);
      });
    }
    updatePagination() {
      if (this.paginationEl) {
        this.paginationEl.innerText = `${this.currentIndex + 1} / ${this.gallery.length}`;
      }
    }
    navigate(step) {
      var _a, _b;
      if (this.gallery.length <= 1) return;
      if (!this.options.loop) {
        const next = this.currentIndex + step;
        if (next < 0 || next >= this.gallery.length) return;
      }
      this.currentIndex = (this.currentIndex + step + this.gallery.length) % this.gallery.length;
      this.showImage();
      this.hasZoomed = false;
      (_b = (_a = this.options).onMove) == null ? void 0 : _b.call(_a, this._createItem());
    }
    changeZoom(delta) {
      const newZoom = Math.min(
        this.options.maxZoom,
        Math.max(this.options.minZoom, this.zoom + delta)
      );
      this.zoom = newZoom;
      this.setZoom(this.zoom);
    }
    setZoom(value) {
      var _a, _b;
      this.zoom = Math.max(1, Math.min(2, value));
      const container = this.imageEl.parentElement;
      const containerRect = container.getBoundingClientRect();
      const imageWidth = this.imageEl.naturalWidth * this.zoom;
      const imageHeight = this.imageEl.naturalHeight * this.zoom;
      const maxOffsetX = Math.max(0, (imageWidth - containerRect.width) / 2);
      const maxOffsetY = Math.max(0, (imageHeight - containerRect.height) / 2);
      this.offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, this.offsetX));
      this.offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, this.offsetY));
      const isReset = Math.abs(this.zoom - 1) < 0.01;
      if (isReset) {
        this.offsetX = 0;
        this.offsetY = 0;
      }
      this.updateTransform();
      if (!this.hasZoomed && this.zoom > 1) {
        this.hasZoomed = true;
        (_b = (_a = this.options).onZoom) == null ? void 0 : _b.call(_a, this._createItem());
      }
    }
    resetZoom() {
      this.zoom = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.setZoom(1);
    }
    handleZoomScroll(event) {
      event.preventDefault();
      const rect = this.imageEl.getBoundingClientRect();
      if (!this.scrollZoomInit) {
        this.lastScrollX = event.clientX - rect.left;
        this.lastScrollY = event.clientY - rect.top;
        this.scrollZoomInit = true;
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
          this.scrollZoomInit = false;
        }, 100);
      }
      const delta = -event.deltaY * 5e-4;
      let newZoom = this.zoom + delta;
      const zoomRatio = newZoom / this.zoom;
      this.offsetX -= (this.lastScrollX - rect.width / 2) * (zoomRatio - 1);
      this.offsetY -= (this.lastScrollY - rect.height / 2) * (zoomRatio - 1);
      if (Math.abs(newZoom - 1) < 0.01) {
        this.offsetX = 0;
        this.offsetY = 0;
        newZoom = 1;
      }
      this.setZoom(newZoom);
    }
    startDrag(e) {
      if (this.zoom <= 1) return;
      this.isDragging = true;
      this.hasDragged = false;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.imageEl.style.cursor = "grabbing";
      this.imageEl.style.transition = "none";
    }
    dragImage(e) {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      const movementThreshold = 2;
      if (Math.abs(dx) > movementThreshold || Math.abs(dy) > movementThreshold) {
        this.hasDragged = true;
        this.offsetX += dx;
        this.offsetY += dy;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.setZoom(this.zoom);
      }
    }
    endDrag() {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.imageEl.style.cursor = "grab";
      this.imageEl.style.transition = "transform 0.3s ease-out";
      this.setZoom(this.zoom);
    }
    startTouch(e) {
      if (e.touches.length === 2) {
        this.initialPinchDistance = this.getPinchDistance(e);
        this.initialZoom = this.zoom;
      }
    }
    handlePinchZoom(e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = this.getPinchDistance(e);
        const scaleFactor = currentDistance / this.initialPinchDistance;
        this.setZoom(this.initialZoom * scaleFactor);
      }
    }
    endTouch() {
      this.initialPinchDistance = null;
    }
    getPinchDistance(e) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
  };
  __publicField(_Masbox, "bindings", []);
  let Masbox = _Masbox;
  document.addEventListener("DOMContentLoaded", () => new Masbox());
  exports2.default = Masbox;
  Object.defineProperties(exports2, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
});
