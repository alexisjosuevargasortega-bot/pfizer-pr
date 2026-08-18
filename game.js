// ================================================
// PFIZER CARE CONNECT ACADEMY - HD CANVAS ENGINE
// Full canvas 2D game with textured environment
// ================================================

// ------------------- CONFIG -------------------
var CHAR_COLORS = ['#48dbfb','#feca57','#ff9ff3','#1dd1a1'];
var CHAR_DARK   = ['#00a8cc','#cc9900','#cc4499','#009977'];
var CHAR_NAMES  = ['Gotita Azul','Gotita Dorada','Gotita Rosa','Gotita Verde'];

var W = 0, H = 0;          // canvas size (fills viewport)
var canvas, ctx;
var selectedChar = 0;
var playerColor, playerDark;
var score = 0;
var gameState = 'START';   // START | EXPLORING | READING | DECIDING | GAMEOVER
var currentCase = null;
var loopRunning = false;

// ------------------- PLAYER -------------------
var player = {
    x: 0, y: 0,
    vx: 0, vy: 0,
    speed: 4.5,
    flipped: false,
    walkCycle: 0,
    expression: 'happy',  // happy | scared | sad
    shadow: 1
};
var keys      = {};
var targetPos = null;

// ------------------- TIMER -------------------
var timeLeft = 0;
var timerInt = null;

// ------------------- PARTICLES -------------------
var particles = [];

function spawnParticle(x, y, color) {
    for (var i = 0; i < 6; i++) {
        var angle = (Math.PI * 2 * i / 6) + Math.random() * 0.5;
        var spd   = 1.5 + Math.random() * 2.5;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd - 1.5,
            life: 1.0,
            decay: 0.025 + Math.random() * 0.02,
            size: 4 + Math.random() * 5,
            color: color
        });
    }
}

function spawnDustParticles(x, y) {
    if (Math.random() > 0.3) return;
    particles.push({
        x: x + (Math.random()-0.5)*20,
        y: y + 5,
        vx: (Math.random()-0.5)*0.8,
        vy: -0.3 - Math.random()*0.5,
        life: 0.6,
        decay: 0.04,
        size: 3 + Math.random()*4,
        color: 'rgba(200,220,255,0.5)'
    });
}

function updateParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x   += p.vx;
        p.y   += p.vy;
        p.vy  += 0.08;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ------------------- ENVIRONMENT -------------------
// Ambient light animation
var ambientT = 0;
// Floating orbs for atmosphere
var orbs = [];
for (var _i = 0; _i < 5; _i++) {
    orbs.push({
        x: Math.random() * 800,
        y: 80 + Math.random() * 120,
        r: 40 + Math.random() * 60,
        speed: 0.3 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        color: _i % 2 === 0 ? 'rgba(72,219,251,0.06)' : 'rgba(0,56,147,0.07)'
    });
}

function drawEnvironment() {
    ambientT += 0.008;

    // --- SKY / CEILING ---
    var skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.52);
    skyGrad.addColorStop(0,   '#1c2e60');
    skyGrad.addColorStop(0.5, '#2a4490');
    skyGrad.addColorStop(1,   '#1a3070');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.52);

    // Ceiling light strip
    var ceilGrad = ctx.createLinearGradient(0, 0, 0, 12);
    ceilGrad.addColorStop(0, 'rgba(180,210,255,0.8)');
    ceilGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(0, 0, W, 12);

    // Overhead lights
    var lightPositions = [W*0.25, W*0.5, W*0.75];
    for (var li = 0; li < lightPositions.length; li++) {
        var lx = lightPositions[li];
        var lightGlow = ctx.createRadialGradient(lx, 0, 0, lx, 0, 180);
        lightGlow.addColorStop(0, 'rgba(200,230,255,0.18)');
        lightGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = lightGlow;
        ctx.fillRect(0, 0, W, H * 0.55);

        // Fixture
        ctx.fillStyle = '#d0e0ff';
        ctx.fillRect(lx - 30, 0, 60, 6);
        ctx.fillStyle = 'rgba(220,240,255,0.9)';
        ctx.fillRect(lx - 28, 2, 56, 3);
    }

    // --- BACK WALL WAINSCOTING ---
    var wallH = H * 0.52;

    // Upper wall
    ctx.fillStyle = '#223a78';
    ctx.fillRect(0, 0, W, wallH);

    // Wall trim horizontal line
    ctx.strokeStyle = 'rgba(100,150,255,0.25)';
    ctx.lineWidth   = 1;
    for (var wy = 60; wy < wallH; wy += 80) {
        ctx.beginPath();
        ctx.moveTo(0, wy);
        ctx.lineTo(W, wy);
        ctx.stroke();
    }
    for (var wx = 0; wx < W; wx += 80) {
        ctx.beginPath();
        ctx.moveTo(wx, 0);
        ctx.lineTo(wx, wallH);
        ctx.stroke();
    }

    // Windows
    var winDefs = [
        { x: W*0.12, y: 30, w: 100, h: 160 },
        { x: W*0.42, y: 30, w: 100, h: 160 },
        { x: W*0.72, y: 30, w: 100, h: 160 }
    ];
    for (var wi = 0; wi < winDefs.length; wi++) {
        drawWindow(winDefs[wi].x, winDefs[wi].y, winDefs[wi].w, winDefs[wi].h, ambientT + wi);
    }

    // Pfizer logo on wall
    drawWallLogo(W * 0.5, 210);

    // Lower wainscoting panel
    var panelY = wallH - 90;
    ctx.fillStyle = '#1a2d65';
    ctx.fillRect(0, panelY, W, 90);
    // Panel rail
    ctx.fillStyle = '#2e4fa0';
    ctx.fillRect(0, panelY, W, 5);
    ctx.fillStyle = '#162555';
    ctx.fillRect(0, panelY + 85, W, 5);

    // Wainscoting panels detail
    for (var pi = 0; pi < 8; pi++) {
        var px = (W / 8) * pi + 10;
        ctx.strokeStyle = 'rgba(60,90,180,0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px, panelY + 12, W/8 - 20, 68);
    }

    // --- FLOATING ATMOSPHERE ORBS ---
    for (var oi = 0; oi < orbs.length; oi++) {
        var ob = orbs[oi];
        var ox = ob.x + Math.sin(ambientT * ob.speed + ob.phase) * 30;
        var oy = ob.y + Math.cos(ambientT * ob.speed * 0.7 + ob.phase) * 15;
        var orbGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, ob.r);
        orbGrad.addColorStop(0, ob.color);
        orbGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, ob.r, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- FLOOR ---
    drawFloor(H * 0.52);

    // --- DECORATIONS ---
    drawPlant(50, H * 0.52);
    drawPlant(W - 60, H * 0.52);
}

