const express = require('express');
const { Telegraf } = require('telegraf');

// 👇👇👇 ЗАМЕНИТЕ ЭТО на ваш токен от BotFather 👇👇👇
const BOT_TOKEN = '8539172370:AAErv47oW_uZ-i5awhDK-y-FwONxDhvR_nc';
// 👆👆👆

const app = express();
const PORT = 3000;

const HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NFT Cases</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0a0a0a, #1a1a2e);
            font-family: Arial, sans-serif;
            color: white;
            padding: 16px;
            padding-bottom: 80px;
        }
        .header {
            background: rgba(0,0,0,0.5);
            border-radius: 20px;
            padding: 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
        }
        .balance {
            background: rgba(236,72,153,0.2);
            padding: 8px 16px;
            border-radius: 30px;
            color: #f472b6;
            font-weight: bold;
        }
        .case-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        .case-card {
            background: rgba(30,30,50,0.8);
            border-radius: 20px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
        }
        .case-emoji { font-size: 48px; }
        .case-name { font-weight: bold; margin: 8px 0; }
        .case-price { color: #4ade80; }
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: space-around;
            padding: 12px;
        }
        .nav-item {
            text-align: center;
            cursor: pointer;
            color: #9ca3af;
        }
        .nav-item.active { color: #ec4899; }
        .nav-icon { font-size: 24px; display: block; }
        .page { display: none; }
        .page.active { display: block; }
        .inventory-item {
            background: rgba(30,30,50,0.5);
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }
        .modal {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #1a1a2e;
            border-radius: 30px 30px 0 0;
            padding: 24px;
            transform: translateY(100%);
            transition: transform 0.3s;
            z-index: 100;
        }
        .modal.open { transform: translateY(0); }
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: none;
            z-index: 99;
        }
        .overlay.open { display: block; }
        button {
            background: #ec4899;
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 30px;
            color: white;
            font-weight: bold;
            margin-bottom: 16px;
            cursor: pointer;
        }
        .top-user {
            display: flex;
            justify-content: space-between;
            padding: 12px;
            background: rgba(30,30,50,0.5);
            border-radius: 12px;
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>🎮 NFT Cases<br><span style="font-size:12px">Level 1</span></div>
        <div class="balance" id="balance">0.07 TON</div>
    </div>

    <div id="gamesPage" class="page active">
        <div class="case-grid" id="cases"></div>
    </div>

    <div id="inventoryPage" class="page">
        <h3>🎒 Инвентарь</h3>
        <div id="inventory"></div>
    </div>

    <div id="profilePage" class="page">
        <h3>👤 Профиль</h3>
        <div style="background:rgba(30,30,50,0.5);border-radius:20px;padding:16px;margin-bottom:16px;">
            <div>💰 Баланс: <span id="profileBalance">0</span> TON</div>
            <div>🎁 Ценность: <span id="totalValue">0</span> TON</div>
        </div>
        <div style="background:rgba(30,30,50,0.5);border-radius:20px;padding:16px;">
            <div>🤝 Реферальная ссылка</div>
            <div id="refLink" style="font-size:11px;background:#0a0a0a;padding:8px;border-radius:10px;margin-top:8px;"></div>
        </div>
    </div>

    <div id="topPage" class="page">
        <div style="display:flex;gap:8px;margin-bottom:16px;">
            <button id="btnBalance" style="flex:1;background:#ec4899;">Топ баланса</button>
            <button id="btnInventory" style="flex:1;background:#374151;">Топ инвентаря</button>
        </div>
        <div id="topList"></div>
    </div>

    <div class="bottom-nav">
        <div class="nav-item active" data-page="games"><span class="nav-icon">🎮</span>Игры</div>
        <div class="nav-item" data-page="inventory"><span class="nav-icon">🎒</span>Инвентарь</div>
        <div class="nav-item" data-page="profile"><span class="nav-icon">👤</span>Профиль</div>
        <div class="nav-item" data-page="top"><span class="nav-icon">🏆</span>Топ</div>
    </div>

    <div class="overlay" id="overlay"></div>
    <div class="modal" id="modal">
        <h3 id="modalTitle">Кейс</h3>
        <button id="openBtn">🔑 Открыть</button>
        <div id="modalPrizes"></div>
        <button onclick="closeModal()" style="background:#374151;">Закрыть</button>
    </div>

    <script>
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        let userId = tg.initDataUnsafe?.user?.id || 'test_' + Date.now();
        let balance = 0.07;
        let inventory = [];
        
        const casesList = [
            { id: 'sweet', name: '🌸 Sweet Spring', price: 2, emoji: '🌸' },
            { id: 'lover', name: '💕 LOVER', price: 1, emoji: '💕' },
            { id: 'gems', name: '💎 MYSTIC GEMS', price: 0.8, emoji: '💎' },
            { id: 'bear', name: '🐻 NIGHT BEAR', price: 0.5, emoji: '🐻' }
        ];
        
        const prizesList = {
            sweet: [
                { name: 'KISSED FROGS', value: 52, rarity: 'RARE' },
                { name: 'DIAMOND RINGS', value: 29, rarity: 'RARE' },
                { name: 'IONIC DRYERS', value: 15, rarity: 'UNIQUE' },
                { name: 'SKY STILETTOS', value: 15, rarity: 'UNIQUE' },
                { name: 'SAKURA FLOWERS', value: 11, rarity: 'UNIQUE' }
            ]
        };
        prizesList.lover = prizesList.sweet.slice(0,4);
        prizesList.gems = prizesList.sweet.slice(1,5);
        prizesList.bear = prizesList.sweet.slice(2,5);
        
        function saveData() {
            localStorage.setItem(userId + '_balance', balance);
            localStorage.setItem(userId + '_inventory', JSON.stringify(inventory));
        }
        
        function loadData() {
            let savedBalance = localStorage.getItem(userId + '_balance');
            let savedInv = localStorage.getItem(userId + '_inventory');
            if (savedBalance) balance = parseFloat(savedBalance);
            if (savedInv) inventory = JSON.parse(savedInv);
            updateUI();
        }
        
        function updateUI() {
            document.getElementById('balance').innerHTML = balance.toFixed(2) + ' TON';
            document.getElementById('profileBalance').innerHTML = balance.toFixed(2) + ' TON';
            let total = inventory.reduce((s,i) => s + (i.value * i.quantity), 0);
            document.getElementById('totalValue').innerHTML = total.toFixed(2) + ' TON';
            document.getElementById('refLink').innerHTML = 't.me/yourbot?start=' + userId;
            renderInventory();
        }
        
        function renderCases() {
            document.getElementById('cases').innerHTML = casesList.map(c => `
                <div class="case-card" onclick="openCase('${c.id}','${c.name}',${c.price})">
                    <div class="case-emoji">${c.emoji}</div>
                    <div class="case-name">${c.name}</div>
                    <div class="case-price">${c.price} TON</div>
                </div>
            `).join('');
        }
        
        window.openCase = function(id, name, price) {
            document.getElementById('modalTitle').innerHTML = name;
            document.getElementById('openBtn').innerHTML = '🔑 Открыть за ' + price + ' TON';
            let prizes = (prizesList[id] || prizesList.sweet).map(p => `
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1)">
                    <span>${p.name}</span>
                    <span style="color:#4ade80">${p.value} TON</span>
                </div>
            `).join('');
            document.getElementById('modalPrizes').innerHTML = prizes;
            document.getElementById('overlay').classList.add('open');
            document.getElementById('modal').classList.add('open');
            
            document.getElementById('openBtn').onclick = () => {
                if (balance < price) {
                    tg.showAlert('Не хватает TON!');
                    return;
                }
                let prizesArr = prizesList[id] || prizesList.sweet;
                let won = prizesArr[Math.floor(Math.random() * prizesArr.length)];
                balance -= price;
                let existing = inventory.find(i => i.name === won.name);
                if (existing) existing.quantity++;
                else inventory.push({ name: won.name, value: won.value, quantity: 1, rarity: won.rarity });
                saveData();
                updateUI();
                tg.showAlert('🎉 Вы выиграли: ' + won.name + ' (' + won.value + ' TON)');
                closeModal();
            };
        };
        
        window.closeModal = function() {
            document.getElementById('overlay').classList.remove('open');
            document.getElementById('modal').classList.remove('open');
        };
        
        function renderInventory() {
            let container = document.getElementById('inventory');
            if (inventory.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#6b7280;padding:40px;">Нет NFT</div>';
                return;
            }
            container.innerHTML = inventory.map(i => `
                <div class="inventory-item">
                    <div><b>${i.name}</b><br><span style="font-size:10px;">${i.rarity}</span></div>
                    <div>${i.value} TON<br>x${i.quantity}</div>
                </div>
            `).join('');
        }
        
        function renderTop(type) {
            let demo = [
                { name: 'Алекс', val: 1250 }, { name: 'Макс', val: 890 }, { name: 'Дима', val: 567 }
            ];
            document.getElementById('topList').innerHTML = demo.map((u,i) => `
                <div class="top-user"><span>${i+1}. ${u.name}</span><span style="color:#4ade80">${u.val} TON</span></div>
            `).join('');
        }
        
        // Навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.onclick = () => {
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                document.getElementById(item.dataset.page + 'Page').classList.add('active');
                item.classList.add('active');
                if (item.dataset.page === 'top') renderTop('balance');
            };
        });
        
        document.getElementById('btnBalance').onclick = () => renderTop('balance');
        document.getElementById('btnInventory').onclick = () => renderTop('inventory');
        
        loadData();
        renderCases();
    </script>
</body>
</html>`;

app.get('/', (req, res) => res.send(HTML));

app.listen(PORT, () => console.log(`✅ Сервер запущен на http://localhost:${PORT}`));

const bot = new Telegraf(BOT_TOKEN);
bot.start((ctx) => {
    ctx.reply('🎮 Добро пожаловать!', {
        reply_markup: {
            inline_keyboard: [[{ text: '🚀 Открыть игру', web_app: { url: 'https://localhost:3000' } }]]
        }
    });
});
bot.launch();
console.log('✅ Бот запущен');
