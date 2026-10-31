const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const opts = {
    words: 'PARABENS LOVE',
    charSize: 70,
    gap: 15,
    fireworkTicked: 50,
    subLines: [
        'Que seu novo ciclo seja cheio de felicidade, conquistas e momentos incríveis.',
        'Preparei cada detalhe com carinho para fazer seu dia um pouco mais especial.',
        'Você merece coisas lindas, hoje e sempre. Te amo!'
    ]
};

const calc = {
    totalWidth: 0,
    totalHeight: 0
};


const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);


const TIMING = {
    pause: 1500,           
    titleFade: 2800,       
    afterTitle: 600,      
    wordStep: 180,         
    linePause: 520,        
    wordFade: 1100,        
    beforeH1: 700,         
    h1Fade: 3200,          
    beforePersonal: 2200,  
    personalLineGap: 1400, 
    personalWordStep: 95, 
    personalWordFade: 1200,
    beforeFinale: 900,    
};

let letters = [];
let sideFireworks = [];


let heartParticles = [];
const heartPointsCount = 80;
const traceCount = 10;
let heartActive = false;
let pulseScale = 1;
let pulseDirection = 1;


let sceneActive = false;
let frameNow = performance.now();
const reveal = { title: Infinity, words: [], glow: Infinity };
let wordSparked = [];
let wordBoxes = [];
let titleBox = null;
let heartRevealed = false;
let heartCenter = { x: 0, y: 0, r: 0 };
let fxRate = 0;            
let sparks = [];           
const timeline = [];


const h1El = document.querySelector('.mensagem-container h1');
const pEl = document.querySelector('.mensagem-container p');
let pWords = [];

function prepareTexts() {
    document.documentElement.style.setProperty('--h1-dur', TIMING.h1Fade + 'ms');
    document.documentElement.style.setProperty('--pw-dur', TIMING.personalWordFade + 'ms');

    if (h1El) h1El.classList.add('seq');

    if (pEl) {
        
        const words = pEl.textContent.trim().split(/\s+/);
        pEl.textContent = '';
        words.forEach(function (w, i) {
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = w;
            pEl.appendChild(s);
            if (i < words.length - 1) pEl.appendChild(document.createTextNode(' '));
        });
        pWords = Array.prototype.slice.call(pEl.querySelectorAll('.w'));
    }
}
prepareTexts();


function getPLines() {
    const lines = [];
    let lastTop = null;
    pWords.forEach(function (w) {
        const top = Math.round(w.offsetTop);
        if (lastTop === null || Math.abs(top - lastTop) > 3) {
            lines.push([]);
            lastTop = top;
        }
        lines[lines.length - 1].push(w);
    });
    return lines;
}

/* ---------- Utilidades de tempo ---------- */
function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
function smooth(k) { return k * k * (3 - 2 * k); }
function progress(t0, dur) {
    if (t0 === undefined || t0 === Infinity) return 0;
    return clamp01((frameNow - t0) / dur);
}

function compensate(b) { return (0.25 * b) / (1 - 0.75 * b); }


function at(time, fn) {
    timeline.push({ t: time, fn: fn });
}
function runTimeline() {
    for (let i = 0; i < timeline.length; i++) {
        if (timeline[i].t <= frameNow) {
            const e = timeline.splice(i, 1)[0];
            i--;
            e.fn();
        }
    }
}

function countSubWords() {
    let n = 0;
    opts.subLines.forEach(function (l) {
        n += l.split(' ').filter(Boolean).length;
    });
    return n;
}


window.startBirthdayScene = function() {
    if (sceneActive) return;
    sideFireworks = [];
    setupLetters();      
    sceneActive = true;
    startSequence();
};

