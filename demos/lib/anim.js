/* 动画引擎：分幕调度、播放控件、补间、旁白。
 *
 * 用法（配合 anim.css）：
 *
 *   <div class="stage-wrap"><div class="stage" id="stage"> ...自己的元素... </div></div>
 *   <script src="lib/anim.js"></script>
 *   <script>
 *     const { sleep, cancelled, tween, lerp, say, pop } = Anim;
 *     Anim.run([
 *       { title: '第一幕', async play(id) { say('开始', '...'); await sleep(700); } },
 *     ], { reset: resetVisuals });
 *   </script>
 *
 * 每个 play(id) 都会收到一个 id。只要用户切走了这一幕，cancelled(id) 就变成 true，
 * 必须在每个 await 之后检查并 return，否则上一幕的动画会和新的一幕打架。
 */
const Anim = (function () {
  let scenes = [];
  let opts = {};
  let cur = 0;
  let token = 0;
  let autoPlaying = false;

  let stage, speech, spark, dotsBox;
  let playBtn, prevBtn, replayBtn, nextBtn;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const cancelled = (id) => id !== token;
  const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;

  /** 通用补间。onFrame 收到 0→1 的缓动进度，自己决定怎么用。 */
  function tween(ms, id, onFrame) {
    const t0 = performance.now();
    return new Promise((resolve) => {
      function frame(now) {
        if (cancelled(id)) return resolve();
        const t = Math.min(1, (now - t0) / ms);
        onFrame(ease(t), t);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  function say(tag, html) {
    speech.innerHTML = '<span class="tag">' + tag + '</span>' + html;
  }

  /** 敲重点：一句话弹出来再消失 */
  function pop(text) {
    spark.textContent = text;
    spark.classList.remove('pop');
    void spark.offsetWidth; // 强制重排，否则连续两次 pop 不会重新播放动画
    spark.classList.add('pop');
  }

  function mount() {
    stage = document.getElementById('stage');
    if (!stage) throw new Error('anim.js: 找不到 #stage');

    // 旁白和重点提示由引擎注入，页面里不用写。放在最前面保证它们在最上层。
    speech = document.createElement('div');
    speech.className = 'speech';
    speech.id = 'speech';
    stage.prepend(speech);

    spark = document.createElement('div');
    spark.className = 'spark';
    spark.id = 'spark';
    stage.appendChild(spark);

    const wrap = stage.closest('.stage-wrap') || stage;

    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML =
      '<button id="playBtn">▶ 自动播放整段动画</button>' +
      '<button id="prevBtn">← 上一段</button>' +
      '<button id="replayBtn">重播这一段</button>' +
      '<button id="nextBtn">下一段 →</button>';
    wrap.after(controls);

    dotsBox = document.createElement('div');
    dotsBox.className = 'dots';
    dotsBox.id = 'dots';
    controls.after(dotsBox);

    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = opts.hintText || '建议先点「自动播放」看完整动画片，再一段一段回看。';
    dotsBox.after(hint);

    playBtn = document.getElementById('playBtn');
    prevBtn = document.getElementById('prevBtn');
    replayBtn = document.getElementById('replayBtn');
    nextBtn = document.getElementById('nextBtn');

    scenes.forEach(() => {
      const d = document.createElement('div');
      d.className = 'dot';
      dotsBox.appendChild(d);
    });

    playBtn.onclick = playAll;
    prevBtn.onclick = () => { if (cur > 0) runScene(cur - 1); };
    replayBtn.onclick = () => runScene(cur);
    nextBtn.onclick = () => { if (cur < scenes.length - 1) runScene(cur + 1); };
  }

  function paintDots() {
    [...dotsBox.children].forEach((d, i) => d.classList.toggle('on', i === cur));
    prevBtn.disabled = cur === 0 || autoPlaying;
    nextBtn.disabled = cur === scenes.length - 1 || autoPlaying;
    replayBtn.disabled = autoPlaying;
  }

  async function runScene(i) {
    cur = i;
    paintDots();
    const id = ++token;
    if (opts.reset) opts.reset();
    await scenes[i].play(id);
  }

  async function playAll() {
    if (autoPlaying) {
      autoPlaying = false;
      token++; // 打断当前这一幕
      playBtn.textContent = '▶ 自动播放整段动画';
      paintDots();
      return;
    }
    autoPlaying = true;
    playBtn.textContent = '❚❚ 停止';
    paintDots();
    for (let i = 0; i < scenes.length; i++) {
      if (!autoPlaying) break;
      await runScene(i);
      if (!autoPlaying) break;
      await sleep(opts.gapMs || 900);
    }
    autoPlaying = false;
    playBtn.textContent = '▶ 自动播放整段动画';
    paintDots();
  }

  function run(sceneList, options) {
    scenes = sceneList;
    opts = options || {};
    mount();
    // 录制脚本会先设 window.ANIM_HOLD，让页面停在第一幕之前，
    // 否则第一幕会先自动播一遍、再被 playAll 重播一遍，视频开头就多出几秒。
    if (window.ANIM_HOLD) {
      cur = 0;
      paintDots();
      if (opts.reset) opts.reset();
      return;
    }
    runScene(0);
  }

  return {
    run,
    sleep, cancelled, ease, lerp, tween, say, pop,
    goto: runScene,
    playAll,
    isPlaying: () => autoPlaying,
    sceneCount: () => scenes.length,
    get stage() { return stage; },
  };
})();
