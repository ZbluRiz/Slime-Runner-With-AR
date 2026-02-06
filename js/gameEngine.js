// Game Engine Module
class GameEngine {
    constructor(handTracker, renderer) {
        this.handTracker = handTracker;
        this.renderer = renderer;
        
        // Game state
        this.gameRunning = false;
        this.score = 0;
        this.gameSpeed = CONFIG.INITIAL_GAME_SPEED;
        this.animFrame = 0;
        
        // Player object
        this.player = {
            x: CONFIG.PLAYER.X,
            y: CONFIG.PLAYER.Y,
            width: CONFIG.PLAYER.WIDTH,
            height: CONFIG.PLAYER.HEIGHT,
            velocityY: 0,
            grounded: false,
            state: 'running', // running, jumping, crouching
            color: CONFIG.PLAYER.COLOR,
            bounceAnimation: 0
        };
        
        // Game objects
        this.obstacles = [];
        this.clouds = [];
        
        // Cache DOM elements
        this.scoreEl = document.getElementById('score');
        this.startButtonEl = document.getElementById('startButton');
        this.gameOverEl = document.getElementById('gameOver');
        this.finalScoreEl = document.getElementById('finalScore');
        this.restartButtonEl = document.getElementById('restartButton');
        
        // Bind event listeners
        this.bindEvents();
    }

    bindEvents() {
        this.startButtonEl.addEventListener('click', () => this.startGame());
        this.restartButtonEl.addEventListener('click', () => this.startGame());
    }

    startGame() {
        this.gameRunning = true;
        this.score = 0;
        this.gameSpeed = CONFIG.INITIAL_GAME_SPEED;
        this.animFrame = 0;
        
        // Clear arrays
        this.obstacles.length = 0;
        this.clouds.length = 0;
        
        // Reset player
        Object.assign(this.player, {
            x: CONFIG.PLAYER.X,
            y: CONFIG.PLAYER.Y,
            velocityY: 0,
            grounded: false,
            state: 'running',
            bounceAnimation: 0
        });
        
        // Hide/show UI elements
        this.startButtonEl.style.display = 'none';
        this.gameOverEl.style.display = 'none';
        
        // Generate initial objects
        this.generateObstacle();
        this.generateCloud();
        
        this.updateScore();
    }

    update() {
        if (!this.gameRunning) return;
        
        this.animFrame++;
        this.player.bounceAnimation += CONFIG.PLAYER.BOUNCE_SPEED;
        
        this.updatePlayerState();
        this.updatePlayerPhysics();
        this.updateObstacles();
        this.updateClouds();
        this.generateObjects();
    }

    updatePlayerState() {
        if (!this.handTracker.isHandDetected()) return;
        
        const gestureState = this.handTracker.getGestureState();
        
        switch (gestureState) {
            case 'jump':
                if (this.player.grounded) {
                    this.player.state = 'jumping';
                }
                break;
            case 'crouch':
                if (this.player.grounded) {
                    this.player.state = 'crouching';
                }
                break;
            default:
                if (this.player.grounded && this.player.state !== 'jumping') {
                    this.player.state = 'running';
                }
                break;
        }
    }

    updatePlayerPhysics() {
        // Jump logic
        if (this.player.state === 'jumping' && this.player.grounded) {
            this.player.velocityY = CONFIG.JUMP_FORCE;
            this.player.grounded = false;
        }
        
        // Apply gravity
        if (!this.player.grounded) {
            this.player.velocityY += CONFIG.GRAVITY;
            this.player.y += this.player.velocityY;
        }
        
        // Ground collision
        if (this.player.y >= CONFIG.GROUND_Y - this.player.height) {
            this.player.y = CONFIG.GROUND_Y - this.player.height;
            this.player.grounded = true;
            this.player.velocityY = 0;
            if (this.player.state === 'jumping') {
                this.player.state = 'running';
            }
        }
    }

    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.gameSpeed;
            
            // Remove off-screen obstacles
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += CONFIG.SCORE_PER_OBSTACLE;
                this.updateScore();
                
                // Increase difficulty
                if (this.score % CONFIG.SCORE_FOR_SPEED_UP === 0) {
                    this.gameSpeed += CONFIG.SPEED_INCREMENT;
                }
            }
            // Check collision
            else if (this.checkCollision(this.player, obstacle)) {
                this.gameOver();
                return;
            }
        }
    }

    updateClouds() {
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            cloud.x -= this.gameSpeed * CONFIG.CLOUD_SPEED_MULTIPLIER;
            
            if (cloud.x + cloud.width < 0) {
                this.clouds.splice(i, 1);
            }
        }
    }

    generateObjects() {
        // Generate obstacles
        if (this.obstacles.length < CONFIG.MAX_OBSTACLES && 
            (!this.obstacles.length || 
             this.obstacles[this.obstacles.length - 1].x < CONFIG.CANVAS_WIDTH - CONFIG.OBSTACLE_SPACING)) {
            this.generateObstacle();
        }
        
        // Generate clouds
        if (this.clouds.length < CONFIG.MAX_CLOUDS && this.animFrame % 300 === 0) {
            this.generateCloud();
        }
    }

    generateObstacle() {
        if (this.obstacles.length >= CONFIG.MAX_OBSTACLES) return;
        
        const isLow = Math.random() < 0.5;
        const height = isLow ? CONFIG.LOW_OBSTACLE_HEIGHT : CONFIG.HIGH_OBSTACLE_HEIGHT;
        
        this.obstacles.push({
            x: CONFIG.CANVAS_WIDTH,
            y: CONFIG.GROUND_Y - height,
            width: CONFIG.OBSTACLE_WIDTH,
            height: height,
            color: CONFIG.COLORS.OBSTACLE
        });
    }

    generateCloud() {
        if (this.clouds.length >= CONFIG.MAX_CLOUDS) return;
        
        this.clouds.push({
            x: CONFIG.CANVAS_WIDTH,
            y: CONFIG.CLOUD_MIN_Y + Math.random() * (CONFIG.CLOUD_MAX_Y - CONFIG.CLOUD_MIN_Y),
            width: CONFIG.CLOUD_MIN_WIDTH + Math.random() * (CONFIG.CLOUD_MAX_WIDTH - CONFIG.CLOUD_MIN_WIDTH),
            height: CONFIG.CLOUD_MIN_HEIGHT + Math.random() * (CONFIG.CLOUD_MAX_HEIGHT - CONFIG.CLOUD_MIN_HEIGHT)
        });
    }

    checkCollision(rect1, rect2) {
        // Adjust hitbox for crouching
        const playerHeight = this.player.state === 'crouching' 
            ? this.player.height * CONFIG.CROUCH_HEIGHT_MULTIPLIER 
            : this.player.height;
        const playerY = this.player.state === 'crouching' 
            ? this.player.y + this.player.height * CONFIG.CROUCH_Y_OFFSET_MULTIPLIER 
            : this.player.y;
        
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               playerY < rect2.y + rect2.height &&
               playerY + playerHeight > rect2.y;
    }

    updateScore() {
        this.scoreEl.textContent = `Score: ${this.score}`;
    }

    gameOver() {
        this.gameRunning = false;
        this.finalScoreEl.textContent = `Final Score: ${this.score}`;
        this.gameOverEl.style.display = 'block';
    }

    // Getters for renderer
    getPlayer() {
        return this.player;
    }

    getObstacles() {
        return this.obstacles;
    }

    getClouds() {
        return this.clouds;
    }

    isGameRunning() {
        return this.gameRunning;
    }
}