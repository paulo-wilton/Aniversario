const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const opts = {
    words: 'PARABENS LOVE',
    charSize: 70,
    gap: 15,
    fireworkTicked: 50
};

const calc = {
    totalWidth: 0,
    totalHeight: 0
};

let letters = [];
let sideFireworks = []; 

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


function Letter (char, x, y) {
    this.char = char;
    this.x = x;
    this.y = y;
    this.dx = ctx.measureText(char).width / 2;
    this.dy = opts.charSize / 2;
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
    if (this.phase === "firework") {
        ctx.fillStyle = this.lightColor;
        ctx.fillRect(this.x, this.fireworkDy, 3, 6);
    } else if (this.phase === "explode") {
        if (Math.random() > 0.3) { 
            ctx.fillStyle = this.lightColor;
            ctx.font = opts.charSize + 'px sans-serif';
            ctx.fillText(this.char, this.x - this.dx, this.y + this.dy);
        }
    } else if (this.phase === "show") {
        ctx.fillStyle = this.color;
        ctx.font = opts.charSize + 'px sans-serif';
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
            // Cria as faíscas da explosão lateral
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

function setupLetters() {
    letters = [];
    const wordsArray = opts.words.split(' ');
    let currentY = calc.totalHeight * 0.3;

    wordsArray.forEach((word) => {
        let wordWidth = 0;
        for (let i = 0; i < word.length; i++) {
            wordWidth += ctx.measureText(word[i]).width + opts.gap;
        }
        wordWidth -= opts.gap;
        let startX = (calc.totalWidth - wordWidth) / 2;

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            letters.push(new Letter(char, startX + ctx.measureText(char).width / 2, currentY));
            startX += ctx.measureText(char).width + opts.gap;
        }
        currentY += opts.charSize + 20;
    });
}

function checkRestart() {
    const todasProntas = letters.every(letter => letter.phase === "show");
    if (todasProntas) {
        letters.forEach(letter => letter.reset());
    }
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
}

window.addEventListener('resize', resize);
resize();
anim();
const audio = document.querySelector('audio');

document.addEventListener('click', function() {
    audio.play();
}, { once: true });
