/* Cherry-blossom shower. One clock, shared with the greeting's animation loop. */
(() => {
  'use strict';

  window.createSakuraShower = function ({ back, front, imageUrl, reduced = false }) {
    const backCtx = back.getContext('2d');
    const frontCtx = front.getContext('2d');
    const petals = [];
    const sprites = [];
    const MAX_PETALS = 150;
    let width = 390, height = 844, pixelRatio = 1;
    let active = false, ready = false, elapsed = 0, spawnCredit = 0;
    let staticPainted = false;

    const image = new Image();
    image.onload = () => {
      if (!backCtx || !frontCtx) return;
      const cellW = image.naturalWidth / 2;
      const cellH = image.naturalHeight / 2;
      // Pre-render the small textures once; the falling petals only transform them.
      for (let layer = 0; layer < 3; layer++) {
        sprites[layer] = [];
        for (let frame = 0; frame < 4; frame++) {
          const tile = document.createElement('canvas');
          tile.width = tile.height = 128;
          const tileCtx = tile.getContext('2d');
          if (!tileCtx) return;
          tileCtx.imageSmoothingEnabled = true;
          tileCtx.imageSmoothingQuality = 'high';
          if (layer === 0) tileCtx.filter = 'blur(1.6px)';
          tileCtx.drawImage(image, (frame % 2) * cellW, Math.floor(frame / 2) * cellH, cellW, cellH, 6, 6, 116, 116);
          sprites[layer][frame] = tile;
        }
      }
      ready = true;
      if (active && reduced) paintStillPetals();
    };
    image.onerror = () => { ready = false; };
    image.src = imageUrl;

    function clear() {
      backCtx?.clearRect(0, 0, width, height);
      frontCtx?.clearRect(0, 0, width, height);
    }

    function resize(w, h, dpr) {
      const oldWidth = width, oldHeight = height;
      width = w; height = h; pixelRatio = Math.min(dpr || 1, 2);
      for (const canvas of [back, front]) {
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        canvas.getContext('2d')?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      }
      for (const petal of petals) {
        petal.x *= width / oldWidth;
        petal.y *= height / oldHeight;
      }
      staticPainted = false;
      if (active && reduced && ready) paintStillPetals();
    }

    function spawn(firstWave = false) {
      if (petals.length >= MAX_PETALS) return;
      const depth = Math.random();
      const layer = depth < .35 ? 0 : depth < .84 ? 1 : 2;
      const sizes = [[11, 19], [21, 34], [38, 57]];
      const [minSize, maxSize] = sizes[layer];
      const size = minSize + Math.random() * (maxSize - minSize);
      petals.push({
        x: -24 + Math.random() * (width + 48),
        // Every petal begins above the visible frame, including the first wave.
        y: -size - 3 - Math.random() * (firstWave ? height * .2 : 36),
        size, layer, frame: Math.floor(Math.random() * 4),
        speed: [44, 72, 104][layer] + Math.random() * 36,
        drift: -10 + Math.random() * 20,
        sway: 10 + Math.random() * 23,
        phase: Math.random() * Math.PI * 2,
        flutter: .8 + Math.random() * 1.3,
        spin: (Math.random() < .5 ? -1 : 1) * (.22 + Math.random() * .6),
        rotation: Math.random() * Math.PI * 2,
        opacity: [.37, .78, .88][layer],
        age: 0,
        shimmer: layer > 0 && Math.random() < .3
      });
    }

    function start() {
      active = true; elapsed = 0; spawnCredit = 0;
      petals.length = 0; staticPainted = false; clear();
      if (reduced) { if (ready) paintStillPetals(); return; }
      for (let i = 0; i < 42; i++) spawn(true);
    }

    function reset() {
      active = false; elapsed = 0; spawnCredit = 0;
      petals.length = 0; staticPainted = false; clear();
    }

    function draw(petal) {
      const context = petal.layer === 0 ? backCtx : frontCtx;
      const tile = sprites[petal.layer]?.[petal.frame];
      if (!context || !tile) return;
      const time = petal.age;
      const fold = .42 + .58 * Math.abs(Math.cos(time * petal.flutter + petal.phase));
      const fadeBottom = Math.min(1, Math.max(0, (height + petal.size - petal.y) / 95));
      // A little more transparency over the words keeps the wish easy to read.
      const overCopy = petal.y > height * .1 && petal.y < height * .4 && petal.x > width * .12 && petal.x < width * .88;
      context.save();
      context.globalAlpha = petal.opacity * fadeBottom * (overCopy ? .62 : 1);
      context.translate(petal.x, petal.y);
      context.rotate(petal.rotation + Math.sin(time * .9 + petal.phase) * .22);
      context.scale(fold, .88 + Math.sin(time * .7 + petal.phase) * .12);
      context.drawImage(tile, -petal.size / 2, -petal.size / 2, petal.size, petal.size);
      context.restore();

      if (petal.shimmer && !reduced) {
        const shine = Math.pow(Math.max(0, Math.sin(time * 1.9 + petal.phase)), 16);
        if (shine > .06) {
          const radius = 2 + shine * 2.5;
          context.save();
          context.globalAlpha = shine * .8 * fadeBottom;
          context.translate(petal.x + petal.size * .14, petal.y - petal.size * .12);
          context.fillStyle = '#fff8e5';
          context.shadowColor = '#ffc4d8'; context.shadowBlur = 8;
          context.beginPath();
          context.moveTo(0, -radius); context.lineTo(radius * .24, -radius * .24);
          context.lineTo(radius, 0); context.lineTo(radius * .24, radius * .24);
          context.lineTo(0, radius); context.lineTo(-radius * .24, radius * .24);
          context.lineTo(-radius, 0); context.lineTo(-radius * .24, -radius * .24);
          context.closePath(); context.fill(); context.restore();
        }
      }
    }

    function paintStillPetals() {
      if (!ready || !active || staticPainted) return;
      clear();
      for (let i = 0; i < 12; i++) {
        draw({ x: width * (i % 2 ? .93 : .07), y: height * (.09 + Math.floor(i / 2) * .15),
          layer: 1, frame: i % 4, size: 23 + (i % 3) * 6, rotation: i * .9,
          age: 0, phase: i, flutter: 1, opacity: .52, shimmer: false });
      }
      staticPainted = true;
    }

    function update(dt) {
      if (!active || !ready || !backCtx || !frontCtx) return;
      if (reduced) { paintStillPetals(); return; }
      const seconds = Math.min(dt, 80) / 1000;
      elapsed += seconds;
      // A generous opening shower becomes a gentle continuous fall afterwards.
      const rate = elapsed < 7 ? 19 : elapsed < 23 ? 11 : 6;
      spawnCredit += seconds * rate;
      while (spawnCredit >= 1) { spawnCredit--; spawn(); }
      clear();
      const breeze = Math.sin(elapsed * .31) * 9;
      for (let i = petals.length - 1; i >= 0; i--) {
        const petal = petals[i];
        petal.age += seconds;
        petal.y += petal.speed * seconds;
        petal.x += (petal.drift + breeze + Math.sin(petal.age * .8 + petal.phase) * petal.sway) * seconds;
        petal.rotation += petal.spin * seconds;
        if (petal.y > height + petal.size || petal.x < -100 || petal.x > width + 100) { petals.splice(i, 1); continue; }
      }
      // Draw distant petals first, then the occasional larger foreground petal.
      for (let layer = 0; layer < 3; layer++) for (const petal of petals) if (petal.layer === layer) draw(petal);
    }

    return { start, reset, resize, update };
  };
})();
