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

let snakeGame = null;

class SnakeGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 20;
        this.score = 0;
        this.snake = [{ x: 10, y: 10 }];
        this.food = { x: 15, y: 15 };
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.gameLoop = null;
        this.isGameOver = false;
        this.speed = 150;

        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    start() {
        this.resize();
        this.reset();
        this.draw(); // Initial draw
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
        this.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.isGameOver = false;
        this.speed = 150;
        this.spawnFood();
        gameOverlay.classList.add('hidden');
        this.draw(); // Draw initial state
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
        
        this.cols = Math.floor(width / this.gridSize);
        this.rows = Math.floor(height / this.gridSize);
    }

    spawnFood() {
        this.food = {
            x: Math.floor(Math.random() * this.cols),
            y: Math.floor(Math.random() * this.rows)
        };
        // Don't spawn food on snake
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

        // Wall collision
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            this.gameOver();
            return;
        }

        // Self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.spawnFood();
            // Speed up slightly
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
        
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, width, height);

        // Draw food
        this.ctx.fillStyle = '#ff4499';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
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
            
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            const size = this.gridSize - 2;

            this.ctx.fillRect(x + 1, y + 1, size, size);
            this.ctx.strokeRect(x + 1, y + 1, size, size);

            // Eyes for head
            if (index === 0) {
                this.ctx.fillStyle = '#000';
                const eyeSize = 3;
                if (this.direction.x === 1) {
                    this.ctx.fillRect(x + 12, y + 5, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
                } else if (this.direction.x === -1) {
                    this.ctx.fillRect(x + 5, y + 5, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 5, y + 12, eyeSize, eyeSize);
                } else if (this.direction.y === 1) {
                    this.ctx.fillRect(x + 5, y + 12, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
                } else {
                    this.ctx.fillRect(x + 5, y + 5, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + 5, eyeSize, eyeSize);
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
        const response = await fetch('./src/games.json');
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

    currentGameTitle.textContent = game.title;
    playingStatus.textContent = `Playing ${game.title}`;

    if (game.type === 'internal') {
        gameIframe.classList.add('hidden');
        internalGameContainer.classList.remove('hidden');
        if (gameId === 'retro-snake') {
            if (snakeGame) snakeGame.stop();
            snakeGame = new SnakeGame(gameCanvas);
            // Give the browser a moment to calculate dimensions
            setTimeout(() => snakeGame.start(), 50);
        }
    } else {
        internalGameContainer.classList.add('hidden');
        gameIframe.classList.remove('hidden');
        gameIframe.src = game.iframeUrl;
    }

    gridView.classList.add('hidden');
    playerView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closePlayer() {
    gameIframe.src = '';
    if (snakeGame) {
        snakeGame.stop();
        snakeGame = null;
    }
    playerView.classList.add('hidden');
    gridView.classList.remove('hidden');
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderGames();
});

document.getElementById('back-btn').addEventListener('click', closePlayer);
document.getElementById('close-btn').addEventListener('click', closePlayer);
document.getElementById('logo').addEventListener('click', closePlayer);
restartBtn.addEventListener('click', () => {
    if (snakeGame) snakeGame.reset();
});

const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
document.getElementById('player-fullscreen-btn').addEventListener('click', toggleFullscreen);

// Initial Load
loadGames();