function startSequence() {
    const T = TIMING;
    const t0 = performance.now();
    const subCount = countSubWords();
    reveal.words = new Array(subCount).fill(Infinity);
    wordSparked = new Array(subCount).fill(false);

    if (reduceMotion) {
        showEverythingNow();
        return;
    }

    
    reveal.title = t0 + T.pause;

    
    let t = T.pause + T.titleFade + T.afterTitle;
    let id = 0;
    opts.subLines.forEach(function (line) {
        const n = line.split(' ').filter(Boolean).length;
        for (let k = 0; k < n; k++) {
            reveal.words[id++] = t0 + t;
            t += T.wordStep;
        }
        t += T.linePause;
    });
    const lastWordStart = t - T.linePause - T.wordStep;
    const subEnd = lastWordStart + T.wordFade;

    
    const h1Start = subEnd + T.beforeH1;
    at(t0 + h1Start, function () {
        if (h1El) h1El.classList.add('on');
    });

    
    at(t0 + h1Start + T.beforePersonal, startPersonal);
}

function startPersonal() {
    const T = TIMING;
    const lines = getPLines();
    const base = performance.now();
    let end = 0;

    lines.forEach(function (ws, li) {
        const lineStart = li * T.personalLineGap;
        ws.forEach(function (w, wi) {
            const when = lineStart + wi * T.personalWordStep;
            at(base + when, function () { w.classList.add('on'); });
            if (when > end) end = when;
        });
    });

    
    at(base + end + T.personalWordFade * 0.6 + T.beforeFinale, startFinale);
}

function startFinale() {
    const now = performance.now();
    heartRevealed = true;
    heartParticles.forEach(function (p) { p.reset(); });  
    reveal.glow = now + 1400;                               

    [200, 900, 1700, 2500].forEach(function (d) {
        at(now + d, function () {
            if (sideFireworks.length < 15) sideFireworks.push(new SideFirework());
        });
    });
    at(now + 1200, function () { fxRate = 0.04; });         
}


function showEverythingNow() {
    reveal.title = 0;
    for (let i = 0; i < reveal.words.length; i++) reveal.words[i] = 0;
    if (h1El) h1El.classList.add('on');
    pWords.forEach(function (w) { w.classList.add('on'); });
    heartRevealed = true;
    settleHeart();
    reveal.glow = 0;
}


function settleHeart() {
    heartParticles.forEach(function (p) {
        p.phase = "show";
        p.tick = opts.fireworkTicked + 1;
        p.x = calc.totalWidth / 2 + p.offsetX;
        p.y = p.baseY + p.offsetY;
        p.fireworkDy = p.y;
    });
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    calc.totalWidth = canvas.width;
    calc.totalHeight = canvas.height;
    opts.charSize = window.innerWidth <= 600 ? 35 : 70;
    opts.gap = window.innerWidth <= 600 ? 5 : 15;
    ctx.font = opts.charSize + 'px sans-serif';
    setupLetters();
}


function textWidth(str, size, gap) {
    ctx.font = size + 'px sans-serif';
    let w = 0;
    for (let i = 0; i < str.length; i++) {
        w += ctx.measureText(str[i]).width + gap;
    }
    return str.length ? w - gap : 0;
}

// Quebra uma frase em várias linhas para caber na largura máxima
function wrapLine(line, size, gap, maxW) {
    const words = line.split(' ');
    const lines = [];
    let cur = '';
    words.forEach(w => {
        const test = cur ? cur + ' ' + w : w;
        if (cur && textWidth(test, size, gap) > maxW) {
            lines.push(cur);
            cur = w;
        } else {
            cur = test;
        }
    });
    if (cur) lines.push(cur);
    return lines;
}


function Letter (char, x, y, size, group) {
    this.char = char;
    this.x = x;
    this.y = y;
    this.size = size || opts.charSize;
    this.group = group;
    this.sweep = 0;

    ctx.font = this.size + 'px sans-serif';
    this.dx = ctx.measureText(char).width / 2;
    this.dy = this.size / 2;

    this.fireworkDy = calc.totalHeight;
    const hue = (x / calc.totalWidth) * 360;
    this.hue = hue;
    this.color = `hsl(${hue}, 80%, 50%)`;
    this.lightColor = `hsl(${hue}, 80%, 70%)`;
    this.reset();
}

