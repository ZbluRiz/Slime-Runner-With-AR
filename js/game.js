// Enhanced Game Variables
let canvas, ctx;
let gameRunning = false;
let score = 0;
let gameSpeed = 2;
let animFrame = 0;
let backgroundOffset = 0;

// Enhanced Player (Slime)
const player = {
    x: 100,
    y: 280,
    width: 50,
    height: 50,
    velocityY: 0,
    grounded: false,
    state: 'running',
    color: '#00FF88',
    bounceAnimation: 0,
    trail: []
};

// Enhanced Game Objects
const obstacles = [];
const clouds = [];
const stars = [];
const particles = [];
const maxObstacles = 4;
const maxClouds = 5;
const maxStars = 20;

const ground = 320;

// Hand tracking variables
let hands, camera;
let gestureState = 'normal';
let handDetected = false;
let lastGestureCheck = 0;
const gestureCheckInterval = 100;

// Cached DOM elements
let scoreEl, handStatusEl, gestureIndicatorEl;

// Pre-calculated values
const pi2 = Math.PI * 2;
const halfPi = Math.PI * 0.5;

// Obstacle types
const obstacleTypes = [
    { type: 'spike', color: '#8B0000', pattern: 'spike' },
    { type: 'rock', color: '#696969', pattern: 'rock' },
    { type: 'crystal', color: '#9370DB', pattern: 'crystal' },
    { type: 'cactus', color: '#228B22', pattern: 'cactus' }
];

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Cache DOM elements
    scoreEl = document.getElementById('score');
    handStatusEl = document.getElementById('handStatus');
    gestureIndicatorEl = document.getElementById('gesture-indicator');
    
    // Optimize canvas rendering
    ctx.imageSmoothingEnabled = true;
    
    // Initialize background elements
    initializeStars();
    initializeParticles();
    
    initHandTracking();
    gameLoop();
}

function initializeStars() {
    stars.length = 0;
    for (let i = 0; i < maxStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (ground - 50),
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.2,
            twinkle: Math.random() * pi2
        });
    }
}

function initializeParticles() {
    particles.length = 0;
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: ground + Math.random() * 20,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 0.8 + 0.3,
            color: `hsl(${Math.random() * 60 + 100}, 70%, 70%)`
        });
    }
}

async function initHandTracking() {
    const videoElement = document.getElementById('videoElement');
    const handCanvas = document.getElementById('handCanvas');
    const handCtx = handCanvas.getContext('2d');

    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
    });

    hands.onResults((results) => {
        const currentTime = Date.now();
        
        if (currentTime - lastGestureCheck < gestureCheckInterval) return;
        lastGestureCheck = currentTime;
        
        handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
        handCtx.drawImage(results.image, 0, 0, handCanvas.width, handCanvas.height);

        if (results.multiHandLandmarks?.[0]) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Enhanced hand drawing
            drawConnectors(handCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF88', lineWidth: 2});
            drawLandmarks(handCtx, landmarks, {color: '#FF6B6B', lineWidth: 1});
            
            const isOpen = detectOpenHandFast(landmarks);
            gestureState = isOpen ? 'jump' : 'crouch';
            handDetected = true;
            updateHandStatus(`Hand Detected: ${gestureState.toUpperCase()}`);
        } else {
            handDetected = false;
            gestureState = 'normal';
            updateHandStatus('No Hand Detected');
        }
        
        updateGestureIndicator();
    });

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240, facingMode: 'user' }
        });
        
        videoElement.srcObject = stream;
        
        camera = new Camera(videoElement, {
            onFrame: async () => await hands.send({image: videoElement}),
            width: 320,
            height: 240
        });
        
        await camera.start();
        updateHandStatus('Camera Ready!');
        
    } catch (error) {
        console.error('Camera error:', error);
        updateHandStatus('No Camera Access');
    }
}

function detectOpenHandFast(landmarks) {
    const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky
    const joints = [6, 10, 14, 18];
    
    let extended = 0;
    for (let i = 0; i < tips.length; i++) {
        if (landmarks[tips[i]].y < landmarks[joints[i]].y) extended++;
    }
    
    return extended >= 3;
}

function updateHandStatus(message) {
    handStatusEl.textContent = message;
}

