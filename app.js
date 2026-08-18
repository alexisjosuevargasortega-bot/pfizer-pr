// =======================
// CASOS DEL JUEGO
// =======================
const cases = [
    {
        name: "Pilly",
        symptoms: "Dolor de cabeza ocasional",
        evidence: "Radiografía: Pato de goma en el estómago",
        isCorrectToApprove: false,
        deathReason: "Aprobaste una radiografía con un pato de goma. ¡Pilly explotó de felicidad (y por el pato)!",
    },
    {
        name: "Gloop",
        symptoms: "Fractura de antebrazo derecho",
        evidence: "Receta: Analgésicos, inmovilización y reposo",
        isCorrectToApprove: true,
        deathReason: "Rechazaste un caso completamente válido. ¡Gloop te demandó por negligencia y perdiste el juicio!",
    },
    {
        name: "Squish",
        symptoms: "Insomnio severo",
        evidence: "Receta: 50 litros de café intravenoso al día",
        isCorrectToApprove: false,
        deathReason: "Aprobaste 50 litros de café IV. ¡Squish vibró a 1000 Hz y se desintegró en la sala de espera!",
    },
    {
        name: "Capsule",
        symptoms: "Corte superficial en el dedo índice",
        evidence: "Solicitud: Amputación total del brazo izquierdo",
        isCorrectToApprove: false,
        deathReason: "Aprobaste una amputación por un corte en papel. ¡Capsule ahora escribe con los pies!",
    },
    {
        name: "Plop",
        symptoms: "Gripe estacional aguda",
        evidence: "Receta: Tratamiento antiviral estándar + hidratación",
        isCorrectToApprove: true,
        deathReason: "Rechazaste medicina para la gripe. ¡Plop inundó la oficina completa de estornudos radiactivos!",
    },
    {
        name: "Bloop",
        symptoms: "Dolor lumbar crónico",
        evidence: "Diagnóstico firmado por el Dr. Pato Donald",
        isCorrectToApprove: false,
        deathReason: "Aprobaste un diagnóstico firmado por un pato animado. ¡El seguro médico te quita el empleo al instante!",
    },
    {
        name: "Wibble",
        symptoms: "Hipertensión arterial",
        evidence: "Receta: Antihipertensivos, dieta baja en sodio",
        isCorrectToApprove: true,
        deathReason: "Rechazaste tratamiento para hipertensión. ¡Wibble saltó al techo literalmente!",
    }
];

// =======================
// ELEMENTOS UI
// =======================
const startScreen      = document.getElementById('start-screen');
const gameWorld        = document.getElementById('game-world');
const gameOverScreen   = document.getElementById('game-over-screen');
const caseModal        = document.getElementById('case-modal');
const playerEl         = document.getElementById('player');
const zoneApprove      = document.getElementById('zone-approve');
const zoneReject       = document.getElementById('zone-reject');
const interactionPrompt = document.getElementById('interaction-prompt');
const scoreDisplay     = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const timerDisplay     = document.getElementById('timer');
const timerHud         = document.getElementById('timer-hud');
const patientNameEl    = document.getElementById('patient-name');
const symptomsEl       = document.getElementById('symptoms');
const evidenceEl       = document.getElementById('evidence');
const gameOverReason   = document.getElementById('game-over-reason');
const deathCharEl      = document.getElementById('death-character');

// =======================
// ESTADO DEL JUEGO
// =======================
let gameState     = 'START';
let playerColor   = '#48dbfb';
let score         = 0;
let timeLeft      = 0;
let timerInterval = null;
let currentCase   = null;
let loopRunning   = false;

// Movimiento
let pos       = { x: 400, y: 250 };
let targetPos = null;
let keys      = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };
let speed     = 5;
let isFlipped = false;

