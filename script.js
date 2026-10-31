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

let letters = [];
let sideFireworks = []; 


let heartParticles = [];
const heartPointsCount = 80;
const traceCount = 10;
let heartActive = false;
let pulseScale = 1;
let pulseDirection = 1;

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

/* ---------- Funções auxiliares de medida (responsividade) ---------- */

// Largura de um texto desenhado letra a letra com espaçamento "gap"
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

function Letter (char, x, y, size) {
    this.char = char;
    this.x = x;
    this.y = y;
    this.size = size || opts.charSize; 
    
    ctx.font = this.size + 'px sans-serif';
    this.dx = ctx.measureText(char).width / 2;
    this.dy = this.size / 2;
    
    this.fireworkDy = calc.totalHeight; 
    const hue = (x / calc.totalWidth) * 360;
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

Letter.prototype.draw = function() {
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
    
    const isMobile = window.innerWidth <= 600;
    const maxW = calc.totalWidth * (isMobile ? 0.94 : 0.92);

    // Topo do bloco de mensagem em HTML (o coração não pode passar daqui)
    const msgEl = document.querySelector('.mensagem-container');
    const msgTop = msgEl ? msgEl.getBoundingClientRect().top : calc.totalHeight;
    
    const wordsArray = opts.words.split(' ');
    let currentY = calc.totalHeight * (isMobile ? 0.08 : 0.15); 

    // Tamanho do título: reduz apenas se não couber na largura da tela
    let titleSize = opts.charSize;
    let titleGap = opts.gap;
    const widestWord = () => Math.max(...wordsArray.map(w => textWidth(w, titleSize, titleGap)));
    while (titleSize > 16 && widestWord() > maxW) {
        titleSize -= 1;
        titleGap = opts.gap * (titleSize / opts.charSize);
    }

    ctx.font = titleSize + 'px sans-serif';

    wordsArray.forEach((word) => {
        let wordWidth = 0;
        for (let i = 0; i < word.length; i++) {
            wordWidth += ctx.measureText(word[i]).width + titleGap;
        }
        wordWidth -= titleGap;
        let startX = (calc.totalWidth - wordWidth) / 2;

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            letters.push(new Letter(char, startX + ctx.measureText(char).width / 2, currentY, titleSize));
            startX += ctx.measureText(char).width + titleGap;
        }
        currentY += titleSize + (isMobile ? 12 : 20);
    });

    
    let subCharSize = isMobile ? 14 : 20; 
    let subGap = isMobile ? 2 : 4;
    const lineStep = (size) => size + (isMobile ? 10 : 15);
    const minHeartSpace = isMobile ? 80 : 120;
    const subStartY = currentY + (isMobile ? 10 : 20);

    // Quebra as frases em linhas que cabem na tela; reduz a fonte só se faltar espaço
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
                continue;
            }

            letters.push(new Letter(char, startX + ctx.measureText(char).width / 2, currentY, subCharSize));
            startX += ctx.measureText(char).width + subGap;
        }
        currentY += lineStep(subCharSize); 
    });

    
    heartParticles = [];
    let baseScale = isMobile ? 3.5 : 6;
    let baseHeartY = currentY + (isMobile ? 50 : 80);

    // Extensão vertical do coração (já considerando a pulsação de 1.15x)
    const TOP = 10.1 * 1.15;
    const BOTTOM = 17 * 1.15;
    const fitsOriginal = (baseHeartY - TOP * baseScale >= currentY - 10) &&
                         (baseHeartY + BOTTOM * baseScale <= msgTop - 5);

    if (!fitsOriginal) {
        // Ajusta tamanho e posição do coração para ficar entre o texto e a mensagem
        const areaTop = currentY - 5;
        const areaBottom = msgTop - 8;
        const avail = Math.max(areaBottom - areaTop, 40);
        baseScale = Math.max(1.5, Math.min(baseScale, avail / (TOP + BOTTOM)));
        baseHeartY = areaTop + (avail - (TOP + BOTTOM) * baseScale) / 2 + TOP * baseScale;
    }

    // Garante que o coração nunca ultrapasse as laterais
    const maxHalfWidth = (calc.totalWidth / 2 - 8) / (16 * 1.15);
    baseScale = Math.min(baseScale, maxHalfWidth);

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
}

function updateAndDrawHeart() {
   
    pulseScale += 0.008 * pulseDirection;
    if (pulseScale > 1.15) pulseDirection = -1;
    if (pulseScale < 0.95) pulseDirection = 1;

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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; 
    ctx.fillRect(0, 0, calc.totalWidth, calc.totalHeight);

    if (Math.random() < 0.04 && sideFireworks.length < 15) {
        sideFireworks.push(new SideFirework());
    }

    sideFireworks.forEach(fw => {
        fw.update();
        fw.draw();
    });
    
    sideFireworks = sideFireworks.filter(fw => fw.phase === "subindo" || fw.particles.length > 0);

    
    letters.forEach((letter) => {
        letter.step();
        letter.draw();
    });

    
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
