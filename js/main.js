/**
 * NAM Ô THẤT BẢO - CONTROLLER LANDING PAGE
 * Carousel Chỉ Hiện Ảnh Lớn -> Nhấp vào ảnh tự động cuộn trỏ tới Thẻ Di Tích
 * Đồng bộ với Bản đồ tương tác Google Maps và nạp ảnh tức thì
 */

document.addEventListener("DOMContentLoaded", () => {
  // Trạng thái ứng dụng
  const state = {
    map: null,
    swiper: null,
    baseLayers: {},
    currentLayerName: "google-hybrid",
    markers: {},
    popups: {},
    routePolyline: null,
    showRoute: true,
    activeSiteId: "dinh-lang-nam-o",
    currentFilter: "all",
    tourInterval: null,
    tourIndex: 0,
    userImages: {}
  };

  function loadStoredImages() {
    NAM_O_HERITAGE_SITES.forEach(site => {
      const stored = localStorage.getItem(`nam_o_img_${site.id}`);
      if (stored) {
        state.userImages[site.id] = stored;
      }
    });
  }

  function getPinColor(num) {
    switch (num) {
      case "01": return "#f29900"; // Google Yellow
      case "02": return "#1a73e8"; // Google Blue
      case "03": return "#12b5cb"; // Google Teal
      case "04": return "#a142f4"; // Google Purple
      case "05": return "#fa7b17"; // Google Orange
      case "06": return "#ea4335"; // Google Red
      case "07": return "#d93025"; // Google Dark Red
      default: return "#1a73e8";
    }
  }

  // =========================================================================
  // 1. CAROUSEL CHỈ HIỆN ẢNH LỚN -> BẤM VÀO TRỎ TỚI THẺ CHI TIẾT
  // =========================================================================
  function renderPhotoCarouselSlides() {
    const wrapper = document.getElementById("carousel-slides-wrapper");
    wrapper.innerHTML = "";

    NAM_O_HERITAGE_SITES.forEach((site, index) => {
      const pinColor = getPinColor(site.number);
      const hasImage = !!state.userImages[site.id];
      const imgSrc = state.userImages[site.id] || site.image;

      const slide = document.createElement("div");
      slide.className = "swiper-slide";
      slide.dataset.siteId = site.id;

      // Khung CHỈ HIỆN ẢNH LỚN kèm tiêu đề tối giản nổi góc dưới
      slide.innerHTML = `
        <div class="photo-slide-card ${hasImage ? 'has-image' : ''}" id="photo-slide-${site.id}" onclick="scrollToRelicCard('${site.id}')" title="Nhấp để xem thẻ chi tiết của ${site.title}">
          
          <!-- Khung ảnh lớn có Skeleton Shimmer cao cấp -->
          <div class="photo-slide-skeleton">
            <span class="slide-skel-icon"><i class="fa-regular fa-image"></i></span>
            <span class="slide-skel-badge"><i class="fa-solid fa-arrow-pointer"></i> Nhấp xem thẻ chi tiết</span>
          </div>

          <img src="${imgSrc}" class="slide-real-image" id="slide-img-${site.id}" alt="${site.title}" onerror="handleSlideImgError('${site.id}')" onload="handleSlideImgSuccess('${site.id}')" />

          <!-- Bảng tiêu đề tối giản phủ nổi lên ảnh -->
          <div class="slide-overlay-caption">
            <div class="slide-overlay-title">
              <span style="color:${pinColor};">●</span>
              <span>${site.number}. ${site.title}</span>
            </div>
            <div class="slide-overlay-hint">
              <span>Xem thẻ</span>
              <i class="fa-solid fa-arrow-down"></i>
            </div>
          </div>

        </div>
      `;

      wrapper.appendChild(slide);
    });
  }

  function initSwiper() {
    state.swiper = new Swiper("#relics-swiper", {
      slidesPerView: 1.15,
      spaceBetween: 16,
      centeredSlides: true,
      loop: false,
      grabCursor: true,
      speed: 650,
      pagination: {
        el: "#swiper-pagination-dots",
        clickable: true,
        dynamicBullets: true
      },
      navigation: {
        nextEl: "#swiper-next-btn",
        prevEl: "#swiper-prev-btn"
      },
      breakpoints: {
        640: {
          slidesPerView: 1.8,
          spaceBetween: 20,
          centeredSlides: false
        },
        900: {
          slidesPerView: 2.3,
          spaceBetween: 24,
          centeredSlides: false
        },
        1200: {
          slidesPerView: 2.6,
          spaceBetween: 26,
          centeredSlides: false
        }
      }
    });

    state.swiper.on("slideChange", () => {
      const activeSlide = state.swiper.slides[state.swiper.activeIndex];
      if (activeSlide) {
        const siteId = activeSlide.dataset.siteId;
        const site = NAM_O_HERITAGE_SITES.find(s => s.id === siteId);
        if (site) {
          updateInspector(site);
          activatePin(site.id);
        }
      }
    });
  }

  window.handleSlideImgError = function(siteId) {
    const card = document.getElementById(`photo-slide-${siteId}`);
    if (card) card.classList.remove("has-image");
  };

  window.handleSlideImgSuccess = function(siteId) {
    const card = document.getElementById(`photo-slide-${siteId}`);
    if (card) card.classList.add("has-image");
  };

  // =========================================================================
  // HÀNH ĐỘNG: BẤM VÀO ẢNH CAROUSEL THÌ TRỎ TỚI THẺ CHI TIẾT
  // =========================================================================
  window.scrollToRelicCard = function(siteId) {
    const targetCard = document.getElementById(`card-${siteId}`);
    if (!targetCard) return;

    // Cuộn mượt màn hình tới thẻ đó
    targetCard.scrollIntoView({ behavior: "smooth", block: "center" });

    // Kích hoạt hiệu ứng phát sáng viền và nhấp nháy thu hút sự chú ý
    document.querySelectorAll(".relic-full-card").forEach(c => c.classList.remove("card-targeted"));
    targetCard.classList.add("card-targeted");

    setTimeout(() => {
      targetCard.classList.remove("card-targeted");
    }, 2200);

    // Đồng thời định vị trên bản đồ
    const site = NAM_O_HERITAGE_SITES.find(s => s.id === siteId);
    if (site) {
      updateInspector(site);
      activatePin(site.id);
    }
  };

  // =========================================================================
  // 2. RENDER HỆ THỐNG THẺ 7 DI TÍCH ĐẦY ĐỦ (ĐÍCH ĐẾN CỦA CAROUSEL)
  // =========================================================================
  function renderRelicsCardsGrid() {
    const grid = document.getElementById("relics-cards-grid");
    grid.innerHTML = "";

    const filtered = NAM_O_HERITAGE_SITES.filter(site => {
      return state.currentFilter === "all" || site.categoryKey === state.currentFilter;
    });

    filtered.forEach(site => {
      const pinColor = getPinColor(site.number);
      const hasImage = !!state.userImages[site.id];
      const imgSrc = state.userImages[site.id] || site.image;

      const card = document.createElement("article");
      card.className = "relic-full-card";
      card.id = `card-${site.id}`;

      card.innerHTML = `
        <!-- Khung ảnh thẻ có Skeleton -->
        <div class="card-media-header ${hasImage ? 'has-image' : ''}" id="card-media-${site.id}" onclick="triggerUpload('${site.id}')">
          <div class="photo-slide-skeleton" title="Nhấp để tải ảnh lên cho ${site.title}">
            <span class="slide-skel-icon" style="font-size:1.8rem;"><i class="fa-regular fa-image"></i></span>
            <span class="slide-skel-badge"><i class="fa-solid fa-cloud-arrow-up"></i> Tải ảnh lên</span>
          </div>
          <img src="${imgSrc}" class="card-media-img" id="card-img-${site.id}" alt="${site.title}" onerror="handleCardImgError('${site.id}')" onload="handleCardImgSuccess('${site.id}')" />
        </div>

        <div class="card-body-content">
          <div class="card-tag-row">
            <span class="card-num-tag" style="color:${pinColor}; background:${pinColor}15;">
              DI TÍCH ${site.number} • ${site.category}
            </span>
            <span style="font-size:0.75rem; color:#f29900; font-weight:700;">★ 5.0</span>
          </div>

          <h3 class="card-title-text">${site.title}</h3>

          <div class="card-address-text">
            <i class="fa-solid fa-map-pin" style="color:var(--google-blue); font-size:0.75rem;"></i>
            <span>${site.address}</span>
          </div>

          <p class="card-desc-text">${site.shortDesc}</p>

          <ul class="card-highlights-list">
            ${site.highlights.slice(0, 2).map(h => `<li>${h}</li>`).join("")}
          </ul>

          <div class="card-footer-buttons">
            <button class="btn-inspector-primary" onclick="focusRelicOnMap('${site.id}')" title="Xem trên bản đồ">
              <i class="fa-solid fa-location-crosshairs"></i>
              <span>Xem trên bản đồ</span>
            </button>
            <button class="btn-inspector-outline" onclick="openDetailModal('${site.id}')">
              <span>Lịch sử chi tiết</span>
              <i class="fa-solid fa-arrow-right" style="font-size:0.7rem;"></i>
            </button>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  window.handleCardImgError = function(siteId) {
    const box = document.getElementById(`card-media-${siteId}`);
    if (box) box.classList.remove("has-image");
  };

  window.handleCardImgSuccess = function(siteId) {
    const box = document.getElementById(`card-media-${siteId}`);
    if (box) box.classList.add("has-image");
  };

  // Cuộn lên bản đồ khi bấm "Xem trên bản đồ"
  window.focusRelicOnMap = function(siteId) {
    const site = NAM_O_HERITAGE_SITES.find(s => s.id === siteId);
    if (!site) return;

    document.getElementById("ban-do").scrollIntoView({ behavior: "smooth" });

    setTimeout(() => {
      state.map.flyTo([site.coordinates.lat, site.coordinates.lng], 17, { duration: 0.9 });
      activatePin(site.id);
      updateInspector(site);

      const marker = state.markers[site.id];
      if (marker) marker.openPopup();
    }, 450);
  };

  // =========================================================================
  // 3. KHỞI TẠO BẢN ĐỒ LEAFLET VỚI GOOGLE MAPS
  // =========================================================================
  function initMap() {
    state.map = L.map("map-container", {
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      scrollWheelZoom: false
    });

    L.control.zoom({ position: "bottomright" }).addTo(state.map);
    state.map.on("click", () => state.map.scrollWheelZoom.enable());

    state.baseLayers["google-hybrid"] = L.tileLayer(
      "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      { maxZoom: 20, attribution: "&copy; Google Maps" }
    );

    state.baseLayers["google-streets"] = L.tileLayer(
      "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      { maxZoom: 20, attribution: "&copy; Google Maps" }
    );

    state.baseLayers["osm"] = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 19, attribution: "&copy; OpenStreetMap" }
    );

    state.baseLayers["google-hybrid"].addTo(state.map);

    drawWalkingRoute();
    renderMapMarkers();
    updateInspector(NAM_O_HERITAGE_SITES[0]);
  }

  function drawWalkingRoute() {
    if (state.routePolyline) state.map.removeLayer(state.routePolyline);

    state.routePolyline = L.polyline(MAP_CONFIG.walkingRoute, {
      color: "#1a73e8",
      weight: 3.5,
      opacity: 0.85,
      dashArray: "6, 8",
      lineCap: "round"
    }).addTo(state.map);
  }

  function renderMapMarkers() {
    NAM_O_HERITAGE_SITES.forEach((site, index) => {
      const pinColor = getPinColor(site.number);

      const pinHtml = `
        <div class="google-pin-container" id="pin-${site.id}">
          <div class="google-pin">
            <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 0C8.06 0 0 8.06 0 18C0 30.5 18 44 18 44C18 44 36 30.5 36 18C36 8.06 27.94 0 18 0Z" fill="${pinColor}"/>
              <circle cx="18" cy="16" r="11" fill="#FFFFFF"/>
            </svg>
            <span class="pin-label" style="color:${pinColor};">${site.number}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "google-pin-wrapper",
        html: pinHtml,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -42]
      });

      const marker = L.marker([site.coordinates.lat, site.coordinates.lng], {
        icon: customIcon,
        title: site.title,
        riseOnHover: true
      }).addTo(state.map);

      const popupContent = `
        <div class="google-popup-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.7rem; font-weight:700; color:${pinColor}; background:${pinColor}15; padding:2px 8px; border-radius:10px;">
              DI TÍCH ${site.number}
            </span>
            <span style="font-size:0.7rem; color:#f29900; font-weight:600;">★ 5.0</span>
          </div>
          <div style="font-size:0.95rem; font-weight:700; color:#0f172a; margin-top:4px;">${site.title}</div>
          <div style="font-size:0.76rem; color:#475569; line-height:1.45;">${site.shortDesc}</div>
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button onclick="scrollToRelicCard('${site.id}')" style="background:#1a73e8; color:#fff; border:none; padding:5px 12px; border-radius:14px; font-size:0.74rem; font-weight:600; cursor:pointer;">
              Xem thẻ
            </button>
            <a href="${site.googleMapsUrl}" target="_blank" style="background:#fff; color:#1a73e8; border:1px solid #dadce0; padding:5px 12px; border-radius:14px; font-size:0.74rem; text-decoration:none; font-weight:600;">
              Chỉ đường
            </a>
          </div>
        </div>
      `;

      const popup = L.popup({
        offset: [0, -38],
        closeButton: false,
        autoPan: false
      }).setContent(popupContent);

      marker.bindPopup(popup);

      // ==========================================================
      // TƯƠNG TÁC SỜ CHUỘT (HOVER TRÊN BẢN ĐỒ)
      // ==========================================================
      marker.on("mouseover", () => {
        marker.openPopup();
        activatePin(site.id);
        updateInspector(site);
        if (state.swiper) {
          state.swiper.slideTo(index, 450);
        }
      });

      marker.on("click", () => {
        scrollToRelicCard(site.id);
      });

      state.markers[site.id] = marker;
      state.popups[site.id] = popup;
    });
  }

  function activatePin(siteId) {
    document.querySelectorAll(".google-pin-container").forEach(el => el.classList.remove("active"));
    const pin = document.getElementById(`pin-${siteId}`);
    if (pin) pin.classList.add("active");
  }

  function updateInspector(site) {
    state.activeSiteId = site.id;
    window.activeSiteId = site.id;

    const pinColor = getPinColor(site.number);
    const hasImage = !!state.userImages[site.id];
    const imgSrc = state.userImages[site.id] || site.image;

    const badgeEl = document.getElementById("insp-badge");
    badgeEl.innerText = `DI TÍCH ${site.number} • ${site.category}`;
    badgeEl.style.color = pinColor;
    badgeEl.style.background = `${pinColor}18`;

    const mediaBox = document.getElementById("insp-media-box");
    const imgEl = document.getElementById("insp-loaded-img");
    imgEl.src = imgSrc;
    if (hasImage) {
      mediaBox.classList.add("has-image");
    } else {
      mediaBox.classList.remove("has-image");
    }

    document.getElementById("insp-title").innerText = site.title;
    document.getElementById("insp-address").querySelector("span").innerText = site.address;
    document.getElementById("insp-desc").innerText = site.shortDesc;
    document.getElementById("insp-btn-gmaps").href = site.googleMapsUrl;
  }

  // =========================================================================
  // 4. BỘ TẢI ẢNH TỪ MÁY TỰ LƯU VÀO LOCALSTORAGE
  // =========================================================================
  let targetUploadSiteId = null;
  const fileInput = document.getElementById("relic-file-input");

  window.triggerUpload = function(siteId) {
    targetUploadSiteId = siteId || state.activeSiteId;
    fileInput.click();
  };

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !targetUploadSiteId) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      const base64 = evt.target.result;
      state.userImages[targetUploadSiteId] = base64;
      try {
        localStorage.setItem(`nam_o_img_${targetUploadSiteId}`, base64);
      } catch (err) {
        console.warn("LocalStorage full", err);
      }
      syncImageEverywhere(targetUploadSiteId, base64);
    };
    reader.readAsDataURL(file);
    fileInput.value = "";
  });

  function syncImageEverywhere(siteId, src) {
    // 1. Cập nhật Slide Carousel
    const slideCard = document.getElementById(`photo-slide-${siteId}`);
    const slideImg = document.getElementById(`slide-img-${siteId}`);
    if (slideCard && slideImg) {
      slideImg.src = src;
      slideCard.classList.add("has-image");
    }

    // 2. Cập nhật Thẻ di tích
    const cardMedia = document.getElementById(`card-media-${siteId}`);
    const cardImg = document.getElementById(`card-img-${siteId}`);
    if (cardMedia && cardImg) {
      cardImg.src = src;
      cardMedia.classList.add("has-image");
    }

    // 3. Cập nhật Inspector
    if (state.activeSiteId === siteId) {
      const inspMedia = document.getElementById("insp-media-box");
      const inspImg = document.getElementById("insp-loaded-img");
      if (inspMedia && inspImg) {
        inspImg.src = src;
        inspMedia.classList.add("has-image");
      }
    }

    // 4. Cập nhật Modal nếu đang mở
    const modalHero = document.getElementById("modal-hero-box");
    const modalImg = document.getElementById("modal-hero-img");
    if (modalHero && modalImg && state.activeSiteId === siteId) {
      modalImg.src = src;
      modalHero.classList.add("has-image");
    }
  }

  // =========================================================================
  // 5. MODAL CHI TIẾT LỊCH SỬ DI TÍCH (LIGHTBOX)
  // =========================================================================
  window.openDetailModal = function(siteId) {
    const site = NAM_O_HERITAGE_SITES.find(s => s.id === siteId);
    if (!site) return;

    state.activeSiteId = site.id;
    const pinColor = getPinColor(site.number);
    const hasImage = !!state.userImages[site.id];
    const imgSrc = state.userImages[site.id] || site.image;

    const modalHero = document.getElementById("modal-hero-box");
    const modalImg = document.getElementById("modal-hero-img");
    modalImg.src = imgSrc;
    if (hasImage) {
      modalHero.classList.add("has-image");
    } else {
      modalHero.classList.remove("has-image");
    }

    const modalBadge = document.getElementById("modal-badge");
    modalBadge.innerText = `DI TÍCH ${site.number} • ${site.category}`;
    modalBadge.style.color = pinColor;
    modalBadge.style.background = `${pinColor}18`;

    document.getElementById("modal-title").innerText = site.title;
    document.getElementById("modal-subtitle").innerText = site.subTitle;

    document.getElementById("modal-address").innerText = site.address;
    document.getElementById("modal-coords").innerText = `${site.coordinates.lat.toFixed(5)}, ${site.coordinates.lng.toFixed(5)} (${site.plusCode})`;
    document.getElementById("modal-era").innerText = site.era;

    const hlUl = document.getElementById("modal-highlights-list");
    hlUl.innerHTML = site.highlights.map(h => `<li>✦ ${h}</li>`).join("");

    const narrativeEl = document.getElementById("modal-narrative-text");
    narrativeEl.innerHTML = site.fullHistory.map(p => `<p style="margin-bottom:12px;">${p}</p>`).join("");

    document.getElementById("modal-gmaps-link").href = site.googleMapsUrl;
    document.getElementById("modal-btn-upload").onclick = () => triggerUpload(site.id);

    document.getElementById("relic-modal").classList.add("open");
  };

  window.closeDetailModal = function() {
    document.getElementById("relic-modal").classList.remove("open");
  };

  document.getElementById("relic-modal").addEventListener("click", (e) => {
    if (e.target.id === "relic-modal") closeDetailModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDetailModal();
  });

  // =========================================================================
  // 6. BỘ LỌC CHIPS THEO CHUYÊN ĐỀ
  // =========================================================================
  document.querySelectorAll(".chip-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chip-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.currentFilter = btn.dataset.filter;

      renderRelicsCardsGrid();

      NAM_O_HERITAGE_SITES.forEach(site => {
        const marker = state.markers[site.id];
        const match = state.currentFilter === "all" || site.categoryKey === state.currentFilter;
        if (marker) {
          if (match) {
            state.map.addLayer(marker);
          } else {
            state.map.removeLayer(marker);
          }
        }
      });
    });
  });

  // =========================================================================
  // 7. CÁC CÔNG CỤ BẢN ĐỒ
  // =========================================================================
  const layerBtn = document.getElementById("btn-layer-menu");
  const layerMenu = document.getElementById("layer-dropdown");

  layerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    layerMenu.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#layer-dropdown") && !e.target.closest("#btn-layer-menu")) {
      layerMenu.classList.remove("show");
    }
  });

  document.querySelectorAll(".layer-drop-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const layerName = btn.dataset.layer;
      if (layerName === state.currentLayerName) return;

      state.map.removeLayer(state.baseLayers[state.currentLayerName]);
      state.baseLayers[layerName].addTo(state.map);
      state.currentLayerName = layerName;

      document.querySelectorAll(".layer-drop-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      layerMenu.classList.remove("show");
    });
  });

  const routeToggleBtn = document.getElementById("btn-toggle-walking-route");
  routeToggleBtn.addEventListener("click", () => {
    state.showRoute = !state.showRoute;
    if (state.showRoute) {
      drawWalkingRoute();
      routeToggleBtn.classList.add("active");
    } else {
      if (state.routePolyline) state.map.removeLayer(state.routePolyline);
      routeToggleBtn.classList.remove("active");
    }
  });

  document.getElementById("btn-recenter-view").addEventListener("click", () => {
    state.map.flyTo(MAP_CONFIG.center, MAP_CONFIG.zoom, { duration: 0.8 });
  });

  const autoTourBtn = document.getElementById("btn-auto-tour-mode");
  let isTouring = false;

  autoTourBtn.addEventListener("click", () => {
    if (isTouring) {
      stopAutoTour();
    } else {
      startAutoTour();
    }
  });

  function startAutoTour() {
    isTouring = true;
    autoTourBtn.classList.add("active");
    autoTourBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    state.tourIndex = 0;
    stepAutoTour();
    state.tourInterval = setInterval(stepAutoTour, 5000);
  }

  function stepAutoTour() {
    if (state.tourIndex >= NAM_O_HERITAGE_SITES.length) state.tourIndex = 0;
    const site = NAM_O_HERITAGE_SITES[state.tourIndex];
    state.map.flyTo([site.coordinates.lat, site.coordinates.lng], 17, { duration: 1 });
    activatePin(site.id);
    updateInspector(site);

    const marker = state.markers[site.id];
    if (marker) marker.openPopup();

    if (state.swiper) {
      state.swiper.slideTo(state.tourIndex, 600);
    }
    state.tourIndex++;
  }

  function stopAutoTour() {
    isTouring = false;
    clearInterval(state.tourInterval);
    autoTourBtn.classList.remove("active");
    autoTourBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  }

  // Khởi động
  loadStoredImages();
  renderPhotoCarouselSlides();
  renderRelicsCardsGrid();
  initSwiper();
  initMap();
});
