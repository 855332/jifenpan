const defaultPlayers = [
    { id: 1, name: '东', wind: '东', wins: 0, cW: 0, cL: 0, mCW: 0, mCL: 0, dC: 0, cD: 0, mCD: 0, mG: 0, aG: 0 },
    { id: 2, name: '南', wind: '南', wins: 0, cW: 0, cL: 0, mCW: 0, mCL: 0, dC: 0, cD: 0, mCD: 0, mG: 0, aG: 0 },
    { id: 3, name: '西', wind: '西', wins: 0, cW: 0, cL: 0, mCW: 0, mCL: 0, dC: 0, cD: 0, mCD: 0, mG: 0, aG: 0 },
    { id: 4, name: '北', wind: '北', wins: 0, cW: 0, cL: 0, mCW: 0, mCL: 0, dC: 0, cD: 0, mCD: 0, mG: 0, aG: 0 }
];
let players = JSON.parse(localStorage.getItem('mj_p')) || defaultPlayers.map(p => ({...p}));
let currD = parseInt(localStorage.getItem('mj_cd')) || 1;
let round = parseInt(localStorage.getItem('mj_rc')) || 1;
let pot = parseInt(localStorage.getItem('mj_pc')) || 1;
let games = parseInt(localStorage.getItem('mj_tg')) || 0;
let season = localStorage.getItem('mj_se') || '01';

const pc = document.getElementById('players-container');
const seasonEl = document.getElementById('season');
const titleEl = document.getElementById('title');
seasonEl.textContent = season;
render(); updStats();

titleEl.addEventListener('input', () => {
    const m = titleEl.textContent.match(/S(\d+)赛季/);
    if (m) { season = m[1]; localStorage.setItem('mj_se', season); }
});
document.getElementById('reset-btn').onclick = () => {
    if (confirm('确定重置所有数据？此操作不可恢复！')) {
        players = defaultPlayers.map(p => ({...p}));
        currD = 1; round = 1; pot = 1; games = 0; season = '01';
        localStorage.clear();
        localStorage.setItem('mj_se', season);
        seasonEl.textContent = season;
        render(); updStats();
    }
};

function render() {
    pc.innerHTML = '';
    players.forEach(p => {
        const c = document.createElement('div');
        c.className = `player-card ${p.wind} ${p.id === currD ? 'dealer' : ''}`;
        c.innerHTML = `
            <div class="player-header">
                <span class="player-name" contenteditable="true" data-id="${p.id}">${p.name}</span>
                <span class="player-wind">${p.wind}</span>
            </div>
            <div class="player-stats">
                <div>胡牌: ${p.wins}</div><div>坐庄: ${p.dC}</div>
                <div>明杠: ${p.mG}</div><div>暗杠: ${p.aG}</div>
                <div>连胜: ${p.cW}</div><div>连败: ${p.cL}</div>
                <div>最大连胜: ${p.mCW}</div><div>最大连败: ${p.mCL}</div>
            </div>
            <div class="player-buttons">
                <button class="btn-win" data-id="${p.id}">胡</button>
                <button class="btn-mingang" data-id="${p.id}">明杠</button>
                <button class="btn-angang" data-id="${p.id}">暗杠</button>
            </div>`;
        pc.appendChild(c);
    });
    document.querySelectorAll('.player-name').forEach(e => e.addEventListener('input', ev => {
        const pl = players.find(x => x.id == ev.target.dataset.id);
        pl.name = ev.target.textContent; save(); updStats();
    }));
    document.querySelectorAll('.btn-win').forEach(b => b.addEventListener('click', e => win(parseInt(e.target.dataset.id))));
    document.querySelectorAll('.btn-mingang').forEach(b => b.addEventListener('click', e => { players.find(p=>p.id==e.target.dataset.id).mG++; save(); render(); }));
    document.querySelectorAll('.btn-angang').forEach(b => b.addEventListener('click', e => { players.find(p=>p.id==e.target.dataset.id).aG++; save(); render(); }));
}

function win(id) {
    games++;
    const oldCurrD = currD;
    const dealer = players.find(p => p.id === oldCurrD);
    if (id === oldCurrD) {
        dealer.wins++; dealer.cW++; dealer.cL = 0; dealer.mCW = Math.max(dealer.mCW, dealer.cW);
        dealer.cD++; dealer.dC++; dealer.mCD = Math.max(dealer.mCD, dealer.cD);
    } else {
        const winner = players.find(p => p.id === id);
        winner.wins++; winner.cW++; winner.cL = 0; winner.mCW = Math.max(winner.mCW, winner.cW);
        dealer.cD = 0;
        currD = currD % 4 + 1;
        const newDealer = players.find(p => p.id === currD);
        newDealer.cD = 1; newDealer.dC++; newDealer.mCD = Math.max(newDealer.mCD, newDealer.cD);
        if (oldCurrD === 4 && currD === 1) { round++; if (round > 4) { pot++; round = 1; } }
    }
    players.forEach(p => {
        if (p.id !== id) { p.cL++; p.cW = 0; p.mCL = Math.max(p.mCL, p.cL); }
    });
    save(); render(); updStats();
}

function updStats() {
    document.getElementById('total-games').textContent = games;
    document.getElementById('round-count').textContent = round;
    document.getElementById('pot-count').textContent = pot;
    const currPlayer = players.find(p => p.id === currD);
    document.getElementById('current-dealer').textContent = currPlayer ? currPlayer.name : '东';
    let md = {n:'无',c:0}; players.forEach(p=>{if(p.mCD>md.c)md={n:p.name,c:p.mCD}});
    document.getElementById('max-dealer').textContent = md.c ? `${md.n} (${md.c})` : '无';
    let mw = {n:'无',c:0}; players.forEach(p=>{if(p.mCW>mw.c)mw={n:p.name,c:p.mCW}});
    document.getElementById('max-win').textContent = mw.c ? `${mw.n} (${mw.c})` : '无';
    let ml = {n:'无',c:0}; players.forEach(p=>{if(p.mCL>ml.c)ml={n:p.name,c:p.mCL}});
    document.getElementById('max-lose').textContent = ml.c ? `${ml.n} (${ml.c})` : '无';
}

function save() {
    localStorage.setItem('mj_p', JSON.stringify(players));
    localStorage.setItem('mj_cd', currD);
    localStorage.setItem('mj_rc', round);
    localStorage.setItem('mj_pc', pot);
    localStorage.setItem('mj_tg', games);
}
if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('sw.js')); }