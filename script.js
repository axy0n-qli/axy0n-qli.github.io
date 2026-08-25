(function () {
  "use strict";
  function getDisplacementMap(opts) {
    var width = opts.width;
    var height = opts.height;
    var radius = opts.radius;
    var depth = opts.depth;

    var svg =
      '<svg height="' + height + '" width="' + width + '" viewBox="0 0 ' + width + ' ' + height + '" xmlns="http://www.w3.org/2000/svg">' +
      '<style>.mix { mix-blend-mode: screen; }</style>' +
      '<defs>' +
      '<linearGradient id="Y" x1="0" x2="0" ' +
      'y1="' + Math.ceil((radius / height) * 15) + '%" ' +
      'y2="' + Math.floor(100 - (radius / height) * 15) + '%">' +
      '<stop offset="0%" stop-color="#0F0" />' +
      '<stop offset="100%" stop-color="#000" />' +
      '</linearGradient>' +
      '<linearGradient id="X" ' +
      'x1="' + Math.ceil((radius / width) * 15) + '%" ' +
      'x2="' + Math.floor(100 - (radius / width) * 15) + '%" ' +
      'y1="0" y2="0">' +
      '<stop offset="0%" stop-color="#F00" />' +
      '<stop offset="100%" stop-color="#000" />' +
      '</linearGradient>' +
      '</defs>' +
      '<rect x="0" y="0" height="' + height + '" width="' + width + '" fill="#808080" />' +
      '<g filter="blur(2px)">' +
      '<rect x="0" y="0" height="' + height + '" width="' + width + '" fill="#000080" />' +
      '<rect x="0" y="0" height="' + height + '" width="' + width + '" fill="url(#Y)" class="mix" />' +
      '<rect x="0" y="0" height="' + height + '" width="' + width + '" fill="url(#X)" class="mix" />' +
      '<rect x="' + depth + '" y="' + depth + '" ' +
      'height="' + (height - 2 * depth) + '" width="' + (width - 2 * depth) + '" ' +
      'fill="#808080" rx="' + radius + '" ry="' + radius + '" ' +
      'filter="blur(' + depth + 'px)" />' +
      '</g>' +
      '</svg>';

    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  
  function getDisplacementFilter(opts) {
    var width = opts.width;
    var height = opts.height;
    var radius = opts.radius;
    var depth = opts.depth;
    var strength = opts.strength || 100;
    var cab = opts.chromaticAberration || 0;

    var map = getDisplacementMap({ width: width, height: height, radius: radius, depth: depth });

    var svg =
      '<svg height="' + height + '" width="' + width + '" viewBox="0 0 ' + width + ' ' + height + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
      '<filter id="displace" color-interpolation-filters="sRGB">' +
      '<feImage x="0" y="0" height="' + height + '" width="' + width + '" href="' + map + '" result="displacementMap" />' +
      '<feDisplacementMap in="SourceGraphic" in2="displacementMap" ' +
      'scale="' + (strength + cab * 2) + '" xChannelSelector="R" yChannelSelector="G" />' +
      '<feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="displacedR" />' +
      '<feDisplacementMap in="SourceGraphic" in2="displacementMap" ' +
      'scale="' + (strength + cab) + '" xChannelSelector="R" yChannelSelector="G" />' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="displacedG" />' +
      '<feDisplacementMap in="SourceGraphic" in2="displacementMap" ' +
      'scale="' + strength + '" xChannelSelector="R" yChannelSelector="G" />' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="displacedB" />' +
      '<feBlend in="displacedR" in2="displacedG" mode="screen" />' +
      '<feBlend in2="displacedB" mode="screen" />' +
      '</filter>' +
      '</defs>' +
      '</svg>';

    return "data:image/svg+xml;utf8," + encodeURIComponent(svg) + "#displace";
  }

  var supportsBackdropFilterUrl = (function () {
    try {
      var test = document.createElement("div");
      test.style.cssText = "backdrop-filter: url(#a)";
      return test.style.backdropFilter.indexOf("url") !== -1;
    } catch (err) {
      return false;
    }
  })();

  function buildGlass(el) {
    var overlay = document.createElement("div");
    overlay.className = "lg-overlay-bg";

    var filterLayer = document.createElement("div");
    filterLayer.className = "lg-filter-layer";

    var glassBox = document.createElement("div");
    glassBox.className = "glass-box";
    filterLayer.appendChild(glassBox);

    var content = document.createElement("div");
    content.className = "lg-content";
    while (el.firstChild) {
      content.appendChild(el.firstChild);
    }

    el.appendChild(overlay);
    el.appendChild(filterLayer);
    el.appendChild(content);

    return glassBox;
  }

  function redraw(el, glassBox) {
    var rect = el.getBoundingClientRect();
    var width = Math.round(rect.width);
    var height = Math.round(rect.height);
    if (!width || !height) return;

    var depth = parseFloat(el.dataset.lgDepth || "10");
    var strength = parseFloat(el.dataset.lgStrength || "70");
    var cab = parseFloat(el.dataset.lgCab || "2");
    var blur = parseFloat(el.dataset.lgBlur || "0");
    var saturate = parseFloat(el.dataset.lgSaturate || "1.4");
    var brightness = parseFloat(el.dataset.lgBrightness || "1.05");
    var radius = parseFloat(getComputedStyle(el).borderRadius) || 0;

    if (supportsBackdropFilterUrl) {
      var filterUrl = getDisplacementFilter({
        width: width,
        height: height,
        radius: radius,
        depth: depth,
        strength: strength,
        chromaticAberration: cab,
      });
      var value =
        "blur(" + blur / 2 + "px) url('" + filterUrl + "') " +
        "blur(" + blur + "px) brightness(" + brightness + ") saturate(" + saturate + ")";
      glassBox.style.backdropFilter = value;
      glassBox.style.webkitBackdropFilter = value;
      el.classList.remove("lg-fallback");
    } else {
      var fallback = "blur(" + Math.min(28, Math.max(10, width / 14)) + "px) saturate(160%)";
      glassBox.style.backdropFilter = fallback;
      glassBox.style.webkitBackdropFilter = fallback;
      el.classList.add("lg-fallback");
    }
  }

  function initGlass() {
    var elements = document.querySelectorAll(".liquid-glass");
    elements.forEach(function (el) {
      var glassBox = buildGlass(el);
      redraw(el, glassBox);

      if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(function () {
          redraw(el, glassBox);
        }).observe(el);
      } else {
        window.addEventListener("resize", function () {
          redraw(el, glassBox);
        });
      }
    });
  }

  function initOrb() {
    var orb = document.getElementById("orb");
    if (!orb) return;

    var dragging = false;
    var startX = 0, startY = 0, x = 0, y = 0;

    function pointerPos(e) {
      var p = e.touches && e.touches.length ? e.touches[0] : e;
      return { x: p.clientX, y: p.clientY };
    }

    function dragStart(e) {
      var p = pointerPos(e);
      startX = p.x - x;
      startY = p.y - y;
      dragging = true;
      orb.classList.add("dragging");
    }

    function drag(e) {
      if (!dragging) return;
      e.preventDefault();
      var p = pointerPos(e);
      x = p.x - startX;
      y = p.y - startY;
      orb.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";
    }

    function dragEnd() {
      dragging = false;
      orb.classList.remove("dragging");
    }

    orb.addEventListener("mousedown", dragStart);
    window.addEventListener("mousemove", drag);
    window.addEventListener("mouseup", dragEnd);

    orb.addEventListener("touchstart", dragStart, { passive: true });
    window.addEventListener("touchmove", drag, { passive: false });
    window.addEventListener("touchend", dragEnd);
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

  window.LiquidGlass = {
    getDisplacementMap: getDisplacementMap,
    getDisplacementFilter: getDisplacementFilter,
  };
})();
