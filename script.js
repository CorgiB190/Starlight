let games = [];
let searchQuery = '';

const gridView = document.getElementById('grid-view');
const playerView = document.getElementById('player-view');
const searchInput = document.getElementById('search-input');
const gameIframe = document.getElementById('game-iframe');
const currentGameTitle = document.getElementById('current-game-title');
const playingStatus = document.getElementById('playing-status');

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
        <div class="game-card group cursor-pointer bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all hover:shadow-2xl hover:shadow-emerald-500/10" onclick="playGame('${game.id}')">
            <div class="aspect-video relative overflow-hidden">
                <img src="${game.thumbnail}" alt="${game.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerpolicy="no-referrer">
                <div class="play-overlay absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span class="text-sm font-medium bg-emerald-500 text-zinc-950 px-3 py-1 rounded-full">Play Now</span>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-lg group-hover:text-emerald-400 transition-colors">${game.title}</h3>
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
    gameIframe.src = game.iframeUrl;

    gridView.classList.add('hidden');
    playerView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closePlayer() {
    gameIframe.src = '';
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