function updateGestureIndicator() {
    const texts = { 
        jump: 'JUMP 🖐️', 
        crouch: 'CROUCH ✊', 
        normal: 'RUN →' 
    };
    gestureIndicatorEl.textContent = texts[gestureState] || texts.normal;
    gestureIndicatorEl.className = `gesture-indicator ${gestureState}`;
}

function startGame() {
    gameRunning = true;
    score = 0;
    gameSpeed = 2;
    animFrame = 0;
    backgroundOffset = 0;
    
    // Reset arrays
    obstacles.length = 0;
    clouds.length = 0;
    
    // Reset player
    Object.assign(player, {
        y: 280, velocityY: 0, grounded: false, 
        state: 'running', bounceAnimation: 0, trail: []
    });
    
    // Reinitialize background elements
    initializeStars();
    initializeParticles();
    
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    
    generateObstacle();
    generateCloud();
}

function restartGame() {
    startGame();
}

function gameLoop() {
    if (gameRunning) {
        animFrame++;
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

function update() {
    backgroundOffset += gameSpeed * 0.5;
    player.bounceAnimation += 0.15;
    updatePlayerState();
    
    // Enhanced player physics
    if (player.state === 'jumping' && player.grounded) {
        player.velocityY = -16;
        player.grounded = false;
        createJumpParticles();
    }
    
    if (!player.grounded) {
        player.velocityY += 0.5;
        player.y += player.velocityY;
    }
    
    // Ground collision
    if (player.y >= ground - player.height) {
        player.y = ground - player.height;
        player.grounded = true;
        player.velocityY = 0;
        if (player.state === 'jumping') {
            player.state = 'running';
            createLandingParticles();
        }
    }
    
    // Update player trail
    updatePlayerTrail();
    
    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.x -= gameSpeed;
        obstacle.rotation = (obstacle.rotation || 0) + 0.02;
        
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(i, 1);
            score += 15;
            updateScore();
            
            if (score % 200 === 0) gameSpeed += 0.4;
        } else if (checkCollision(player, obstacle)) {
            gameOver();
            return;
        }
    }
    
    // Update clouds with parallax
    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= gameSpeed * clouds[i].speed;
        if (clouds[i].x + clouds[i].width < 0) {
            clouds.splice(i, 1);
        }
    }
    
    // Update stars
    for (const star of stars) {
        star.x -= gameSpeed * star.speed;
        star.twinkle += 0.1;
        if (star.x < -10) {
            star.x = canvas.width + 10;
            star.y = Math.random() * (ground - 50);
        }
    }
    
    // Update particles
    updateParticles();
    
    // Generate objects
    if (obstacles.length < maxObstacles && 
        (!obstacles.length || obstacles[obstacles.length - 1].x < canvas.width - 350)) {
        generateObstacle();
    }
    
    if (clouds.length < maxClouds && animFrame % 180 === 0) {
        generateCloud();
    }
}

function updatePlayerState() {
    if (!handDetected) return;
    
    if (gestureState === 'jump' && player.grounded) {
        player.state = 'jumping';
    } else if (gestureState === 'crouch' && player.grounded) {
        player.state = 'crouching';
    } else if (player.grounded && player.state !== 'jumping') {
        player.state = 'running';
    }
}

function updatePlayerTrail() {
    // Add current position to trail
    player.trail.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        life: 10
    });
    
    // Update trail
    for (let i = player.trail.length - 1; i >= 0; i--) {
        player.trail[i].life--;
        if (player.trail[i].life <= 0) {
            player.trail.splice(i, 1);
        }
    }
    
    // Limit trail length
    if (player.trail.length > 8) {
        player.trail.shift();
    }
}

function createJumpParticles() {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: player.x + Math.random() * player.width,
            y: player.y + player.height,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * -3 - 1,
            size: Math.random() * 4 + 2,
            life: 30,
            color: '#00FF88'
        });
    }
}

function createLandingParticles() {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: player.x + Math.random() * player.width,
            y: ground,
            vx: (Math.random() - 0.5) * 6,
            vy: Math.random() * -2 - 1,
            size: Math.random() * 3 + 1,
            life: 25,
            color: '#32CD32'
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.vx !== undefined) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        } else {
            p.x -= gameSpeed * p.speed;
            if (p.x < -10) {
                p.x = canvas.width + 10;
            }
        }
    }
}

