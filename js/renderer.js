// Renderer Module
class Renderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
    }

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Optimize canvas rendering
        this.ctx.imageSmoothingEnabled = false;
    }

    render(gameEngine) {
        if (!gameEngine.isGameRunning()) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // Draw background
        this.drawBackground();
        
        // Draw clouds
        this.drawClouds(gameEngine.getClouds());
        
        // Draw player (slime)
        this.drawPlayer(gameEngine.getPlayer());
        
        // Draw obstacles
        this.drawObstacles(gameEngine.getObstacles());
        
        // Draw ground line
        this.drawGroundLine();
    }

    drawBackground() {
        // Sky (solid color for performance)
        this.ctx.fillStyle = CONFIG.COLORS.SKY;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.GROUND_Y);
        
        // Ground
        this.ctx.fillStyle = CONFIG.COLORS.GROUND;
        this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_Y);
    }

    drawClouds(clouds) {
        this.ctx.fillStyle = CONFIG.COLORS.CLOUD;
        for (const cloud of clouds) {
            this.ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
        }
    }

    drawObstacles(obstacles) {
        this.ctx.fillStyle = CONFIG.COLORS.OBSTACLE;
        for (const obstacle of obstacles) {
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    }

    drawGroundLine() {
        this.ctx.fillStyle = CONFIG.COLORS.GROUND_LINE;
        this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.CANVAS_WIDTH, 3);
    }

    drawPlayer(player) {
        const centerX = player.x + player.width * 0.5;
        const centerY = player.y + player.height * 0.5;
        
        // Calculate animations
        let bounceOffset = 0;
        let scaleX = 1;
        let scaleY = 1;
        
        // Animation based on player state
        if (player.grounded && player.state === 'running') {
            bounceOffset = Math.sin(player.bounceAnimation) * 3;
            scaleX = 1 + Math.sin(player.bounceAnimation) * 0.1;
            scaleY = 1 - Math.sin(player.bounceAnimation) * 0.1;
        } else if (player.state === 'crouching') {
            scaleX = 1.4;
            scaleY = 0.6;
            bounceOffset = 15;
        } else if (player.state === 'jumping') {
            scaleX = 0.9;
            scaleY = 1.3;
        }
        
        // Save context for transformations
        this.ctx.save();
        this.ctx.translate(centerX, centerY + bounceOffset);
        this.ctx.scale(scaleX, scaleY);
        
        // Draw slime body (main circle)
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, player.width * 0.5, 0, CONFIG.PI2);
        this.ctx.fill();
        
        // Add shine effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(-8, -8, 6, 0, CONFIG.PI2);
        this.ctx.fill();
        
        // Draw eyes
        const eyeOffset = player.state === 'crouching' ? 5 : 0;
        
        // Left eye
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(-8, -5 + eyeOffset, 5, 0, CONFIG.PI2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-6, -3 + eyeOffset, 3, 0, CONFIG.PI2);
        this.ctx.fill();
        
        // Right eye
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(8, -5 + eyeOffset, 5, 0, CONFIG.PI2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(6, -3 + eyeOffset, 3, 0, CONFIG.PI2);
        this.ctx.fill();
        
        // Draw mouth
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        if (player.state === 'jumping') {
            // Excited mouth when jumping
            this.ctx.arc(0, 5, 8, 0, Math.PI);
        } else if (player.state === 'crouching') {
            // Small mouth when crouching
            this.ctx.arc(0, 8, 4, 0, Math.PI);
        } else {
            // Normal happy mouth
            this.ctx.arc(0, 5, 6, 0, Math.PI);
        }
        this.ctx.stroke();
        
        // Add slime trail effect when jumping
        if (player.state === 'jumping') {
            for (let i = 0; i < 3; i++) {
                this.ctx.fillStyle = `rgba(0, 255, 136, ${0.3 - i * 0.1})`;
                this.ctx.beginPath();
                this.ctx.arc(-20 - i * 8, 10 + i * 5, 3 - i, 0, CONFIG.PI2);
                this.ctx.fill();
            }
        }
        
        this.ctx.restore();
    }

    // Utility method to get canvas context (for external use)
    getContext() {
        return this.ctx;
    }

    // Utility method to get canvas element
    getCanvas() {
        return this.canvas;
    }
}