// =======================
// SVG DEL PERSONAJE
// (estilo Dumb Ways to Die: cuerpo blob, ojos grandes, bracitos)
// =======================
function getCharacterSVG(color, expression) {
    expression = expression || 'happy';

    var mouth = '';
    if (expression === 'happy') {
        mouth = "<path d='M 38 54 Q 50 66 62 54' fill='transparent' stroke='#003893' stroke-width='4' stroke-linecap='round'/>";
    } else if (expression === 'scared') {
        mouth = "<ellipse cx='50' cy='58' rx='7' ry='6' fill='#003893'/><ellipse cx='50' cy='58' rx='5' ry='4' fill='white'/>";
    } else if (expression === 'dead') {
        mouth = "<path d='M 38 58 Q 50 50 62 58' fill='transparent' stroke='#003893' stroke-width='4' stroke-linecap='round'/>";
    }

    return "<svg viewBox='0 0 100 100' width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>" +
        // Shadow
        "<ellipse cx='50' cy='97' rx='20' ry='4' fill='rgba(0,0,0,0.12)'/>" +
        // Left arm
        "<path d='M 22 55 Q 8 48 12 32' fill='transparent' stroke='#003893' stroke-width='5' stroke-linecap='round'/>" +
        // Right arm
        "<path d='M 78 55 Q 92 48 88 32' fill='transparent' stroke='#003893' stroke-width='5' stroke-linecap='round'/>" +
        // Left leg
        "<line x1='36' y1='84' x2='30' y2='96' stroke='#003893' stroke-width='6' stroke-linecap='round'/>" +
        // Right leg
        "<line x1='64' y1='84' x2='70' y2='96' stroke='#003893' stroke-width='6' stroke-linecap='round'/>" +
        // Body (blob)
        "<path d='M 18 42 C 18 -8, 82 -8, 82 42 L 82 65 C 82 98, 18 98, 18 65 Z' fill='" + color + "' stroke='#003893' stroke-width='5'/>" +
        // Shine on body
        "<ellipse cx='38' cy='28' rx='8' ry='6' fill='rgba(255,255,255,0.35)'/>" +
        // Left eye white
        "<ellipse cx='36' cy='38' rx='8' ry='10' fill='white' stroke='#003893' stroke-width='3'/>" +
        // Right eye white
        "<ellipse cx='64' cy='38' rx='8' ry='10' fill='white' stroke='#003893' stroke-width='3'/>" +
        // Left pupil
        "<circle cx='37' cy='39' r='4' fill='#003893'/>" +
        // Right pupil
        "<circle cx='65' cy='39' r='4' fill='#003893'/>" +
        // Eye shine left
        "<circle cx='39' cy='36' r='1.5' fill='white'/>" +
        // Eye shine right
        "<circle cx='67' cy='36' r='1.5' fill='white'/>" +
        // Mouth
        mouth +
        "</svg>";
}

// =======================
// INICIALIZAR PANTALLA DE SELECCIÓN
// =======================
document.getElementById('preview-blue').innerHTML  = getCharacterSVG('#48dbfb', 'happy');
document.getElementById('preview-gold').innerHTML  = getCharacterSVG('#feca57', 'happy');
document.getElementById('preview-pink').innerHTML  = getCharacterSVG('#ff9ff3', 'happy');
document.getElementById('preview-green').innerHTML = getCharacterSVG('#1dd1a1', 'happy');

// Selección de personaje
document.querySelectorAll('.char-card').forEach(function(card) {
    card.addEventListener('click', function() {
        document.querySelectorAll('.char-card').forEach(function(c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        playerColor = card.dataset.color;
    });
});

// =======================
// BOTONES PRINCIPALES
// =======================
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', function() {
    score = 0;
    startGame();
});
document.getElementById('btn-take-case').addEventListener('click', takeCase);
document.getElementById('interaction-prompt').addEventListener('click', openCase);
document.getElementById('desk').addEventListener('click', function() {
    if (gameState === 'EXPLORING' && !interactionPrompt.classList.contains('hidden')) {
        openCase();
    }
});

