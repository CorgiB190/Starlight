let games = [];
let searchQuery = '';

const gridView = document.getElementById('grid-view');
const playerView = document.getElementById('player-view');
const searchInput = document.getElementById('search-input');
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
        this.ctx.strokeStyle = '#facc15';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(
            this.offsetX - 2, 
            this.offsetY - 2, 
            (this.cols * this.gridSize) + 4, 
            (this.rows * this.gridSize) + 4
        );

        // Draw Map Background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(
            this.offsetX, 
            this.offsetY, 
            this.cols * this.gridSize, 
            this.rows * this.gridSize
        );

        // Draw food
        this.ctx.fillStyle = '#ff4499';
        this.ctx.beginPath();
        this.ctx.arc(
            this.offsetX + this.food.x * this.gridSize + this.gridSize / 2,
            this.offsetY + this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 4,
            0, Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#facc15' : '#ffffff';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            
            const x = this.offsetX + segment.x * this.gridSize;
            const y = this.offsetY + segment.y * this.gridSize;
            const size = this.gridSize - 2;

            this.ctx.fillRect(x + 1, y + 1, size, size);
            this.ctx.strokeRect(x + 1, y + 1, size, size);

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
        overlayScore.textContent = `SCORE: ${this.score}`;
    }
}

// Load games from JSON
async function loadGames() {
    try {
        const response = await fetch('/api/games');
        games = await response.json();
        renderGames();
    } catch (error) {
        console.error('Error loading games:', error);
    }
}

function renderGames() {
    const filtered = games.filter(game => 
        game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    gridView.innerHTML = filtered.map(game => `
        <div class="game-card group cursor-pointer bg-white comic-border rounded-[2rem] overflow-hidden transition-all comic-shadow" onclick="playGame('${game.id}')">
            <div class="aspect-video relative overflow-hidden border-b-4 border-black">
                <img src="${game.thumbnail}" alt="${game.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerpolicy="no-referrer">
                <div class="play-overlay absolute inset-0 bg-[#ff4499]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="text-xl font-black bg-white comic-border text-black px-6 py-2 rounded-2xl comic-shadow-sm uppercase italic">Play!</span>
                </div>
            </div>
            <div class="p-6 bg-[#facc15]">
                <h3 class="font-black text-xl uppercase italic group-hover:text-[#ff4499] transition-colors">${game.title}</h3>
            </div>
        </div>
    `).join('');

    if (filtered.length === 0) {
        gridView.innerHTML = `<div class="col-span-full py-20 text-center text-zinc-500"><p class="text-lg">No games found matching "${searchQuery}"</p></div>`;
    }
}

function playGame(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    currentGameId = gameId;
    if (currentGameTitle) currentGameTitle.textContent = game.title;
    if (playingStatus) playingStatus.textContent = `Playing ${game.title}`;

    if (game.type === 'internal') {
        if (gameIframe) gameIframe.classList.add('hidden');
        if (internalGameContainer) internalGameContainer.classList.remove('hidden');
        if (gameId === 'retro-snake') {
            if (snakeGame) snakeGame.stop();
            snakeGame = new SnakeGame(gameCanvas);
            // Give the browser a moment to calculate dimensions
            setTimeout(() => snakeGame.start(), 50);
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

if (document.getElementById('back-btn')) document.getElementById('back-btn').addEventListener('click', closePlayer);
if (document.getElementById('close-btn')) document.getElementById('close-btn').addEventListener('click', closePlayer);
if (document.getElementById('logo')) document.getElementById('logo').addEventListener('click', closePlayer);
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        if (snakeGame) snakeGame.reset();
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
}
