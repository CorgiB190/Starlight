let games = [];
let searchQuery = '';
let currentCategory = 'All';

const gridView = document.getElementById('grid-view');
const playerView = document.getElementById('player-view');
const searchInput = document.getElementById('search-input');
const categoryBtns = document.querySelectorAll('.category-btn');
const gameIframe = document.getElementById('game-iframe');
const internalGameContainer = document.getElementById('internal-game-container');
const gameCanvas = document.getElementById('game-canvas');
const gameOverlay = document.getElementById('game-overlay');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const currentGameTitle = document.getElementById('current-game-title');
const playingStatus = document.getElementById('playing-status');
const openTabBtn = document.getElementById('open-tab-btn');

let currentGameId = null;
let snakeGame = null;
let breakoutGame = null;
let pingPongGame = null;

class PingPongGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.score1 = 0;
        this.score2 = 0;
        this.isGameOver = false;
        this.isStarted = false;
        this.gameLoop = null;
        this.mode = 'ai'; // 'ai' or '2p'
        
        // Paddles
        this.paddleWidth = 15;
        this.paddleHeight = 100;
        this.paddle1Y = 0;
        this.paddle2Y = 0;
        this.paddleSpeed = 8;
        
        // Ball
        this.ballRadius = 8;
        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;
        this.initialSpeed = 5;
        
        this.keys = {};
        
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    start() {
        this.resize();
        this.reset();
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        
        // Show start screen
        this.isStarted = false;
        gameOverlay.classList.remove('hidden');
        document.getElementById('overlay-title').textContent = "PING PONG";
        document.getElementById('overlay-title').classList.add('glow-text');
        overlayScore.innerHTML = `
            <div class="flex flex-col gap-4 items-center">
                <p class="text-xl font-bold text-purple-400 uppercase">CHOOSE MODE</p>
                <div class="flex gap-4">
                    <button id="mode-ai" class="bg-white/10 border-2 border-white/20 px-4 py-2 rounded-xl hover:bg-purple-600 transition-all font-bold uppercase italic">VS AI</button>
                    <button id="mode-2p" class="bg-white/10 border-2 border-white/20 px-4 py-2 rounded-xl hover:bg-purple-600 transition-all font-bold uppercase italic">2 PLAYER</button>
                </div>
                <p class="text-xs text-white/60 mt-2">P1: W/S | P2: UP/DOWN</p>
            </div>
        `;
        
        document.getElementById('mode-ai').onclick = () => { this.mode = 'ai'; this.begin(); };
        document.getElementById('mode-2p').onclick = () => { this.mode = '2p'; this.begin(); };
        
        restartBtn.classList.add('hidden');
        this.draw();
    }

    begin() {
        this.isStarted = true;
        gameOverlay.classList.add('hidden');
        restartBtn.classList.remove('hidden');
        restartBtn.textContent = "PLAY AGAIN!";
        this.resetBall();
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    stop() {
        if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }

    reset() {
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        this.paddle1Y = (height - this.paddleHeight) / 2;
        this.paddle2Y = (height - this.paddleHeight) / 2;
        this.score1 = 0;
        this.score2 = 0;
        this.isGameOver = false;
        this.resetBall();
    }

    resetBall() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        this.x = width / 2;
        this.y = height / 2;
        this.dx = (Math.random() > 0.5 ? 1 : -1) * this.initialSpeed;
        this.dy = (Math.random() * 2 - 1) * this.initialSpeed;
    }

    resize() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 450;
        
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;
        if (['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S'].includes(e.key)) {
            e.preventDefault();
        }
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    update() {
        if (this.isGameOver || !this.isStarted) return;

        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        // Player 1 Movement (W/S)
        if ((this.keys['w'] || this.keys['W']) && this.paddle1Y > 0) {
            this.paddle1Y -= this.paddleSpeed;
        }
        if ((this.keys['s'] || this.keys['S']) && this.paddle1Y < height - this.paddleHeight) {
            this.paddle1Y += this.paddleSpeed;
        }

        // Player 2 or AI Movement
        if (this.mode === '2p') {
            if (this.keys['ArrowUp'] && this.paddle2Y > 0) {
                this.paddle2Y -= this.paddleSpeed;
            }
            if (this.keys['ArrowDown'] && this.paddle2Y < height - this.paddleHeight) {
                this.paddle2Y += this.paddleSpeed;
            }
        } else {
            // AI Logic
            const paddle2Center = this.paddle2Y + this.paddleHeight / 2;
            if (paddle2Center < this.y - 10) {
                this.paddle2Y += this.paddleSpeed * 0.8;
            } else if (paddle2Center > this.y + 10) {
                this.paddle2Y -= this.paddleSpeed * 0.8;
            }
            // Clamp AI paddle
            if (this.paddle2Y < 0) this.paddle2Y = 0;
            if (this.paddle2Y > height - this.paddleHeight) this.paddle2Y = height - this.paddleHeight;
        }

        // Ball movement
        this.x += this.dx;
        this.y += this.dy;

        // Wall bounce (Top/Bottom)
        if (this.y < this.ballRadius || this.y > height - this.ballRadius) {
            this.dy = -this.dy;
        }

        // Paddle Collision (Player 1)
        if (this.x < this.paddleWidth + this.ballRadius) {
            if (this.y > this.paddle1Y && this.y < this.paddle1Y + this.paddleHeight) {
                this.dx = -this.dx * 1.05; // Speed up slightly
                this.x = this.paddleWidth + this.ballRadius;
                // Angle based on hit position
                const deltaY = this.y - (this.paddle1Y + this.paddleHeight / 2);
                this.dy = deltaY * 0.2;
            } else if (this.x < 0) {
                this.score2++;
                this.resetBall();
                if (this.score2 >= 10) this.gameOver(2);
            }
        }

        // Paddle Collision (Player 2)
        if (this.x > width - this.paddleWidth - this.ballRadius) {
            if (this.y > this.paddle2Y && this.y < this.paddle2Y + this.paddleHeight) {
                this.dx = -this.dx * 1.05; // Speed up slightly
                this.x = width - this.paddleWidth - this.ballRadius;
                // Angle based on hit position
                const deltaY = this.y - (this.paddle2Y + this.paddleHeight / 2);
                this.dy = deltaY * 0.2;
            } else if (this.x > width) {
                this.score1++;
                this.resetBall();
                if (this.score1 >= 10) this.gameOver(1);
            }
        }

        this.draw();
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    draw() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        this.ctx.clearRect(0, 0, width, height);
        
        // Background
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, width, height);

        // Center Line
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(width / 2, 0);
        this.ctx.lineTo(width / 2, height);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Paddles
        this.ctx.fillStyle = '#a855f7';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#a855f7';
        this.ctx.fillRect(0, this.paddle1Y, this.paddleWidth, this.paddleHeight);
        this.ctx.fillRect(width - this.paddleWidth, this.paddle2Y, this.paddleWidth, this.paddleHeight);
        this.ctx.shadowBlur = 0;

        // Ball
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.ballRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fill();
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = "#ffffff";
        this.ctx.closePath();
        this.ctx.shadowBlur = 0;

        // Scores
        this.ctx.font = 'black 48px Fredoka';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.score1, width / 4, 60);
        this.ctx.fillText(this.score2, (width / 4) * 3, 60);
    }

    gameOver(winner) {
        this.isGameOver = true;
        gameOverlay.classList.remove('hidden');
        restartBtn.classList.remove('hidden');
        document.getElementById('overlay-title').textContent = winner === 1 ? "PLAYER 1 WINS!" : (this.mode === 'ai' ? "AI WINS!" : "PLAYER 2 WINS!");
        overlayScore.textContent = `FINAL SCORE: ${this.score1} - ${this.score2}`;
    }
}

class BreakoutGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.score = 0;
        this.isGameOver = false;
        this.isStarted = false;
        this.gameLoop = null;
        
        // Paddle
        this.paddleHeight = 15;
        this.paddleWidth = 100;
        this.paddleX = 0;
        
        // Ball
        this.ballRadius = 8;
        this.x = 0;
        this.y = 0;
        this.dx = 4;
        this.dy = -4;
        
        // Bricks
        this.brickRowCount = 5;
        this.brickColumnCount = 8;
        this.brickWidth = 75;
        this.brickHeight = 20;
        this.brickPadding = 10;
        this.brickOffsetTop = 50;
        this.brickOffsetLeft = 30;
        this.bricks = [];
        
        this.rightPressed = false;
        this.leftPressed = false;
        
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
    }

    start() {
        this.resize();
        this.reset();
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('mousemove', this.handleMouseMove);
        
        // Show start screen
        this.isStarted = false;
        gameOverlay.classList.remove('hidden');
        document.getElementById('overlay-title').textContent = "ATARI BREAKOUT";
        overlayScore.textContent = "DESTROY ALL BRICKS!";
        restartBtn.textContent = "PLAY GAME!";
        
        this.draw();
    }

    begin() {
        this.isStarted = true;
        gameOverlay.classList.add('hidden');
        restartBtn.textContent = "PLAY AGAIN!";
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    stop() {
        if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('mousemove', this.handleMouseMove);
    }

    reset() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        this.paddleX = (width - this.paddleWidth) / 2;
        this.x = width / 2;
        this.y = height - 30;
        this.dx = 4;
        this.dy = -4;
        this.score = 0;
        this.isGameOver = false;
        
        this.bricks = [];
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                this.bricks[c][r] = { x: 0, y: 0, status: 1 };
            }
        }
        gameOverlay.classList.add('hidden');
    }

    resize() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 450;
        
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Adjust brick width based on canvas width
        const availableWidth = width - (this.brickOffsetLeft * 2);
        this.brickWidth = (availableWidth - (this.brickPadding * (this.brickColumnCount - 1))) / this.brickColumnCount;
    }

    handleKeyDown(e) {
        if (e.key === "Right" || e.key === "ArrowRight") this.rightPressed = true;
        else if (e.key === "Left" || e.key === "ArrowLeft") this.leftPressed = true;
    }

    handleKeyUp(e) {
        if (e.key === "Right" || e.key === "ArrowRight") this.rightPressed = false;
        else if (e.key === "Left" || e.key === "ArrowLeft") this.leftPressed = false;
    }

    handleMouseMove(e) {
        const relativeX = e.clientX - this.canvas.getBoundingClientRect().left;
        if (relativeX > 0 && relativeX < this.canvas.width / (window.devicePixelRatio || 1)) {
            this.paddleX = relativeX - this.paddleWidth / 2;
        }
    }

    collisionDetection() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const b = this.bricks[c][r];
                if (b.status === 1) {
                    if (this.x > b.x && this.x < b.x + this.brickWidth && this.y > b.y && this.y < b.y + this.brickHeight) {
                        this.dy = -this.dy;
                        b.status = 0;
                        this.score += 10;
                        if (this.score === this.brickRowCount * this.brickColumnCount * 10) {
                            this.gameOver(true);
                        }
                    }
                }
            }
        }
    }

    update() {
        if (this.isGameOver || !this.isStarted) return;

        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        if (this.x + this.dx > width - this.ballRadius || this.x + this.dx < this.ballRadius) {
            this.dx = -this.dx;
        }
        if (this.y + this.dy < this.ballRadius) {
            this.dy = -this.dy;
        } else if (this.y + this.dy > height - this.paddleHeight - 10 - this.ballRadius) {
            if (this.x > this.paddleX && this.x < this.paddleX + this.paddleWidth) {
                if (this.dy > 0) {
                    this.dy = -this.dy;
                    // Add some variety to bounce
                    this.dx = 8 * ((this.x - (this.paddleX + this.paddleWidth / 2)) / this.paddleWidth);
                    // Snap ball to top of paddle to prevent phasing
                    this.y = height - this.paddleHeight - 10 - this.ballRadius;
                }
            } else if (this.y + this.dy > height - this.ballRadius) {
                this.gameOver(false);
                return;
            }
        }

        if (this.rightPressed && this.paddleX < width - this.paddleWidth) {
            this.paddleX += 7;
        } else if (this.leftPressed && this.paddleX > 0) {
            this.paddleX -= 7;
        }

        this.x += this.dx;
        this.y += this.dy;

        this.collisionDetection();
        this.draw();
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    draw() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        this.ctx.clearRect(0, 0, width, height);
        
        // Background
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, width, height);

        // Bricks
        const colors = ['#ff4444', '#ff8844', '#ffff44', '#44ff44', '#4444ff'];
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    const brickX = c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                    const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                    this.bricks[c][r].x = brickX;
                    this.bricks[c][r].y = brickY;
                    this.ctx.beginPath();
                    this.ctx.rect(brickX, brickY, this.brickWidth, this.brickHeight);
                    this.ctx.fillStyle = colors[r % colors.length];
                    this.ctx.fill();
                    this.ctx.closePath();
                }
            }
        }

        // Ball
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.ballRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fill();
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = "#ffffff";
        this.ctx.closePath();
        this.ctx.shadowBlur = 0;

        // Paddle
        this.ctx.beginPath();
        this.ctx.rect(this.paddleX, height - this.paddleHeight - 10, this.paddleWidth, this.paddleHeight);
        this.ctx.fillStyle = "#a855f7";
        this.ctx.fill();
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = "#a855f7";
        this.ctx.closePath();
        this.ctx.shadowBlur = 0;
    }

    gameOver(win) {
        this.isGameOver = true;
        gameOverlay.classList.remove('hidden');
        document.getElementById('overlay-title').textContent = win ? "YOU WIN!" : "GAME OVER";
        document.getElementById('overlay-title').classList.add('glow-text');
        overlayScore.textContent = `SCORE: ${this.score}`;
    }
}

class SnakeGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 35; // Thicker snake
        this.cols = 18;     // Fixed smaller map width
        this.rows = 12;     // Fixed smaller map height
        this.score = 0;
        this.snake = [];
        this.food = { x: 5, y: 5 };
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.gameLoop = null;
        this.isGameOver = false;
        this.speed = 150;
        this.offsetX = 0;
        this.offsetY = 0;

        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    start() {
        this.resize();
        this.reset();
        this.draw();
        window.addEventListener('keydown', this.handleKeyDown);
        this.resizeHandler = () => {
            this.resize();
            this.draw();
        };
        window.addEventListener('resize', this.resizeHandler);
        this.gameLoop = setInterval(() => this.update(), this.speed);
    }

    stop() {
        if (this.gameLoop) clearInterval(this.gameLoop);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('resize', this.resizeHandler);
    }

    reset() {
        const midX = Math.floor(this.cols / 2);
        const midY = Math.floor(this.rows / 2);
        this.snake = [
            { x: midX, y: midY },
            { x: midX - 1, y: midY },
            { x: midX - 2, y: midY }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.isGameOver = false;
        this.speed = 150;
        this.spawnFood();
        gameOverlay.classList.add('hidden');
    }

    resize() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 450;
        
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Calculate offsets to center the fixed-size grid
        this.offsetX = Math.floor((width - (this.cols * this.gridSize)) / 2);
        this.offsetY = Math.floor((height - (this.rows * this.gridSize)) / 2);
    }

    spawnFood() {
        this.food = {
            x: Math.floor(Math.random() * this.cols),
            y: Math.floor(Math.random() * this.rows)
        };
        if (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y)) {
            this.spawnFood();
        }
    }

    handleKeyDown(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
        switch (e.key) {
            case 'ArrowUp': if (this.direction.y === 0) this.nextDirection = { x: 0, y: -1 }; break;
            case 'ArrowDown': if (this.direction.y === 0) this.nextDirection = { x: 0, y: 1 }; break;
            case 'ArrowLeft': if (this.direction.x === 0) this.nextDirection = { x: -1, y: 0 }; break;
            case 'ArrowRight': if (this.direction.x === 0) this.nextDirection = { x: 1, y: 0 }; break;
        }
    }

    update() {
        if (this.isGameOver) return;

        this.direction = this.nextDirection;
        const head = { x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y };

        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            this.gameOver();
            return;
        }

        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.spawnFood();
            if (this.speed > 60) {
                clearInterval(this.gameLoop);
                this.speed -= 2;
                this.gameLoop = setInterval(() => this.update(), this.speed);
            }
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    draw() {
        const dpr = window.devicePixelRatio || 1;
        const width = this.canvas.width / dpr;
        const height = this.canvas.height / dpr;
        
        // Background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, width, height);

        // Draw Map Border
        this.ctx.strokeStyle = '#a855f7';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(
            this.offsetX - 2, 
            this.offsetY - 2, 
            (this.cols * this.gridSize) + 4, 
            (this.rows * this.gridSize) + 4
        );

        // Draw Map Background
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(
            this.offsetX, 
            this.offsetY, 
            this.cols * this.gridSize, 
            this.rows * this.gridSize
        );

        // Draw food
        this.ctx.fillStyle = '#facc15';
        this.ctx.beginPath();
        this.ctx.arc(
            this.offsetX + this.food.x * this.gridSize + this.gridSize / 2,
            this.offsetY + this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 4,
            0, Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#facc15';
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#a855f7' : '#ffffff';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            
            const x = this.offsetX + segment.x * this.gridSize;
            const y = this.offsetY + segment.y * this.gridSize;
            const size = this.gridSize - 2;

            if (index === 0) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#a855f7';
            }
            this.ctx.fillRect(x + 1, y + 1, size, size);
            this.ctx.strokeRect(x + 1, y + 1, size, size);
            this.ctx.shadowBlur = 0;

            if (index === 0) {
                this.ctx.fillStyle = '#000';
                const eyeSize = 4;
                const eyeOffset = this.gridSize / 4;
                if (this.direction.x === 1) {
                    this.ctx.fillRect(x + this.gridSize - 10, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.gridSize - 10, y + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.direction.x === -1) {
                    this.ctx.fillRect(x + 6, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 6, y + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.direction.y === 1) {
                    this.ctx.fillRect(x + eyeOffset, y + this.gridSize - 10, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.gridSize - eyeOffset - eyeSize, y + this.gridSize - 10, eyeSize, eyeSize);
                } else {
                    this.ctx.fillRect(x + eyeOffset, y + 6, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.gridSize - eyeOffset - eyeSize, y + 6, eyeSize, eyeSize);
                }
            }
        });
    }

    gameOver() {
        this.isGameOver = true;
        gameOverlay.classList.remove('hidden');
        document.getElementById('overlay-title').textContent = "GAME OVER";
        document.getElementById('overlay-title').classList.add('glow-text');
        overlayScore.textContent = `SCORE: ${this.score}`;
    }
}