function generateObstacle() {
    if (obstacles.length >= maxObstacles) return;
    
    const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const isLow = Math.random() < 0.6;
    const height = isLow ? 35 + Math.random() * 25 : 65 + Math.random() * 35;
    
    obstacles.push({
        x: canvas.width,
        y: ground - height,
        width: 25 + Math.random() * 15,
        height: height,
        color: obstacleType.color,
        type: obstacleType.type,
        pattern: obstacleType.pattern,
        rotation: 0
    });
}

function generateCloud() {
    if (clouds.length >= maxClouds) return;
    
    clouds.push({
        x: canvas.width,
        y: Math.random() * 120 + 30,
        width: 80 + Math.random() * 60,
        height: 40 + Math.random() * 30,
        speed: 0.2 + Math.random() * 0.4,
        opacity: 0.6 + Math.random() * 0.3
    });
}

function checkCollision(rect1, rect2) {
    const margin = 5; // Collision margin for better gameplay
    const h = player.state === 'crouching' ? player.height * 0.6 : player.height;
    const y = player.state === 'crouching' ? player.y + player.height * 0.4 : player.y;
    
    return rect1.x + margin < rect2.x + rect2.width &&
           rect1.x + rect1.width - margin > rect2.x &&
           y + margin < rect2.y + rect2.height &&
           y + h - margin > rect2.y;
}

function draw() {
    // Enhanced gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#FFB6C1');  // Light pink
    gradient.addColorStop(0.3, '#87CEEB'); // Sky blue
    gradient.addColorStop(0.7, '#98FB98'); // Pale green
    gradient.addColorStop(1, '#32CD32');   // Lime green
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, ground);
    
    // Ground with texture
    const groundGradient = ctx.createLinearGradient(0, ground, 0, canvas.height);
    groundGradient.addColorStop(0, '#228B22');
    groundGradient.addColorStop(0.5, '#32CD32');
    groundGradient.addColorStop(1, '#006400');
    
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, ground, canvas.width, canvas.height - ground);
    
    // Draw animated background elements
    drawStars();
    drawParticles();
    drawClouds();
    
    // Draw player trail
    drawPlayerTrail();
    
    // Draw enhanced player
    drawEnhancedPlayer();
    
    // Draw enhanced obstacles
    drawEnhancedObstacles();
    
    // Ground decoration
    drawGroundDecoration();
}

function drawStars() {
    ctx.save();
    for (const star of stars) {
        const alpha = 0.5 + Math.sin(star.twinkle) * 0.3;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFFFE0';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, pi2);
        ctx.fill();
        
        // Star sparkle effect
        if (Math.random() < 0.1) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(star.x - star.size * 2, star.y);
            ctx.lineTo(star.x + star.size * 2, star.y);
            ctx.moveTo(star.x, star.y - star.size * 2);
            ctx.lineTo(star.x, star.y + star.size * 2);
            ctx.stroke();
        }
    }
    ctx.restore();
}

function drawParticles() {
    ctx.save();
    for (const particle of particles) {
        if (particle.life !== undefined) {
            ctx.globalAlpha = particle.life / 30;
        } else {
            ctx.globalAlpha = 0.4;
        }
        ctx.fillStyle = particle.color || '#90EE90';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, pi2);
        ctx.fill();
    }
    ctx.restore();
}

function drawClouds() {
    ctx.save();
    for (const cloud of clouds) {
        ctx.globalAlpha = cloud.opacity;
        ctx.fillStyle = '#FFFFFF';
        
        // Draw fluffy cloud shape
        const x = cloud.x;
        const y = cloud.y;
        const w = cloud.width;
        const h = cloud.height;
        
        ctx.beginPath();
        ctx.arc(x, y + h/2, h/2, 0, pi2);
        ctx.arc(x + w/4, y, h/3, 0, pi2);
        ctx.arc(x + w/2, y + h/4, h/2.5, 0, pi2);
        ctx.arc(x + 3*w/4, y, h/3, 0, pi2);
        ctx.arc(x + w, y + h/2, h/2, 0, pi2);
        ctx.fill();
    }
    ctx.restore();
}

