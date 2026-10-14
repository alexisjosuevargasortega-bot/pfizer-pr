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
    shadow: 1,
    name: 'Gotita Azul',
    title: 'Gran Dictaminador',
    gear: { head: 'none', body: 'none', accessory: 'none', shoes: 'default' },
    // Smooth gaze direction (for eye pupils to follow movement)
    gazeDx: 0, gazeDy: 0,
    // Lean angle for dynamic walk feel
    leanAngle: 0,
    // Speed-based squash
    moveSpeed: 0
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

// ------------------- CHARACTER DRAWING (Solid 3D Volumetric Engine) -------------------
function drawChar(ctx2, cx, cy, color, darkColor, expression, walkCycle, scale, shadow, angle, gear, gazeDx, gazeDy, leanAngle) {
    scale = scale || 1;
    expression = expression || 'happy';
    var t = walkCycle || 0;
    angle = (angle !== undefined) ? angle : 0;
    gear = gear || { head: 'none', body: 'none', accessory: 'none', shoes: 'default' };
    gazeDx   = gazeDx   || 0;
    gazeDy   = gazeDy   || 0;
    leanAngle = leanAngle || 0;

    // Normalize angle to [0, 2*PI)
    angle = (angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

    var cosA = Math.cos(angle); // +1 = front, -1 = back, 0 = profile
    var sinA = Math.sin(angle); // +1 = facing right, -1 = facing left

    // ── DYNAMIC WALK PHYSICS ──
    // Stronger bob when actually moving
    var isMoving = (Math.abs(gazeDx) + Math.abs(gazeDy)) > 0.1;
    var bobAmp   = isMoving ? 5 : 2;
    var bobY     = Math.sin(t * 0.18) * bobAmp;

    // Squash & Stretch: body compresses on landing, stretches on lift
    var squashPhase = Math.abs(Math.sin(t * 0.18));
    var scaleX = isMoving ? (1 + (1 - squashPhase) * 0.055) : 1;
    var scaleY = isMoving ? (1 - (1 - squashPhase) * 0.045) : 1;

    // Lateral lean into the direction of movement (leanAngle is in radians, max ~0.15)
    // (applied after bh is known)

    var bx = cx;
    var by = cy + bobY;
    var bw = 38 * scale;
    var bh = 48 * scale;

    // Apply lean offset to bx
    bx = cx + Math.sin(leanAngle) * bh * 0.18;

    // --- 1. PEDESTAL / DROP SHADOW ---
    if (shadow) {
        ctx2.save();
        ctx2.globalAlpha = 0.35;
        var shadowGrad = ctx2.createRadialGradient(bx, cy + bh * 0.56, 4 * scale, bx, cy + bh * 0.56, bw * 0.95);
        shadowGrad.addColorStop(0, 'rgba(0, 5, 20, 0.9)');
        shadowGrad.addColorStop(1, 'rgba(0, 5, 20, 0)');
        ctx2.fillStyle = shadowGrad;
        ctx2.beginPath();
        ctx2.ellipse(bx, cy + bh * 0.56, bw * 0.92 * scaleX, 10 * scale, 0, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.restore();
    }

    // --- 2. CAPE BEHIND BODY (When facing front: cosA > -0.15) ---
    if (gear.body === 'hero_cape' && cosA > -0.15) {
        ctx2.save();
        var capeSway = Math.sin(t * 0.15 + (1 - cosA)) * 5;
        var capeGrad = ctx2.createLinearGradient(bx, by - bh * 0.2, bx, by + bh * 0.75);
        capeGrad.addColorStop(0, '#c0392b');
        capeGrad.addColorStop(1, '#681008');
        ctx2.fillStyle = capeGrad;
        ctx2.beginPath();
        var cTopLeft = bx - bw * 0.7 * Math.max(0.4, cosA);
        var cTopRight = bx + bw * 0.7 * Math.max(0.4, cosA);
        ctx2.moveTo(cTopLeft, by - bh * 0.12);
        ctx2.quadraticCurveTo(bx - bw * 0.95 + capeSway, by + bh * 0.35, bx - bw * 0.85 - sinA * 8 + capeSway, by + bh * 0.78);
        ctx2.lineTo(bx + bw * 0.85 - sinA * 8 + capeSway, by + bh * 0.78);
        ctx2.quadraticCurveTo(bx + bw * 0.95 + capeSway, by + bh * 0.35, cTopRight, by - bh * 0.12);
        ctx2.closePath();
        ctx2.fill();
        ctx2.strokeStyle = '#f1c40f';
        ctx2.lineWidth = 2 * scale;
        ctx2.stroke();
        ctx2.restore();
    }

    // --- 3. 3D FLANK ARM SYSTEM (No crossing over eyes/chest) ---
    // In a cartoon mascot / droplet character, arms are attached at the lateral flanks (shoulders).
    // Local coordinates:
    // Left shoulder:  local X = -bw * 0.86, local Z = 0
    // Right shoulder: local X = +bw * 0.86, local Z = 0
    // When rotated by angle (cosA, sinA):
    // Left shoulder:  screen X = bx - bw * 0.86 * cosA,  depth Z = +sinA
    // Right shoulder: screen X = bx + bw * 0.86 * cosA,  depth Z = -sinA
    //
    // CRITICAL DEPTH RULE:
    // When turning right (sinA > 0):
    //   Left shoulder moves TOWARDS camera (depth Z = +sinA > 0, FRONT arm).
    //   Right shoulder moves AWAY from camera (depth Z = -sinA < 0, BACK arm).
    // When turning left (sinA < 0):
    //   Right shoulder moves TOWARDS camera (depth Z = -sinA > 0, FRONT arm).
    //   Left shoulder moves AWAY from camera (depth Z = +sinA < 0, BACK arm).

    var armSleeve = (gear.body === 'lab_coat')    ? '#f0f4f8' :
                    (gear.body === 'formal_suit')  ? '#1e293b' :
                    (gear.body === 'pfizer_shirt') ? '#003893' : darkColor;

    // Shoulders attached at cute mid-torso level (below the eyes/mouth):
    var shoulderY = by + bh * 0.04;

    var leftSx = bx - bw * 0.86 * cosA;
    var leftSy = shoulderY;
    var leftZ  = sinA; // > 0 when turning right = FRONT; < 0 when turning left = BACK

    var rightSx = bx + bw * 0.86 * cosA;
    var rightSy = shoulderY;
    var rightZ  = -sinA; // < 0 when turning right = BACK; > 0 when turning left = FRONT

    // Hands hang at the sides with dynamic walking swing
    var leftFlare  = -4.0 * scale * Math.max(0.2, Math.abs(cosA));
    var rightFlare =  4.0 * scale * Math.max(0.2, Math.abs(cosA));

    var armSwingAmp = isMoving ? 5.5 * scale : 1.5 * scale;
    var armForwardAmp = isMoving ? 3.5 * scale : 0.6 * scale;
    var armPhase = t * 0.28;

    var leftHx = leftSx + leftFlare + Math.cos(armPhase) * armForwardAmp;
    var leftHy = leftSy + 17 * scale + Math.sin(armPhase) * armSwingAmp;

    var rightHx = rightSx + rightFlare - Math.cos(armPhase) * armForwardAmp;
    var rightHy = rightSy + 17 * scale - Math.sin(armPhase) * armSwingAmp;

    // Unified arm renderer
    function drawArm(sx, sy, hx, hy, depthZ, isLeft) {
        var isFront = depthZ >= 0;
        var alpha = 1.0;
        if (!isFront) {
            // Far arm smoothly fades out when behind the droplet at profile
            alpha = Math.max(0, Math.min(1, Math.abs(cosA) * 1.6 - 0.15));
        }
        if (alpha <= 0.03) return;

        ctx2.save();
        ctx2.globalAlpha = alpha;

        // Arm stroke
        ctx2.strokeStyle = armSleeve;
        ctx2.lineWidth   = isFront ? 5.2 * scale : 4.0 * scale;
        ctx2.lineCap     = 'round';
        ctx2.beginPath();
        ctx2.moveTo(sx, sy);

        // Natural elbow curve points outward from torso flank
        var sideSign = isLeft ? -1 : 1;
        var ex = sx + (hx - sx) * 0.5 + (sideSign * 3.5 * scale * Math.max(0.2, Math.abs(cosA)));
        var ey = sy + (hy - sy) * 0.52;
        ctx2.quadraticCurveTo(ex, ey, hx, hy);
        ctx2.stroke();

        // Lab coat sleeve seam
        if (gear.body === 'lab_coat') {
            ctx2.strokeStyle = '#94a3b8';
            ctx2.lineWidth   = 0.9 * scale;
            ctx2.globalAlpha = alpha * 0.6;
            ctx2.stroke();
        }

        // Hand
        ctx2.globalAlpha = alpha;
        ctx2.fillStyle   = isFront ? color : darkColor;
        ctx2.strokeStyle = darkColor;
        ctx2.lineWidth   = 1.5 * scale;
        ctx2.beginPath();
        ctx2.arc(hx, hy + 1.2 * scale, 3.6 * scale, 0, Math.PI * 2);
        ctx2.fill();
        if (isFront) ctx2.stroke();
        ctx2.restore();
    }

    // Determine back arm vs front arm
    // The arm with lower Z is in the back (drawn BEFORE the body, so the body covers it)
    var backArmIsLeft = (leftZ < rightZ);

    // Draw BACK arm before body
    if (backArmIsLeft) {
        drawArm(leftSx, leftSy, leftHx, leftHy, leftZ, true);
    } else {
        drawArm(rightSx, rightSy, rightHx, rightHy, rightZ, false);
    }

    // --- 4. LEGS & SHOES (3D Depth & True Step Motion) ---
    var legW = 5.8 * scale;
    var lxL = bx - 12 * scale * cosA;
    var lxR = bx + 12 * scale * cosA;

    function renderLegAndFoot(lx, isLeft) {
        ctx2.save();
        ctx2.strokeStyle = darkColor;
        ctx2.lineWidth = legW;
        ctx2.lineCap = 'round';
        ctx2.beginPath();
        ctx2.moveTo(lx, by + bh * 0.44);

        // Dynamic stepping: feet step forward and lift off ground
        var legCadence = t * 0.28;
        var stepSwing = isMoving ? (isLeft ? Math.sin(legCadence) : -Math.sin(legCadence)) : 0;
        var swingX = stepSwing * 8 * scale + sinA * 2 * scale;
        var stepLift = isMoving ? -Math.max(0, stepSwing) * 4.5 * scale : 0;
        var footX = lx + swingX;
        var footY = by + bh * 0.44 + 16 * scale + stepLift;
        ctx2.lineTo(footX, footY);
        ctx2.stroke();

        // Shoes
        ctx2.translate(footX, footY);
        if (gear.shoes === 'formal_shoes') {
            ctx2.fillStyle = '#111827';
            ctx2.beginPath();
            ctx2.ellipse(sinA * 3 * scale, 0, 7.5 * scale, 4 * scale, sinA * 0.18, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.fillStyle = 'rgba(255,255,255,0.45)';
            ctx2.fillRect(-2 * scale, -2 * scale, 4 * scale, 1.5 * scale);
        } else if (gear.shoes === 'sneakers') {
            ctx2.fillStyle = '#ef4444';
            ctx2.beginPath();
            ctx2.ellipse(sinA * 3 * scale, -1, 7.5 * scale, 4.8 * scale, sinA * 0.18, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.fillStyle = '#ffffff';
            ctx2.fillRect(-5 * scale, 2 * scale, 11 * scale, 2.5 * scale);
        } else if (gear.shoes === 'boots') {
            ctx2.fillStyle = '#d97706';
            ctx2.beginPath();
            ctx2.roundRect ? ctx2.roundRect(-6 * scale, -4 * scale, 12 * scale, 8 * scale, 3 * scale) : ctx2.rect(-6 * scale, -4 * scale, 12 * scale, 8 * scale);
            ctx2.fill();
            ctx2.strokeStyle = '#1f2937';
            ctx2.lineWidth = 1.5;
            ctx2.stroke();
        } else {
            // Natural droplet feet
            ctx2.fillStyle = darkColor;
            ctx2.beginPath();
            ctx2.ellipse(sinA * 2 * scale, 0, 5.5 * scale, 3.2 * scale, 0, 0, Math.PI * 2);
            ctx2.fill();
        }
        ctx2.restore();
    }

    renderLegAndFoot(lxL, true);
    renderLegAndFoot(lxR, false);

    // --- 5. SOLID 3D DROPLET BODY PATH (Re-usable for clipping and fill) ---
    function createBodyPath(c) {
        c.beginPath();
        c.moveTo(0, -bh * 0.55);
        c.bezierCurveTo( bw * 0.9, -bh * 0.55,  bw * 1.1,  bh * 0.1,  bw * 0.9,  bh * 0.45);
        c.bezierCurveTo( bw * 0.6,  bh * 0.8,  -bw * 0.6,  bh * 0.8, -bw * 0.9,  bh * 0.45);
        c.bezierCurveTo(-bw * 1.1,  bh * 0.1,  -bw * 0.9, -bh * 0.55,      0, -bh * 0.55);
        c.closePath();
    }

    ctx2.save();
    ctx2.translate(bx, by);
    ctx2.scale(scaleX, scaleY);

    // 3D Spherical Lighting (Dynamic light angle)
    // Key light source is at top-left-front: (-0.35 * bw, -0.28 * bh)
    var lightX = -bw * 0.32 + sinA * 6 * scale;
    var lightY = -bh * 0.25;
    var bodyGrad = ctx2.createRadialGradient(lightX, lightY, bw * 0.08, 0, bh * 0.05, bw * 1.25);
    bodyGrad.addColorStop(0, lighten(color, 55));
    bodyGrad.addColorStop(0.35, color);
    bodyGrad.addColorStop(0.8, darkColor);
    bodyGrad.addColorStop(1, '#001428');

    createBodyPath(ctx2);
    ctx2.fillStyle = bodyGrad;
    ctx2.fill();

    // 3D Ambient Edge Outline
    ctx2.strokeStyle = darkColor;
    ctx2.lineWidth = 2.8 * scale;
    ctx2.stroke();

    // 3D Fresnel / Rim Lighting (Gives translucent volumetric water/gel look)
    var rimGrad = ctx2.createRadialGradient(0, 0, bw * 0.75, 0, 0, bw * 1.05);
    rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    rimGrad.addColorStop(0.85, 'rgba(72, 219, 251, 0.25)');
    rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0.45)');
    ctx2.fillStyle = rimGrad;
    createBodyPath(ctx2);
    ctx2.fill();

    // 3D Glossy Specular Highlight (ONLY visible from front/side, disappears on back!)
    if (cosA > -0.25) {
        var specAlpha = Math.min(1, Math.max(0, (cosA + 0.25) / 0.8));
        ctx2.save();
        ctx2.globalAlpha = specAlpha;
        var specGrad = ctx2.createRadialGradient(lightX, lightY, 1, lightX + 2, lightY + 2, bw * 0.52);
        specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
        specGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
        specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx2.fillStyle = specGrad;
        ctx2.beginPath();
        ctx2.ellipse(lightX, lightY, bw * 0.38, bh * 0.25, -0.38, 0, Math.PI * 2);
        ctx2.fill();

        // Secondary bottom bounce reflection
        ctx2.fillStyle = 'rgba(72, 219, 251, 0.25)';
        ctx2.beginPath();
        ctx2.ellipse(bw * 0.28, bh * 0.38, bw * 0.3, bh * 0.12, 0.35, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.restore();
    } else {
        // Back-view solid shading: subtle top contour highlight
        ctx2.save();
        ctx2.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx2.lineWidth = 1.8 * scale;
        ctx2.beginPath();
        ctx2.arc(0, -bh * 0.45, bw * 0.35, 1.1 * Math.PI, 1.9 * Math.PI, false);
        ctx2.stroke();
        ctx2.restore();
    }

    ctx2.restore(); // end body transform

    // --- 6. 3D CLOTHES & OUTFIT (Continuous 360° Volumetric Wrapping) ---
    // In real 3D, clothing features (lapels, buttons, pockets, ties, seams) live at
    // specific surface longitudes (phi). When rotated by angle, their screen position is
    // X = bx + R * sin(angle + phi) and depth Z = cos(angle + phi).
    // Features facing the camera (Z > 0.08) are rendered with true foreshortening and smooth fade!

    if (gear.body === 'lab_coat') {
        ctx2.save();
        ctx2.translate(bx, by);
        ctx2.scale(scaleX, scaleY);

        // Lab coat outer silhouette (wraps the lower cylinder of the body seamlessly)
        var coatGrad = ctx2.createLinearGradient(0, -bh * 0.05, 0, bh * 0.54);
        coatGrad.addColorStop(0, '#ffffff');
        coatGrad.addColorStop(0.85, '#f1f5f9');
        coatGrad.addColorStop(1, '#e2e8f0');
        ctx2.fillStyle = coatGrad;
        ctx2.strokeStyle = '#cbd5e1';
        ctx2.lineWidth = 1.8 * scale;

        ctx2.beginPath();
        ctx2.moveTo(-bw * 0.86, -bh * 0.05);
        ctx2.quadraticCurveTo(-bw * 1.02, bh * 0.25, -bw * 0.80, bh * 0.52);
        // Hem ellipse curves down in front when cosA > 0, down in back when cosA < 0
        ctx2.quadraticCurveTo(0, bh * 0.52 + cosA * 7 * scale, bw * 0.80, bh * 0.52);
        ctx2.quadraticCurveTo(bw * 1.02, bh * 0.25, bw * 0.86, -bh * 0.05);

        // Neckline ellipse curves down in front when cosA > 0, up when cosA < 0
        ctx2.quadraticCurveTo(0, -bh * 0.06 - cosA * 4 * scale, -bw * 0.86, -bh * 0.05);
        ctx2.closePath();
        ctx2.fill();
        ctx2.stroke();

        // ── 3D SURFACE FEATURES FOR LAB COAT ──
        // 1. Center Placket & 3 Pearlescent Buttons (phi = 0)
        var placketZ = cosA;
        if (placketZ > 0.08) {
            var pAlpha = Math.min(1, Math.max(0, (placketZ - 0.08) / 0.25));
            var pX = (bw * 0.38) * sinA;

            ctx2.save();
            ctx2.globalAlpha = pAlpha;

            // Placket line
            ctx2.strokeStyle = '#94a3b8';
            ctx2.lineWidth = 1.8 * scale;
            ctx2.beginPath();
            ctx2.moveTo(pX, bh * 0.16);
            ctx2.lineTo(pX, bh * 0.52 + cosA * 7 * scale);
            ctx2.stroke();

            // 3 Buttons
            for (var bi = 0; bi < 3; bi++) {
                var btnY = bh * (0.22 + bi * 0.10);
                ctx2.fillStyle = '#f8fafc';
                ctx2.strokeStyle = '#64748b';
                ctx2.lineWidth = 1 * scale;
                ctx2.beginPath();
                ctx2.arc(pX, btnY, 2.4 * scale, 0, Math.PI * 2);
                ctx2.fill();
                ctx2.stroke();
                // 4 thread dots
                ctx2.fillStyle = '#0057cc';
                ctx2.fillRect(pX - 0.7 * scale, btnY - 0.7 * scale, 1.4 * scale, 1.4 * scale);
            }
            ctx2.restore();
        }

        // 2. Lapels (Left lapel phi = -0.45, Right lapel phi = +0.45)
        function renderCoatLapel(lapelPhi, isLeftLapel) {
            var lAngle = angle + lapelPhi;
            var lZ = Math.cos(lAngle);
            if (lZ <= 0.08) return;
            var lAlpha = Math.min(1, Math.max(0, (lZ - 0.08) / 0.25));
            var lBaseX = (bw * 0.55) * Math.sin(lAngle);
            var placketX = (bw * 0.38) * sinA;

            ctx2.save();
            ctx2.globalAlpha = lAlpha;
            ctx2.fillStyle = '#ffffff';
            ctx2.strokeStyle = '#94a3b8';
            ctx2.lineWidth = 1.2 * scale;

            ctx2.beginPath();
            ctx2.moveTo(lBaseX * 0.7, -bh * 0.05);
            ctx2.lineTo(lBaseX, bh * 0.08);
            ctx2.lineTo(placketX + (isLeftLapel ? -2 : 2) * scale * Math.max(0.3, cosA), bh * 0.20);
            ctx2.closePath();
            ctx2.fill();
            ctx2.stroke();
            ctx2.restore();
        }
        renderCoatLapel(-0.45, true);
        renderCoatLapel( 0.45, false);

        // 3. Breast Pocket with Clinic Pens (phi = -0.55, on left chest)
        var pockAngle = angle - 0.55;
        var pockZ = Math.cos(pockAngle);
        if (pockZ > 0.08) {
            var pockAlpha = Math.min(1, Math.max(0, (pockZ - 0.08) / 0.25));
            var pockX = (bw * 0.58) * Math.sin(pockAngle);
            var pockW = 8 * scale * pockZ;

            ctx2.save();
            ctx2.globalAlpha = pockAlpha;

            // Pocket pouch
            ctx2.fillStyle = '#ffffff';
            ctx2.strokeStyle = '#94a3b8';
            ctx2.lineWidth = 1.2 * scale;
            ctx2.beginPath();
            ctx2.rect(pockX - pockW * 0.5, bh * 0.14, pockW, 9 * scale);
            ctx2.fill();
            ctx2.stroke();

            // Pen 1: Pfizer Cyan Pen with silver clip
            ctx2.fillStyle = '#0057cc';
            ctx2.fillRect(pockX - pockW * 0.4, bh * 0.08, 2.2 * scale * pockZ, 7 * scale);
            ctx2.fillStyle = '#e2e8f0';
            ctx2.fillRect(pockX - pockW * 0.25, bh * 0.10, 1 * scale * pockZ, 4 * scale);

            // Pen 2: Red Highlighter with gold clip
            ctx2.fillStyle = '#ef4444';
            ctx2.fillRect(pockX + pockW * 0.05, bh * 0.09, 2.2 * scale * pockZ, 6 * scale);
            ctx2.fillStyle = '#f59e0b';
            ctx2.fillRect(pockX + pockW * 0.2, bh * 0.11, 1 * scale * pockZ, 3.5 * scale);
            ctx2.restore();
        }

        // 4. Back Yoke & Center Split Vent (phi = PI, on back)
        var backZ = -cosA;
        if (backZ > 0.08) {
            var bAlpha = Math.min(1, Math.max(0, (backZ - 0.08) / 0.25));
            var bX = -(bw * 0.38) * sinA;

            ctx2.save();
            ctx2.globalAlpha = bAlpha;
            ctx2.strokeStyle = '#94a3b8';
            ctx2.lineWidth = 1.4 * scale;

            // Shoulder yoke seam
            ctx2.beginPath();
            ctx2.moveTo(-bw * 0.65 * backZ, bh * 0.08);
            ctx2.lineTo( bw * 0.65 * backZ, bh * 0.08);
            ctx2.stroke();

            // Center vertical seam & vent
            ctx2.beginPath();
            ctx2.moveTo(bX, bh * 0.08);
            ctx2.lineTo(bX, bh * 0.52 - cosA * 7 * scale);
            ctx2.stroke();
            ctx2.restore();
        }
        ctx2.restore();
    } else if (gear.body === 'formal_suit') {
        ctx2.save();
        ctx2.translate(bx, by);
        ctx2.scale(scaleX, scaleY);

        // Luxury midnight charcoal/navy fabric gradient
        var suitGrad = ctx2.createLinearGradient(0, -bh * 0.05, 0, bh * 0.54);
        suitGrad.addColorStop(0, '#1e293b');
        suitGrad.addColorStop(1, '#0f172a');
        ctx2.fillStyle = suitGrad;
        ctx2.strokeStyle = '#020617';
        ctx2.lineWidth = 1.8 * scale;

        ctx2.beginPath();
        ctx2.moveTo(-bw * 0.86, -bh * 0.05);
        ctx2.quadraticCurveTo(-bw * 1.02, bh * 0.25, -bw * 0.80, bh * 0.52);
        ctx2.quadraticCurveTo(0, bh * 0.52 + cosA * 7 * scale, bw * 0.80, bh * 0.52);
        ctx2.quadraticCurveTo(bw * 1.02, bh * 0.25, bw * 0.86, -bh * 0.05);
        ctx2.quadraticCurveTo(0, -bh * 0.06 - cosA * 4 * scale, -bw * 0.86, -bh * 0.05);
        ctx2.closePath();
        ctx2.fill();
        ctx2.stroke();

        // ── 3D SURFACE FEATURES FOR FORMAL SUIT ──
        // 1. Shirt & Silk Tie (phi = 0)
        var suitFrontZ = cosA;
        if (suitFrontZ > 0.08) {
            var sfAlpha = Math.min(1, Math.max(0, (suitFrontZ - 0.08) / 0.25));
            var sfX = (bw * 0.38) * sinA;

            ctx2.save();
            ctx2.globalAlpha = sfAlpha;

            // Crisp white dress shirt triangle
            ctx2.fillStyle = '#ffffff';
            ctx2.beginPath();
            ctx2.moveTo(sfX - 10 * scale * suitFrontZ, -bh * 0.05);
            ctx2.lineTo(sfX, bh * 0.24);
            ctx2.lineTo(sfX + 10 * scale * suitFrontZ, -bh * 0.05);
            ctx2.closePath();
            ctx2.fill();

            // Silk Crimson Necktie with Windsor Knot
            ctx2.fillStyle = '#dc2626';
            ctx2.beginPath();
            ctx2.moveTo(sfX - 3.5 * scale * suitFrontZ, -bh * 0.04);
            ctx2.lineTo(sfX + 3.5 * scale * suitFrontZ, -bh * 0.04);
            ctx2.lineTo(sfX + 4.5 * scale * suitFrontZ, bh * 0.28);
            ctx2.lineTo(sfX, bh * 0.38);
            ctx2.lineTo(sfX - 4.5 * scale * suitFrontZ, bh * 0.28);
            ctx2.closePath();
            ctx2.fill();

            // Necktie Windsor Knot
            ctx2.fillStyle = '#b91c1c';
            ctx2.beginPath();
            ctx2.moveTo(sfX - 3 * scale * suitFrontZ, -bh * 0.04);
            ctx2.lineTo(sfX + 3 * scale * suitFrontZ, -bh * 0.04);
            ctx2.lineTo(sfX + 2 * scale * suitFrontZ, bh * 0.04);
            ctx2.lineTo(sfX - 2 * scale * suitFrontZ, bh * 0.04);
            ctx2.closePath();
            ctx2.fill();

            // Gold Tie Bar
            ctx2.fillStyle = '#f59e0b';
            ctx2.fillRect(sfX - 3 * scale * suitFrontZ, bh * 0.16, 6 * scale * suitFrontZ, 1.8 * scale);

            // 2 Polished jacket buttons
            ctx2.fillStyle = '#020617';
            ctx2.beginPath();
            ctx2.arc(sfX, bh * 0.32, 2.2 * scale, 0, Math.PI * 2);
            ctx2.arc(sfX, bh * 0.42, 2.2 * scale, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.restore();
        }

        // 2. Peaked Lapels (Left phi = -0.45, Right phi = +0.45)
        function renderSuitLapel(lapelPhi, isLeft) {
            var lAngle = angle + lapelPhi;
            var lZ = Math.cos(lAngle);
            if (lZ <= 0.08) return;
            var lAlpha = Math.min(1, Math.max(0, (lZ - 0.08) / 0.25));
            var lBaseX = (bw * 0.55) * Math.sin(lAngle);
            var sfX = (bw * 0.38) * sinA;

            ctx2.save();
            ctx2.globalAlpha = lAlpha;
            ctx2.fillStyle = '#0f172a';
            ctx2.strokeStyle = '#334155';
            ctx2.lineWidth = 1.2 * scale;

            ctx2.beginPath();
            ctx2.moveTo(lBaseX * 0.7, -bh * 0.05);
            ctx2.lineTo(lBaseX, bh * 0.08);
            ctx2.lineTo(lBaseX * 0.85, bh * 0.16);
            ctx2.lineTo(sfX, bh * 0.26);
            ctx2.closePath();
            ctx2.fill();
            ctx2.stroke();
            ctx2.restore();
        }
        renderSuitLapel(-0.45, true);
        renderSuitLapel( 0.45, false);

        // 3. Back Tailored Seams (phi = PI)
        var suitBackZ = -cosA;
        if (suitBackZ > 0.08) {
            var sbAlpha = Math.min(1, Math.max(0, (suitBackZ - 0.08) / 0.25));
            var sbX = -(bw * 0.38) * sinA;

            ctx2.save();
            ctx2.globalAlpha = sbAlpha;
            ctx2.strokeStyle = '#334155';
            ctx2.lineWidth = 1.4 * scale;
            ctx2.beginPath();
            ctx2.moveTo(sbX, -bh * 0.05);
            ctx2.lineTo(sbX, bh * 0.52 - cosA * 7 * scale);
            ctx2.stroke();
            ctx2.restore();
        }
        ctx2.restore();
    } else if (gear.body === 'pfizer_shirt') {
        ctx2.save();
        ctx2.translate(bx, by);
        ctx2.scale(scaleX, scaleY);

        // Rich athletic royal blue pique gradient
        var poloGrad = ctx2.createLinearGradient(0, -bh * 0.08, 0, bh * 0.50);
        poloGrad.addColorStop(0, '#0057cc');
        poloGrad.addColorStop(1, '#002f7a');
        ctx2.fillStyle = poloGrad;
        ctx2.beginPath();
        ctx2.moveTo(-bw * 0.84, -bh * 0.08);
        ctx2.quadraticCurveTo(-bw * 0.98, bh * 0.2, -bw * 0.78, bh * 0.48);
        ctx2.quadraticCurveTo(0, bh * 0.48 + cosA * 7 * scale, bw * 0.78, bh * 0.48);
        ctx2.quadraticCurveTo(bw * 0.98, bh * 0.2, bw * 0.84, -bh * 0.08);
        ctx2.quadraticCurveTo(0, -bh * 0.08 - cosA * 4 * scale, -bw * 0.84, -bh * 0.08);
        ctx2.closePath();
        ctx2.fill();
        ctx2.strokeStyle = '#001a4d';
        ctx2.lineWidth = 1.5 * scale;
        ctx2.stroke();

        // 1. Contrast White Ribbed Polo Collar & Placket (phi = 0)
        var poloFrontZ = cosA;
        if (poloFrontZ > 0.08) {
            var pfAlpha = Math.min(1, Math.max(0, (poloFrontZ - 0.08) / 0.25));
            var pfX = (bw * 0.38) * sinA;

            ctx2.save();
            ctx2.globalAlpha = pfAlpha;

            // Ribbed collar
            ctx2.fillStyle = '#ffffff';
            ctx2.beginPath();
            ctx2.ellipse(pfX, -bh * 0.05, bw * 0.36 * poloFrontZ, 5 * scale, 0, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.strokeStyle = '#0057cc';
            ctx2.lineWidth = 1 * scale;
            ctx2.stroke();

            // Placket with 2 buttons
            ctx2.fillStyle = '#ffffff';
            ctx2.fillRect(pfX - 2.5 * scale * poloFrontZ, -bh * 0.02, 5 * scale * poloFrontZ, 12 * scale);
            ctx2.fillStyle = '#002f7a';
            ctx2.beginPath();
            ctx2.arc(pfX, bh * 0.02, 1.2 * scale, 0, Math.PI * 2);
            ctx2.arc(pfX, bh * 0.07, 1.2 * scale, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.restore();
        }

        // 2. Embossed Pfizer CARE Crest Badge (phi = +0.50, on right chest)
        var badgeAngle = angle + 0.50;
        var bz = Math.cos(badgeAngle);
        if (bz > 0.08) {
            var bAlpha = Math.min(1, Math.max(0, (bz - 0.08) / 0.25));
            var bxPos = (bw * 0.55) * Math.sin(badgeAngle);

            ctx2.save();
            ctx2.globalAlpha = bAlpha;
            ctx2.fillStyle = '#f59e0b';
            ctx2.beginPath();
            ctx2.ellipse(bxPos, bh * 0.12, 4.5 * scale * bz, 4.5 * scale, 0, 0, Math.PI * 2);
            ctx2.fill();

            // Star inside badge
            ctx2.fillStyle = '#ffffff';
            ctx2.font = 'bold ' + (6 * scale) + 'px sans-serif';
            ctx2.textAlign = 'center';
            ctx2.fillText('★', bxPos, bh * 0.145);
            ctx2.restore();
        }
        ctx2.restore();
    } else if (gear.body === 'hero_cape' && cosA <= -0.05) {
        // Hero Cape in Back View (Continuous smooth fade-in as character turns around)
        var capeAlpha = Math.min(1, Math.max(0, (-cosA - 0.05) / 0.25));
        ctx2.save();
        ctx2.globalAlpha = capeAlpha;

        var capeSway2 = Math.sin(t * 0.15) * 6;
        var capeGrad2 = ctx2.createLinearGradient(bx, by - bh * 0.2, bx, by + bh * 0.82);
        capeGrad2.addColorStop(0, '#dc2626');
        capeGrad2.addColorStop(0.5, '#b91c1c');
        capeGrad2.addColorStop(1, '#7f1d1d');
        ctx2.fillStyle = capeGrad2;

        ctx2.beginPath();
        ctx2.moveTo(bx - bw * 0.75, by - bh * 0.12);
        ctx2.quadraticCurveTo(bx - bw * 1.05 + capeSway2, by + bh * 0.38, bx - bw * 0.95 + capeSway2, by + bh * 0.82);
        ctx2.lineTo(bx - bw * 0.3 + capeSway2, by + bh * 0.80);
        ctx2.lineTo(bx + capeSway2, by + bh * 0.84);
        ctx2.lineTo(bx + bw * 0.3 + capeSway2, by + bh * 0.80);
        ctx2.lineTo(bx + bw * 0.95 + capeSway2, by + bh * 0.82);
        ctx2.quadraticCurveTo(bx + bw * 1.05 + capeSway2, by + bh * 0.38, bx + bw * 0.75, by - bh * 0.12);
        ctx2.closePath();
        ctx2.fill();

        // Heavy Gold Bullion Trim along edges
        ctx2.strokeStyle = '#f59e0b';
        ctx2.lineWidth = 2.8 * scale;
        ctx2.stroke();

        // Giant Golden Pfizer Starburst Insignia
        var starX = bx + capeSway2 * 0.5;
        var starY = by + bh * 0.32;
        ctx2.fillStyle = 'rgba(254, 240, 138, 0.35)';
        ctx2.beginPath();
        ctx2.arc(starX, starY, 18 * scale, 0, Math.PI * 2);
        ctx2.fill();

        ctx2.fillStyle = '#f59e0b';
        ctx2.strokeStyle = '#78350f';
        ctx2.lineWidth = 1 * scale;
        ctx2.font = 'bold ' + (20 * scale) + 'px sans-serif';
        ctx2.textAlign = 'center';
        ctx2.fillText('★', starX, starY + 7 * scale);
        ctx2.strokeText('★', starX, starY + 7 * scale);
        ctx2.restore();
    }

    // --- 7. FACIAL FEATURES (SPHERICAL PROJECTION & PROPER SEPARATION) ---
    ctx2.save();
    // Clip to the droplet body silhouette so NOTHING can ever leak outside:
    ctx2.translate(bx, by);
    ctx2.scale(scaleX, scaleY);
    createBodyPath(ctx2);
    ctx2.clip();
    ctx2.scale(1 / scaleX, 1 / scaleY);
    ctx2.translate(-bx, -by);

    var eyeOffsetY = by - bh * 0.11;
    var eyeSepAngle = 0.38; // Wide, cute eye spacing

    // Gaze offset: pupils shift dynamically in direction of movement / looking around
    var gazeLen = Math.sqrt(gazeDx * gazeDx + gazeDy * gazeDy);
    var gazeNx = gazeLen > 0.01 ? gazeDx / gazeLen : 0;
    var gazeNy = gazeLen > 0.01 ? gazeDy / gazeLen : 0;
    var gazeShiftX = gazeNx * Math.min(3.6 * scale, gazeLen * 1.8 * scale);
    var gazeShiftY = gazeNy * Math.min(2.4 * scale, gazeLen * 1.4 * scale);

    // Natural lively blink cycle (blink every 3.8s for ~120ms)
    var blinkCycle = (Date.now() * 0.001) % 3.8;
    var isBlink = (blinkCycle < 0.12) && (expression !== 'scared');

    function renderSphericalEye(eyeAngleRad, isLeftEye) {
        var eyeCos = Math.cos(eyeAngleRad);
        if (eyeCos <= 0.08) return; // Disappear smoothly when rotated behind

        var eyeAlpha = Math.min(1, Math.max(0, (eyeCos - 0.08) / 0.25));
        var eyeX = bx + (bw * 0.65) * Math.sin(eyeAngleRad);
        var eyeW = 9.5 * scale * eyeCos;
        var eyeH = 13.5 * scale;

        ctx2.save();
        ctx2.globalAlpha = eyeAlpha;

        // Cute Rosy Cheek Blush below eye
        if (cosA > 0.30) {
            ctx2.fillStyle = 'rgba(244, 114, 182, 0.28)';
            ctx2.beginPath();
            ctx2.ellipse(eyeX, eyeOffsetY + 12 * scale, 6.5 * scale * eyeCos, 3 * scale, 0, 0, Math.PI * 2);
            ctx2.fill();
        }

        // If blinking, render cute expressive closed eyelid arc
        if (isBlink) {
            ctx2.strokeStyle = '#0f172a';
            ctx2.lineWidth = 2.4 * scale;
            ctx2.lineCap = 'round';
            ctx2.beginPath();
            ctx2.arc(eyeX, eyeOffsetY + 2 * scale, Math.max(2, eyeW * 0.8), 1.15 * Math.PI, 1.85 * Math.PI, false);
            ctx2.stroke();

            ctx2.strokeStyle = darkColor;
            ctx2.lineWidth = 1.2 * scale;
            ctx2.beginPath();
            ctx2.arc(eyeX, eyeOffsetY + 3.2 * scale, Math.max(1, eyeW * 0.6), 1.2 * Math.PI, 1.8 * Math.PI, false);
            ctx2.stroke();

            ctx2.restore();
            return;
        }

        // Eye White (Sclera)
        ctx2.fillStyle = '#ffffff';
        ctx2.beginPath();
        ctx2.ellipse(eyeX, eyeOffsetY, Math.max(1, eyeW), eyeH, 0, 0, Math.PI * 2);
        ctx2.fill();

        // Eye outline with reinforced upper lash curve
        ctx2.strokeStyle = darkColor;
        ctx2.lineWidth = 1.8 * scale;
        ctx2.stroke();

        ctx2.strokeStyle = '#0f172a';
        ctx2.lineWidth = 2.2 * scale;
        ctx2.beginPath();
        ctx2.arc(eyeX, eyeOffsetY - 1 * scale, Math.max(1, eyeW), 1.15 * Math.PI, 1.85 * Math.PI, false);
        ctx2.stroke();

        // Iris / Pupil with deep blue-black core — offset by gaze direction
        var pupilShiftY = (expression === 'scared') ? 3.5 * scale : 1.2 * scale;
        var pupilR = 4.6 * scale * Math.max(0.35, eyeCos);

        // Clamp gaze shift inside eye bounds
        var maxShiftX = Math.max(0, eyeW * 0.65);
        var maxShiftY = 2.8 * scale;
        var clampedGazeX = Math.max(-maxShiftX, Math.min(maxShiftX, gazeShiftX * eyeCos));
        var clampedGazeY = Math.max(-maxShiftY, Math.min(maxShiftY, gazeShiftY));

        ctx2.fillStyle = '#090d16';
        ctx2.beginPath();
        ctx2.arc(eyeX + clampedGazeX, eyeOffsetY + pupilShiftY + clampedGazeY, pupilR, 0, Math.PI * 2);
        ctx2.fill();

        // Lower Iris Glow ring
        ctx2.fillStyle = color;
        ctx2.beginPath();
        ctx2.arc(eyeX + clampedGazeX, eyeOffsetY + pupilShiftY + clampedGazeY + 1.5 * scale, pupilR * 0.6, 0.1 * Math.PI, 0.9 * Math.PI, false);
        ctx2.fill();

        // Dual Sparkling Highlights (fixed to sclera, not pupil)
        ctx2.fillStyle = '#ffffff';
        ctx2.beginPath();
        ctx2.arc(eyeX + 1.8 * scale * eyeCos, eyeOffsetY + pupilShiftY - 2.5 * scale, 2.2 * scale * eyeCos, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.beginPath();
        ctx2.arc(eyeX - 1.2 * scale * eyeCos, eyeOffsetY + pupilShiftY + 1.5 * scale, 1.1 * scale * eyeCos, 0, Math.PI * 2);
        ctx2.fill();

        ctx2.restore();
    }

    renderSphericalEye(angle - eyeSepAngle, true);
    renderSphericalEye(angle + eyeSepAngle, false);

    // Expressive Mouth with dimples
    var mouthCos = Math.cos(angle);
    if (mouthCos > 0.12 && gear.accessory !== 'mask') {
        var mouthAlpha = Math.min(1, Math.max(0, (mouthCos - 0.12) / 0.25));
        var mouthX = bx + (bw * 0.55) * sinA;
        ctx2.save();
        ctx2.globalAlpha = mouthAlpha;

        if (expression === 'scared') {
            ctx2.fillStyle = '#1e293b';
            ctx2.strokeStyle = darkColor;
            ctx2.lineWidth = 1.6 * scale;
            ctx2.beginPath();
            ctx2.ellipse(mouthX, by + bh * 0.10, 5.5 * scale * mouthCos, 7.5 * scale, 0, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.stroke();
        } else if (expression === 'sad') {
            ctx2.strokeStyle = darkColor;
            ctx2.lineWidth = 2.4 * scale;
            ctx2.lineCap = 'round';
            ctx2.beginPath();
            ctx2.arc(mouthX, by + bh * 0.24, 8.5 * scale * mouthCos, 0.25 * Math.PI, 0.75 * Math.PI, false);
            ctx2.stroke();
        } else {
            // Cute Happy Smile with dimples
            ctx2.strokeStyle = darkColor;
            ctx2.lineWidth = 2.4 * scale;
            ctx2.lineCap = 'round';
            ctx2.beginPath();
            ctx2.arc(mouthX, by + bh * 0.04, 9.5 * scale * mouthCos, 0.15 * Math.PI, 0.85 * Math.PI, false);
            ctx2.stroke();

            ctx2.fillStyle = darkColor;
            ctx2.beginPath();
            ctx2.arc(mouthX - 7 * scale * mouthCos, by + bh * 0.07, 1 * scale, 0, Math.PI * 2);
            ctx2.arc(mouthX + 7 * scale * mouthCos, by + bh * 0.07, 1 * scale, 0, Math.PI * 2);
            ctx2.fill();
        }
        ctx2.restore();
    }
    ctx2.restore(); // end clipped facial area

    // --- 8. ACCESSORIES (Full 3D Orbiting Glasses, Mask, Stethoscope, Badge) ---
    // Premium Designer Glasses with Independent 3D Lens Projection
    if (gear.accessory === 'glasses') {
        var gY = by - bh * 0.11;

        // Render each lens with its OWN true 3D surface position & depth
        function render3DLens(lensAngle, isLeft) {
            var lZ = Math.cos(lensAngle);
            if (lZ <= 0.08) return null; // Lens is on back of head

            var lAlpha = Math.min(1, Math.max(0, (lZ - 0.08) / 0.25));
            var lX = bx + (bw * 0.65) * Math.sin(lensAngle);
            var lW = 10 * scale * Math.max(0.2, lZ);
            var lH = 11.5 * scale;

            ctx2.save();
            ctx2.globalAlpha = lAlpha;

            // Outer Acetate Rim
            ctx2.strokeStyle = '#0f172a';
            ctx2.lineWidth = 2.6 * scale;
            ctx2.fillStyle = 'rgba(186, 230, 253, 0.22)';
            ctx2.beginPath();
            ctx2.ellipse(lX, gY, lW, lH, 0, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.stroke();

            // Inner Gold Rim
            ctx2.strokeStyle = '#f59e0b';
            ctx2.lineWidth = 0.8 * scale;
            ctx2.beginPath();
            ctx2.ellipse(lX, gY, Math.max(1, lW - 1.2 * scale), lH - 1.2 * scale, 0, 0, Math.PI * 2);
            ctx2.stroke();

            // Glass glint reflection
            ctx2.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            ctx2.lineWidth = 1.2 * scale;
            ctx2.beginPath();
            ctx2.moveTo(lX - 4 * scale * lZ, gY - 6 * scale);
            ctx2.lineTo(lX + 3 * scale * lZ, gY + 5 * scale);
            ctx2.stroke();

            // Temple (patilla) going to ear position
            var earX = isLeft ? (bx - bw * 0.85 * cosA) : (bx + bw * 0.85 * cosA);
            var templeEdgeX = isLeft ? (lX - lW) : (lX + lW);
            ctx2.strokeStyle = '#0f172a';
            ctx2.lineWidth = 2 * scale;
            ctx2.beginPath();
            ctx2.moveTo(templeEdgeX, gY);
            ctx2.lineTo(earX, gY - 1 * scale);
            ctx2.stroke();

            ctx2.restore();
            return { x: lX, w: lW, z: lZ };
        }

        var leftLensInfo = render3DLens(angle - eyeSepAngle, true);
        var rightLensInfo = render3DLens(angle + eyeSepAngle, false);

        // Bridge between lenses (renders smoothly if center of face is visible)
        var bridgeZ = cosA;
        if (bridgeZ > 0.12 && leftLensInfo && rightLensInfo) {
            var bAlpha = Math.min(1, Math.max(0, (bridgeZ - 0.12) / 0.25));
            ctx2.save();
            ctx2.globalAlpha = bAlpha;
            ctx2.strokeStyle = '#f59e0b';
            ctx2.lineWidth = 2.2 * scale;
            ctx2.lineCap = 'round';
            ctx2.beginPath();
            var bMidX = (leftLensInfo.x + rightLensInfo.x) * 0.5;
            ctx2.moveTo(leftLensInfo.x + leftLensInfo.w * 0.85, gY);
            ctx2.quadraticCurveTo(bMidX, gY - 3 * scale, rightLensInfo.x - rightLensInfo.w * 0.85, gY);
            ctx2.stroke();
            ctx2.restore();
        }
    } else if (gear.accessory === 'mask') {
        // Hospital-Grade Pleated Surgical Mask (Continuous 3D face wrapping)
        var maskZ = cosA;
        if (maskZ > 0.08) {
            var mAlpha = Math.min(1, Math.max(0, (maskZ - 0.08) / 0.25));
            var mX = bx + (bw * 0.55) * sinA;
            var mW = 34 * scale * Math.max(0.18, maskZ);
            var mH = 17 * scale;
            var mY = by - 1 * scale;

            ctx2.save();
            ctx2.globalAlpha = mAlpha;

            // Mask Body
            var maskGrad = ctx2.createLinearGradient(mX - mW * 0.5, mY, mX + mW * 0.5, mY + mH);
            maskGrad.addColorStop(0, '#38bdf8');
            maskGrad.addColorStop(1, '#0284c7');
            ctx2.fillStyle = maskGrad;
            ctx2.strokeStyle = '#ffffff';
            ctx2.lineWidth = 1.6 * scale;

            ctx2.beginPath();
            ctx2.roundRect ? ctx2.roundRect(mX - mW * 0.5, mY, mW, mH, 4 * scale) : ctx2.rect(mX - mW * 0.5, mY, mW, mH);
            ctx2.fill();
            ctx2.stroke();

            // 3 Pleats
            for (var pi = 1; pi <= 3; pi++) {
                var pleatY = mY + pi * 4 * scale;
                ctx2.strokeStyle = 'rgba(2, 132, 199, 0.6)';
                ctx2.lineWidth = 1.5 * scale;
                ctx2.beginPath();
                ctx2.moveTo(mX - mW * 0.44, pleatY); ctx2.lineTo(mX + mW * 0.44, pleatY);
                ctx2.stroke();
            }

            // Nose wire
            ctx2.strokeStyle = '#ffffff';
            ctx2.lineWidth = 2 * scale;
            ctx2.beginPath();
            ctx2.moveTo(mX - mW * 0.25, mY + 1 * scale);
            ctx2.lineTo(mX, mY - 1.5 * scale);
            ctx2.lineTo(mX + mW * 0.25, mY + 1 * scale);
            ctx2.stroke();

            // Ear straps to 3D ear positions
            ctx2.strokeStyle = '#ffffff';
            ctx2.lineWidth = 1.4 * scale;
            var earLX = bx - bw * 0.85 * cosA;
            var earRX = bx + bw * 0.85 * cosA;
            ctx2.beginPath();
            ctx2.moveTo(mX - mW * 0.5, mY + 4 * scale); ctx2.lineTo(earLX, mY + 6 * scale);
            ctx2.moveTo(mX + mW * 0.5, mY + 4 * scale); ctx2.lineTo(earRX, mY + 6 * scale);
            ctx2.stroke();
            ctx2.restore();
        }
    } else if (gear.accessory === 'stethoscope') {
        // Professional Cardiology Stethoscope (Full 3D Orbiting Bell)
        ctx2.save();

        // Neck loop that rests on shoulders
        ctx2.strokeStyle = '#1e293b';
        ctx2.lineWidth = 3.8 * scale;
        ctx2.lineCap = 'round';
        ctx2.beginPath();
        ctx2.arc(bx, by - bh * 0.02, bw * 0.60 * Math.max(0.65, Math.abs(cosA)), 0.1 * Math.PI, 0.9 * Math.PI, false);
        ctx2.stroke();

        var stethAngle = angle + 0.22;
        var stethZ = Math.cos(stethAngle);
        if (stethZ > 0.08) {
            var stAlpha = Math.min(1, Math.max(0, (stethZ - 0.08) / 0.25));
            var stX = bx + (bw * 0.42) * Math.sin(stethAngle);

            ctx2.globalAlpha = stAlpha;

            // Tubing
            ctx2.strokeStyle = '#1e293b';
            ctx2.lineWidth = 3.6 * scale;
            ctx2.beginPath();
            ctx2.moveTo(bx, by + bh * 0.14);
            ctx2.quadraticCurveTo(bx + 4 * scale * sinA, by + bh * 0.22, stX, by + bh * 0.33);
            ctx2.stroke();

            // Chrome Chestpiece
            ctx2.fillStyle = '#f1f5f9';
            ctx2.strokeStyle = '#64748b';
            ctx2.lineWidth = 1.8 * scale;
            ctx2.beginPath();
            ctx2.ellipse(stX, by + bh * 0.33, 6 * scale * Math.max(0.2, stethZ), 6 * scale, 0, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.stroke();

            // Concentric diaphragm ring
            ctx2.strokeStyle = '#94a3b8';
            ctx2.lineWidth = 1 * scale;
            ctx2.beginPath();
            ctx2.ellipse(stX, by + bh * 0.33, 3.8 * scale * Math.max(0.2, stethZ), 3.8 * scale, 0, 0, Math.PI * 2);
            ctx2.stroke();
        }
        ctx2.restore();
    } else if (gear.accessory === 'badge') {
        // Official Pfizer CARE Connect Security Credential (3D Surface Tracking)
        var badgeAngle = angle + 0.30;
        var bz = Math.cos(badgeAngle);
        if (bz > 0.08) {
            var bAlpha = Math.min(1, Math.max(0, (bz - 0.08) / 0.25));
            var bX = bx + (bw * 0.40) * Math.sin(badgeAngle);
            var bW = 16 * scale * Math.max(0.18, bz);
            var bH = 20 * scale;
            var bY = by + bh * 0.22;

            ctx2.save();
            ctx2.globalAlpha = bAlpha;

            // Lanyard strap
            ctx2.strokeStyle = '#0057cc';
            ctx2.lineWidth = 2.4 * scale;
            ctx2.beginPath();
            ctx2.moveTo(bx - 8 * scale * cosA, by - bh * 0.05);
            ctx2.lineTo(bX, by + bh * 0.18);
            ctx2.lineTo(bx + 8 * scale * cosA, by - bh * 0.05);
            ctx2.stroke();

            // Clasp
            ctx2.fillStyle = '#cbd5e1';
            ctx2.fillRect(bX - 2 * scale * bz, by + bh * 0.18, 4 * scale * bz, 3.5 * scale);

            // Acrylic Card
            ctx2.fillStyle = '#ffffff';
            ctx2.strokeStyle = '#003893';
            ctx2.lineWidth = 1.4 * scale;
            ctx2.beginPath();
            ctx2.roundRect ? ctx2.roundRect(bX - bW * 0.5, bY, bW, bH, 2.5 * scale) : ctx2.rect(bX - bW * 0.5, bY, bW, bH);
            ctx2.fill();
            ctx2.stroke();

            // Blue Header
            ctx2.fillStyle = '#0057cc';
            ctx2.fillRect(bX - bW * 0.45, bY + 1 * scale, bW * 0.9, 4 * scale);

            // Photo frame
            ctx2.fillStyle = '#e2e8f0';
            ctx2.fillRect(bX - bW * 0.42, bY + 6 * scale, 6 * scale * bz, 7 * scale);

            // Holographic Seal
            ctx2.fillStyle = '#f59e0b';
            ctx2.beginPath();
            ctx2.arc(bX + 4 * scale * bz, bY + 8 * scale, 2 * scale * bz, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.restore();
        }
    }

    // --- 9. HEADGEAR (Doctor Cap, Grad Hat, Crown, Headset, Cap, Fedora) ---
    var headApexX = bx + (bw * 0.15 * sinA);
    var headApexY = by - bh * 0.52;

    if (gear.head === 'doctor_cap') {
        // High-Quality Clinical Cap with 3D Crest
        ctx2.save();
        ctx2.translate(headApexX, headApexY);

        var capGrad = ctx2.createLinearGradient(0, -14 * scale, 0, 0);
        capGrad.addColorStop(0, '#14b8a6');
        capGrad.addColorStop(1, '#0f766e');
        ctx2.fillStyle = capGrad;
        ctx2.strokeStyle = '#042f2e';
        ctx2.lineWidth = 1.8 * scale;

        ctx2.beginPath();
        ctx2.ellipse(0, -6 * scale, 19 * scale, 12 * scale, 0, Math.PI, 0, false);
        ctx2.closePath();
        ctx2.fill();
        ctx2.stroke();

        ctx2.fillStyle = '#ffffff';
        ctx2.fillRect(-18 * scale, -2 * scale, 36 * scale, 3.5 * scale);
        ctx2.strokeStyle = '#042f2e';
        ctx2.lineWidth = 1 * scale;
        ctx2.strokeRect(-18 * scale, -2 * scale, 36 * scale, 3.5 * scale);

        if (cosA > 0.08) {
            var cAlpha = Math.min(1, Math.max(0, (cosA - 0.08) / 0.25));
            ctx2.globalAlpha = cAlpha;
            var crossX = 8 * scale * sinA;
            ctx2.fillStyle = '#ef4444';
            ctx2.beginPath();
            ctx2.arc(crossX, -8 * scale, 5.5 * scale, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.strokeStyle = '#ffffff';
            ctx2.lineWidth = 1 * scale;
            ctx2.stroke();

            ctx2.fillStyle = '#ffffff';
            ctx2.fillRect(crossX - 1.5 * scale, -11 * scale, 3 * scale, 6 * scale);
            ctx2.fillRect(crossX - 3 * scale, -9.5 * scale, 6 * scale, 3 * scale);
        }
        ctx2.restore();
    } else if (gear.head === 'grad_hat') {
        // Academic Mortarboard with 3D Rotated Diamond Top
        ctx2.save();
        ctx2.translate(headApexX, headApexY - 4 * scale);

        ctx2.fillStyle = '#0f172a';
        ctx2.strokeStyle = '#000000';
        ctx2.lineWidth = 1.6 * scale;
        ctx2.beginPath();
        ctx2.moveTo(0, -10 * scale);
        ctx2.lineTo(25 * scale * Math.max(0.65, Math.abs(cosA)), 0);
        ctx2.lineTo(0, 10 * scale);
        ctx2.lineTo(-25 * scale * Math.max(0.65, Math.abs(cosA)), 0);
        ctx2.closePath();
        ctx2.fill();
        ctx2.stroke();

        ctx2.strokeStyle = '#f59e0b';
        ctx2.lineWidth = 1 * scale;
        ctx2.stroke();

        ctx2.fillStyle = '#1e293b';
        ctx2.fillRect(-11 * scale, 0, 22 * scale, 8 * scale);

        ctx2.fillStyle = '#f59e0b';
        ctx2.beginPath();
        ctx2.arc(0, 0, 2.5 * scale, 0, Math.PI * 2);
        ctx2.fill();

        // Tassel follows front direction
        var tasselX = -19 * scale * (cosA >= 0 ? Math.max(0.5, cosA) : -Math.max(0.5, -cosA));
        ctx2.strokeStyle = '#f59e0b';
        ctx2.lineWidth = 2.2 * scale;
        ctx2.beginPath();
        ctx2.moveTo(0, 0);
        ctx2.quadraticCurveTo(tasselX * 0.5, 6 * scale, tasselX, 15 * scale);
        ctx2.stroke();

        ctx2.fillStyle = '#d97706';
        ctx2.beginPath();
        ctx2.arc(tasselX, 16 * scale, 3.2 * scale, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.fillStyle = '#f59e0b';
        ctx2.fillRect(tasselX - 2 * scale, 17 * scale, 4 * scale, 6 * scale);
        ctx2.restore();
    } else if (gear.head === 'crown') {
        // Gilded Imperial Crown
        ctx2.save();
        ctx2.translate(headApexX, headApexY - 2 * scale);

        var crownGrad = ctx2.createLinearGradient(-16 * scale, -16 * scale, 16 * scale, 6 * scale);
        crownGrad.addColorStop(0, '#fde047');
        crownGrad.addColorStop(0.5, '#facc15');
        crownGrad.addColorStop(1, '#ca8a04');
        ctx2.fillStyle = crownGrad;
        ctx2.strokeStyle = '#78350f';
        ctx2.lineWidth = 1.8 * scale;

        ctx2.beginPath();
        ctx2.moveTo(-17 * scale, 3 * scale);
        ctx2.lineTo(-19 * scale, -13 * scale);
        ctx2.lineTo(-9 * scale, -4 * scale);
        ctx2.lineTo(0, -18 * scale);
        ctx2.lineTo(9 * scale, -4 * scale);
        ctx2.lineTo(19 * scale, -13 * scale);
        ctx2.lineTo(17 * scale, 3 * scale);
        ctx2.closePath();
        ctx2.fill();
        ctx2.stroke();

        ctx2.fillStyle = '#dc2626';
        ctx2.fillRect(-16 * scale, 0, 32 * scale, 3.5 * scale);

        ctx2.fillStyle = '#ef4444';
        ctx2.beginPath();
        ctx2.arc(0, -6 * scale, 3.2 * scale, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.fillStyle = '#3b82f6';
        ctx2.beginPath();
        ctx2.arc(-11 * scale, -2 * scale, 2.4 * scale, 0, Math.PI * 2);
        ctx2.arc( 11 * scale, -2 * scale, 2.4 * scale, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.restore();
    } else if (gear.head === 'headset') {
        // Esports Headset with 3D Orbiting Earcups
        ctx2.save();
        ctx2.translate(bx, by - bh * 0.25);

        ctx2.strokeStyle = '#1e293b';
        ctx2.lineWidth = 4 * scale;
        ctx2.beginPath();
        ctx2.arc(0, -bh * 0.25, bw * 0.72, 0.9 * Math.PI, 2.1 * Math.PI, false);
        ctx2.stroke();

        function renderEarcup(cxPos, cz) {
            var eAlpha = cz < 0 ? 0.6 : 1.0;
            ctx2.save();
            ctx2.globalAlpha = eAlpha;
            ctx2.fillStyle = '#ef4444';
            ctx2.strokeStyle = '#0f172a';
            ctx2.lineWidth = 1.5 * scale;
            ctx2.beginPath();
            ctx2.ellipse(cxPos, -bh * 0.1, 5.5 * scale, 9.5 * scale, 0, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.stroke();
            ctx2.restore();
        }

        renderEarcup(-bw * 0.75 * cosA,  sinA);
        renderEarcup( bw * 0.75 * cosA, -sinA);

        if (cosA > 0.08) {
            var micAlpha = Math.min(1, Math.max(0, (cosA - 0.08) / 0.25));
            ctx2.save();
            ctx2.globalAlpha = micAlpha;
            ctx2.strokeStyle = '#0f172a';
            ctx2.lineWidth = 2.2 * scale;
            ctx2.beginPath();
            ctx2.moveTo(bw * 0.72 * cosA, -bh * 0.1);
            var micTargetX = (bw * 0.35 * sinA) + 4 * scale;
            ctx2.quadraticCurveTo(micTargetX + 8 * scale, bh * 0.05, micTargetX, bh * 0.1);
            ctx2.stroke();

            ctx2.fillStyle = '#0f172a';
            ctx2.beginPath();
            ctx2.arc(micTargetX, bh * 0.1, 3.5 * scale, 0, Math.PI * 2);
            ctx2.fill();

            ctx2.fillStyle = '#22c55e';
            ctx2.beginPath();
            ctx2.arc(micTargetX + 1 * scale, bh * 0.1, 1.2 * scale, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.restore();
        }
        ctx2.restore();
    } else if (gear.head === 'cap_pfizer') {
        // Sporty Baseball Cap with 3D Directional Visor
        ctx2.save();
        ctx2.translate(headApexX, headApexY + 4 * scale);

        var domeGrad = ctx2.createLinearGradient(0, -12 * scale, 0, 0);
        domeGrad.addColorStop(0, '#0057cc');
        domeGrad.addColorStop(1, '#003893');
        ctx2.fillStyle = domeGrad;
        ctx2.strokeStyle = '#001a4d';
        ctx2.lineWidth = 1.6 * scale;

        ctx2.beginPath();
        ctx2.ellipse(0, -6 * scale, 19 * scale, 11 * scale, 0, Math.PI, 0, false);
        ctx2.closePath();
        ctx2.fill();
        ctx2.stroke();

        // Top button
        ctx2.fillStyle = '#ffffff';
        ctx2.beginPath();
        ctx2.arc(0, -16.5 * scale, 2.2 * scale, 0, Math.PI * 2);
        ctx2.fill();

        // Visor follows direction sinA when facing front/profile
        if (cosA >= -0.15) {
            var vAlpha = Math.min(1, Math.max(0, (cosA + 0.15) / 0.25));
            ctx2.save();
            ctx2.globalAlpha = vAlpha;
            ctx2.fillStyle = '#003893';
            ctx2.beginPath();
            ctx2.ellipse(sinA * 11 * scale, -1 * scale, 15 * scale, 4.5 * scale, sinA * 0.22, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.strokeStyle = '#001a4d';
            ctx2.lineWidth = 1.4 * scale;
            ctx2.stroke();

            ctx2.strokeStyle = '#ffffff';
            ctx2.lineWidth = 1.2 * scale;
            ctx2.beginPath();
            ctx2.arc(sinA * 11 * scale, 0, 14 * scale, 0.15 * Math.PI, 0.85 * Math.PI, false);
            ctx2.stroke();
            ctx2.restore();
        } else {
            // Back sizing strap arch cutout
            ctx2.fillStyle = darkColor;
            ctx2.beginPath();
            ctx2.arc(0, -2 * scale, 6 * scale, Math.PI, 0, false);
            ctx2.fill();
        }
        ctx2.restore();
    } else if (gear.head === 'detective_hat') {
        // Classic Felt Fedora
        ctx2.save();
        ctx2.translate(headApexX, headApexY - 2 * scale);

        var fedoraGrad = ctx2.createLinearGradient(0, -16 * scale, 0, 2 * scale);
        fedoraGrad.addColorStop(0, '#78350f');
        fedoraGrad.addColorStop(1, '#451a03');
        ctx2.fillStyle = fedoraGrad;
        ctx2.strokeStyle = '#290f02';
        ctx2.lineWidth = 1.6 * scale;

        ctx2.beginPath();
        ctx2.ellipse(0, 2 * scale, 25 * scale, 6.5 * scale, 0, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.stroke();

        ctx2.beginPath();
        ctx2.roundRect ? ctx2.roundRect(-12.5 * scale, -15 * scale, 25 * scale, 16 * scale, 5 * scale) : ctx2.rect(-12.5 * scale, -15 * scale, 25 * scale, 16 * scale);
        ctx2.fill();
        ctx2.stroke();

        ctx2.fillStyle = '#0f172a';
        ctx2.fillRect(-12.5 * scale, -3.5 * scale, 25 * scale, 4.5 * scale);
        ctx2.fillStyle = '#f59e0b';
        ctx2.fillRect(-2 * scale, -4 * scale, 4 * scale, 5.5 * scale);
        ctx2.restore();
    }

    // --- 10. FRONT ARM (Drawn over body and clothes) ---
    if (backArmIsLeft) {
        drawArm(rightSx, rightSy, rightHx, rightHy, rightZ, false);
    } else {
        drawArm(leftSx, leftSy, leftHx, leftHy, leftZ, true);
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

// ------------------- LIVES SYSTEM -------------------
var MAX_LIVES = 3;
var playerLives = MAX_LIVES;

function updateLivesDisplay() {
    var str = '';
    for (var i = 0; i < MAX_LIVES; i++) {
        str += (i < playerLives) ? '❤️' : '🤍';
    }
    var el = document.getElementById('hud-lives');
    if (el) el.textContent = str;
    var elModal = document.getElementById('feedback-lives-val');
    if (elModal) elModal.textContent = str;
}

// ------------------- CASES (10 CASOS DETALLADOS Y CHUSCOS) -------------------
var cases = [
    {
        name: 'Pilly',
        color: '#ff9ff3',
        dark: '#cc4499',
        symptoms: 'Dolor de estómago y ruidos de "cuak"',
        evidence: 'Radiografía torácica: Pato de goma amarillo atorado en el estómago.',
        approve: false,
        successTitle: '¡Pato de Goma Interceptado a Tiempo! 🦆',
        successStory: '¡Ojo clínico de águila! Rechazaste la solicitud de medicamento para gastritis porque el paciente se tragó un pato de hule. El cirujano extrajo el patito sin problemas, ahora es la mascota oficial de CARE Connect y te regalaron una dotación de galletas.',
        errorTitle: '¡Recetaste Antiácidos a un Pato de Hule! 🦆💥',
        errorExplanation: '¿Por qué te equivocaste? Según el protocolo médico de Pfizer CARE, un cuerpo extraño radio-opaco requiere extracción endoscópica urgente, ¡no un jarabe estomacal! Aprobaste la receta y Pilly ahora grazna cada vez que respira.',
        death: 'Aprobaste una radiografía con un pato de goma. ¡Pilly graznó tan fuerte que colapsó el sistema de audio del hospital!'
    },
    {
        name: 'Gloop',
        color: '#48dbfb',
        dark: '#00a8cc',
        symptoms: 'Fractura desplazada de antebrazo derecho tras jugar básquetbol',
        evidence: 'Estudio de rayos X con fractura diafisaria, receta de analgésicos e inmovilización con yeso firmada por traumatólogo certificado.',
        approve: true,
        successTitle: '¡Brazo Salvado con Eficiencia Olímpica! 🦴💪',
        successStory: '¡Dictamen impecable! Validaste la documentación completa, la firma colegiada y el criterio de inmovilización estándar. Gloop ya tiene su yeso autografiado con plumón azul por todo el equipo de dictaminadores de Pfizer.',
        errorTitle: '¡Dejaste a Gloop con el Brazo Chueco! 😱',
        errorExplanation: '¿Por qué te equivocaste? El caso cumplía con el 100% de los requisitos: evidencia radiológica verídica, diagnóstico claro y tratamiento conservador con analgesia. Rechazaste un caso de libro de texto y Gloop intentó levantar su queja con el brazo inmóvil.',
        death: 'Rechazaste un caso legítimo de fractura. ¡Gloop te demandó ante la comisión médica internacional!'
    },
    {
        name: 'Squish',
        color: '#feca57',
        dark: '#cc9900',
        symptoms: 'Insomnio crónico severo por ver series toda la noche',
        evidence: 'Receta casera: Infusión intravenosa de 50 litros de café expreso con caramelo al día.',
        approve: false,
        successTitle: '¡Frenaste una Bomba de Cafeína Supersónica! ☕⚡',
        successStory: '¡Excelente criterio de seguridad! Detectaste una dosis letal y absurda de cafeína intravenosa. Le sugeriste apagar el celular a las 10 PM y tomar té de manzanilla. Squish durmió 9 horas seguidas por primera vez en un año.',
        errorTitle: '¡Creaste una Gotita a la Velocidad de la Luz! ⚡🤯',
        errorExplanation: '¿Por qué te equivocaste? La farmacopea internacional prohíbe la administración de cafeína concentrada por vía venosa en dosis industriales. Squish vibró a 12,000 RPM, atravesó dos paredes de la oficina y alteró la señal de Wi-Fi de toda la ciudad.',
        death: 'Aprobaste 50 litros de café IV. ¡Squish rompió la barrera del sonido y desintegró la mesa de dictamen!'
    },
    {
        name: 'Capsule',
        color: '#1dd1a1',
        dark: '#009977',
        symptoms: 'Corte milimétrico superficial con hoja de papel en el pulgar',
        evidence: 'Solicitud quirúrgica: Amputación radical de brazo completo bajo anestesia general.',
        approve: false,
        successTitle: '¡Salvaste un Brazo de una Petición Ridícula! ✂️🛡️',
        successStory: '¡Sentido común legendario! Rechazaste una amputación innecesaria para un corte de 1 milímetro. La enfermera le puso un curita con dibujos de gotitas y Capsule volvió a teclear felizmente sin derramar una sola lágrima.',
        errorTitle: '¡Mandaste a Amputar por un Rasguño de Papel! 🩹😱',
        errorExplanation: '¿Por qué te equivocaste? Violaste el principio básico de proporcionalidad médica: un daño cutáneo menor jamás amerita intervención quirúrgica mutilante. ¡Capsule ahora tiene que aprender a escribir cartas con los dedos de los pies!',
        death: 'Aprobaste una amputación por una hoja de papel. ¡El comité de bioética te quitó la licencia al instante!'
    },
    {
        name: 'Plop',
        color: '#ff6b6b',
        dark: '#cc2222',
        symptoms: 'Fiebre de 38.8°C, congestión nasal y tos seca de 24 hrs de evolución',
        evidence: 'Prueba rápida de antígeno positiva para Influenza y prescripción de antiviral específico de dosis ajustada.',
        approve: true,
        successTitle: '¡Antiviral a Tiempo y Pandemia Evitada! 🧪🦠',
        successStory: '¡Dictamen brillante! La intervención temprana dentro de las primeras 48 horas de síntomas es la regla de oro para la efectividad antiviral. Plop ya no tiene fiebre y te mandó una foto descansando en cama con sopa de fideos.',
        errorTitle: '¡Negaste el Antiviral y Plop Inundó la Oficina! 🤧🌊',
        errorExplanation: '¿Por qué te equivocaste? La evidencia de prueba antigénica positiva combinada con sintomatología aguda es criterio obligatorio de aprobación para terapia antiviral. Plop estornudó con tanta fuerza que volaron 500 expedientes al techo.',
        death: 'Rechazaste medicamento para influenza comprobada. ¡El paciente estornudó una ola gigante sobre el servidor central!'
    },
    {
        name: 'Bloop',
        color: '#a29bfe',
        dark: '#6c5ce7',
        symptoms: 'Dolor de espalda baja tras levantar un garrafón de agua',
        evidence: 'Dictamen firmado con sello del "Dr. Pato Donald, Licenciado en Cua-Cua-terapia".',
        approve: false,
        successTitle: '¡Fraude de Dibujos Animados Descubierto! 🦆🔍',
        successStory: '¡Auditor estrella de CARE Connect! Notaste de inmediato que la cédula médica pertenecía a un personaje ficticio de historietas. El caso fue remitido al departamento legal y a Bloop le mandaron una cita con un fisioterapeuta de verdad.',
        errorTitle: '¡Aceptaste la Firma de un Personaje de Caricatura! 📜🦆',
        errorExplanation: '¿Por qué te equivocaste? Todo expediente médico debe contar con nombre, firma y número de cédula profesional verificable ante la autoridad sanitaria. Aprobaste un tratamiento avalado por plumas de pato y auditoría te puso en la lista negra.',
        death: 'Validaste un diagnóstico de un pato animado. ¡El seguro te despidió en vivo por televisión nacional!'
    },
    {
        name: 'Wibble',
        color: '#fd79a8',
        dark: '#d63031',
        symptoms: 'Presión arterial sistólica en 165/100 mmHg con cefalea occipital',
        evidence: 'Bitácora de monitoreo de presión arterial de 7 días y prescripción de antihipertensivo de primera línea.',
        approve: true,
        successTitle: '¡Presión Controlada y Corazón Protegido! ❤️🫀',
        successStory: '¡Magistral decisión clínica! Protegiste al paciente de un evento cerebrovascular o crisis hipertensiva aprobando su tratamiento de mantenimiento. Wibble tiene su presión en 120/80 y celebró con un licuado verde bajo en sodio.',
        errorTitle: '¡Rechazaste un Antihipertensivo Crítico! 📈💔',
        errorExplanation: '¿Por qué te equivocaste? Cifras tensionales mayores a 140/90 sostenidas con evidencia de monitoreo ambulatorio exigen cobertura inmediata para prevenir daño a órgano blanco. La presión de Wibble subió tanto que salió disparado por la ventana.',
        death: 'Rechazaste terapia antihipertensiva urgente. ¡Wibble explotó de tensión como globo en fiesta infantil!'
    },
    {
        name: 'Sparky',
        color: '#e056fd',
        dark: '#be2edd',
        symptoms: 'Molestia en una muela al comer helado de limón',
        evidence: 'Solicitud quirúrgica urgente de trasplante de corazón y riñón simultáneo.',
        approve: false,
        successTitle: '¡Evitaste el Mayor Despilfarro Quirúrgico! 🦷🚫',
        successStory: '¡Filtro de acero! Evitaste que a un paciente con caries le abrieran el pecho para cambiarle el motor. Con una cita de 20 minutos con el dentista y pasta dental para dientes sensibles, Sparky quedó como nuevo y la empresa ahorró 3 millones.',
        errorTitle: '¡Aprobaste un Trasplante Cardíaco por una Muela! 🦷🫀',
        errorExplanation: '¿Por qué te equivocaste? Incongruencia clínico-quirúrgica flagrante: el dolor dental no tiene ninguna correlación con patología cardiovascular terminal. ¡Casi le cambias los órganos vitales a alguien que solo comió helado muy rápido!',
        death: 'Aprobaste doble trasplante por una caries. ¡El hospital te confiscó la bata y el gafete!'
    },
    {
        name: 'Nubia',
        color: '#686de0',
        dark: '#4834d4',
        symptoms: 'Sibilancias respiratorias audibles y opresión en el pecho tras contacto con gatos',
        evidence: 'Espirometría con patrón obstructivo reversible y prescripción de inhalador con cámara espaciadora.',
        approve: true,
        successTitle: '¡Vías Aéreas Despejadas a la Perfección! 🌬️🐈',
        successStory: '¡Dictaminación impecable! Identificaste la crisis asmática desencadenada por alérgenos y autorizaste el broncodilatador con técnica inhalatoria correcta. Nubia ya respira con total claridad y acaricia gatos desde lejos.',
        errorTitle: '¡Dejaste a Nubia sin Inhalador para el Asma! 😮‍💨😾',
        errorExplanation: '¿Por qué te equivocaste? Las crisis de broncoespasmo requieren medicamento inhalado de acción rápida para evitar insuficiencia respiratoria severa. Nubia tuvo que inflar bolsas de papel durante toda la tarde.',
        death: 'Rechazaste un inhalador para el asma. ¡Nubia sopló tan desesperada que generó un huracán categoría 5!'
    },
    {
        name: 'Toby',
        color: '#ffbe76',
        dark: '#f0932b',
        symptoms: 'Ataque de hipo benigno de 20 minutos de duración',
        evidence: 'Solicitud médica de 6 meses de incapacidad pagada con estancia todo incluido en Cancún.',
        approve: false,
        successTitle: '¡Detector de Turistas Falsos al 100%! 🏖️🚫',
        successStory: '¡Auditoría de alta precisión! Identificaste un abuso evidente de la póliza de incapacidades. Le diste un vaso de agua fría, un susto amistoso y el hipo desapareció al instante sin gastar viáticos tropicales.',
        errorTitle: '¡Mandaste a Cancún a Alguien con Hipo! 🌴💸',
        errorExplanation: '¿Por qué te equivocaste? Una alteración diafragmática transitoria como el hipo no genera ninguna incapacidad laboral prolongada. ¡Toby ya estaba en la alberca con lentes de sol y coctel en mano con cargo a tu sueldo!',
        death: 'Aprobaste 6 meses de vacaciones pagadas por tener hipo. ¡Auditoría interna te embargó hasta los zapatos!'
    }
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

// ------------------- GEAR & CUSTOMIZATION CATALOG -------------------
var CHAR_DROPS = [
    { name: 'Gotita Azul',    color: '#48dbfb', dark: '#00a8cc' },
    { name: 'Gotita Dorada',  color: '#feca57', dark: '#cc9900' },
    { name: 'Gotita Rosa',    color: '#ff9ff3', dark: '#cc4499' },
    { name: 'Gotita Verde',   color: '#1dd1a1', dark: '#009977' }
];

var ITEMS_CATALOG = {
    head: [
        { id: 'none',          name: 'Ninguno',            icon: '❌', tier: '' },
        { id: 'doctor_cap',    name: 'Cofia Médica',       icon: '🩺', tier: 'Nvl. 3' },
        { id: 'grad_hat',      name: 'Birrete Académico',   icon: '🎓', tier: 'Nvl. 4' },
        { id: 'headset',       name: 'Headset CARE',       icon: '🎧', tier: 'Nvl. 2' },
        { id: 'detective_hat', name: 'Gorro Detective',    icon: '🕵️', tier: 'Nvl. 3' },
        { id: 'crown',         name: 'Corona de Élite',    icon: '👑', tier: 'Nvl. 5' },
        { id: 'cap_pfizer',    name: 'Gorra Pfizer',       icon: '🧢', tier: 'Nvl. 1' }
    ],
    body: [
        { id: 'none',          name: 'Sin Atuendo',        icon: '❌', tier: '' },
        { id: 'lab_coat',      name: 'Bata Laboratorio',   icon: '🥼', tier: 'Nvl. 4' },
        { id: 'formal_suit',   name: 'Traje Ejecutivo',    icon: '👔', tier: 'Nvl. 4' },
        { id: 'hero_cape',     name: 'Capa Protectora',    icon: '🦸', tier: 'Nvl. 5' },
        { id: 'pfizer_shirt',  name: 'Polo Pfizer CARE',   icon: '👕', tier: 'Nvl. 1' }
    ],
    accessory: [
        { id: 'none',          name: 'Ninguno',            icon: '❌', tier: '' },
        { id: 'glasses',       name: 'Gafas de Análisis',  icon: '👓', tier: 'Nvl. 2' },
        { id: 'stethoscope',   name: 'Estetoscopio',       icon: '🩺', tier: 'Nvl. 4' },
        { id: 'mask',          name: 'Cubrebocas Clínico', icon: '😷', tier: 'Nvl. 1' },
        { id: 'badge',         name: 'Credencial CARE',    icon: '🪪', tier: 'Nvl. 3' }
    ],
    shoes: [
        { id: 'default',       name: 'Pies Naturales',     icon: '❌', tier: '' },
        { id: 'formal_shoes',  name: 'Zapatos de Charol',  icon: '👞', tier: 'Nvl. 3' },
        { id: 'sneakers',      name: 'Tenis Deportivos',   icon: '👟', tier: 'Nvl. 2' },
        { id: 'boots',         name: 'Botas Quirúrgicas',  icon: '🥾', tier: 'Nvl. 4' }
    ]
};

// ------------------- CUSTOMIZER STATE -------------------
var customState = {
    charIdx: 0,
    name: 'Gotita Azul',
    title: '(Gran Dictaminador)',
    rotAngle: 0,
    rotSpeed: 0,
    isDragging: false,
    lastX: 0,
    lastInteraction: Date.now(),
    gear: { head: 'none', body: 'none', accessory: 'none', shoes: 'default' }
};

var customCanvas = document.getElementById('custom-canvas');
var customCtx = customCanvas ? customCanvas.getContext('2d') : null;

// Pedestal Ambient Orbs
var customOrbs = [];
for (var coi = 0; coi < 12; coi++) {
    customOrbs.push({
        angle: Math.random() * Math.PI * 2,
        dist: 90 + Math.random() * 80,
        y: (Math.random() - 0.5) * 60,
        spd: 0.01 + Math.random() * 0.02,
        r: 2 + Math.random() * 3.5,
        color: coi % 2 === 0 ? 'rgba(72, 219, 251, 0.7)' : 'rgba(254, 202, 87, 0.7)'
    });
}

// ------------------- DRAW PEDESTAL & 3D STAGE -------------------
function drawPedestal(cctx, cx, cy, t) {
    var pw = 145, ph = 38;

    // Glowing column light beam going upwards
    var beamGrad = cctx.createLinearGradient(cx, cy + 40, cx, cy - 220);
    beamGrad.addColorStop(0, 'rgba(72, 219, 251, 0.22)');
    beamGrad.addColorStop(0.5, 'rgba(0, 87, 204, 0.08)');
    beamGrad.addColorStop(1, 'transparent');
    cctx.fillStyle = beamGrad;
    cctx.beginPath();
    cctx.moveTo(cx - pw * 0.85, cy + 20);
    cctx.lineTo(cx - pw * 0.5, cy - 200);
    cctx.lineTo(cx + pw * 0.5, cy - 200);
    cctx.lineTo(cx + pw * 0.85, cy + 20);
    cctx.closePath();
    cctx.fill();

    // Pedestal bottom base shadow
    cctx.fillStyle = 'rgba(0, 5, 20, 0.8)';
    cctx.beginPath();
    cctx.ellipse(cx, cy + 30, pw * 1.05, ph * 1.05, 0, 0, Math.PI * 2);
    cctx.fill();

    // Pedestal Cylinder Wall
    var cylGrad = cctx.createLinearGradient(cx - pw, 0, cx + pw, 0);
    cylGrad.addColorStop(0, '#0c1b40');
    cylGrad.addColorStop(0.5, '#1e3c8a');
    cylGrad.addColorStop(1, '#0c1b40');
    cctx.fillStyle = cylGrad;
    cctx.beginPath();
    cctx.ellipse(cx, cy + 18, pw, ph, 0, 0, Math.PI, false);
    cctx.lineTo(cx - pw, cy);
    cctx.ellipse(cx, cy, pw, ph, 0, Math.PI, 0, true);
    cctx.closePath();
    cctx.fill();

    // Pedestal Wall edge lines
    cctx.strokeStyle = 'rgba(72, 219, 251, 0.35)';
    cctx.lineWidth = 1.5;
    cctx.stroke();

    // Top Platform Ring Surface
    var platGrad = cctx.createRadialGradient(cx, cy - 5, 10, cx, cy, pw);
    platGrad.addColorStop(0, '#2a4d9e');
    platGrad.addColorStop(0.7, '#152b66');
    platGrad.addColorStop(1, '#0a1638');
    cctx.fillStyle = platGrad;
    cctx.beginPath();
    cctx.ellipse(cx, cy, pw, ph, 0, 0, Math.PI * 2);
    cctx.fill();

    // Glowing Neon Rim
    var rimGlow = 1 + Math.sin(t * 3) * 0.08;
    cctx.strokeStyle = '#48dbfb';
    cctx.lineWidth = 3.5 * rimGlow;
    cctx.shadowColor = '#48dbfb';
    cctx.shadowBlur = 18;
    cctx.stroke();
    cctx.shadowBlur = 0;

    // Concentric Inner Tech Circles
    cctx.strokeStyle = 'rgba(72, 219, 251, 0.45)';
    cctx.lineWidth = 1.5;
    cctx.beginPath();
    cctx.ellipse(cx, cy, pw * 0.72, ph * 0.72, 0, 0, Math.PI * 2);
    cctx.stroke();

    cctx.strokeStyle = 'rgba(254, 202, 87, 0.55)';
    cctx.beginPath();
    cctx.ellipse(cx, cy, pw * 0.42, ph * 0.42, 0, 0, Math.PI * 2);
    cctx.stroke();

    // Floating Energy Orbs around pedestal
    for (var i = 0; i < customOrbs.length; i++) {
        var orb = customOrbs[i];
        orb.angle += orb.spd;
        var ox = cx + Math.cos(orb.angle) * orb.dist;
        var oz = Math.sin(orb.angle) * (orb.dist * 0.32);
        var oy = cy + orb.y + oz;

        cctx.save();
        cctx.fillStyle = orb.color;
        cctx.shadowColor = orb.color;
        cctx.shadowBlur = 10;
        cctx.beginPath();
        cctx.arc(ox, oy, orb.r, 0, Math.PI * 2);
        cctx.fill();
        cctx.restore();
    }
}

// ------------------- ANIMATE CUSTOMIZER -------------------
var customizerRunning = true;
function animateCustomizer() {
    if (!customCtx) return;
    requestAnimationFrame(animateCustomizer);
    if (gameState !== 'START') return;

    var cw = customCanvas.width;
    var ch = customCanvas.height;
    customCtx.clearRect(0, 0, cw, ch);

    var now = Date.now();
    var timeSec = now * 0.001;

    // Handle rotation physics & inertia
    if (!customState.isDragging) {
        customState.rotSpeed *= 0.93;
        customState.rotAngle += customState.rotSpeed;

        // Auto-idle rotation after 2.5s of inactivity
        if (now - customState.lastInteraction > 2500 && Math.abs(customState.rotSpeed) < 0.001) {
            customState.rotAngle += 0.006;
        }
    }

    var pedX = cw / 2;
    var pedY = ch * 0.76;

    // Draw glowing platform
    drawPedestal(customCtx, pedX, pedY, timeSec);

    // Draw Character on Platform
    var drop = CHAR_DROPS[customState.charIdx];
    var charY = pedY - 45;
    drawChar(
        customCtx,
        pedX,
        charY,
        drop.color,
        drop.dark,
        'happy',
        now * 0.04,
        2.1,
        true,
        customState.rotAngle,
        customState.gear
    );
}
requestAnimationFrame(animateCustomizer);

// ------------------- ROTATION TOUCH / MOUSE DRAG -------------------
var stageWrapper = document.getElementById('canvas-3d-wrapper');
if (stageWrapper) {
    function onPointerDown(e) {
        customState.isDragging = true;
        customState.lastX = e.clientX;
        customState.lastInteraction = Date.now();
        customState.rotSpeed = 0;
        if (stageWrapper.setPointerCapture) {
            try { stageWrapper.setPointerCapture(e.pointerId); } catch(err){}
        }
    }
    function onPointerMove(e) {
        if (!customState.isDragging) return;
        var dx = e.clientX - customState.lastX;
        customState.rotSpeed = dx * 0.015;
        customState.rotAngle += customState.rotSpeed;
        customState.lastX = e.clientX;
        customState.lastInteraction = Date.now();
    }
    function onPointerUp(e) {
        customState.isDragging = false;
        customState.lastInteraction = Date.now();
        if (stageWrapper.releasePointerCapture) {
            try { stageWrapper.releasePointerCapture(e.pointerId); } catch(err){}
        }
    }

    stageWrapper.addEventListener('pointerdown', onPointerDown);
    stageWrapper.addEventListener('pointermove', onPointerMove);
    stageWrapper.addEventListener('pointerup', onPointerUp);
    stageWrapper.addEventListener('pointercancel', onPointerUp);
}

// ------------------- UPDATE CUSTOMIZER UI -------------------
function updateCustomizerUI() {
    var drop = CHAR_DROPS[customState.charIdx];

    // Base name label
    var baseNameEl = document.getElementById('name-base');
    if (baseNameEl) baseNameEl.textContent = drop.name;

    // Slot labels & icons
    ['head', 'body', 'accessory', 'shoes'].forEach(function(cat) {
        var curId = customState.gear[cat];
        var itemDef = ITEMS_CATALOG[cat].find(function(it){ return it.id === curId; }) || ITEMS_CATALOG[cat][0];
        var iconEl = document.getElementById('icon-' + cat);
        var nameEl = document.getElementById('name-' + cat);
        var tierEl = document.getElementById('tier-' + cat);
        var slotCard = document.getElementById('slot-' + cat);

        if (iconEl) iconEl.textContent = curId === 'none' || curId === 'default' ? '+' : itemDef.icon;
        if (nameEl) nameEl.textContent = itemDef.name;
        if (tierEl) tierEl.textContent = itemDef.tier || 'Nvl. 1';
        if (slotCard) {
            if (curId !== 'none' && curId !== 'default') slotCard.classList.add('equipped');
            else slotCard.classList.remove('equipped');
        }
    });

    // Update stats dynamically based on gear
    var powerBase = 110 + (customState.gear.head !== 'none' ? 8 : 0) +
                          (customState.gear.body !== 'none' ? 12 : 0) +
                          (customState.gear.accessory !== 'none' ? 6 : 0) +
                          (customState.gear.shoes !== 'default' ? 5 : 0);
    var powerEl = document.getElementById('stat-power');
    if (powerEl) powerEl.textContent = powerBase.toFixed(2) + 'K';
}

// ------------------- CHARACTER NAVIGATION (< and >) -------------------
function setCharacter(idx) {
    var oldName = CHAR_DROPS[customState.charIdx].name;
    var nameInput = document.getElementById('custom-name-input');
    customState.charIdx = (idx + CHAR_DROPS.length) % CHAR_DROPS.length;
    var newDrop = CHAR_DROPS[customState.charIdx];

    // If user hasn't edited the name to something custom, update with new droplet name
    if (nameInput && (nameInput.value === oldName || nameInput.value === '')) {
        nameInput.value = newDrop.name;
        customState.name = newDrop.name;
    }
    updateCustomizerUI();
}

var btnPrev = document.getElementById('btn-prev-char');
if (btnPrev) btnPrev.addEventListener('click', function() { setCharacter(customState.charIdx - 1); });

var btnNext = document.getElementById('btn-next-char');
if (btnNext) btnNext.addEventListener('click', function() { setCharacter(customState.charIdx + 1); });

// Base slot click advances character
var slotBase = document.getElementById('slot-base');
if (slotBase) slotBase.addEventListener('click', function() { setCharacter(customState.charIdx + 1); });

// Name input
var nameInput = document.getElementById('custom-name-input');
if (nameInput) {
    nameInput.addEventListener('input', function() {
        customState.name = nameInput.value.trim() || CHAR_DROPS[customState.charIdx].name;
    });
}
var editNameBtn = document.getElementById('btn-edit-name');
if (editNameBtn && nameInput) {
    editNameBtn.addEventListener('click', function() { nameInput.focus(); nameInput.select(); });
}

// ------------------- GEAR PICKER MODAL -------------------
var pickerModal = document.getElementById('item-picker-modal');
var pickerTitle = document.getElementById('picker-title');
var pickerGrid = document.getElementById('picker-grid');
var pickerClose = document.getElementById('btn-picker-close');
var pickerBackdrop = document.getElementById('picker-backdrop');
var currentPickerCategory = null;

function openItemPicker(category) {
    if (!ITEMS_CATALOG[category]) return;
    currentPickerCategory = category;

    var titles = {
        head: 'Equipar Cabeza',
        body: 'Equipar Atuendo',
        accessory: 'Equipar Accesorio',
        shoes: 'Equipar Calzado'
    };
    if (pickerTitle) pickerTitle.textContent = titles[category] || 'Equipar';

    if (pickerGrid) {
        pickerGrid.innerHTML = '';
        var items = ITEMS_CATALOG[category];
        items.forEach(function(item) {
            var card = document.createElement('div');
            card.className = 'picker-item' + (customState.gear[category] === item.id ? ' active' : '');
            card.innerHTML =
                '<div class="picker-item-tier">' + (item.tier || '') + '</div>' +
                '<div class="picker-item-icon">' + item.icon + '</div>' +
                '<div class="picker-item-name">' + item.name + '</div>';

            card.addEventListener('click', function() {
                customState.gear[category] = item.id;
                updateCustomizerUI();
                closeItemPicker();
            });
            pickerGrid.appendChild(card);
        });
    }

    if (pickerModal) pickerModal.classList.remove('hidden');
}

function closeItemPicker() {
    if (pickerModal) pickerModal.classList.add('hidden');
    currentPickerCategory = null;
}

if (pickerClose) pickerClose.addEventListener('click', closeItemPicker);
if (pickerBackdrop) pickerBackdrop.addEventListener('click', closeItemPicker);

['head', 'body', 'accessory', 'shoes'].forEach(function(cat) {
    var slot = document.getElementById('slot-' + cat);
    if (slot) {
        slot.addEventListener('click', function() { openItemPicker(cat); });
    }
});

// ------------------- AUTOEQUIP & UNEQUIP BUTTONS -------------------
var btnAuto = document.getElementById('btn-autoequip');
if (btnAuto) {
    btnAuto.addEventListener('click', function() {
        var hItems = ITEMS_CATALOG.head.filter(function(i){ return i.id !== 'none'; });
        var bItems = ITEMS_CATALOG.body.filter(function(i){ return i.id !== 'none'; });
        var aItems = ITEMS_CATALOG.accessory.filter(function(i){ return i.id !== 'none'; });
        var sItems = ITEMS_CATALOG.shoes.filter(function(i){ return i.id !== 'default'; });

        customState.gear.head      = hItems[Math.floor(Math.random() * hItems.length)].id;
        customState.gear.body      = bItems[Math.floor(Math.random() * bItems.length)].id;
        customState.gear.accessory = aItems[Math.floor(Math.random() * aItems.length)].id;
        customState.gear.shoes     = sItems[Math.floor(Math.random() * sItems.length)].id;
        updateCustomizerUI();
    });
}

var btnUnequip = document.getElementById('btn-unequip');
if (btnUnequip) {
    btnUnequip.addEventListener('click', function() {
        customState.gear = { head: 'none', body: 'none', accessory: 'none', shoes: 'default' };
        updateCustomizerUI();
    });
}

updateCustomizerUI();

// ------------------- START GAME WITH CUSTOM DROPLET -------------------
document.getElementById('btn-start').addEventListener('click', function() {
    var drop = CHAR_DROPS[customState.charIdx];
    playerColor = drop.color;
    playerDark  = drop.dark;
    player.name = (nameInput && nameInput.value.trim()) || drop.name;
    player.title = 'Gran Dictaminador';
    player.gear = Object.assign({}, customState.gear);

    // Update HUD
    var hudName = document.getElementById('hud-player-name');
    if (hudName) hudName.textContent = player.name;

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

    // Reset lives
    playerLives = MAX_LIVES;
    updateLivesDisplay();

    // Init maze now that W/H are known
    initOfficeMaze();

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

        var isMoving = (dx !== 0 || dy !== 0);

        if (isMoving) {
            if (dx < 0) player.flipped = true;
            if (dx > 0) player.flipped = false;
            player.walkCycle += 1.4;

            var r = 20; // collision radius

            // Try X axis
            var nx = player.x + dx;
            var ny = player.y;
            nx = Math.max(30, Math.min(W - 30, nx));
            ny = Math.max(H*0.52 + 20, Math.min(H - 20, ny));
            if (!checkMazeCollision(nx, ny, r)) {
                player.x = nx;
            }

            // Try Y axis
            nx = player.x;
            ny = player.y + dy;
            nx = Math.max(30, Math.min(W - 30, nx));
            ny = Math.max(H*0.52 + 20, Math.min(H - 20, ny));
            if (!checkMazeCollision(nx, ny, r)) {
                player.y = ny;
            }

            spawnDustParticles(player.x, player.y + 30);
        } else {
            // Idle breathing and gentle sway
            player.walkCycle += 0.22;
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

        // ── SMOOTH GAZE & LEAN PHYSICS ──
        var targetGazeDx = 0;
        var targetGazeDy = 0;

        if (isMoving) {
            targetGazeDx = dx * 1.5;
            targetGazeDy = dy * 1.5;
        } else {
            // Natural idle eye look-around (alive, never completely still)
            var idleT = Date.now() * 0.0018;
            targetGazeDx = Math.sin(idleT) * 1.8;
            targetGazeDy = Math.cos(idleT * 0.6) * 1.0;
        }

        var gazeLerp = isMoving ? 0.22 : 0.08;
        player.gazeDx += (targetGazeDx - player.gazeDx) * gazeLerp;
        player.gazeDy += (targetGazeDy - player.gazeDy) * gazeLerp;

        // Lean angle: tilt toward horizontal movement direction + natural waddle cadence
        var waddle = isMoving ? Math.sin(player.walkCycle * 0.30) * 0.16 : Math.sin(Date.now() * 0.002) * 0.03;
        var targetLean = (dx / player.speed) * 0.14 + waddle;
        player.leanAngle += (targetLean - player.leanAngle) * 0.18;

        drawEnvironment();
        updateMazeObstacles(); // animate obstacle movement
        drawOfficeMaze();
        drawPortals();
        drawDesk(dp.x, dp.y);
        updateParticles();
        drawParticles();

        // Draw player (with flip & gear, gaze, lean)
        ctx.save();
        var walkAngle = player.flipped ? -0.28 : 0.28;
        // When flipped, mirror gaze X for canvas flip
        var gdx = player.flipped ? -player.gazeDx : player.gazeDx;
        var gdy = player.gazeDy;
        var lean = player.flipped ? -player.leanAngle : player.leanAngle;

        if (player.flipped) {
            ctx.translate(player.x * 2, 0);
            ctx.scale(-1, 1);
            drawChar(ctx, player.x, player.y, playerColor, playerDark, player.expression, player.walkCycle, 1.4, true, walkAngle, player.gear, gdx, gdy, lean);
        } else {
            drawChar(ctx, player.x, player.y, playerColor, playerDark, player.expression, player.walkCycle, 1.4, true, walkAngle, player.gear, gdx, gdy, lean);
        }
        ctx.restore();

        // Draw Player Floating Name Tag
        ctx.save();
        ctx.font = 'bold 12px Nunito, sans-serif';
        ctx.textAlign = 'center';
        var nameText = player.name || 'Gotita';
        var nw = ctx.measureText(nameText).width + 16;
        var tagY = player.y - 52;

        ctx.fillStyle = 'rgba(0, 20, 50, 0.75)';
        ctx.strokeStyle = 'rgba(72, 219, 251, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        roundRect(player.x - nw/2, tagY - 14, nw, 20, 10, true);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(nameText, player.x, tagY);
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
    for (var i = 0; i < mazeObstacles.length; i++) {
        mazeObstacles[i].angle = mazeObstacles[i].phase || 0;
    }
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
    if (!currentCase || gameState === 'FEEDBACK') return;
    gameState = 'FEEDBACK';
    clearInterval(timerInt);
    document.getElementById('hud-timer').textContent = '--';
    document.getElementById('timer-box').classList.remove('urgent');

    var wasCorrect = (isApprove === currentCase.approve);
    var caseSnap = currentCase;
    currentCase = null;

    if (wasCorrect) {
        score++;
        document.getElementById('hud-score').textContent = score;
        spawnParticle(player.x, player.y, isApprove ? '#22cc66' : '#ff4444');
        spawnParticle(player.x, player.y, '#feca57');
        player.expression = 'happy';
        showFeedbackModal(true, caseSnap, isApprove);
    } else {
        playerLives--;
        updateLivesDisplay();
        player.expression = 'sad';
        if (playerLives <= 0) {
            showFeedbackModal(false, caseSnap, isApprove, true);
        } else {
            showFeedbackModal(false, caseSnap, isApprove, false);
        }
    }
}

// ------------------- FEEDBACK MODAL -------------------
function showFeedbackModal(isSuccess, caseData, isApprove, isGameOver) {
    var card   = document.getElementById('feedback-card');
    var badge  = document.getElementById('feedback-badge');
    var title  = document.getElementById('feedback-title');
    var patEl  = document.getElementById('feedback-patient');
    var expHdr = document.getElementById('feedback-exp-header');
    var expTxt = document.getElementById('feedback-exp-text');
    var livRow = document.getElementById('feedback-lives-row');
    var btn    = document.getElementById('btn-feedback-action');

    // Reset classes
    card.classList.remove('success', 'error');

    if (isSuccess) {
        card.classList.add('success');
        badge.textContent  = '🏆 ¡DICTAMEN CORRECTO!';
        title.textContent  = caseData.successTitle || '¡Excelente trabajo!';
        expHdr.textContent = '🎯 ¿POR QUÉ LO LOGRASTE?';
        expTxt.textContent = caseData.successStory || 'Tomaste la decisión correcta.';
        livRow.style.display = 'none';
        btn.textContent = '¡Siguiente Expediente! 📋';
    } else {
        card.classList.add('error');
        badge.textContent  = '❌ ¡DICTAMEN INCORRECTO!';
        title.textContent  = caseData.errorTitle || '¡Ay, te equivocaste!';
        expHdr.textContent = '🔍 ¿QUÉ FALLÓ?';
        expTxt.textContent = caseData.errorExplanation || caseData.death;
        livRow.style.display = 'flex';
        updateLivesDisplay();
        if (isGameOver) {
            btn.textContent = '💀 Ver Resultados Finales';
        } else {
            var livStr = playerLives === 1 ? '1 vida ❤️' : playerLives + ' vidas ❤️';
            btn.textContent = '¡Continuar! Te quedan ' + livStr;
        }
    }

    patEl.textContent = 'Paciente: ' + caseData.name;

    // Render gotita in feedback canvas
    var fc = document.getElementById('feedback-char-canvas');
    var fc2 = fc.getContext('2d');
    fc2.clearRect(0, 0, fc.width, fc.height);
    drawChar(fc2, fc.width/2, fc.height * 0.82,
        playerColor, playerDark,
        isSuccess ? 'happy' : 'sad',
        isSuccess ? (Date.now() * 0.04) : 0,
        1.3, false, isSuccess ? 0.3 : 0, player.gear);

    // Store state for button handler
    document.getElementById('modal-feedback')._pendingGameOver = isGameOver;
    document.getElementById('modal-feedback')._wasSuccess = isSuccess;

    document.getElementById('modal-feedback').classList.remove('hidden');
}

// Feedback button action
document.getElementById('btn-feedback-action').addEventListener('click', function() {
    var modal = document.getElementById('modal-feedback');
    var isGameOver = modal._pendingGameOver;
    modal.classList.add('hidden');

    if (isGameOver) {
        triggerGameOver('¡Se te agotaron todas las vidas! El expediente quedó sin dictaminar... y con el café ya frío.');
    } else {
        player.expression = 'happy';
        gameState = 'EXPLORING';
        targetPos = null;
    }
});

// ------------------- MAZE OBSTACLES (DYNAMIC MOVING FURNITURE) -------------------
var mazeObstacles = [];
var mazeTimer = 0;

function initOfficeMaze() {
    mazeObstacles = [];
    var fY = H * 0.52 + 8; // floor start Y
    var fH = (H - 25) - fY; // floor playable height

    // Helper to add an obstacle with vertical movement
    // type: 'mampara' | 'archivador' | 'workstation' | 'garrafon' | 'coffee' | 'boxes' | 'plant'
    function obs(x, baseY, w, h, moveRange, speed, phase, type) {
        mazeObstacles.push({
            x: x,
            y: baseY,
            baseY: baseY,
            w: w,
            h: h,
            moveRange: moveRange || 0,
            speed: speed || 0.03,
            phase: phase || 0,
            type: type || 'boxes'
        });
    }

    // === 1. GATES (MAMPARAS QUE SE MUEVEN RÁPIDO ARRIBA Y ABAJO CERRANDO EL PASO) ===
    // Mampara izquierda: sube y baja rápido cerrando el corredor hacia RECHAZAR
    var mamparaH = Math.min(130, fH * 0.46);
    obs(W * 0.20, fY + fH * 0.38, 22, mamparaH, fH * 0.23, 0.048, 0, 'mampara');

    // Mampara derecha: sube y baja con fase contraria cerrando el corredor hacia APROBAR
    obs(W * 0.80 - 22, fY + fH * 0.38, 22, mamparaH, fH * 0.23, 0.048, Math.PI, 'mampara');

    // === 2. WORKSTATIONS RODANTES (ESCRITORIOS CON MONITORES QUE OSCILAN RÁPIDO) ===
    var deskW = Math.min(105, W * 0.12);
    // Workstation izquierda
    obs(W * 0.32, fY + fH * 0.44, deskW, 55, fH * 0.20, 0.054, 1.3, 'workstation');
    // Workstation derecha
    obs(W * 0.68 - deskW, fY + fH * 0.44, deskW, 55, fH * 0.20, 0.054, 1.3 + Math.PI, 'workstation');

    // === 3. ARCHIVADORES METÁLICOS RODANTES RÁPIDOS ===
    // Archivador exterior izquierdo
    obs(W * 0.10, fY + fH * 0.56, 55, 68, fH * 0.22, 0.058, 2.5, 'archivador');
    // Archivador exterior derecho
    obs(W * 0.90 - 55, fY + fH * 0.56, 55, 68, fH * 0.22, 0.058, 2.5 + Math.PI, 'archivador');

    // === 4. CENTRO CERCA DEL ESCRITORIO (GARRAFÓN Y MESA DE CAFÉ) ===
    // Garrafón de agua (sube y baja dinámicamente)
    obs(W * 0.45 - 38, fY + fH * 0.72, 36, 58, fH * 0.16, 0.062, 0.6, 'garrafon');
    // Mesa de break / café y donuts
    obs(W * 0.55 + 2, fY + fH * 0.72, 68, 44, fH * 0.16, 0.062, 0.6 + Math.PI, 'coffee');

    // === 5. PILAS DE CAJAS DE AUDITORÍA ===
    obs(W * 0.38, fY + fH * 0.20, 56, 48, fH * 0.15, 0.050, 3.2, 'boxes');
    obs(W * 0.62 - 56, fY + fH * 0.20, 56, 48, fH * 0.15, 0.050, 3.2 + Math.PI, 'boxes');

    // === 6. PLANTA DE ADORNO (CENTRO SUPERIOR) ===
    obs(W * 0.5 - 17, fY + 25, 34, 34, 0, 0, 0, 'plant');
}

function updateMazeObstacles() {
    var r = 20;
    var fY = H * 0.52 + 8;

    // Los muebles se mueven activamente a buen ritmo cuando el jugador toma el expediente
    if (gameState === 'DECIDING') {
        for (var i = 0; i < mazeObstacles.length; i++) {
            var ob = mazeObstacles[i];
            if (ob.moveRange > 0) {
                if (ob.angle === undefined) ob.angle = ob.phase || 0;
                ob.angle += ob.speed;
                var oldY = ob.y;
                ob.y = ob.baseY + Math.sin(ob.angle) * ob.moveRange;
                var deltaY = ob.y - oldY;

                // Si el obstáculo empuja al jugador, desplazarlo suavemente
                if (player.x > ob.x - r && player.x < ob.x + ob.w + r &&
                    player.y > ob.y - r && player.y < ob.y + ob.h + r) {
                    player.y += deltaY;
                    player.y = Math.max(fY + 20, Math.min(H - 20, player.y));
                }
            }
        }
    } else {
        // En modo exploración o lectura, los muebles regresan a su posición base y se quedan quietos
        for (var j = 0; j < mazeObstacles.length; j++) {
            var ob2 = mazeObstacles[j];
            ob2.angle = ob2.phase || 0;
            if (Math.abs(ob2.y - ob2.baseY) > 0.5) {
                ob2.y += (ob2.baseY - ob2.y) * 0.15;
            } else {
                ob2.y = ob2.baseY;
            }
        }
    }
}

function drawOfficeMaze() {
    // Dibujado limpio de muebles (sin líneas que los crucen)
    mazeObstacles.forEach(function(ob) {
        var cx = ob.x + ob.w / 2;
        var type = ob.type;

        if (type === 'mampara') {
            drawMampara(ob.x, ob.y, ob.w, ob.h);
        } else if (type === 'archivador') {
            drawArchivador(ob.x, ob.y, ob.w, ob.h);
        } else if (type === 'workstation') {
            drawWorkstation(ob.x, ob.y, ob.w, ob.h);
        } else if (type === 'garrafon') {
            drawGarrafon(ob.x, ob.y, ob.w, ob.h);
        } else if (type === 'coffee') {
            drawCoffeeTable(ob.x, ob.y, ob.w, ob.h);
        } else if (type === 'plant') {
            drawPlantSmall(cx, ob.y + ob.h);
        } else {
            drawArchiveBoxes(ob.x, ob.y, ob.w, ob.h);
        }

        // Ruedas de oficina en la base si es un mueble móvil
        if (ob.moveRange > 0 && type !== 'plant') {
            drawFurnitureWheels(ob.x, ob.y + ob.h, ob.w);
        }
    });
}

function drawFurnitureWheels(x, y, w) {
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    // Rueda izquierda
    ctx.beginPath();
    ctx.arc(x + 6, y + 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Rueda derecha
    ctx.beginPath();
    ctx.arc(x + w - 6, y + 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawMampara(x, y, w, h) {
    // 3D cubicle panel
    // Side face
    ctx.fillStyle = '#2a3d6b';
    ctx.fillRect(x + w, y + 6, 8, h);
    // Front face
    var mg = ctx.createLinearGradient(x, y, x + w, y);
    mg.addColorStop(0, '#3a5faa');
    mg.addColorStop(0.5, '#4a74c0');
    mg.addColorStop(1, '#2c4890');
    ctx.fillStyle = mg;
    ctx.fillRect(x, y, w, h);
    // Glass panel strip
    ctx.fillStyle = 'rgba(100,180,255,0.25)';
    ctx.fillRect(x + 3, y + 15, w - 6, h * 0.4);
    // Top cap
    ctx.fillStyle = '#c8aa50';
    ctx.fillRect(x - 2, y - 4, w + 4, 6);
    // Bottom baseboard
    ctx.fillStyle = '#1a2a4a';
    ctx.fillRect(x, y + h - 5, w, 5);
}

function drawArchivador(x, y, w, h) {
    // Cabinet shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 6, y + h, w, 8);
    // Side face
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(x + w, y + 5, 8, h);
    // Front face
    var ag = ctx.createLinearGradient(x, y, x + w, y);
    ag.addColorStop(0, '#718096');
    ag.addColorStop(0.4, '#a0aec0');
    ag.addColorStop(1, '#4a5568');
    ctx.fillStyle = ag;
    ctx.fillRect(x, y, w, h);
    // Drawers (3)
    var dh = (h - 10) / 3;
    for (var di = 0; di < 3; di++) {
        var dy = y + 5 + di * dh;
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 4, dy + 2, w - 8, dh - 4);
        // Handle
        ctx.fillStyle = '#c8aa50';
        ctx.fillRect(x + w/2 - 8, dy + dh/2 - 2, 16, 4);
    }
    // Label on top
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.font = '7px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ARCHIVOS', x + w/2, y + 6);
    ctx.restore();
}

function drawWorkstation(x, y, w, h) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + 5, y + h, w, 10);
    // Desk side
    ctx.fillStyle = '#5a3e00';
    ctx.fillRect(x + 5, y + h, w, 8);
    // Desk surface
    var wg = ctx.createLinearGradient(x, y, x, y + h);
    wg.addColorStop(0, '#c8922a');
    wg.addColorStop(0.3, '#a07020');
    wg.addColorStop(1, '#7a5010');
    ctx.fillStyle = wg;
    ctx.fillRect(x, y, w, h);
    // Monitor (dual)
    var monW = 30, monH = 24;
    // Left monitor
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(x + 8, y - monH - 5, monW, monH);
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(x + 10, y - monH - 3, monW - 4, monH - 6);
    // Screen glow
    var sg = ctx.createRadialGradient(x + 24, y - monH + 4, 2, x + 24, y - monH + 4, 12);
    sg.addColorStop(0, 'rgba(72,219,251,0.4)');
    sg.addColorStop(1, 'transparent');
    ctx.fillStyle = sg;
    ctx.fillRect(x + 10, y - monH - 3, monW - 4, monH - 6);
    // Right monitor
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(x + w - monW - 8, y - monH - 5, monW, monH);
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(x + w - monW - 6, y - monH - 3, monW - 4, monH - 6);
    var sg2 = ctx.createRadialGradient(x + w - 24, y - monH + 4, 2, x + w - 24, y - monH + 4, 12);
    sg2.addColorStop(0, 'rgba(254,202,87,0.35)');
    sg2.addColorStop(1, 'transparent');
    ctx.fillStyle = sg2;
    ctx.fillRect(x + w - monW - 6, y - monH - 3, monW - 4, monH - 6);
    // Keyboard
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(x + w/2 - 22, y + 8, 44, 12);
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(x + w/2 - 20, y + 10, 40, 8);
    // Coffee mug
    ctx.fillStyle = '#e53e3e';
    ctx.beginPath();
    ctx.arc(x + w - 12, y + 12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 6px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('☕', x + w - 12, y + 15);
}

function drawGarrafon(x, y, w, h) {
    // Stand
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(x + 4, y + h - 15, w - 8, 15);
    // Bottle body
    var bg = ctx.createLinearGradient(x, y, x + w, y);
    bg.addColorStop(0, 'rgba(100,200,255,0.6)');
    bg.addColorStop(0.4, 'rgba(180,230,255,0.85)');
    bg.addColorStop(1, 'rgba(50,150,200,0.5)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(x + w/2, y + h/2 - 10, w/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,180,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Neck
    ctx.fillStyle = 'rgba(130,210,255,0.7)';
    ctx.fillRect(x + w/2 - 5, y, 10, 18);
    // Cap
    ctx.fillStyle = '#3182ce';
    ctx.fillRect(x + w/2 - 6, y - 5, 12, 8);
    // Bubbles
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(x + w/2 - 4, y + h/2 - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w/2 + 5, y + h/2 + 2, 2, 0, Math.PI * 2);
    ctx.fill();
    // Label
    ctx.save();
    ctx.fillStyle = '#1a5276';
    ctx.font = 'bold 7px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💧AGUA', x + w/2, y + h/2 + 8);
    ctx.restore();
}

function drawCoffeeTable(x, y, w, h) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + 4, y + h, w, 6);
    // Side
    ctx.fillStyle = '#7b341e';
    ctx.fillRect(x + 4, y + h, w, 6);
    // Top
    var tg = ctx.createLinearGradient(x, y, x, y + h);
    tg.addColorStop(0, '#e67e22');
    tg.addColorStop(1, '#d35400');
    ctx.fillStyle = tg;
    ctx.fillRect(x, y, w, h);
    // Donuts plate
    ctx.fillStyle = '#f6e05e';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.3, y + h * 0.45, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Donuts
    var dColors = ['#fc8181','#68d391'];
    for (var di = 0; di < 2; di++) {
        ctx.fillStyle = dColors[di];
        ctx.beginPath();
        ctx.arc(x + 12 + di * 14, y + h * 0.38, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2d3748';
        ctx.beginPath();
        ctx.arc(x + 12 + di * 14, y + h * 0.38, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    // Coffee machine
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(x + w - 22, y + 4, 20, h - 8);
    ctx.fillStyle = '#e53e3e';
    ctx.fillRect(x + w - 20, y + 6, 16, 10);
    ctx.fillStyle = '#1a202c';
    ctx.beginPath();
    ctx.arc(x + w - 12, y + h - 10, 5, 0, Math.PI * 2);
    ctx.fill();
    // Label
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 6px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('☕ BREAK', x + w/2, y - 4);
    ctx.restore();
}

function drawArchiveBoxes(x, y, w, h) {
    // Stack of 2 boxes
    var colors = ['#c69c6d', '#b8864e'];
    for (var bi = 1; bi >= 0; bi--) {
        var by = y + bi * (h * 0.5);
        var bh = h * 0.5;
        // Shadow
        if (bi === 1) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(x + 4, by + bh, w, 6);
        }
        // Box side
        ctx.fillStyle = bi === 0 ? '#8b6914' : '#7a5c10';
        ctx.fillRect(x + w, by + 4, 6, bh);
        // Box face
        var bg = ctx.createLinearGradient(x, by, x + w, by);
        bg.addColorStop(0, colors[bi]);
        bg.addColorStop(1, bi === 0 ? '#a07840' : '#8b6228');
        ctx.fillStyle = bg;
        ctx.fillRect(x, by, w, bh);
        // Box outline
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, by, w, bh);
        // Label tape
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillRect(x + 5, by + bh * 0.25, w - 10, bh * 0.35);
        // Label text
        ctx.save();
        ctx.fillStyle = '#2d3748';
        ctx.font = 'bold 6px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bi === 0 ? 'AUDITORIA' : '2026', x + w/2, by + bh * 0.47);
        ctx.restore();
    }
}

function drawPlantSmall(cx, floorY) {
    // Small pot
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(cx - 10, floorY - 18, 20, 18);
    // Soil
    ctx.fillStyle = '#3d1e05';
    ctx.beginPath();
    ctx.ellipse(cx, floorY - 18, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Leaves
    var leafC = ['#2ecc71', '#27ae60', '#1dd1a1'];
    var lf = [{dx:-12,dy:-30,r:-0.4},{dx:12,dy:-30,r:0.4},{dx:0,dy:-42,r:0}];
    for (var li = 0; li < lf.length; li++) {
        ctx.save();
        ctx.translate(cx + lf[li].dx, floorY + lf[li].dy);
        ctx.rotate(lf[li].r + Math.sin(ambientT + li) * 0.06);
        ctx.fillStyle = leafC[li];
        ctx.beginPath();
        ctx.ellipse(0, -10, 8, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Maze collision (axis-separated for smooth sliding)
function checkMazeCollision(px, py, radius) {
    for (var i = 0; i < mazeObstacles.length; i++) {
        var ob = mazeObstacles[i];
        // Expand obstacle by radius for circle-rect collision
        var left   = ob.x - radius;
        var right  = ob.x + ob.w + radius;
        var top    = ob.y - radius;
        var bottom = ob.y + ob.h + radius;
        if (px > left && px < right && py > top && py < bottom) {
            return true;
        }
    }
    return false;
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
    drawChar(gc2, gc.width/2, gc.height*0.78, playerColor, playerDark, 'sad', 0, 1.2, false, 0, player.gear);

    document.getElementById('hud').classList.add('hidden');
    document.getElementById('screen-gameover').classList.remove('hidden');
    canvas.style.display = 'none';
}

// Init
resizeCanvas();
