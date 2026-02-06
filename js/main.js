// Main Application Entry Point
class SlimeRunnerApp {
    constructor() {
        this.handTracker = null;
        this.renderer = null;
        this.gameEngine = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('Initializing Slime Runner...');
            
            // Initialize modules in order
            this.handTracker = new HandTracker();
            this.renderer = new Renderer();
            
            // Initialize renderer first (needs canvas)
            this.renderer.init();
            
            // Initialize hand tracking (async)
            await this.handTracker.init();
            
            // Initialize game engine with dependencies
            this.gameEngine = new GameEngine(this.handTracker, this.renderer);
            
            this.isInitialized = true;
            console.log('Slime Runner initialized successfully!');
            
            // Start game loop
            this.startGameLoop();
            
        } catch (error) {
            console.error('Failed to initialize Slime Runner:', error);
            this.handleInitError(error);
        }
    }

    startGameLoop() {
        const gameLoop = () => {
            if (this.isInitialized) {
                // Update game logic
                this.gameEngine.update();
                
                // Render frame
                this.renderer.render(this.gameEngine);
            }
            
            // Continue loop
            requestAnimationFrame(gameLoop);
        };
        
        // Start the loop
        requestAnimationFrame(gameLoop);
    }

    handleInitError(error) {
        const handStatusEl = document.getElementById('handStatus');
        if (handStatusEl) {
            if (error.name === 'NotAllowedError') {
                handStatusEl.textContent = 'Camera permission denied';
            } else if (error.name === 'NotFoundError') {
                handStatusEl.textContent = 'No camera found';
            } else {
                handStatusEl.textContent = 'Initialization failed';
            }
        }
        
        // Show error message to user
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.textContent = 'Camera Required - Refresh to Retry';
            startButton.disabled = true;
        }
    }

    // Cleanup method for proper resource management
    destroy() {
        if (this.handTracker) {
            this.handTracker.destroy();
        }
        this.isInitialized = false;
    }
}

// Global app instance
let slimeRunnerApp = null;

// Initialize when page loads
window.addEventListener('load', async () => {
    slimeRunnerApp = new SlimeRunnerApp();
    await slimeRunnerApp.init();
});

// Cleanup when page unloads
window.addEventListener('beforeunload', () => {
    if (slimeRunnerApp) {
        slimeRunnerApp.destroy();
    }
});

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (slimeRunnerApp && slimeRunnerApp.gameEngine) {
        if (document.hidden) {
            // Pause game when tab is hidden
            slimeRunnerApp.gameEngine.gameRunning = false;
        }
        // Game will resume when user clicks start again
    }
});

// Error handling for unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});