/* 条形对比组件。配套 bars.css，依赖 anim.js 的 tween/lerp。
 *
 *   const bars = Bars.create({
 *     items: [{ name: '甲', color: '#f4a025' }, { name: '乙', color: '#3ea0e8' }],
 *     scale: 2.2,      // 1 个单位画多少像素
 *     unit: '千克',
 *   });
 *
 *   bars.set([120, 90]);                  // 立即设定
 *   await bars.tween([105, 105], 700, id); // 动着变
 *   bars.showNumbers(true);                // 显示数字（默认藏起来，先看高矮）
 *   bars.guide(90, '乙的高度在这儿');
 *   bars.split(0, 4, '份');                // 把第 0 根切成 4 等份，一份份亮
 *   bars.diff(0, 1, '相差 30');            // 在两根之间标出差值
 *   bars.reset();                          // 每幕开始前清干净
 *
 * 数字默认藏起来是有意的：先让孩子看见「谁高谁矮」，再给数字。
 */
const Bars = (function () {
  function create(cfg) {
    const stage = cfg.stage || document.getElementById('stage');
    const items = cfg.items;
    const scale = cfg.scale || 2;
    const unit = cfg.unit || '';
    const baseline = cfg.baseline || 86;
    const barW = cfg.barWidth || 110;

    const root = document.createElement('div');
    root.className = 'bars';
    root.style.setProperty('--bars-base', baseline + 'px');
    root.style.setProperty('--bars-w', barW + 'px');
    stage.appendChild(root);

    // 均匀铺开：两边留边距，条与条之间等距
    const n = items.length;
    const pad = cfg.padding || 150;
    const bars = items.map((it, i) => {
      const el = document.createElement('div');
      el.className = 'bar';
      el.style.left = n === 1
        ? `calc(50% - ${barW / 2}px)`
        : `calc(${pad}px + (100% - ${pad * 2}px - ${barW}px) * ${i / (n - 1)})`;
      el.innerHTML =
        '<div class="bar-fill"><div class="bar-segs"></div></div>' +
        '<div class="bar-name"></div>';
      root.appendChild(el);

      const value = document.createElement('div');
      value.className = 'bar-value';
      el.appendChild(value);

      el.querySelector('.bar-name').textContent = it.name;
      const fill = el.querySelector('.bar-fill');
      fill.style.background = `linear-gradient(180deg, ${it.color}, ${shade(it.color)})`;
      return { el, fill, value, segs: el.querySelector('.bar-segs'), conf: it };
    });

    const guideEl = document.createElement('div');
    guideEl.className = 'bar-guide';
    guideEl.innerHTML = '<span></span>';
    root.appendChild(guideEl);

    const diffEl = document.createElement('div');
    diffEl.className = 'bar-diff';
    diffEl.innerHTML = '<span></span>';
    root.appendChild(diffEl);

    let values = items.map(() => 0);
    let numbersVisible = false;

    function px(v) { return v * scale; }

    function paint() {
      bars.forEach((b, i) => {
        const h = px(values[i]);
        b.fill.style.height = h + 'px';
        b.value.textContent = numbersVisible ? round(values[i]) + unit : '?';
        b.value.style.bottom = Math.max(h - 30, 8) + 'px';
      });
    }

    function set(next) {
      values = next.slice();
      paint();
    }

    async function tweenTo(next, ms, id) {
      const from = values.slice();
      await Anim.tween(ms, id, (e) => {
        set(from.map((v, i) => Anim.lerp(v, next[i], e)));
      });
    }

    function showNumbers(on) {
      numbersVisible = on !== false;
      paint();
    }

    function guide(value, text) {
      guideEl.style.bottom = (baseline + px(value)) + 'px';
      guideEl.querySelector('span').textContent = text || '';
      guideEl.classList.add('show');
    }
    function hideGuide() { guideEl.classList.remove('show'); }

    /** 把第 index 根切成 count 等份，一份一份亮起来 */
    async function split(index, count, label, id, stepMs) {
      const b = bars[index];
      b.segs.innerHTML = '';
      const each = px(values[index]) / count;
      for (let i = 0; i < count; i++) {
        const seg = document.createElement('div');
        seg.className = 'bar-seg';
        seg.style.height = each + 'px';
        seg.textContent = (i + 1) + (label || ' 份');
        b.segs.appendChild(seg);
        await Anim.sleep(stepMs || 280);
        if (id !== undefined && Anim.cancelled(id)) return;
        seg.classList.add('show');
      }
    }
    function clearSplit() { bars.forEach((b) => (b.segs.innerHTML = '')); }

    /** 在第 a 根和第 b 根之间标出高度差。两根一样高时不适合用它，改用 guide。 */
    function diff(a, b, text) {
      const hi = Math.max(px(values[a]), px(values[b]));
      const lo = Math.min(px(values[a]), px(values[b]));
      const left = bars[a].el.offsetLeft + barW;
      const right = bars[b].el.offsetLeft;
      diffEl.style.left = left + 'px';
      diffEl.style.width = Math.max(right - left, 40) + 'px';
      diffEl.style.bottom = (baseline + lo) + 'px';
      // 差为 0 时给个最小高度，否则括号塌成一条线，文字会糊在一起
      diffEl.style.height = Math.max(hi - lo, 22) + 'px';
      diffEl.querySelector('span').textContent = text || '';
      diffEl.classList.add('show');
    }
    function hideDiff() { diffEl.classList.remove('show'); }

    function reset() {
      numbersVisible = false;
      clearSplit();
      hideGuide();
      hideDiff();
    }

    return {
      set, tween: tweenTo, showNumbers,
      guide, hideGuide, split, clearSplit, diff, hideDiff, reset,
      get values() { return values.slice(); },
      bars,
    };
  }

  function round(v) {
    return Math.abs(v - Math.round(v)) < 1e-6 ? String(Math.round(v)) : v.toFixed(1);
  }

  /** 把颜色压暗一点，用来做条形的渐变底色 */
  function shade(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    const f = 0.72;
    const r = Math.round(((n >> 16) & 255) * f);
    const g = Math.round(((n >> 8) & 255) * f);
    const b = Math.round((n & 255) * f);
    return `rgb(${r},${g},${b})`;
  }

  return { create };
})();