function drawPlayerTrail() {
    ctx.save();
    for (let i = 0; i < player.trail.length; i++) {
        const trail = player.trail[i];
        const alpha = trail.life / 10;
        const size = 3 + (trail.life / 10) * 2;
        
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, size, 0, pi2);
        ctx.fill();
    }
    ctx.restore();
}

function drawEnhancedPlayer() {
    const centerX = player.x + player.width * 0.5;
    const centerY = player.y + player.height * 0.5;
    
    let bounceOffset = 0, scaleX = 1, scaleY = 1;
    
    if (player.grounded && player.state === 'running') {
        bounceOffset = Math.sin(player.bounceAnimation) * 4;
        scaleX = 1 + Math.sin(player.bounceAnimation) * 0.15;
        scaleY = 1 - Math.sin(player.bounceAnimation) * 0.1;
    } else if (player.state === 'crouching') {
        scaleX = 1.6; scaleY = 0.5; bounceOffset = 20;
    } else if (player.state === 'jumping') {
        scaleX = 0.8; scaleY = 1.4;
    }
    
    ctx.save();
    ctx.translate(centerX, centerY + bounceOffset);
    ctx.scale(scaleX, scaleY);
    
    // Slime glow effect
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;
    
    // Main slime body with gradient
    const slimeGradient = ctx.createRadialGradient(0, -5, 5, 0, 0, player.width * 0.5);
    slimeGradient.addColorStop(0, '#00FFAA');
    slimeGradient.addColorStop(0.7, player.color);
    slimeGradient.addColorStop(1, '#00CC66');
    
    ctx.fillStyle = slimeGradient;
    ctx.beginPath();
    ctx.arc(0, 0, player.width * 0.5, 0, pi2);
    ctx.fill();
    
    // Slime shine effect
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-8, -8, 8, 12, -0.3, 0, pi2);
    ctx.fill();
    
    // Enhanced eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-10, -6, 7, 0, pi2);
    ctx.arc(10, -6, 7, 0, pi2);
    ctx.fill();
    
    // Eye pupils with animation
    const eyeOffset = Math.sin(animFrame * 0.05) * 1;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-8 + eyeOffset, -4, 4, 0, pi2);
    ctx.arc(8 + eyeOffset, -4, 4, 0, pi2);
    ctx.fill();
    
    // Eye shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-6 + eyeOffset, -6, 2, 0, pi2);
    ctx.arc(10 + eyeOffset, -6, 2, 0, pi2);
    ctx.fill();
    
    // Animated mouth
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const mouthOffset = Math.sin(player.bounceAnimation) * 2;
    ctx.arc(0, 8 + mouthOffset, 8, 0, Math.PI);
    ctx.stroke();
    
    ctx.restore();
}

function drawEnhancedObstacles() {
    for (const obstacle of obstacles) {
        ctx.save();
        ctx.translate(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
        
        if (obstacle.type === 'spike') {
            drawSpikeObstacle(obstacle);
        } else if (obstacle.type === 'rock') {
            drawRockObstacle(obstacle);
        } else if (obstacle.type === 'crystal') {
            drawCrystalObstacle(obstacle);
        } else if (obstacle.type === 'cactus') {
            drawCactusObstacle(obstacle);
        }
        
        ctx.restore();
    }
}

function drawSpikeObstacle(obstacle) {
    ctx.rotate(obstacle.rotation);
    
    // Spike gradient
    const gradient = ctx.createLinearGradient(0, -obstacle.height/2, 0, obstacle.height/2);
    gradient.addColorStop(0, '#FF4444');
    gradient.addColorStop(0.5, obstacle.color);
    gradient.addColorStop(1, '#440000');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, -obstacle.height/2);
    const spikes = 6;
    for (let i = 0; i <= spikes; i++) {
        const angle = (i / spikes) * pi2;
        const radius = i % 2 === 0 ? obstacle.width/2 : obstacle.width/3;
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius - obstacle.height/4);
    }
    ctx.closePath();
    ctx.fill();
    
    // Spike glow
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 10;
    ctx.stroke();
}

