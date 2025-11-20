// ADDED BY AGENT: 2025-01-27
// Rocket Dodge Game - Interactive JavaScript game with initGame API for embedding
// Supports both standalone and embedded usage

(function() {
    'use strict';

    // Game state
    let gameInstance = null;
    let canvas, ctx;
    let gameRunning = false;
    let score = 0;
    let highScore = localStorage.getItem('rocketDodgeHighScore') || 0;
    let level = 1;
    let frameCount = 0;
    let animationId = null;

    // Rocket Variables
    const rocket = {
        x: 100,
        y: 0,
        width: 40,
        height: 40,
        velocity: 0,
        gravity: 0.5,
        boost: -10,
        hasShield: false,
        shieldTime: 0,
        rotation: 0
    };

    // Game Objects
    let obstacles = [];
    let stars = [];
    let powerUps = [];
    let particles = [];
    let confettiParticles = [];

    // Game Settings
    const obstacleSpeed = 2.5;
    const obstacleGap = 250;
    const obstacleFrequency = 140;

    // Background music (optional, muted by default)
    let bgMusic = null;

    /**
     * Initialize the game in a container
     * @param {string} containerSelector - CSS selector for the container element
     * @param {Object} options - Configuration options
     * @param {number} options.width - Canvas width (default: 800)
     * @param {number} options.height - Canvas height (default: 600)
     * @param {boolean} options.music - Enable background music (default: false)
     */
    function initGame(containerSelector, options = {}) {
        const container = typeof containerSelector === 'string' 
            ? document.querySelector(containerSelector)
            : containerSelector;

        if (!container) {
            console.error('Game container not found:', containerSelector);
            return;
        }

        // Default options
        const config = {
            width: options.width || 800,
            height: options.height || 600,
            music: options.music || false
        };

        // Create canvas if it doesn't exist
        let existingCanvas = container.querySelector('canvas');
        if (existingCanvas) {
            canvas = existingCanvas;
            // Use existing dimensions if set, otherwise use config
            if (!canvas.width || canvas.width === 300) {
                canvas.width = config.width;
            }
            if (!canvas.height || canvas.height === 150) {
                canvas.height = config.height;
            }
        } else {
            canvas = document.createElement('canvas');
            canvas.id = 'gameCanvas';
            canvas.width = config.width;
            canvas.height = config.height;
            container.appendChild(canvas);
        }

        ctx = canvas.getContext('2d');

        // Initialize rocket position
        rocket.y = canvas.height / 2;

        // Setup music if enabled
        if (config.music) {
            try {
                bgMusic = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b5b8b6b2.mp3');
                bgMusic.loop = true;
                bgMusic.volume = 0.25;
            } catch(e) {
                console.warn('Could not load background music:', e);
            }
        }

        // Reset game state
        resetGame();

        // Setup event listeners
        setupEventListeners();

        // Draw start screen
        drawStartScreen();

        // Update score display
        updateScoreDisplay();

        gameInstance = {
            canvas: canvas,
            start: startGame,
            restart: restartGame,
            stop: stopGame
        };

        return gameInstance;
    }

    /**
     * Setup event listeners for game controls
     */
    function setupEventListeners() {
        // Remove existing listeners if any
        canvas.removeEventListener('click', handleInput);
        document.removeEventListener('keydown', handleKeyDown);

        // Add new listeners
        canvas.addEventListener('click', handleInput);
        document.addEventListener('keydown', handleKeyDown);

        // Touch support for mobile
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleInput();
        });
    }

    /**
     * Handle keyboard input
     */
    function handleKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            handleInput();
        }
    }

    /**
     * Handle input (click, space, touch)
     */
    function handleInput() {
        if (!gameRunning) {
            try {
                if (bgMusic) {
                    bgMusic.currentTime = 0;
                    bgMusic.play();
                }
            } catch(e) {}
            startGame();
        } else {
            rocket.velocity = rocket.boost;
            createBoostParticles();
        }
    }

    /**
     * Reset game state
     */
    function resetGame() {
        gameRunning = false;
        score = 0;
        level = 1;
        frameCount = 0;
        obstacles = [];
        stars = [];
        powerUps = [];
        particles = [];
        confettiParticles = [];
        rocket.y = canvas.height / 2;
        rocket.velocity = 0;
        rocket.hasShield = false;
        rocket.shieldTime = 0;
    }

    /**
     * Start the game
     */
    function startGame() {
        resetGame();
        gameRunning = true;
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        gameLoop();
    }

    /**
     * Restart the game
     */
    function restartGame() {
        startGame();
    }

    /**
     * Stop the game
     */
    function stopGame() {
        gameRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        try {
            if (bgMusic) bgMusic.pause();
        } catch(e) {}
    }

    /**
     * Draw start screen
     */
    function drawStartScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click or Press SPACE to Start!', canvas.width / 2, canvas.height / 2);
        
        // Draw sample rocket
        drawRocket(canvas.width / 2 - 50, canvas.height / 2 + 50);
    }

    /**
     * Main game loop
     */
    function gameLoop() {
        if (!gameRunning || document.hidden) {
            return;
        }
        
        frameCount++;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update level based on score
        level = Math.floor(score / 500) + 1;
        
        // Update rocket
        updateRocket();
        
        // Generate obstacles
        if (frameCount % (obstacleFrequency - level * 5) === 0) {
            createObstacle();
        }
        
        // Generate stars
        if (frameCount % 80 === 0) {
            createStar();
        }
        
        // Generate power-ups
        if (frameCount % 300 === 0) {
            createPowerUp();
        }
        
        // Update and draw game objects
        updateObstacles();
        updateStars();
        updatePowerUps();
        updateParticles();
        updateConfetti();
        
        // Draw rocket
        drawRocket(rocket.x, rocket.y);
        
        // Draw shield if active
        if (rocket.hasShield) {
            drawShield();
        }
        
        // Update score
        score += 1;
        updateScoreDisplay();
        
        // Continue game loop
        animationId = requestAnimationFrame(gameLoop);
    }

    /**
     * Update rocket position and state
     */
    function updateRocket() {
        rocket.velocity += rocket.gravity;
        rocket.y += rocket.velocity;
        rocket.rotation = rocket.velocity * 0.05;
        
        // Update shield timer
        if (rocket.hasShield) {
            rocket.shieldTime--;
            if (rocket.shieldTime <= 0) {
                rocket.hasShield = false;
            }
        }
        
        // Check boundaries
        if (rocket.y + rocket.height > canvas.height || rocket.y < 0) {
            if (!rocket.hasShield) {
                endGame();
            } else {
                rocket.y = Math.max(0, Math.min(canvas.height - rocket.height, rocket.y));
                rocket.velocity = 0;
            }
        }
    }

    /**
     * Draw the rocket
     */
    function drawRocket(x, y) {
        ctx.save();
        ctx.translate(x + rocket.width / 2, y + rocket.height / 2);
        ctx.rotate(rocket.rotation);
        
        // Rocket body (rounded)
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(-rocket.width / 2, rocket.height / 2);
        ctx.lineTo(-rocket.width / 2, -rocket.height / 2 + 10);
        ctx.quadraticCurveTo(-rocket.width / 2, -rocket.height / 2, 0, -rocket.height / 2 - 10);
        ctx.quadraticCurveTo(rocket.width / 2, -rocket.height / 2, rocket.width / 2, -rocket.height / 2 + 10);
        ctx.lineTo(rocket.width / 2, rocket.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Rocket window
        ctx.fillStyle = '#4ecdc4';
        ctx.beginPath();
        ctx.arc(0, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Rocket flames
        if (gameRunning) {
            ctx.save();
            ctx.rotate(Math.random() * 0.1 - 0.05);
            ctx.fillStyle = '#ffd93d';
            ctx.beginPath();
            ctx.moveTo(-rocket.width / 2, rocket.height / 2);
            ctx.lineTo(-rocket.width / 2 - 15, rocket.height / 2 + Math.random() * 20);
            ctx.lineTo(-rocket.width / 2, rocket.height / 2 - 10);
            ctx.fill();
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.moveTo(-rocket.width / 2, rocket.height / 2 - 10);
            ctx.lineTo(-rocket.width / 2 - 10, rocket.height / 2 + Math.random() * 15);
            ctx.lineTo(-rocket.width / 2, rocket.height / 2 - 20);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    /**
     * Create a new obstacle
     */
    function createObstacle() {
        const minHeight = 80;
        const maxHeight = canvas.height - obstacleGap - minHeight;
        const topHeight = Math.random() * maxHeight + minHeight;
        obstacles.push({
            x: canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + obstacleGap,
            width: 80,
            passed: false
        });
    }

    /**
     * Update and draw obstacles
     */
    function updateObstacles() {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.x -= obstacleSpeed + level * 0.5;
            
            // Draw obstacle (rounded, gradient)
            let grad = ctx.createLinearGradient(obs.x, 0, obs.x + obs.width, 0);
            grad.addColorStop(0, '#e74c3c');
            grad.addColorStop(1, '#ffb347');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(obs.x, 0);
            ctx.lineTo(obs.x + obs.width, 0);
            ctx.lineTo(obs.x + obs.width, obs.topHeight - 20);
            ctx.quadraticCurveTo(obs.x + obs.width / 2, obs.topHeight, obs.x, obs.topHeight - 20);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.bottomY + 20);
            ctx.quadraticCurveTo(obs.x + obs.width / 2, obs.bottomY, obs.x + obs.width, obs.bottomY + 20);
            ctx.lineTo(obs.x + obs.width, canvas.height);
            ctx.lineTo(obs.x, canvas.height);
            ctx.closePath();
            ctx.fill();
            
            // Add shine effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(obs.x, 0, 10, obs.topHeight);
            ctx.fillRect(obs.x, obs.bottomY, 10, canvas.height - obs.bottomY);
            
            // Check collision
            if (checkCollision(rocket, obs)) {
                if (rocket.hasShield) {
                    rocket.hasShield = false;
                    rocket.shieldTime = 0;
                    createExplosion(rocket.x, rocket.y, '#4ecdc4');
                } else {
                    endGame();
                }
            }
            
            // Award points for passing
            if (!obs.passed && obs.x + obs.width < rocket.x) {
                obs.passed = true;
                score += 50;
            }
            
            // Remove off-screen obstacles
            if (obs.x + obs.width < 0) {
                obstacles.splice(i, 1);
            }
        }
    }

    /**
     * Create a collectible star
     */
    function createStar() {
        stars.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 60) + 30,
            size: 15,
            collected: false
        });
    }

    /**
     * Update and draw stars
     */
    function updateStars() {
        for (let i = stars.length - 1; i >= 0; i--) {
            const star = stars[i];
            star.x -= obstacleSpeed + level * 0.5;
            
            // Draw star
            if (!star.collected) {
                ctx.save();
                ctx.translate(star.x, star.y);
                ctx.rotate(frameCount * 0.05);
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                for (let j = 0; j < 5; j++) {
                    ctx.lineTo(Math.cos((j * 4 * Math.PI) / 5) * star.size, 
                              Math.sin((j * 4 * Math.PI) / 5) * star.size);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                
                // Check collection
                const dist = Math.hypot(rocket.x + rocket.width / 2 - star.x, 
                                       rocket.y + rocket.height / 2 - star.y);
                if (dist < star.size + rocket.width / 2) {
                    star.collected = true;
                    score += 100;
                    createExplosion(star.x, star.y, '#ffd700');
                }
            }
            
            // Remove off-screen stars
            if (star.x < -star.size) {
                stars.splice(i, 1);
            }
        }
    }

    /**
     * Create a power-up
     */
    function createPowerUp() {
        powerUps.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 60) + 30,
            size: 20,
            collected: false,
            type: 'shield'
        });
    }

    /**
     * Update and draw power-ups
     */
    function updatePowerUps() {
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];
            powerUp.x -= obstacleSpeed + level * 0.5;
            
            // Draw power-up
            if (!powerUp.collected) {
                ctx.fillStyle = '#4ecdc4';
                ctx.beginPath();
                ctx.arc(powerUp.x, powerUp.y, powerUp.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('💎', powerUp.x, powerUp.y + 6);
                
                // Check collection
                const dist = Math.hypot(rocket.x + rocket.width / 2 - powerUp.x, 
                                       rocket.y + rocket.height / 2 - powerUp.y);
                if (dist < powerUp.size + rocket.width / 2) {
                    powerUp.collected = true;
                    rocket.hasShield = true;
                    rocket.shieldTime = 300;
                    createExplosion(powerUp.x, powerUp.y, '#4ecdc4');
                }
            }
            
            // Remove off-screen power-ups
            if (powerUp.x < -powerUp.size) {
                powerUps.splice(i, 1);
            }
        }
    }

    /**
     * Draw shield effect
     */
    function drawShield() {
        ctx.strokeStyle = `rgba(78, 205, 196, ${rocket.shieldTime / 300})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rocket.x + rocket.width / 2, rocket.y + rocket.height / 2, 
                rocket.width, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * Check collision between rocket and obstacle
     */
    function checkCollision(rocket, obstacle) {
        return rocket.x < obstacle.x + obstacle.width &&
               rocket.x + rocket.width > obstacle.x &&
               (rocket.y < obstacle.topHeight || 
                rocket.y + rocket.height > obstacle.bottomY);
    }

    /**
     * Create boost particles
     */
    function createBoostParticles() {
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: rocket.x,
                y: rocket.y + rocket.height / 2,
                vx: -Math.random() * 3 - 1,
                vy: Math.random() * 4 - 2,
                size: Math.random() * 4 + 2,
                color: '#ffd93d',
                life: 30
            });
        }
    }

    /**
     * Create explosion effect
     */
    function createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * (Math.random() * 4 + 2),
                vy: Math.sin(angle) * (Math.random() * 4 + 2),
                size: Math.random() * 6 + 3,
                color: color,
                life: 40
            });
        }
    }

    /**
     * Update and draw particles
     */
    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            // Draw particle
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 40;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            // Remove dead particles
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    /**
     * Create confetti effect
     */
    function createConfetti() {
        for (let i = 0; i < 120; i++) {
            confettiParticles.push({
                x: Math.random() * canvas.width,
                y: -20,
                vx: Math.random() * 4 - 2,
                vy: Math.random() * 4 + 2,
                size: Math.random() * 8 + 4,
                color: `hsl(${Math.random() * 360}, 80%, 60%)`,
                life: Math.random() * 60 + 60
            });
        }
    }

    /**
     * Update and draw confetti
     */
    function updateConfetti() {
        for (let i = confettiParticles.length - 1; i >= 0; i--) {
            const c = confettiParticles[i];
            c.x += c.vx;
            c.y += c.vy;
            c.vy += 0.05;
            c.life--;
            ctx.save();
            ctx.globalAlpha = Math.max(0, c.life / 120);
            ctx.fillStyle = c.color;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            if (c.life <= 0 || c.y > canvas.height + 20) {
                confettiParticles.splice(i, 1);
            }
        }
    }

    /**
     * Update score display
     */
    function updateScoreDisplay() {
        const scoreDisplay = document.getElementById('scoreDisplay');
        const highScoreDisplay = document.getElementById('highScoreDisplay');
        const levelDisplay = document.getElementById('levelDisplay');
        
        if (scoreDisplay) scoreDisplay.textContent = score;
        if (highScoreDisplay) highScoreDisplay.textContent = highScore;
        if (levelDisplay) levelDisplay.textContent = level;
    }

    /**
     * End the game
     */
    function endGame() {
        gameRunning = false;
        try {
            if (bgMusic) bgMusic.pause();
        } catch(e) {}
        
        createConfetti();
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('rocketDodgeHighScore', highScore);
        }
        
        // Show game over screen
        const gameOverScreen = document.getElementById('gameOverScreen');
        const finalScore = document.getElementById('finalScore');
        const finalHighScore = document.getElementById('finalHighScore');
        
        if (gameOverScreen) gameOverScreen.style.display = 'block';
        if (finalScore) finalScore.textContent = score;
        if (finalHighScore) finalHighScore.textContent = highScore;
        
        updateScoreDisplay();
        
        // Play confetti for a few seconds
        let confettiFrames = 0;
        function confettiLoop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            updateConfetti();
            if (confettiFrames++ < 120) {
                requestAnimationFrame(confettiLoop);
            }
        }
        confettiLoop();
    }

    // Handle page visibility to pause game
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && gameRunning) {
            // Game will pause naturally in gameLoop
        }
    });

    // Auto-initialize if canvas exists on page load (standalone mode)
    function autoInit() {
        const existingCanvas = document.getElementById('gameCanvas');
        if (existingCanvas && !gameInstance) {
            // Find the parent container
            const container = existingCanvas.parentElement;
            if (container) {
                initGame(container, { 
                    width: existingCanvas.width || 800, 
                    height: existingCanvas.height || 600 
                });
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

    // Export initGame function globally
    window.initGame = initGame;

})();