Letter.prototype.reset = function() {
    this.phase = "firework";
    this.fireworkDy = calc.totalHeight + Math.random() * 200;
    this.tick = 0;
};

Letter.prototype.step = function() {
    if (this.group !== undefined) return;   
    if (this.phase === "firework") {
        this.fireworkDy += (this.y - this.fireworkDy) * 0.08;
        if (Math.abs(this.fireworkDy - this.y) < 1) {
            this.phase = "explode";
        }
    } else if (this.phase === "explode") {
        this.tick++;
        if (this.tick > opts.fireworkTicked) {
            this.phase = "show";
        }
    }
};


Letter.prototype.drawText = function() {
    let k;
    let yOff = 0;

    if (this.group === 'title') {
        const p = progress(reveal.title, TIMING.titleFade);
        if (p <= 0) return;
        k = clamp01(p * 1.4 - this.sweep * 0.4);   
    } else {
        k = progress(reveal.words[this.group], TIMING.wordFade);
        yOff = (1 - smooth(k)) * 8;                
    }
    if (k <= 0) return;

    const b = smooth(k);
    ctx.font = this.size + 'px sans-serif';
    ctx.globalAlpha = compensate(b);
    
    ctx.fillStyle = k < 1 ? `hsl(${this.hue}, 80%, ${50 + 22 * (1 - b)}%)` : this.color;

    ctx.fillText(this.char, this.x - this.dx, this.y + this.dy + yOff);

    ctx.globalAlpha = 1;
};

Letter.prototype.draw = function() {
    if (this.group !== undefined) {
        this.drawText();
        return;
    }
    ctx.font = this.size + 'px sans-serif';
    if (this.phase === "firework") {
        ctx.fillStyle = this.lightColor;
        ctx.fillRect(this.x, this.fireworkDy, this.size > 40 ? 3 : 1.5, this.size > 40 ? 6 : 3);
    } else if (this.phase === "explode") {
        if (Math.random() > 0.3) {
            ctx.fillStyle = this.lightColor;
            ctx.fillText(this.char, this.x - this.dx, this.y + this.dy);
        }
    } else if (this.phase === "show") {
        ctx.fillStyle = this.color;
        ctx.fillText(this.char, this.x - this.dx, this.y + this.dy);
    }
};

function SideFirework() {
    const naEsquerda = Math.random() < 0.5;
    this.x = naEsquerda ? Math.random() * (calc.totalWidth * 0.2) : calc.totalWidth * 0.8 + Math.random() * (calc.totalWidth * 0.2);

    this.y = calc.totalHeight;
    this.targetY = Math.random() * (calc.totalHeight * 0.6) + (calc.totalHeight * 0.1);
    this.hue = Math.random() * 360;
    this.color = `hsl(${this.hue}, 100%, 60%)`;
    this.speed = Math.random() * 4 + 4;
    this.phase = "subindo";
    this.particles = [];
}

SideFirework.prototype.update = function() {
    if (this.phase === "subindo") {
        this.y -= this.speed;
        if (this.y <= this.targetY) {
            this.phase = "explodido";
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 3 + 1;
                this.particles.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: 1
                });
            }
        }
    } else {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.04;
            p.alpha -= 0.015;
        });
        this.particles = this.particles.filter(p => p.alpha > 0);
    }
};

SideFirework.prototype.draw = function() {
    if (this.phase === "subindo") {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 3, 3);
    } else {
        this.particles.forEach(p => {
            ctx.fillStyle = `hsla(${this.hue}, 100%, 60%, ${p.alpha})`;
            ctx.fillRect(p.x, p.y, 2, 2);
        });
    }
};


function getHeartPoint(t) {
    return {
        x: 16 * Math.pow(Math.sin(t), 3),
        y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    };
}