function drawRockObstacle(obstacle) {
    // Rock with texture
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, obstacle.width/2);
    gradient.addColorStop(0, '#A0A0A0');
    gradient.addColorStop(0.5, obstacle.color);
    gradient.addColorStop(1, '#404040');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    // Irregular rock shape
    const points = 8;
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * pi2;
        const radius = (obstacle.width/2) * (0.8 + Math.random() * 0.4);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.7;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Rock highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(-obstacle.width/4, -obstacle.height/4, 3, 0, pi2);
    ctx.fill();
}

function drawCrystalObstacle(obstacle) {
    ctx.rotate(obstacle.rotation * 2);
    
    // Crystal gradient
    const gradient = ctx.createLinearGradient(0, -obstacle.height/2, 0, obstacle.height/2);
    gradient.addColorStop(0, '#E6E6FA');
    gradient.addColorStop(0.5, obstacle.color);
    gradient.addColorStop(1, '#4B0082');
    
    ctx.fillStyle = gradient;
    
    // Crystal facets
    const facets = 6;
    for (let i = 0; i < facets; i++) {
        ctx.beginPath();
        const angle1 = (i / facets) * pi2;
        const angle2 = ((i + 1) / facets) * pi2;
        ctx.moveTo(0, -obstacle.height/2);
        ctx.lineTo(Math.cos(angle1) * obstacle.width/2, 0);
        ctx.lineTo(Math.cos(angle2) * obstacle.width/2, 0);
        ctx.closePath();
        ctx.globalAlpha = 0.7 + Math.sin(animFrame * 0.1 + i) * 0.3;
        ctx.fill();
    }
    
    // Crystal glow
    ctx.globalAlpha = 1;
    ctx.shadowColor = obstacle.color;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawCactusObstacle(obstacle) {
    // Cactus gradient
    const gradient = ctx.createLinearGradient(0, -obstacle.height/2, 0, obstacle.height/2);
    gradient.addColorStop(0, '#90EE90');
    gradient.addColorStop(0.5, obstacle.color);
    gradient.addColorStop(1, '#006400');
    
    ctx.fillStyle = gradient;
    
    // Main cactus body
    ctx.fillRect(-obstacle.width/3, -obstacle.height/2, obstacle.width/1.5, obstacle.height);
    
    // Cactus arms
    ctx.fillRect(-obstacle.width/2, -obstacle.height/4, obstacle.width/4, obstacle.height/3);
    ctx.fillRect(obstacle.width/4, -obstacle.height/3, obstacle.width/4, obstacle.height/2);
    
    // Cactus spines
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
        const x = (Math.random() - 0.5) * obstacle.width;
        const y = (Math.random() - 0.5) * obstacle.height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 3, y - 3);
        ctx.stroke();
    }
}

function drawGroundDecoration() {
    // Grass blades
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    for (let x = 0; x < canvas.width; x += 30) {
        const grassX = (x - backgroundOffset) % canvas.width;
        if (grassX > -20 && grassX < canvas.width + 20) {
            for (let i = 0; i < 3; i++) {
                const bladeX = grassX + i * 8 + Math.sin(animFrame * 0.02 + x * 0.01) * 2;
                const bladeHeight = 8 + Math.random() * 6;
                
                ctx.beginPath();
                ctx.moveTo(bladeX, ground);
                ctx.lineTo(bladeX + Math.sin(animFrame * 0.03 + i) * 2, ground - bladeHeight);
                ctx.stroke();
            }
        }
    }
    
    // Ground pattern
    ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
    for (let x = 0; x < canvas.width; x += 50) {
        const patternX = (x - backgroundOffset * 0.5) % canvas.width;
        if (patternX > -30 && patternX < canvas.width + 30) {
            ctx.beginPath();
            ctx.arc(patternX, ground + 15, 4, 0, pi2);
            ctx.fill();
        }
    }
}

function updateScore() {
    scoreEl.textContent = `Score: ${score}`;
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = `Final Score: ${score}`;
    document.getElementById('gameOver').style.display = 'block';
}

// Event listeners
document.getElementById('startButton').addEventListener('click', startGame);

// Keyboard controls for testing (optional)
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.code) {
        case 'Space':
            gestureState = 'jump';
            break;
        case 'ArrowDown':
            gestureState = 'crouch';
            break;
    }
});

document.addEventListener('keyup', (e) => {
    if (!gameRunning) return;
    gestureState = 'normal';
});

// Initialize game when page loads
window.addEventListener('load', initGame);