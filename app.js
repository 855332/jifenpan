const defaultPlayers = [
    { id: 1, name: '东', wins: 0, dC: 0, cD: 0, mCD: 0, cW: 0, mCW: 0, cL: 0, mCL: 0, mG: 0, aG: 0 },
    { id: 2, name: '南', wins: 0, dC: 0, cD: 0, mCD: 0, cW: 0, mCW: 0, cL: 0, mCL: 0, mG: 0, aG: 0 },
    { id: 3, name: '西', wins: 0, dC: 0, cD: 0, mCD: 0, cW: 0, mCW: 0, cL: 0, mCL: 0, mG: 0, aG: 0 },
    { id: 4, name: '北', wins: 0, dC: 0, cD: 0, mCD: 0, cW: 0, mCW: 0, cL: 0, mCL: 0, mG: 0, aG: 0 }
];
const winds = ['东','南','西','北'];

// 读取数据（用 mj2_ 前缀避免和旧版冲突）
let players = JSON.parse(localStorage.getItem('mj2_players'));
if (!players || !Array.isArray(players) || players.length !== 4) {
    players = defaultPlayers.map(p => ({...p}));
}
let currD = parseInt(localStorage.getItem('mj2_currD')) || 1;
let round = parseInt(localStorage.getItem('mj2_round')) || 1;
let pot = parseInt(localStorage.getItem('mj2_pot')) || 1;
let games = parseInt(localStorage.getItem('mj2_games')) || 0;

function save() {
    localStorage.setItem('mj2_players', JSON.stringify(players));
    localStorage.setItem('mj2_currD', currD);
    localStorage.setItem('mj2_round', round);
    localStorage.setItem('mj2_pot', pot);
    localStorage.setItem('mj2_games', games);
}

// 渲染
function render() {
    const sb = document.getElementById('score-board');
    sb.innerHTML = '';
    players.forEach(p => {
        const isDealer = (p.id === currD);
        const div = document.createElement('div');
        div.className = 'player-card' + (isDealer ? ' is-dealer' : '');
        div.dataset.id = p.id;
        div.innerHTML = `
            ${isDealer ? '<div class="dealer-tag">庄</div>' : ''}
            <div class="player-header">
                <div class="player-name" contenteditable="true">${p.name}</div>
                <div class="player-wind">${winds[p.id-1]}</div>
            </div>
            <div class="player-stats">
                <div class="stat-row"><span>胡牌:</span><strong>${p.wins}</strong></div>
                <div class="stat-row"><span>坐庄:</span><strong>${p.dC}</strong></div>
                <div class="stat-row"><span>明杠:</span><strong>${p.mG}</strong></div>
                <div class="stat-row"><span>暗杠:</span><strong>${p.aG}</strong></div>
                <div class="stat-row"><span>连胜:</span><strong>${p.cW}</strong></div>
                <div class="stat-row"><span>连败:</span><strong>${p.cL}</strong></div>
                <div class="stat-row"><span>最大连胜:</span><strong>${p.mCW}</strong></div>
                <div class="stat-row"><span>最大连败:</span><strong>${p.mCL}</strong></div>
            </div>
            <div class="player-actions">
                <button class="btn btn-win" data-id="${p.id}">🀄 胡</button>
                <button class="btn btn-mingang" data-id="${p.id}">明杠</button>
                <button class="btn btn-angang" data-id="${p.id}">暗杠</button>
            </div>
        `;
        sb.appendChild(div);
    });

    // 绑定事件
    document.querySelectorAll('.btn-win').forEach(b => {
        b.onclick = () => win(parseInt(b.dataset.id));
    });
    document.querySelectorAll('.btn-mingang').forEach(b => {
        b.onclick = () => { players.find(p=>p.id==b.dataset.id).mG++; save(); render(); updStats(); };
    });
    document.querySelectorAll('.btn-angang').forEach(b => {
        b.onclick = () => { players.find(p=>p.id==b.dataset.id).aG++; save(); render(); updStats(); };
    });
    document.querySelectorAll('.player-name').forEach(el => {
        el.onblur = () => {
            const id = parseInt(el.closest('.player-card').dataset.id);
            const pl = players.find(p=>p.id===id);
            pl.name = el.textContent.trim() || winds[id-1];
            el.textContent = pl.name;
            save(); updStats();
        };
        el.onkeydown = (e) => { if(e.key==='Enter'){ e.preventDefault(); el.blur(); } };
    });
}

// 胡牌
function win(id) {
    games++;
    const oldDealer = players.find(p=>p.id===currD);
    if (id === currD) {
        oldDealer.wins++; oldDealer.cW++; oldDealer.cL=0; oldDealer.mCW=Math.max(oldDealer.mCW,oldDealer.cW);
        oldDealer.cD++; oldDealer.dC++; oldDealer.mCD=Math.max(oldDealer.mCD,oldDealer.cD);
    } else {
        const winner = players.find(p=>p.id===id);
        winner.wins++; winner.cW++; winner.cL=0; winner.mCW=Math.max(winner.mCW,winner.cW);
        oldDealer.cD = 0;
        currD = currD % 4 + 1;
        const nd = players.find(p=>p.id===currD);
        nd.cD=1; nd.dC++; nd.mCD=Math.max(nd.mCD,nd.cD);
        if (oldDealer.id===4 && currD===1) { round++; if(round>4){ pot++; round=1; } }
    }
    players.forEach(p=>{
        if(p.id!==id){ p.cL++; p.cW=0; p.mCL=Math.max(p.mCL,p.cL); }
    });
    save(); render(); updStats();
}

// 更新统计
function updStats() {
    document.getElementById('total-games').textContent = games;
    document.getElementById('round-count').textContent = round + '/4';
    document.getElementById('pot-count').textContent = pot;
    const cd = players.find(p=>p.id===currD);
    document.getElementById('current-dealer').textContent = cd ? cd.name : '东';
    let md={n:'无',c:0}, mw={n:'无',c:0}, ml={n:'无',c:0};
    players.forEach(p=>{
        if(p.mCD>md.c) md={n:p.name,c:p.mCD};
        if(p.mCW>mw.c) mw={n:p.name,c:p.mCW};
        if(p.mCL>ml.c) ml={n:p.name,c:p.mCL};
    });
    document.getElementById('max-dealer').textContent = md.c ? `${md.n}(${md.c})` : '无';
    document.getElementById('max-win').textContent = mw.c ? `${mw.n}(${mw.c})` : '无';
    document.getElementById('max-lose').textContent = ml.c ? `${ml.n}(${ml.c})` : '无';
}

// 重置
document.getElementById('reset-btn').onclick = () => {
    if (confirm('⚠️ 确定重置所有数据？不可恢复！')) {
        ['mj2_players','mj2_currD','mj2_round','mj2_pot','mj2_games'].forEach(k => localStorage.removeItem(k));
        players = defaultPlayers.map(p=>({...p}));
        currD=1; round=1; pot=1; games=0;
        document.getElementById('season-input').textContent = 'S01';
        render(); updStats();
        alert('✅ 数据已重置！');
    }
};

// 赛季编辑
document.getElementById('season-input').onblur = function() {
    let v = this.textContent.trim();
    if(!v) this.textContent = 'S01';
};

// 启动
render();
updStats();

// Service Worker 注册
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}