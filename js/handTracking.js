// Hand Tracking Module
class HandTracker {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.gestureState = 'normal';
        this.handDetected = false;
        this.lastGestureCheck = 0;
        
        // Cache DOM elements
        this.videoElement = null;
        this.handCanvas = null;
        this.handCtx = null;
        this.handStatusEl = null;
        this.gestureIndicatorEl = null;
    }

    async init() {
        // Get DOM elements
        this.videoElement = document.getElementById('videoElement');
        this.handCanvas = document.getElementById('handCanvas');
        this.handCtx = this.handCanvas.getContext('2d');
        this.handStatusEl = document.getElementById('handStatus');
        this.gestureIndicatorEl = document.getElementById('gesture-indicator');

        // Initialize MediaPipe Hands
        this.hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        // Configure hand detection settings
        this.hands.setOptions({
            maxNumHands: CONFIG.HAND_TRACKING.MAX_HANDS,
            modelComplexity: CONFIG.HAND_TRACKING.MODEL_COMPLEXITY,
            minDetectionConfidence: CONFIG.HAND_TRACKING.MIN_DETECTION_CONFIDENCE,
            minTrackingConfidence: CONFIG.HAND_TRACKING.MIN_TRACKING_CONFIDENCE
        });

        // Set up results callback
        this.hands.onResults(this.onResults.bind(this));

        try {
            // Get camera stream
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: CONFIG.HAND_TRACKING.CAMERA_WIDTH, 
                    height: CONFIG.HAND_TRACKING.CAMERA_HEIGHT,
                    facingMode: 'user'
                }
            });
            
            this.videoElement.srcObject = stream;
            
            // Initialize camera
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    await this.hands.send({image: this.videoElement});
                },
                width: CONFIG.HAND_TRACKING.CAMERA_WIDTH,
                height: CONFIG.HAND_TRACKING.CAMERA_HEIGHT
            });
            
            await this.camera.start();
            this.updateHandStatus('Ready!');
            
        } catch (error) {
            console.error('Camera error:', error);
            this.updateHandStatus('No camera');
        }
    }

    onResults(results) {
        const currentTime = Date.now();
        
        // Throttle hand processing for performance
        if (currentTime - this.lastGestureCheck < CONFIG.HAND_TRACKING.GESTURE_CHECK_INTERVAL) {
            return;
        }
        this.lastGestureCheck = currentTime;
        
        // Clear and redraw hand canvas
        this.handCtx.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height);
        this.handCtx.drawImage(results.image, 0, 0, this.handCanvas.width, this.handCanvas.height);

        if (results.multiHandLandmarks?.[0]) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Draw hand connections (simplified for performance)
            drawConnectors(this.handCtx, landmarks, HAND_CONNECTIONS, {
                color: '#00FF00', 
                lineWidth: 1
            });
            
            // Detect gesture
            const isOpen = this.detectOpenHandFast(landmarks);
            this.gestureState = isOpen ? 'jump' : 'crouch';
            this.handDetected = true;
            this.updateHandStatus(`Hand: ${this.gestureState.toUpperCase()}`);
        } else {
            this.handDetected = false;
            this.gestureState = 'normal';
            this.updateHandStatus('No hand');
        }
        
        this.updateGestureIndicator();
    }

    // Optimized gesture detection - only checks key fingers
    detectOpenHandFast(landmarks) {
        // Check only 3 key fingers for performance
        const fingerTips = [8, 12, 16]; // Index, Middle, Ring
        const fingerJoints = [6, 10, 14]; // Respective joints
        
        let extendedFingers = 0;
        
        for (let i = 0; i < fingerTips.length; i++) {
            const tipY = landmarks[fingerTips[i]].y;
            const jointY = landmarks[fingerJoints[i]].y;
            
            // Finger is extended if tip is above joint
            if (tipY < jointY) {
                extendedFingers++;
            }
        }
        
        // Hand is "open" if 2 or more fingers are extended
        return extendedFingers >= 2;
    }

    updateHandStatus(message) {
        if (this.handStatusEl) {
            this.handStatusEl.textContent = message;
        }
    }

    updateGestureIndicator() {
        if (!this.gestureIndicatorEl) return;
        
        const gestureTexts = {
            jump: 'JUMP 🖐️',
            crouch: 'CROUCH ✊',
            normal: 'RUN →'
        };
        
        const text = gestureTexts[this.gestureState] || gestureTexts.normal;
        this.gestureIndicatorEl.textContent = text;
        this.gestureIndicatorEl.className = `gesture-indicator ${this.gestureState}`;
    }

    // Getters for game engine
    getGestureState() {
        return this.gestureState;
    }

    isHandDetected() {
        return this.handDetected;
    }

    // Cleanup method
    destroy() {
        if (this.camera) {
            this.camera.stop();
        }
        if (this.videoElement && this.videoElement.srcObject) {
            const tracks = this.videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    }
}