// Load games from JSON
async function loadGames() {
    try {
        const response = await fetch('/api/games');
        if (!response.ok) throw new Error('Failed to fetch games');
        games = await response.json();
        if (!Array.isArray(games) || games.length === 0) throw new Error('No games data');
        renderGames();
    } catch (error) {
        console.error('Error loading games:', error);
        // Fallback data if API fails
        games = [
            {
                "id": "stickman-parkour",
                "title": "Stickman Parkour",
                "thumbnail": "https://picsum.photos/seed/stickman/400/250",
                "iframeUrl": "https://d11jzht7mj96rr.cloudfront.net/games/2024/construct/219/stickman-parkour/index-gg.html",
                "category": "Action"
            },
            {
                "id": "retro-snake",
                "title": "Retro Snake",
                "thumbnail": "https://picsum.photos/seed/snake/400/250",
                "type": "internal",
                "category": "Classic"
            },
            {
                "id": "atari-breakout",
                "title": "Atari Breakout",
                "thumbnail": "https://picsum.photos/seed/breakout/400/250",
                "type": "internal",
                "category": "Classic"
            },
            {
                "id": "dune-game",
                "title": "Dune Dash",
                "thumbnail": "https://picsum.photos/seed/dune/400/250",
                "iframeUrl": "/dune.html",
                "category": "Action"
            },
            {
                "id": "snow-rider-3d",
                "title": "Snow Rider 3D",
                "thumbnail": "https://picsum.photos/seed/snowrider/400/250",
                "iframeUrl": "/snow-rider.html",
                "category": "Action"
            },
            {
                "id": "ping-pong",
                "title": "Ping Pong",
                "thumbnail": "https://picsum.photos/seed/pingpong/400/250",
                "type": "internal",
                "category": "Classic"
            },
            {
                "id": "bitlife",
                "title": "BitLife",
                "thumbnail": "https://picsum.photos/seed/bitlife/400/250",
                "iframeUrl": "https://macvg-games.github.io/strategy-games/bitlife/",
                "category": "Simulation"
            },
            {
                "id": "basketball-shoutout",
                "title": "Basketball Shoutout",
                "thumbnail": "https://picsum.photos/seed/basketball/400/250",
                "iframeUrl": "https://app-197304.games.s3.yandex.net/197304/kj9rcykboy6eol5xnn250jesr7v0hoh1/index.html",
                "category": "Sports"
            }
        ];
        renderGames();
    }
}