// =======================
// INICIAR JUEGO
// =======================
function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameWorld.classList.remove('hidden');

    playerEl.innerHTML = getCharacterSVG(playerColor, 'happy');
    scoreDisplay.textContent = score;
    finalScoreDisplay.textContent = score;

    pos.x = gameWorld.clientWidth  / 2;
    pos.y = gameWorld.clientHeight / 2;
    targetPos = null;
    isFlipped = false;
    updatePlayerPosition();

    resetToExploring();

    if (!loopRunning) {
        loopRunning = true;
        requestAnimationFrame(gameLoop);
    }
}

function resetToExploring() {
    gameState = 'EXPLORING';
    currentCase = null;
    timerDisplay.textContent = '--';
    timerHud.classList.remove('urgent');
    clearInterval(timerInterval);
    zoneApprove.classList.remove('active');
    zoneReject.classList.remove('active');
    playerEl.innerHTML = getCharacterSVG(playerColor, 'happy');
}

// =======================
// INPUT: TECLADO
// =======================
window.addEventListener('keydown', function(e) {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        targetPos = null; // Cancel click-to-move on key press
    }
    if (e.code === 'Space' && gameState === 'EXPLORING' && !interactionPrompt.classList.contains('hidden')) {
        e.preventDefault();
        openCase();
    }
});
window.addEventListener('keyup', function(e) {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// =======================
// INPUT: CLIC EN PISO (CLICK-TO-MOVE)
// =======================
gameWorld.addEventListener('pointerdown', function(e) {
    // Ignore clicks on UI elements
    if (e.target.closest('#hud, .zone, #desk, #interaction-prompt, .modal-overlay, .game-btn')) return;
    if (gameState !== 'EXPLORING' && gameState !== 'DECIDING') return;

    var rect = gameWorld.getBoundingClientRect();
    targetPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
});

// =======================
// GAME LOOP
// =======================
function gameLoop() {
    if (gameState === 'EXPLORING' || gameState === 'DECIDING') {
        movePlayer();
        checkCollisions();
    }
    requestAnimationFrame(gameLoop);
}

// =======================
// MOVIMIENTO DEL JUGADOR
// =======================
function movePlayer() {
    var dx = 0;
    var dy = 0;

    // Keyboard
    if (keys.ArrowUp   || keys.w) { dy -= speed; }
    if (keys.ArrowDown || keys.s) { dy += speed; }
    if (keys.ArrowLeft || keys.a) { dx -= speed; isFlipped = true;  }
    if (keys.ArrowRight|| keys.d) { dx += speed; isFlipped = false; }

    // Click-to-move (mouse / touch)
    if (targetPos && dx === 0 && dy === 0) {
        var diffX = targetPos.x - pos.x;
        var diffY = targetPos.y - pos.y;
        var dist  = Math.sqrt(diffX * diffX + diffY * diffY);

        if (dist > speed) {
            dx = (diffX / dist) * speed;
            dy = (diffY / dist) * speed;
            if (dx < -0.5) isFlipped = true;
            if (dx >  0.5) isFlipped = false;
        } else {
            pos.x = targetPos.x;
            pos.y = targetPos.y;
            targetPos = null;
        }
    }

    var moving = (dx !== 0 || dy !== 0);

    if (moving) {
        playerEl.classList.add('walking');
        var pw = 72, ph = 72;
        var gw = gameWorld.clientWidth;
        var gh = gameWorld.clientHeight;

        var newX = pos.x + dx;
        var newY = pos.y + dy;

        // Boundary clamp
        if (newX < pw / 2)      newX = pw / 2;
        if (newX > gw - pw / 2) newX = gw - pw / 2;
        if (newY < ph / 2)      newY = ph / 2;
        if (newY > gh - ph / 2) newY = gh - ph / 2;

        // Desk collision
        var deskRect   = { x: gw/2 - 95, y: gh - 35 - 72, w: 190, h: 72 };
        var playerRect = { x: newX - pw/2, y: newY - ph/2, w: pw, h: ph };

        if (rectIntersect(playerRect, deskRect)) {
            newX = pos.x;
            newY = pos.y;
            targetPos = null;
        }

        pos.x = newX;
        pos.y = newY;
    } else {
        playerEl.classList.remove('walking');
    }

    updatePlayerPosition();
}

function updatePlayerPosition() {
    playerEl.style.left      = pos.x + 'px';
    playerEl.style.top       = pos.y  + 'px';
    playerEl.style.transform = 'translate(-50%, -50%) scaleX(' + (isFlipped ? -1 : 1) + ')';
}

function rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
             r2.x + r2.w < r1.x ||
             r2.y > r1.y + r1.h ||
             r2.y + r2.h < r1.y);
}