function setupLetters() {
    letters = [];
    wordBoxes = [];
    titleBox = null;

    const isMobile = window.innerWidth <= 600;
    const maxW = calc.totalWidth * (isMobile ? 0.94 : 0.92);

    
    const msgEl = document.querySelector('.mensagem-container');
    const msgTop = msgEl ? msgEl.getBoundingClientRect().top : calc.totalHeight;

    const wordsArray = opts.words.split(' ');
    let currentY = calc.totalHeight * (isMobile ? 0.08 : 0.15);

    
    let titleSize = opts.charSize;
    let titleGap = opts.gap;
    const widestWord = () => Math.max(...wordsArray.map(w => textWidth(w, titleSize, titleGap)));
    while (titleSize > 16 && widestWord() > maxW) {
        titleSize -= 1;
        titleGap = opts.gap * (titleSize / opts.charSize);
    }

    ctx.font = titleSize + 'px sans-serif';

    const titleLetters = [];
    const titleTopY = currentY;
    let lastRowY = currentY;

    wordsArray.forEach((word) => {
        let wordWidth = 0;
        for (let i = 0; i < word.length; i++) {
            wordWidth += ctx.measureText(word[i]).width + titleGap;
        }
        wordWidth -= titleGap;
        let startX = (calc.totalWidth - wordWidth) / 2;

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const l = new Letter(char, startX + ctx.measureText(char).width / 2, currentY, titleSize, 'title');
            letters.push(l);
            titleLetters.push(l);
            startX += ctx.measureText(char).width + titleGap;
        }
        lastRowY = currentY;
        currentY += titleSize + (isMobile ? 12 : 20);
    });

    if (titleLetters.length) {
        let minX = Infinity;
        let maxX = -Infinity;
        titleLetters.forEach(l => {
            if (l.x < minX) minX = l.x;
            if (l.x > maxX) maxX = l.x;
        });
        const span = (maxX - minX) || 1;
        titleLetters.forEach(l => { l.sweep = (l.x - minX) / span; });
        titleBox = { x1: minX, x2: maxX, y1: titleTopY - titleSize * 0.2, y2: lastRowY + titleSize * 0.5 };
    }


    let subCharSize = isMobile ? 14 : 20;
    let subGap = isMobile ? 2 : 4;
    const lineStep = (size) => size + (isMobile ? 10 : 15);
    const minHeartSpace = isMobile ? 80 : 120;
    const subStartY = currentY + (isMobile ? 10 : 20);

    
    let wrapped;
    while (true) {
        subGap = isMobile ? Math.max(1, Math.round(subCharSize / 7)) : 4;
        wrapped = [];
        opts.subLines.forEach(l => wrapped.push(...wrapLine(l, subCharSize, subGap, maxW)));
        const endY = subStartY + wrapped.length * lineStep(subCharSize);
        if (msgTop - endY >= minHeartSpace || subCharSize <= 10) break;
        subCharSize -= 1;
    }

    currentY = subStartY;

    let wid = 0;   

    wrapped.forEach((line) => {
        ctx.font = subCharSize + 'px sans-serif';
        let lineWidth = 0;
        for (let i = 0; i < line.length; i++) {
            lineWidth += ctx.measureText(line[i]).width + subGap;
        }
        lineWidth -= subGap;
        let startX = (calc.totalWidth - lineWidth) / 2;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === ' ') {
                startX += ctx.measureText(' ').width + subGap;
                wid++;
                continue;
            }

            const cx = startX + ctx.measureText(char).width / 2;
            letters.push(new Letter(char, cx, currentY, subCharSize, wid));

            const box = wordBoxes[wid] || (wordBoxes[wid] = { x1: cx, x2: cx, y: currentY });
            if (cx < box.x1) box.x1 = cx;
            if (cx > box.x2) box.x2 = cx;

            startX += ctx.measureText(char).width + subGap;
        }
        wid++;
        currentY += lineStep(subCharSize);
    });


    heartParticles = [];
    let baseScale = isMobile ? 3.5 : 6;
    let baseHeartY = currentY + (isMobile ? 50 : 80);

    
    const TOP = 10.1 * 1.15;
    const BOTTOM = 17 * 1.15;
    const fitsOriginal = (baseHeartY - TOP * baseScale >= currentY - 10) &&
                         (baseHeartY + BOTTOM * baseScale <= msgTop - 5);

    if (!fitsOriginal) {
        
        const areaTop = currentY - 5;
        const areaBottom = msgTop - 8;
        const avail = Math.max(areaBottom - areaTop, 40);
        baseScale = Math.max(1.5, Math.min(baseScale, avail / (TOP + BOTTOM)));
        baseHeartY = areaTop + (avail - (TOP + BOTTOM) * baseScale) / 2 + TOP * baseScale;
    }

    
    const maxHalfWidth = (calc.totalWidth / 2 - 8) / (16 * 1.15);
    baseScale = Math.min(baseScale, maxHalfWidth);

    heartCenter = {
        x: calc.totalWidth / 2,
        y: baseHeartY + 3.45 * baseScale,
        r: baseScale * 16 * 1.15 * 1.9
    };

    for (let i = 0; i < heartPointsCount; i++) {
        let t = (i / heartPointsCount) * Math.PI * 2;
        let point = getHeartPoint(t);

        let targetX = calc.totalWidth / 2 + point.x * baseScale;
        let targetY = baseHeartY + point.y * baseScale;


        let p = new Letter('', targetX, targetY, 0);


        p.baseX = targetX;
        p.baseY = baseHeartY;
        p.offsetX = point.x * baseScale;
        p.offsetY = point.y * baseScale;
        p.trace = [];


        let pinkHue = 330 + Math.random() * 20;
        p.color = `hsla(${pinkHue}, 100%, 65%, 0.85)`;
        p.lightColor = `hsla(${pinkHue}, 100%, 80%, 1)`;

        for (let k = 0; k < traceCount; k++) {
            p.trace[k] = { x: targetX, y: calc.totalHeight };
        }
        heartParticles.push(p);
    }

    
    if (heartRevealed) settleHeart();
}


