(function () {
  function getDisplacementMap(w, h, r, d) {
    var svg =
      '<svg height="' + h + '" width="' + w + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
      '<style>.mix { mix-blend-mode: screen; }</style>' +
      '<defs>' +
      '<linearGradient id="Y" x1="0" x2="0" y1="' + Math.ceil((r / h) * 15) + '%" y2="' + Math.floor(100 - (r / h) * 15) + '%">' +
      '<stop offset="0%" stop-color="#0F0" /><stop offset="100%" stop-color="#000" />' +
      '</linearGradient>' +
      '<linearGradient id="X" x1="' + Math.ceil((r / w) * 15) + '%" x2="' + Math.floor(100 - (r / w) * 15) + '%" y1="0" y2="0">' +
      '<stop offset="0%" stop-color="#F00" /><stop offset="100%" stop-color="#000" />' +
      '</linearGradient>' +
      '</defs>' +
      '<rect x="0" y="0" height="' + h + '" width="' + w + '" fill="#808080" />' +
      '<g filter="blur(2px)">' +
      '<rect x="0" y="0" height="' + h + '" width="' + w + '" fill="#000080" />' +
      '<rect x="0" y="0" height="' + h + '" width="' + w + '" fill="url(#Y)" class="mix" />' +
      '<rect x="0" y="0" height="' + h + '" width="' + w + '" fill="url(#X)" class="mix" />' +
      '<rect x="' + d + '" y="' + d + '" height="' + (h - 2 * d) + '" width="' + (w - 2 * d) + '" fill="#808080" rx="' + r + '" ry="' + r + '" filter="blur(' + d + 'px)" />' +
      '</g>' +
      '</svg>';
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  function getDisplacementFilter(w, h, r, d, strength, cab) {
    var map = getDisplacementMap(w, h, r, d);

    if (cab <= 0) {
      var cheap =
        '<svg height="' + h + '" width="' + w + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
        '<defs>' +
        '<filter id="displace" color-interpolation-filters="sRGB">' +
        '<feImage x="0" y="0" height="' + h + '" width="' + w + '" href="' + map + '" result="dm" />' +
        '<feDisplacementMap in="SourceGraphic" in2="dm" scale="' + strength + '" xChannelSelector="R" yChannelSelector="G" />' +
        '</filter>' +
        '</defs>' +
        '</svg>';
      return "data:image/svg+xml;utf8," + encodeURIComponent(cheap) + "#displace";
    }

    var svg =
      '<svg height="' + h + '" width="' + w + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
      '<filter id="displace" color-interpolation-filters="sRGB">' +
      '<feImage x="0" y="0" height="' + h + '" width="' + w + '" href="' + map + '" result="dm" />' +
      '<feDisplacementMap in="SourceGraphic" in2="dm" scale="' + (strength + cab * 2) + '" xChannelSelector="R" yChannelSelector="G" />' +
      '<feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="dR" />' +
      '<feDisplacementMap in="SourceGraphic" in2="dm" scale="' + (strength + cab) + '" xChannelSelector="R" yChannelSelector="G" />' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="dG" />' +
      '<feDisplacementMap in="SourceGraphic" in2="dm" scale="' + strength + '" xChannelSelector="R" yChannelSelector="G" />' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="dB" />' +
      '<feBlend in="dR" in2="dG" mode="screen" />' +
      '<feBlend in2="dB" mode="screen" />' +
      '</filter>' +
      '</defs>' +
      '</svg>';
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg) + "#displace";
  }

  var supportsUrl = (function () {
    try {
      var t = document.createElement("div");
      t.style.cssText = "backdrop-filter: url(#a)";
      return t.style.backdropFilter.indexOf("url") !== -1;
    } catch (e) {
      return false;
    }
  })();

  function buildGlass(el) {
    var overlay = document.createElement("div");
    overlay.className = "lg-overlay-bg";

    var filterLayer = document.createElement("div");
    filterLayer.className = "lg-filter-layer";
    var box = document.createElement("div");
    box.className = "glass-box";
    filterLayer.appendChild(box);

    var content = document.createElement("div");
    content.className = "lg-content";
    while (el.firstChild) content.appendChild(el.firstChild);

    el.appendChild(overlay);
    el.appendChild(filterLayer);
    el.appendChild(content);

    return box;
  }

  function redraw(el, box) {
    var rect = el.getBoundingClientRect();
    var w = Math.round(rect.width);
    var h = Math.round(rect.height);
    if (!w || !h) return;

    var d = parseFloat(el.dataset.lgDepth || "10");
    var strength = parseFloat(el.dataset.lgStrength || "70");
    var cab = parseFloat(el.dataset.lgCab || "2");
    var saturate = parseFloat(el.dataset.lgSaturate || "1.4");
    var brightness = parseFloat(el.dataset.lgBrightness || "1.05");
    var r = parseFloat(getComputedStyle(el).borderRadius) || 0;

    if (supportsUrl) {
      var url = getDisplacementFilter(w, h, r, d, strength, cab);
      var value = "url('" + url + "') brightness(" + brightness + ") saturate(" + saturate + ")";
      box.style.backdropFilter = value;
      box.style.webkitBackdropFilter = value;
      el.classList.remove("lg-fallback");
    } else {
      var fallback = "blur(" + Math.min(28, Math.max(10, w / 14)) + "px) saturate(160%)";
      box.style.backdropFilter = fallback;
      box.style.webkitBackdropFilter = fallback;
      el.classList.add("lg-fallback");
    }
  }

  function initGlass() {
    var els = document.querySelectorAll(".liquid-glass");
    els.forEach(function (el) {
      var box = buildGlass(el);
      redraw(el, box);
      if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(function () {
          redraw(el, box);
        }).observe(el);
      } else {
        window.addEventListener("resize", function () {
          redraw(el, box);
        });
      }
    });
  }

  function pointerPos(e) {
    var p = e.touches && e.touches.length ? e.touches[0] : e;
    return { x: p.clientX, y: p.clientY };
  }

  function initOrb() {
    var orb = document.getElementById("orb");
    if (!orb) return;

    var dragging = false;
    var startX = 0, startY = 0, x = 0, y = 0;

    function down(e) {
      var p = pointerPos(e);
      startX = p.x - x;
      startY = p.y - y;
      dragging = true;
      orb.classList.add("dragging");
    }

    function move(e) {
      if (!dragging) return;
      if (e.cancelable) e.preventDefault();
      var p = pointerPos(e);
      x = p.x - startX;
      y = p.y - startY;
      orb.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";
    }

    function up() {
      dragging = false;
      orb.classList.remove("dragging");
    }

    orb.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    orb.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
  }

  function init() {
    initGlass();
    initOrb();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