function drawWindow(x, y, w, h, t) {
    // Outside sky
    var skyOut = ctx.createLinearGradient(x, y, x, y+h);
    skyOut.addColorStop(0, '#87CEEB');
    skyOut.addColorStop(0.5, '#b0dfff');
    skyOut.addColorStop(1, '#d4f0ff');
    ctx.fillStyle = skyOut;
    roundRect(x, y, w, h, 4, true);

    // Animated clouds
    ctx.save();
    ctx.beginPath();
    roundRect(x, y, w, h, 4, false);
    ctx.clip();
    var cx = x + ((t * 12) % (w + 60)) - 30;
    drawCloud(ctx, cx, y + h*0.3, 0.4);
    drawCloud(ctx, cx - 40, y + h*0.6, 0.25);
    ctx.restore();

    // Window frame
    ctx.strokeStyle = '#2d4fa0';
    ctx.lineWidth = 5;
    roundRect(x, y, w, h, 4, false);
    ctx.stroke();

    // Window panes (cross)
    ctx.strokeStyle = 'rgba(45,79,160,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w/2, y);
    ctx.lineTo(x + w/2, y + h);
    ctx.moveTo(x, y + h/2);
    ctx.lineTo(x + w, y + h/2);
    ctx.stroke();

    // Window glare
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(x+5, y+5);
    ctx.lineTo(x+w*0.4, y+5);
    ctx.lineTo(x+w*0.4, y+h*0.4);
    ctx.lineTo(x+5, y+h*0.4);
    ctx.closePath();
    ctx.fill();

    // Bottom sill
    ctx.fillStyle = '#3a5bbf';
    ctx.fillRect(x-5, y+h, w+10, 8);
}

function drawCloud(ctx, x, y, scale) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(x,      y,      20*scale, 0, Math.PI*2);
    ctx.arc(x+18*scale, y-8*scale,  15*scale, 0, Math.PI*2);
    ctx.arc(x+30*scale, y+2*scale,  12*scale, 0, Math.PI*2);
    ctx.fill();
}

function drawWallLogo(x, y) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#90beff';
    ctx.font = 'bold 22px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pfizer CARE Connect Academy', x, y);
    ctx.restore();
}

function drawFloor(startY) {
    var floorH = H - startY;

    // Base floor color
    var floorGrad = ctx.createLinearGradient(0, startY, 0, H);
    floorGrad.addColorStop(0, '#2c3e6e');
    floorGrad.addColorStop(1, '#1a2545');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, startY, W, floorH);

    // Tile grid
    var tileW = 90;
    var tileH = 70;
    var cols = Math.ceil(W / tileW) + 1;
    var rows = Math.ceil(floorH / tileH) + 1;

    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
            var tx = col * tileW;
            var ty = startY + row * tileH;

            // Alternate tile colors for a checkerboard-like effect
            var isDark = (row + col) % 2 === 0;
            var tileColor = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.04)';
            ctx.fillStyle = tileColor;
            ctx.fillRect(tx + 1, ty + 1, tileW - 2, tileH - 2);

            // Tile highlight (specular top edge)
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fillRect(tx + 1, ty + 1, tileW - 2, 3);
        }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(80,120,200,0.2)';
    ctx.lineWidth = 1;
    for (var gc = 0; gc <= cols; gc++) {
        ctx.beginPath();
        ctx.moveTo(gc * tileW, startY);
        ctx.lineTo(gc * tileW, H);
        ctx.stroke();
    }
    for (var gr = 0; gr <= rows; gr++) {
        ctx.beginPath();
        ctx.moveTo(0, startY + gr * tileH);
        ctx.lineTo(W, startY + gr * tileH);
        ctx.stroke();
    }

    // Floor glow from overhead lights
    for (var fl = 0; fl < 3; fl++) {
        var flx = W * (fl === 0 ? 0.25 : fl === 1 ? 0.5 : 0.75);
        var floorGlow = ctx.createRadialGradient(flx, startY, 0, flx, startY, 150);
        floorGlow.addColorStop(0, 'rgba(150,200,255,0.1)');
        floorGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = floorGlow;
        ctx.fillRect(0, startY, W, 150);
    }

    // Floor-wall junction baseboard
    ctx.fillStyle = '#4a6aaa';
    ctx.fillRect(0, startY, W, 5);
    ctx.fillStyle = '#2a3d80';
    ctx.fillRect(0, startY + 5, W, 3);
}