function renderGames() {
    const filtered = games.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = currentCategory === 'All' || game.category === currentCategory;
        return matchesSearch && matchesCategory;
    });

    gridView.innerHTML = filtered.map(game => `
        <div class="game-card group cursor-pointer bg-black/40 backdrop-blur-md border-4 border-white/20 rounded-[2rem] overflow-hidden transition-all hover:border-purple-500 hover:glow-border" onclick="playGame('${game.id}')">
            <div class="aspect-video relative overflow-hidden border-b-4 border-white/20">
                <img src="${game.thumbnail}" alt="${game.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerpolicy="no-referrer">
                <div class="play-overlay absolute inset-0 bg-purple-600/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="text-xl font-black bg-white text-black px-6 py-2 rounded-2xl uppercase italic glow-border">Play!</span>
                </div>
                <div class="absolute top-4 left-4">
                    <span class="bg-purple-600 border-2 border-white/40 text-white px-3 py-1 rounded-xl text-xs font-black uppercase italic">${game.category || 'Game'}</span>
                </div>
            </div>
            <div class="p-6">
                <h3 class="font-black text-xl uppercase italic group-hover:text-purple-400 transition-colors text-white">${game.title}</h3>
            </div>
        </div>
    `).join('');

    if (filtered.length === 0) {
        const msg = currentCategory === 'All' 
            ? `No games found matching "${searchQuery}"` 
            : `No ${currentCategory} games found matching "${searchQuery}"`;
        gridView.innerHTML = `<div class="col-span-full py-20 text-center text-white/40"><p class="text-lg">${msg}</p></div>`;
    }
}