// =======================
// COLISIONES Y TRIGGER ZONES
// =======================
function checkCollisions() {
    var pw = 72, ph = 72;
    var gw = gameWorld.clientWidth;
    var gh = gameWorld.clientHeight;
    var playerRect = { x: pos.x - pw/2, y: pos.y - ph/2, w: pw, h: ph };

    // Desk interaction area (enlarged hitbox around desk)
    var deskArea = { x: gw/2 - 130, y: gh - 35 - 110, w: 260, h: 130 };
    if (gameState === 'EXPLORING' && rectIntersect(playerRect, deskArea)) {
        interactionPrompt.classList.remove('hidden');
    } else {
        interactionPrompt.classList.add('hidden');
    }

    // Decision zones
    if (gameState === 'DECIDING') {
        var rejectRect  = { x: 60,       y: 0, w: 140, h: 90 };
        var approveRect = { x: gw - 200, y: 0, w: 140, h: 90 };

        if (rectIntersect(playerRect, rejectRect)) {
            submitDecision(false);
        } else if (rectIntersect(playerRect, approveRect)) {
            submitDecision(true);
        }
    }
}

// =======================
// LÓGICA DE CASOS
// =======================
function openCase() {
    if (gameState !== 'EXPLORING') return;
    gameState = 'READING';
    targetPos = null;
    interactionPrompt.classList.add('hidden');

    currentCase = cases[Math.floor(Math.random() * cases.length)];
    patientNameEl.textContent = currentCase.name;
    symptomsEl.textContent    = currentCase.symptoms;
    evidenceEl.textContent    = currentCase.evidence;

    caseModal.classList.remove('hidden');
    playerEl.innerHTML = getCharacterSVG(playerColor, 'scared'); // Scared face when reading!
}

function takeCase() {
    caseModal.classList.add('hidden');
    gameState = 'DECIDING';
    zoneApprove.classList.add('active');
    zoneReject.classList.add('active');
    playerEl.innerHTML = getCharacterSVG(playerColor, 'scared');

    timeLeft = Math.max(8, 22 - score * 2);
    timerDisplay.textContent = timeLeft;

    clearInterval(timerInterval);
    timerInterval = setInterval(function() {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 4) timerHud.classList.add('urgent');
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            triggerGameOver('¡Se te acabó el tiempo! El expediente quedó sin resolver... la fila de espera es infinita.');
        }
    }, 1000);
}

function submitDecision(isApprove) {
    clearInterval(timerInterval);
    if (isApprove === currentCase.isCorrectToApprove) {
        score++;
        scoreDisplay.textContent = score;
        resetToExploring();
    } else {
        triggerGameOver(currentCase.deathReason);
    }
}

// =======================
// GAME OVER
// =======================
function triggerGameOver(reason) {
    gameState = 'GAMEOVER';
    targetPos = null;
    clearInterval(timerInterval);

    // Show dead character
    deathCharEl.innerHTML = getCharacterSVG(playerColor, 'dead');

    gameOverReason.textContent = reason;
    finalScoreDisplay.textContent = score;

    gameOverScreen.classList.remove('hidden');
    gameWorld.classList.add('hidden');
}