function addSpark(x, y, big) {
    sparks.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(0.1 + Math.random() * 0.5),
        life: 1,
        decay: 0.006 + Math.random() * 0.01,
        size: (big ? 1.4 : 0.8) + Math.random() * 1.3,
        hue: Math.random() < 0.65 ? 320 + Math.random() * 30 : 38 + Math.random() * 14,
        ph: Math.random() * 6.283
    });
}

function updateSparks() {
    if (!reduceMotion && sparks.length < 70 && Math.random() < 0.15) {
        addSpark(Math.random() * calc.totalWidth, calc.totalHeight * (0.3 + Math.random() * 0.7), false);
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;
        if (s.life <= 0) {
            sparks.splice(i, 1);
            continue;
        }
        const tw = 0.55 + 0.45 * Math.sin(frameNow / 160 + s.ph);
        ctx.globalAlpha = Math.max(0, s.life) * tw * 0.9;
        ctx.fillStyle = `hsl(${s.hue}, 100%, 78%)`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}


function checkReveals() {
    if (reduceMotion) return;

    const tp = progress(reveal.title, TIMING.titleFade);
    if (titleBox && tp > 0.03 && tp < 1 && Math.random() < 0.6) {
        addSpark(
            titleBox.x1 + Math.random() * (titleBox.x2 - titleBox.x1),
            titleBox.y1 + Math.random() * (titleBox.y2 - titleBox.y1),
            true
        );
    }

    for (let id = 0; id < reveal.words.length; id++) {
        if (!wordSparked[id] && frameNow >= reveal.words[id]) {
            wordSparked[id] = true;
            const b = wordBoxes[id];
            if (b) {
                for (let k = 0; k < 3; k++) {
                    addSpark(b.x1 + Math.random() * (b.x2 - b.x1), b.y + (Math.random() - 0.5) * 8, true);
                }
            }
        }
    }
}


function drawHeartGlow() {
    const g = progress(reveal.glow, 2600);
    if (g <= 0) return;

    const e = smooth(g);
    const beat = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(frameNow / 380);
    const alpha = e * (0.04 + 0.025 * beat);
    const R = heartCenter.r * (0.85 + 0.15 * e + 0.05 * beat);
    const cx = heartCenter.x;
    const cy = heartCenter.y;

    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    gr.addColorStop(0, 'rgba(255, 70, 160, 1)');
    gr.addColorStop(0.45, 'rgba(255, 70, 160, 0.35)');
    gr.addColorStop(1, 'rgba(255, 70, 160, 0)');

    ctx.globalAlpha = alpha;
    ctx.fillStyle = gr;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.globalAlpha = 1;
}

function updateAndDrawHeart() {
    if (!heartRevealed) return;   

    if (!reduceMotion) {
        pulseScale += 0.008 * pulseDirection;
        if (pulseScale > 1.15) pulseDirection = -1;
        if (pulseScale < 0.95) pulseDirection = 1;
    } else {
        pulseScale = 1;
    }

    drawHeartGlow();

    heartParticles.forEach(p => {
        p.step();

        if (p.phase === "firework") {

            ctx.fillStyle = p.lightColor;
            ctx.fillRect(p.x, p.fireworkDy, 2, 4);
        } else {

            let animatedX = calc.totalWidth / 2 + p.offsetX * pulseScale;
            let animatedY = p.baseY + p.offsetY * pulseScale;


            p.x += (animatedX - p.x) * 0.1;
            p.y += (animatedY - p.y) * 0.1;


            ctx.fillStyle = p.color;
            ctx.fillRect(p.x + (Math.random() - 0.5) * 1.5, p.y + (Math.random() - 0.5) * 1.5, 3, 3);
        }
    });
}

function anim() {
    window.requestAnimationFrame(anim);
    frameNow = performance.now();
    if (!sceneActive) return;

    runTimeline();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, 0, calc.totalWidth, calc.totalHeight);

    if (!reduceMotion && fxRate > 0 && Math.random() < fxRate && sideFireworks.length < 15) {
        sideFireworks.push(new SideFirework());
    }

    sideFireworks.forEach(fw => {
        fw.update();
        fw.draw();
    });

    sideFireworks = sideFireworks.filter(fw => fw.phase === "subindo" || fw.particles.length > 0);

    checkReveals();

    letters.forEach((letter) => {
        letter.step();
        letter.draw();
    });

    updateSparks();

    updateAndDrawHeart();
}

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();
anim();