function drawPlant(x, floorY) {
    // Pot
    var potGrad = ctx.createLinearGradient(x-15, 0, x+15, 0);
    potGrad.addColorStop(0, '#8B4513');
    potGrad.addColorStop(0.5, '#cd6d1e');
    potGrad.addColorStop(1, '#7a3a0e');
    ctx.fillStyle = potGrad;
    ctx.beginPath();
    ctx.moveTo(x-18, floorY + 5);
    ctx.lineTo(x-15, floorY - 30);
    ctx.lineTo(x+15, floorY - 30);
    ctx.lineTo(x+18, floorY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6a2e08';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Soil
    ctx.fillStyle = '#3d1e05';
    ctx.beginPath();
    ctx.ellipse(x, floorY - 30, 16, 5, 0, 0, Math.PI*2);
    ctx.fill();

    // Leaves
    var leafColors = ['#1a7a30','#24a040','#1e8a36'];
    var leaves = [
        {dx:-18, dy:-70, rot:-0.5},
        {dx: 18, dy:-70, rot: 0.5},
        {dx:-10, dy:-95, rot:-0.2},
        {dx: 10, dy:-95, rot: 0.2},
        {dx:  0, dy:-110, rot: 0}
    ];
    for (var li = 0; li < leaves.length; li++) {
        var lf = leaves[li];
        ctx.save();
        ctx.translate(x + lf.dx, floorY + lf.dy);
        ctx.rotate(lf.rot + Math.sin(ambientT + li) * 0.08);
        var lGrad = ctx.createLinearGradient(-15, -25, 15, 5);
        lGrad.addColorStop(0, leafColors[li % 3]);
        lGrad.addColorStop(1, '#0d4a1c');
        ctx.fillStyle = lGrad;
        ctx.beginPath();
        ctx.ellipse(0, -15, 12, 25, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#0d4a1c';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
    }
}

// ------------------- DESK -------------------
var deskBounce = 0;
function drawDesk(gx, gy) {
    var deskW = 180, deskH = 70;
    var dx = gx - deskW/2;
    var dy = gy - deskH;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(gx, gy + 8, deskW * 0.55, 14, 0, 0, Math.PI*2);
    ctx.fill();

    // Desk side (3D depth)
    ctx.fillStyle = '#7a5a00';
    ctx.fillRect(dx + 8, dy + deskH, deskW, 12);

    // Desk top surface
    var deskGrad = ctx.createLinearGradient(dx, dy, dx, dy + deskH);
    deskGrad.addColorStop(0, '#f0c840');
    deskGrad.addColorStop(0.4, '#c79222');
    deskGrad.addColorStop(1, '#9a6d10');
    ctx.fillStyle = deskGrad;
    ctx.fillRect(dx, dy, deskW, deskH);

    // Desk edge highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(dx, dy, deskW, 5);

    // Border
    ctx.strokeStyle = '#7a5a00';
    ctx.lineWidth = 3;
    ctx.strokeRect(dx, dy, deskW, deskH);

    // Papers on desk
    drawPaperStack(gx - 30, dy + 15, ambientT);

    // Desk label
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = 'bold 12px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Mesa de Casos', gx + 40, dy + deskH/2 + 5);

    // Pulsing arrow when near
    if (gameState === 'EXPLORING') {
        deskBounce = Math.sin(ambientT * 4) * 5;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('↓', gx, dy - 10 + deskBounce);
    }
}

function drawPaperStack(x, y, t) {
    var colors = ['rgba(255,255,255,0.9)','rgba(240,245,255,0.9)','rgba(230,240,255,0.9)'];
    for (var pi = 2; pi >= 0; pi--) {
        ctx.fillStyle = colors[pi];
        ctx.save();
        ctx.translate(x + pi*2, y + pi*2);
        ctx.rotate((-0.1 + pi*0.08) + Math.sin(t + pi)*0.02);
        ctx.fillRect(-20, -15, 40, 50);
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-20, -15, 40, 50);
        // Lines on paper
        ctx.strokeStyle = '#ddd';
        for (var ln = 0; ln < 4; ln++) {
            ctx.beginPath();
            ctx.moveTo(-14, -7 + ln*10);
            ctx.lineTo(14, -7 + ln*10);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// ------------------- PORTALS -------------------
var portalT = 0;
function drawPortals() {
    portalT += 0.04;

    var portalY = H * 0.52;

    // REJECT portal (left)
    drawPortal(120, portalY, '#ff4444', '#cc0000', '❌', 'Rechazar', gameState === 'DECIDING');

    // APPROVE portal (right)
    drawPortal(W - 120, portalY, '#22cc66', '#009933', '✅', 'Aprobar', gameState === 'DECIDING');
}

function drawPortal(cx, y, col1, col2, icon, label, active) {
    var pw = 100, ph = 100;
    var intensity = active ? 1.0 : 0.4;
    var pulse = active ? (1 + Math.sin(portalT * 3) * 0.08) : 1;

    // Outer glow
    if (active) {
        var outerGlow = ctx.createRadialGradient(cx, y - ph/2, 0, cx, y - ph/2, pw*1.8*pulse);
        outerGlow.addColorStop(0, col1.replace(')', ',0.3)').replace('rgb', 'rgba'));
        outerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(cx, y - ph/2, pw*1.8*pulse, 0, Math.PI*2);
        ctx.fill();
    }

    // Portal arch background
    var archGrad = ctx.createLinearGradient(cx - pw/2, 0, cx + pw/2, 0);
    archGrad.addColorStop(0, col2);
    archGrad.addColorStop(0.5, col1);
    archGrad.addColorStop(1, col2);

    ctx.save();
    ctx.globalAlpha = intensity;

    // Arch shape (attached to ceiling)
    ctx.beginPath();
    ctx.moveTo(cx - pw/2, y);
    ctx.lineTo(cx - pw/2, y - ph + pw/2);
    ctx.arc(cx, y - ph + pw/2, pw/2, Math.PI, 0, false);
    ctx.lineTo(cx + pw/2, y);
    ctx.closePath();
    ctx.fillStyle = archGrad;
    ctx.fill();

    // Arch border
    ctx.strokeStyle = active ? col1 : col2;
    ctx.lineWidth = active ? 3*pulse : 2;
    ctx.stroke();

    // Scanlines inside portal (animated)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - pw/2, y);
    ctx.lineTo(cx - pw/2, y - ph + pw/2);
    ctx.arc(cx, y - ph + pw/2, pw/2, Math.PI, 0, false);
    ctx.lineTo(cx + pw/2, y);
    ctx.closePath();
    ctx.clip();

    if (active) {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 2;
        var offset = (portalT * 20) % 12;
        for (var sl = -ph; sl < ph; sl += 12) {
            ctx.beginPath();
            ctx.moveTo(cx - pw, y - ph + sl + offset);
            ctx.lineTo(cx + pw, y - ph + sl + offset);
            ctx.stroke();
        }
    }
    ctx.restore();

    // Highlight top of arch
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(cx, y - ph + pw/2, pw/2 - 6, Math.PI, 0, false);
    ctx.arc(cx, y - ph + pw/2, pw/2 - 18, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Icon
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = intensity;
    ctx.fillText(icon, cx, y - ph*0.35);

    // Label
    ctx.font = 'bold 13px Fredoka One, cursive';
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = intensity;
    ctx.fillText(label, cx, y - 10);
    ctx.globalAlpha = 1;
}

// ------------------- CHARACTER DRAWING -------------------
function drawChar(ctx2, cx, cy, color, darkColor, expression, walkCycle, scale, shadow) {
    scale = scale || 1;
    expression = expression || 'happy';
    var t = walkCycle || 0;

    // Body bob
    var bobY = Math.sin(t * 0.15) * 3;
    // Squash & stretch
    var scaleX = 1 + Math.cos(t * 0.15) * 0.03;
    var scaleY = 1 - Math.cos(t * 0.15) * 0.03;

    var bx = cx;
    var by = cy + bobY;
    var bw = 38 * scale;
    var bh = 48 * scale;

    // --- DROP SHADOW ---
    if (shadow) {
        ctx2.save();
        ctx2.globalAlpha = 0.25;
        ctx2.fillStyle = '#000';
        ctx2.beginPath();
        ctx2.ellipse(bx, cy + bh*0.55, bw * 0.85 * scaleX, 8*scale, 0, 0, Math.PI*2);
        ctx2.fill();
        ctx2.restore();
    }

    // --- LEGS ---
    var legSwing = Math.sin(t * 0.25) * 10;
    var legW = 6 * scale;

    // Left leg
    ctx2.save();
    ctx2.translate(bx - 12*scale, by + bh*0.45);
    ctx2.rotate(-legSwing * 0.05);
    ctx2.strokeStyle = darkColor;
    ctx2.lineWidth = legW;
    ctx2.lineCap = 'round';
    ctx2.beginPath();
    ctx2.moveTo(0, 0);
    ctx2.lineTo(Math.sin(-legSwing * 0.04) * 8, 16*scale);
    ctx2.stroke();
    ctx2.restore();

    // Right leg
    ctx2.save();
    ctx2.translate(bx + 12*scale, by + bh*0.45);
    ctx2.rotate(legSwing * 0.05);
    ctx2.strokeStyle = darkColor;
    ctx2.lineWidth = legW;
    ctx2.lineCap = 'round';
    ctx2.beginPath();
    ctx2.moveTo(0, 0);
    ctx2.lineTo(Math.sin(legSwing * 0.04) * 8, 16*scale);
    ctx2.stroke();
    ctx2.restore();

    // --- ARMS ---
    var armSwing = Math.sin(t * 0.25) * 12;
    var armW = 5 * scale;

    // Left arm
    ctx2.save();
    ctx2.translate(bx - bw*0.85, by - bh*0.05);
    ctx2.rotate(armSwing * 0.05 - 0.3);
    ctx2.strokeStyle = darkColor;
    ctx2.lineWidth = armW;
    ctx2.lineCap = 'round';
    ctx2.beginPath();
    ctx2.moveTo(0, 0);
    ctx2.quadraticCurveTo(-8*scale, 10*scale, -3*scale, 20*scale);
    ctx2.stroke();
    ctx2.restore();

    // Right arm
    ctx2.save();
    ctx2.translate(bx + bw*0.85, by - bh*0.05);
    ctx2.rotate(-armSwing * 0.05 + 0.3);
    ctx2.strokeStyle = darkColor;
    ctx2.lineWidth = armW;
    ctx2.lineCap = 'round';
    ctx2.beginPath();
    ctx2.moveTo(0, 0);
    ctx2.quadraticCurveTo(8*scale, 10*scale, 3*scale, 20*scale);
    ctx2.stroke();
    ctx2.restore();

    // --- BODY ---
    ctx2.save();
    ctx2.translate(bx, by);
    ctx2.scale(scaleX, scaleY);

    // Body gradient
    var bodyGrad = ctx2.createRadialGradient(-bw*0.25, -bh*0.2, bw*0.05, 0, 0, bw*1.3);
    bodyGrad.addColorStop(0, lighten(color, 40));
    bodyGrad.addColorStop(0.5, color);
    bodyGrad.addColorStop(1, darkColor);

    // Blob shape (slightly pear-shaped)
    ctx2.beginPath();
    ctx2.moveTo(0, -bh*0.55);
    ctx2.bezierCurveTo( bw*0.9, -bh*0.55,  bw*1.1,  bh*0.1,  bw*0.9,  bh*0.45);
    ctx2.bezierCurveTo( bw*0.6,  bh*0.8,  -bw*0.6,  bh*0.8, -bw*0.9,  bh*0.45);
    ctx2.bezierCurveTo(-bw*1.1,  bh*0.1,  -bw*0.9, -bh*0.55,      0, -bh*0.55);
    ctx2.closePath();
    ctx2.fillStyle = bodyGrad;
    ctx2.fill();

    // Body outline
    ctx2.strokeStyle = darkColor;
    ctx2.lineWidth = 2.5 * scale;
    ctx2.stroke();

    // Specular highlight
    var specGrad = ctx2.createRadialGradient(-bw*0.3, -bh*0.3, 0, -bw*0.15, -bh*0.2, bw*0.55);
    specGrad.addColorStop(0, 'rgba(255,255,255,0.55)');
    specGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx2.fillStyle = specGrad;
    ctx2.beginPath();
    ctx2.ellipse(-bw*0.2, -bh*0.3, bw*0.45, bh*0.3, -0.4, 0, Math.PI*2);
    ctx2.fill();

    ctx2.restore(); // end body transform

    // --- EYES ---
    var eyeOffsetX = 12 * scale;
    var eyeOffsetY = (by - bh*0.1);
    var eyeW = 11 * scale;
    var eyeH = 14 * scale;

    // Left eye white
    ctx2.fillStyle = 'white';
    ctx2.strokeStyle = darkColor;
    ctx2.lineWidth = 1.5 * scale;
    ctx2.beginPath();
    ctx2.ellipse(bx - eyeOffsetX, eyeOffsetY, eyeW, eyeH, 0, 0, Math.PI*2);
    ctx2.fill();
    ctx2.stroke();

    // Right eye white
    ctx2.beginPath();
    ctx2.ellipse(bx + eyeOffsetX, eyeOffsetY, eyeW, eyeH, 0, 0, Math.PI*2);
    ctx2.fill();
    ctx2.stroke();

    // Pupils
    var pupilX = 0, pupilY = 2*scale;
    if (expression === 'scared') { pupilX = 0; pupilY = 4*scale; }
    var pupilR = 5 * scale;

    ctx2.fillStyle = '#111';
    ctx2.beginPath();
    ctx2.arc(bx - eyeOffsetX + pupilX, eyeOffsetY + pupilY, pupilR, 0, Math.PI*2);
    ctx2.fill();

    ctx2.beginPath();
    ctx2.arc(bx + eyeOffsetX + pupilX, eyeOffsetY + pupilY, pupilR, 0, Math.PI*2);
    ctx2.fill();

    // Eye shines
    ctx2.fillStyle = 'white';
    ctx2.beginPath();
    ctx2.arc(bx - eyeOffsetX + pupilX + 2*scale, eyeOffsetY + pupilY - 3*scale, 2.5*scale, 0, Math.PI*2);
    ctx2.fill();
    ctx2.beginPath();
    ctx2.arc(bx + eyeOffsetX + pupilX + 2*scale, eyeOffsetY + pupilY - 3*scale, 2.5*scale, 0, Math.PI*2);
    ctx2.fill();

    // Expression - Scared: open "O" mouth
    if (expression === 'scared') {
        ctx2.fillStyle = '#222';
        ctx2.strokeStyle = darkColor;
        ctx2.lineWidth = 1.5*scale;
        ctx2.beginPath();
        ctx2.ellipse(bx, by + bh*0.12, 6*scale, 8*scale, 0, 0, Math.PI*2);
        ctx2.fill();
        ctx2.stroke();
        // eyebrows tilted inward (worried)
        ctx2.strokeStyle = darkColor;
        ctx2.lineWidth = 2.5*scale;
        ctx2.lineCap = 'round';
        ctx2.beginPath();
        ctx2.moveTo(bx - eyeOffsetX - 7*scale, eyeOffsetY - eyeH - 3*scale);
        ctx2.lineTo(bx - eyeOffsetX + 4*scale, eyeOffsetY - eyeH - 8*scale);
        ctx2.stroke();
        ctx2.beginPath();
        ctx2.moveTo(bx + eyeOffsetX + 7*scale, eyeOffsetY - eyeH - 3*scale);
        ctx2.lineTo(bx + eyeOffsetX - 4*scale, eyeOffsetY - eyeH - 8*scale);
        ctx2.stroke();
    } else if (expression === 'sad') {
        // Frown
        ctx2.strokeStyle = darkColor;
        ctx2.lineWidth = 2.5*scale;
        ctx2.lineCap = 'round';
        ctx2.beginPath();
        ctx2.arc(bx, by + bh*0.3, 9*scale, 0.25*Math.PI, 0.75*Math.PI, false);
        ctx2.stroke();
        // X eyes for dead
        ctx2.strokeStyle = darkColor;
        ctx2.lineWidth = 2.5*scale;
        var xx = bx - eyeOffsetX, xy = eyeOffsetY;
        ctx2.beginPath();
        ctx2.moveTo(xx - 5*scale, xy - 5*scale); ctx2.lineTo(xx + 5*scale, xy + 5*scale);
        ctx2.moveTo(xx + 5*scale, xy - 5*scale); ctx2.lineTo(xx - 5*scale, xy + 5*scale);
        ctx2.stroke();
        xx = bx + eyeOffsetX;
        ctx2.beginPath();
        ctx2.moveTo(xx - 5*scale, xy - 5*scale); ctx2.lineTo(xx + 5*scale, xy + 5*scale);
        ctx2.moveTo(xx + 5*scale, xy - 5*scale); ctx2.lineTo(xx - 5*scale, xy + 5*scale);
        ctx2.stroke();
    } else {
        // Happy smile
        ctx2.strokeStyle = darkColor;
        ctx2.lineWidth = 2.5*scale;
        ctx2.lineCap = 'round';
        ctx2.beginPath();
        ctx2.arc(bx, by + bh*0.05, 10*scale, 0.15*Math.PI, 0.85*Math.PI, false);
        ctx2.stroke();
    }
}

// Color helpers
function lighten(hex, amount) {
    var r = parseInt(hex.slice(1,3),16);
    var g = parseInt(hex.slice(3,5),16);
    var b = parseInt(hex.slice(5,7),16);
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function roundRect(x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) { ctx.fill(); }
}

// ------------------- INTERACTION PROMPT -------------------
function drawInteractionPrompt(x, y) {
    var alpha = 0.7 + Math.sin(ambientT * 6) * 0.3;
    ctx.save();
    ctx.globalAlpha = alpha;

    var msg = 'ESPACIO o clic para revisar';
    var mw = ctx.measureText(msg).width + 30;
    var mx = x - mw/2;
    var my = y - 110;

    ctx.fillStyle = '#003893';
    ctx.shadowColor = '#48dbfb';
    ctx.shadowBlur = 15;
    roundRect(mx, my, mw, 30, 8, true);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'white';
    ctx.font = 'bold 13px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(msg, x, my + 20);

    ctx.restore();
}

// ------------------- CASES -------------------
var cases = [
    { name:'Pilly', color:'#ff9ff3', dark:'#cc4499',
      symptoms:'Dolor de cabeza ocasional',
      evidence:'Radiografía: Pato de goma en el estómago',
      approve: false,
      death:'Aprobaste una radiografía con un pato de goma. ¡Pilly explotó de felicidad (y por el pato)!' },
    { name:'Gloop', color:'#48dbfb', dark:'#00a8cc',
      symptoms:'Fractura de antebrazo derecho',
      evidence:'Receta: Analgésicos, inmovilización y reposo',
      approve: true,
      death:'Rechazaste un caso completamente válido. ¡Gloop te demandó por negligencia!' },
    { name:'Squish', color:'#feca57', dark:'#cc9900',
      symptoms:'Insomnio severo',
      evidence:'Receta: 50 litros de café intravenoso al día',
      approve: false,
      death:'Aprobaste 50 litros de café IV. ¡Squish vibró a 1000 Hz y se desintegró!' },
    { name:'Capsule', color:'#1dd1a1', dark:'#009977',
      symptoms:'Corte superficial en el dedo índice',
      evidence:'Solicitud: Amputación total del brazo izquierdo',
      approve: false,
      death:'Aprobaste una amputación por un corte en papel. ¡Capsule ahora escribe con los pies!' },
    { name:'Plop', color:'#ff6b6b', dark:'#cc2222',
      symptoms:'Gripe estacional aguda',
      evidence:'Receta: Antiviral estándar + hidratación',
      approve: true,
      death:'Rechazaste medicina para la gripe. ¡Plop inundó la oficina de estornudos!' },
    { name:'Bloop', color:'#a29bfe', dark:'#6c5ce7',
      symptoms:'Dolor lumbar crónico',
      evidence:'Diagnóstico firmado por el Dr. Pato Donald',
      approve: false,
      death:'Aprobaste un diagnóstico firmado por un pato animado. ¡El seguro te despidió!' },
    { name:'Wibble', color:'#fd79a8', dark:'#d63031',
      symptoms:'Hipertensión arterial',
      evidence:'Receta: Antihipertensivos, dieta baja en sodio',
      approve: true,
      death:'Rechazaste tratamiento para hipertensión. ¡Wibble saltó al techo literalmente!' }
];

// ------------------- DESK & ZONE POSITIONS -------------------
function getDeskPos() {
    return { x: W / 2, y: H - 50 };
}
function getRejectPos()  { return { x: 120,     y: H * 0.52 }; }
function getApprovePos() { return { x: W - 120, y: H * 0.52 }; }

// ------------------- PROXIMITY CHECKS -------------------
function dist(ax, ay, bx2, by2) {
    var dx = ax - bx2, dy = ay - by2;
    return Math.sqrt(dx*dx + dy*dy);
}

// ------------------- CANVAS PREVIEW (character select) -------------------
function renderPreviews() {
    var canvases = document.querySelectorAll('.char-canvas');
    for (var i = 0; i < canvases.length; i++) {
        var cc = canvases[i];
        var c2 = cc.getContext('2d');
        var idx = parseInt(cc.dataset.idx);
        c2.clearRect(0, 0, cc.width, cc.height);
        drawChar(c2, cc.width/2, cc.height*0.75, CHAR_COLORS[idx], CHAR_DARK[idx],
                 'happy', Date.now() * 0.05, 1.0, false);
    }
}
setInterval(renderPreviews, 32); // animate previews

// ------------------- UI BINDINGS -------------------
document.querySelectorAll('.char-option').forEach(function(opt) {
    opt.addEventListener('click', function() {
        document.querySelectorAll('.char-option').forEach(function(o){ o.classList.remove('selected'); });
        opt.classList.add('selected');
        selectedChar = parseInt(opt.dataset.idx);
        playerColor = CHAR_COLORS[selectedChar];
        playerDark  = CHAR_DARK[selectedChar];
    });
});

document.getElementById('btn-start').addEventListener('click', function() {
    playerColor = CHAR_COLORS[selectedChar];
    playerDark  = CHAR_DARK[selectedChar];
    score = 0;
    document.getElementById('hud-score').textContent = score;
    startGame();
});

document.getElementById('btn-retry').addEventListener('click', function() {
    score = 0;
    document.getElementById('hud-score').textContent = score;
    document.getElementById('screen-gameover').classList.add('hidden');
    startGame();
});

document.getElementById('btn-take').addEventListener('click', function() {
    document.getElementById('modal-case').classList.add('hidden');
    startDeciding();
});

// ------------------- INPUT -------------------
window.addEventListener('keydown', function(e) {
    keys[e.key] = true;
    if (e.code === 'Space') e.preventDefault();
    if (e.code === 'Space' && gameState === 'EXPLORING') {
        var d = getDeskPos();
        if (dist(player.x, player.y, d.x, d.y) < 120) openCase();
    }
});
window.addEventListener('keyup', function(e) { keys[e.key] = false; });

canvas = document.getElementById('game-canvas');
canvas.addEventListener('pointerdown', function(e) {
    if (gameState !== 'EXPLORING' && gameState !== 'DECIDING') return;
    var rect = canvas.getBoundingClientRect();
    var scaleRatio = W / rect.width;
    targetPos = {
        x: (e.clientX - rect.left) * scaleRatio,
        y: (e.clientY - rect.top)  * scaleRatio
    };
});

// ------------------- START GAME -------------------
function startGame() {
    document.getElementById('screen-start').classList.add('hidden');
    document.getElementById('screen-gameover').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    canvas.style.display = 'block';
    resizeCanvas();

    player.x = W / 2;
    player.y = H * 0.7;
    player.flipped   = false;
    player.walkCycle = 0;
    player.expression = 'happy';
    targetPos = null;
    keys = {};

    gameState = 'EXPLORING';
    currentCase = null;
    document.getElementById('hud-timer').textContent = '--';
    document.getElementById('timer-box').classList.remove('urgent');
    clearInterval(timerInt);

    if (!loopRunning) {
        loopRunning = true;
        requestAnimationFrame(gameLoop);
    }
}

// ------------------- RESIZE -------------------
function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
}
window.addEventListener('resize', function() {
    if (canvas.style.display !== 'none') resizeCanvas();
});

// ------------------- GAME LOOP -------------------
function gameLoop(ts) {
    ctx = canvas.getContext('2d');
    requestAnimationFrame(gameLoop);

    if (gameState === 'START' || gameState === 'GAMEOVER') return;

    // -- MOVE PLAYER --
    if (gameState === 'EXPLORING' || gameState === 'DECIDING') {
        var spd = player.speed;
        var dx = 0, dy = 0;

        if (keys['ArrowLeft']  || keys['a']) { dx -= spd; targetPos = null; }
        if (keys['ArrowRight'] || keys['d']) { dx += spd; targetPos = null; }
        if (keys['ArrowUp']    || keys['w']) { dy -= spd; targetPos = null; }
        if (keys['ArrowDown']  || keys['s']) { dy += spd; targetPos = null; }

        if (targetPos) {
            var tdx = targetPos.x - player.x;
            var tdy = targetPos.y - player.y;
            var td  = Math.sqrt(tdx*tdx + tdy*tdy);
            if (td > spd) {
                dx = (tdx/td) * spd;
                dy = (tdy/td) * spd;
            } else {
                player.x = targetPos.x;
                player.y = targetPos.y;
                targetPos = null;
            }
        }

        if (dx !== 0 || dy !== 0) {
            if (dx < 0) player.flipped = true;
            if (dx > 0) player.flipped = false;
            player.walkCycle++;
            player.x += dx;
            player.y += dy;
            // Boundary clamp
            player.x = Math.max(30,  Math.min(W - 30,  player.x));
            player.y = Math.max(H*0.52 + 20, Math.min(H - 20, player.y));
            spawnDustParticles(player.x, player.y + 30);
        }

        // Check desk proximity
        var dp = getDeskPos();
        var nearDesk = dist(player.x, player.y, dp.x, dp.y) < 120;

        // Check zone entry
        if (gameState === 'DECIDING') {
            var rp = getRejectPos();
            var ap = getApprovePos();
            if (dist(player.x, player.y, rp.x, rp.y) < 80) {
                submitDecision(false);
            } else if (dist(player.x, player.y, ap.x, ap.y) < 80) {
                submitDecision(true);
            }
        }

        // -- DRAW --
        ctx.clearRect(0, 0, W, H);

        drawEnvironment();
        drawPortals();
        drawDesk(dp.x, dp.y);
        updateParticles();
        drawParticles();

        // Draw player (with flip)
        ctx.save();
        if (player.flipped) {
            ctx.translate(player.x * 2, 0);
            ctx.scale(-1, 1);
            drawChar(ctx, player.x, player.y, playerColor, playerDark, player.expression, player.walkCycle, 1.4, true);
        } else {
            drawChar(ctx, player.x, player.y, playerColor, playerDark, player.expression, player.walkCycle, 1.4, true);
        }
        ctx.restore();

        if (gameState === 'EXPLORING' && nearDesk) {
            drawInteractionPrompt(dp.x, dp.y);
        }
    }
}

// ------------------- OPEN CASE -------------------
function openCase() {
    if (gameState !== 'EXPLORING') return;
    gameState = 'READING';
    targetPos = null;
    player.expression = 'scared';

    currentCase = cases[Math.floor(Math.random() * cases.length)];
    document.getElementById('modal-name').textContent = currentCase.name;
    document.getElementById('modal-symptoms').textContent = currentCase.symptoms;
    document.getElementById('modal-evidence').textContent = currentCase.evidence;

    // Draw patient character in modal
    var mc = document.getElementById('modal-patient-canvas');
    var mc2 = mc.getContext('2d');
    mc2.clearRect(0,0,mc.width,mc.height);
    drawChar(mc2, mc.width/2, mc.height*0.78, currentCase.color, currentCase.dark, 'scared', 0, 1.0, false);

    document.getElementById('modal-case').classList.remove('hidden');
}

// ------------------- DECIDING -------------------
function startDeciding() {
    gameState = 'DECIDING';
    var secs = Math.max(7, 20 - score * 2);
    timeLeft = secs;
    document.getElementById('hud-timer').textContent = timeLeft;
    document.getElementById('timer-box').classList.remove('urgent');
    clearInterval(timerInt);
    timerInt = setInterval(function() {
        timeLeft--;
        document.getElementById('hud-timer').textContent = timeLeft;
        if (timeLeft <= 4) document.getElementById('timer-box').classList.add('urgent');
        if (timeLeft <= 0) {
            clearInterval(timerInt);
            triggerGameOver('¡Se te acabó el tiempo! El expediente quedó en el limbo burocrático.');
        }
    }, 1000);
}

// ------------------- SUBMIT DECISION -------------------
function submitDecision(isApprove) {
    if (!currentCase) return;
    clearInterval(timerInt);
    document.getElementById('hud-timer').textContent = '--';
    document.getElementById('timer-box').classList.remove('urgent');

    if (isApprove === currentCase.approve) {
        // Correct!
        score++;
        document.getElementById('hud-score').textContent = score;
        spawnParticle(player.x, player.y, isApprove ? '#22cc66' : '#ff4444');
        spawnParticle(player.x, player.y, '#feca57');
        currentCase = null;
        player.expression = 'happy';
        gameState = 'EXPLORING';
    } else {
        triggerGameOver(currentCase.death);
    }
}

// ------------------- GAME OVER -------------------
function triggerGameOver(reason) {
    gameState = 'GAMEOVER';
    clearInterval(timerInt);
    targetPos = null;
    player.expression = 'sad';

    document.getElementById('go-reason').textContent  = reason;
    document.getElementById('go-score').textContent   = score;

    // Draw dead character
    var gc = document.getElementById('go-char-canvas');
    var gc2 = gc.getContext('2d');
    gc2.clearRect(0, 0, gc.width, gc.height);
    drawChar(gc2, gc.width/2, gc.height*0.78, playerColor, playerDark, 'sad', 0, 1.2, false);

    document.getElementById('hud').classList.add('hidden');
    document.getElementById('screen-gameover').classList.remove('hidden');
    canvas.style.display = 'none';
}

// Init
resizeCanvas();