function playGame(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    currentGameId = gameId;
    if (currentGameTitle) currentGameTitle.textContent = game.title;
    if (playingStatus) playingStatus.textContent = `Playing ${game.title}`;

    // Clear previous game instances
    if (snakeGame) {
        snakeGame.stop();
        snakeGame = null;
    }
    if (breakoutGame) {
        breakoutGame.stop();
        breakoutGame = null;
    }

    if (game.type === 'internal') {
        if (gameIframe) gameIframe.classList.add('hidden');
        if (internalGameContainer) internalGameContainer.classList.remove('hidden');
        if (gameId === 'retro-snake') {
            snakeGame = new SnakeGame(gameCanvas);
            setTimeout(() => snakeGame.start(), 50);
        } else if (gameId === 'atari-breakout') {
            breakoutGame = new BreakoutGame(gameCanvas);
            setTimeout(() => breakoutGame.start(), 50);
        } else if (gameId === 'ping-pong') {
            pingPongGame = new PingPongGame(gameCanvas);
            setTimeout(() => pingPongGame.start(), 50);
        }
    } else {
        if (internalGameContainer) internalGameContainer.classList.add('hidden');
        if (gameIframe) {
            gameIframe.classList.remove('hidden');
            gameIframe.src = game.iframeUrl;
        }
    }

    if (gridView) gridView.classList.add('hidden');
    if (playerView) playerView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closePlayer() {
    if (gameIframe) gameIframe.src = '';
    if (snakeGame) {
        snakeGame.stop();
        snakeGame = null;
    }
    if (breakoutGame) {
        breakoutGame.stop();
        breakoutGame = null;
    }
    if (pingPongGame) {
        pingPongGame.stop();
        pingPongGame = null;
    }
    if (playerView) playerView.classList.add('hidden');
    if (gridView) gridView.classList.remove('hidden');
    currentGameId = null;
}

// Event Listeners
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderGames();
    });
}

if (categoryBtns) {
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderGames();
        });
    });
}

if (document.getElementById('back-btn')) document.getElementById('back-btn').addEventListener('click', closePlayer);
if (document.getElementById('close-btn')) document.getElementById('close-btn').addEventListener('click', closePlayer);
if (document.getElementById('logo')) document.getElementById('logo').addEventListener('click', closePlayer);
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        if (snakeGame) snakeGame.reset();
        if (breakoutGame) {
            if (!breakoutGame.isStarted) {
                breakoutGame.begin();
            } else {
                breakoutGame.reset();
                breakoutGame.begin();
            }
        }
        if (pingPongGame) {
            pingPongGame.reset();
            pingPongGame.begin();
        }
    });
}

if (openTabBtn) {
    openTabBtn.addEventListener('click', () => {
        if (currentGameId) {
            window.open(`./game.html?id=${currentGameId}`, '_blank');
        }
    });
}

const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

if (document.getElementById('fullscreen-btn')) document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
if (document.getElementById('player-fullscreen-btn')) document.getElementById('player-fullscreen-btn').addEventListener('click', toggleFullscreen);

// Initial Load
if (gridView) {
    loadGames();
    initStars();
}

function initStars() {
    const container = document.getElementById('stars-container');
    if (!container) return;
    
    const count = 150;
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.setProperty('--duration', `${2 + Math.random() * 4}s`);
        star.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(star);
    }
}

window.SnakeGame = SnakeGame;
window.BreakoutGame = BreakoutGame;
window.PingPongGame = PingPongGame;
window.playGame = playGame;
