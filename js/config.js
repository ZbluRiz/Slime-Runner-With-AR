// Game Configuration
const CONFIG = {
    // Canvas settings
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 400,
    
    // Game physics
    GRAVITY: 0.4,
    JUMP_FORCE: -15,
    INITIAL_GAME_SPEED: 1.5,
    SPEED_INCREMENT: 0.3,
    SCORE_PER_OBSTACLE: 10,
    SCORE_FOR_SPEED_UP: 150,
    
    // Player settings
    PLAYER: {
        X: 100,
        Y: 280,
        WIDTH: 50,
        HEIGHT: 50,
        COLOR: '#5845eaff',
        BOUNCE_SPEED: 0.15
    },
    
    // World settings
    GROUND_Y: 320,
    
    // Object limits for performance
    MAX_OBSTACLES: 3,
    MAX_CLOUDS: 3,
    
    // Obstacle generation
    OBSTACLE_SPACING: 400,
    OBSTACLE_WIDTH: 20,
    LOW_OBSTACLE_HEIGHT: 30,
    HIGH_OBSTACLE_HEIGHT: 60,
    
    // Cloud settings
    CLOUD_SPEED_MULTIPLIER: 0.3,
    CLOUD_MIN_WIDTH: 60,
    CLOUD_MAX_WIDTH: 100,
    CLOUD_MIN_HEIGHT: 30,
    CLOUD_MAX_HEIGHT: 50,
    CLOUD_MIN_Y: 50,
    CLOUD_MAX_Y: 150,
    
    // Hand tracking settings
    HAND_TRACKING: {
        MAX_HANDS: 1,
        MODEL_COMPLEXITY: 0,
        MIN_DETECTION_CONFIDENCE: 0.5,
        MIN_TRACKING_CONFIDENCE: 0.5,
        GESTURE_CHECK_INTERVAL: 100, // ms
        CAMERA_WIDTH: 320,
        CAMERA_HEIGHT: 240
    },
    
    // Colors
    COLORS: {
        SKY: '#87CEEB',
        GROUND: '#32CD32',
        GROUND_LINE: '#228B22',
        OBSTACLE: '#05041aff',
        CLOUD: 'rgba(255, 255, 255, 0.8)',
        UI_GOLD: '#FFD700'
    },
    
    // Animation constants
    PI2: Math.PI * 2,
    HALF_PI: Math.PI * 0.5,
    
    // Collision detection
    CROUCH_HEIGHT_MULTIPLIER: 0.6,
    CROUCH_Y_OFFSET_MULTIPLIER: 0.4
};