const audio = document.querySelector('audio');
document.addEventListener('click', function() {
    if (audio) audio.play().catch(e => console.log("Áudio pendente:", e));
}, { once: true });


if (!document.getElementById('intro')) {
    window.startBirthdayScene();
}



(function () {
    const intro = document.getElementById('intro');
    const cv = document.getElementById('intro-canvas');
    if (!intro || !cv) return;

    const c = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1;

    function fit() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        cv.width = W * dpr;
        cv.height = H * dpr;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fit();
    window.addEventListener('resize', fit);

    let parts = [];
    let rockets = [];
    let raf = null;
    let opened = false;

    
    const palette = [
        [330, 100, 65], [340, 100, 72], [320, 90, 70],
        [45, 100, 65], [0, 0, 100], [350, 100, 80]
    ];

    function spawn(x, y, vx, vy, o) {
        parts.push(Object.assign({
            x: x, y: y, vx: vx, vy: vy,
            life: 1, decay: 0.01, size: 1.5,
            fr: 0.985, g: 0.03, col: palette[0]
        }, o || {}));
    }

    
    function burst(x, y) {
        for (let i = 0; i < 150; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = Math.sqrt(Math.random()) * 7;
            spawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp, {
                col: palette[Math.floor(Math.random() * palette.length)],
                size: 1 + Math.random() * 2.4,
                decay: 0.008 + Math.random() * 0.01,
                g: 0.02, fr: 0.982
            });
        }
        for (let i = 0; i < 14; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = Math.random() * 2.5;
            spawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp, {
                col: palette[0], size: 4 + Math.random() * 3,
                decay: 0.02, g: 0, fr: 0.97
            });
        }
    }

    function explode(x, y) {
        const col = palette[Math.floor(Math.random() * palette.length)];
        if (Math.random() < 0.4) {
            
            const k = 0.2;
            for (let i = 0; i < 64; i++) {
                const t = (i / 64) * Math.PI * 2;
                const hx = 16 * Math.pow(Math.sin(t), 3);
                const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
                spawn(x, y, hx * k, hy * k, {
                    col: [335 + Math.random() * 15, 100, 68],
                    size: 2, decay: 0.009, fr: 0.975, g: 0.008
                });
            }
        } else {
            for (let i = 0; i < 70; i++) {
                const a = Math.random() * Math.PI * 2;
                const sp = 1 + Math.random() * 4.5;
                spawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp, {
                    col: col, size: 1.2 + Math.random() * 1.6,
                    decay: 0.009 + Math.random() * 0.008,
                    fr: 0.98, g: 0.035
                });
            }
        }
    }

    function launch() {
        rockets.push({
            x: W * (0.15 + Math.random() * 0.7),
            y: H,
            ty: H * (0.15 + Math.random() * 0.35),
            vy: -(6 + Math.random() * 3)
        });
    }

    function loop() {
        raf = window.requestAnimationFrame(loop);

        
        c.globalCompositeOperation = 'destination-out';
        c.fillStyle = 'rgba(0, 0, 0, 0.25)';
        c.fillRect(0, 0, W, H);
        c.globalCompositeOperation = 'lighter';

        for (let i = rockets.length - 1; i >= 0; i--) {
            const r = rockets[i];
            r.y += r.vy;
            spawn(r.x, r.y, (Math.random() - 0.5) * 0.4, Math.random() * 0.6, {
                col: palette[3], size: 1.3, decay: 0.045, g: 0, fr: 1
            });
            if (r.y <= r.ty) {
                explode(r.x, r.y);
                rockets.splice(i, 1);
            }
        }

        if (parts.length > 1800) parts.splice(0, parts.length - 1800);

        for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            p.vx *= p.fr;
            p.vy = p.vy * p.fr + p.g;
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) { parts.splice(i, 1); continue; }
            c.fillStyle = 'hsla(' + p.col[0] + ',' + p.col[1] + '%,' + p.col[2] + '%,' + p.life + ')';
            c.beginPath();
            c.arc(p.x, p.y, p.size * (0.6 + p.life * 0.6), 0, Math.PI * 2);
            c.fill();
        }
    }

    function reveal_() {
        
        if (window.startBirthdayScene) window.startBirthdayScene();
        document.body.classList.remove('intro-active');
        intro.classList.add('fade-out');

        setTimeout(function () {
            if (raf) window.cancelAnimationFrame(raf);
            window.removeEventListener('resize', fit);
            intro.remove();
        }, 2000);
    }

    function openIntro() {
        if (opened) return;   
        opened = true;
        intro.classList.add('opening');

        
        if (reduceMotion) {
            setTimeout(reveal_, 900);
            return;
        }

        loop();

        setTimeout(function () { burst(W / 2, H / 2); }, 450);

        const times = [1000, 1350, 1700, 2000, 2300, 2650, 3000];
        times.forEach(function (t) {
            setTimeout(launch, t + Math.random() * 120);
        });

        setTimeout(reveal_, 3500);
    }

    intro.addEventListener('click', openIntro);
    intro.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openIntro();
            
            if (audio) audio.play().catch(function () {});
        }
    });
})();
