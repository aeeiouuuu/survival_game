/**
 * 配列をシャッフルする（Fisher-Yatesアルゴリズム）
 */
function shuffle(array) {
    let m = array.length, t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

/**
 * 配列からランダムにk個の要素を非復元抽出する
 */
function sample(population, k) {
    const shuffled = shuffle([...population]);
    return shuffled.slice(0, k);
}


class GameSimulator {
    /**
     * Pythonの __init__ に相当
     */
    constructor() {
        // --- 1. DOM要素の取得 ---
        this.logArea = document.getElementById('log-area');
        
        // ステータス
        this.foodValueEl = document.getElementById('food-value');
        this.waterValueEl = document.getElementById('water-value');
        this.woodValueEl = document.getElementById('wood-value');
        this.raftValueEl = document.getElementById('raft-value');
        
        // アクション
        this.bagComponentEl = document.getElementById('bag-component');
        this.deckComponentEl = document.getElementById('deck-component');
        this.deckCountEl = document.getElementById('deck-count');
        this.deckVisualEl = document.getElementById('deck-visual');

        // ★★★ 変更: ビジュアライザーの参照を分離 ★★★
        // アクション演出用
        this.animationArea = document.getElementById('animation-area'); 
        // 天気常時表示用
        this.currentWeatherPanelEl = document.getElementById('current-weather-panel');
        this.currentWeatherCardAreaEl = document.getElementById('current-weather-card-area');
        this.roundNumberEl = document.getElementById('round-number');
        // ★★★ ここまで ★★★

        // --- 2. ステータス (手動) ---
        this.food = 0;
        this.water = 0;
        this.wood = 0;
        this.raft = 0;
        this.updateDisplay();

        // --- 3. 袋の準備 ---
        const ball_w1 = { color: 'white', fish: 1 };
        const ball_w2 = { color: 'white', fish: 2 };
        const ball_b3 = { color: 'black', fish: 3 };
        this.master_bag = [
            ...Array(3).fill(ball_w1),
            ...Array(2).fill(ball_w2),
            ...Array(1).fill(ball_b3)
        ];
        this.log(`👜 袋 準備完了 (計${this.master_bag.length}個)`);
        
        // --- 4. 天気デッキの準備 ---
        this.weather_deck = [];
        this.STORM_CARD_INFO = '降水量2 (嵐)';
        this.round = 0; // ★ ラウンドカウンター
        this.setup_weather_deck(); 
        
        this.log("--- シミュレーター準備完了 ---");
    }
    
    // ===================================
    // ログ & ビジュアライザー 制御
    // ===================================
    
    /**
     * 詳細ログエリアにメッセージを追記
     */
    log(message, type = 'normal') {
        const p = document.createElement('p');
        p.textContent = message;
        if (type === 'storm') {
            p.className = 'storm-log';
        }
        this.logArea.appendChild(p);
        this.logArea.scrollTop = this.logArea.scrollHeight;
    }

    /**
     * ★★★ 変更 ★★★
     * 「アクション結果」のビジュアライザーのみをリセット
     * (現在の天気パネルは触らない)
     */
    clearActionVisualizer() {
        this.animationArea.innerHTML = '';
        this.animationArea.classList.remove('snake-bite');
        this.bagComponentEl.classList.remove('shake');
    }

    // ===================================
    // ステータス (手動) 制御 (変更なし)
    // ===================================

    adjustResource(resource, amount) {
        switch(resource) {
            case 'food': this.food = Math.max(0, this.food + amount); break;
            case 'water': this.water = Math.max(0, this.water + amount); break;
            case 'wood': this.wood = Math.max(0, this.wood + amount); break;
            case 'raft': this.raft = Math.max(0, this.raft + amount); break;
        }
        this.updateDisplay();
    }
    
    updateDisplay() {
        this.foodValueEl.textContent = this.food;
        this.waterValueEl.textContent = this.water;
        this.woodValueEl.textContent = this.wood;
        this.raftValueEl.textContent = this.raft;
    }

    // ===================================
    // アクション (f, w, r)
    // ===================================

    /**
     * ＃＃天気 アクション (r)
     * ★★★ 変更: デッキのリセット時にラウンドもリセット
     */
    setup_weather_deck() {
        this.log("🃏 天気カードの山を準備しています...");
        
        // ★ ラウンドと天気パネルをリセット
        this.round = 0;
        this.roundNumberEl.textContent = 'Round 0';
        this.currentWeatherCardAreaEl.innerHTML = `
            <p class="placeholder-text">天気カードを引いて<br>ラウンドを開始してください</p>
        `;
        this.currentWeatherPanelEl.classList.remove('storm-game-over');
        
        const storm_card = { info: this.STORM_CARD_INFO, value: 2, isSafe: false };
        let other_cards = [
            ...Array(4).fill({ info: '降水量0', value: 0 }),
            ...Array(3).fill({ info: '降水量1', value: 1 }),
            ...Array(3).fill({ info: '降水量2', value: 2 }),
            ...Array(1).fill({ info: '降水量3', value: 3 })
        ];
        
        shuffle(other_cards);
        
        const top_half = other_cards.slice(0, 6).map(card => ({...card, isSafe: true}));
        const bottom_half_base = other_cards.slice(6).map(card => ({...card, isSafe: false}));
        
        let bottom_pile = [...bottom_half_base, storm_card];
        shuffle(bottom_pile);
        
        this.weather_deck = [...top_half, ...bottom_pile];
        
        this.log(`🃏 天気カードの山 (12枚) をルール通りに構築しました。`);
        this.renderDeckVisual();
    }

    /**
     * ★天気デッキの見た目を更新する (変更なし)
     */
    renderDeckVisual() {
        this.deckCountEl.textContent = this.weather_deck.length;
        this.deckVisualEl.innerHTML = ''; 

        this.weather_deck.forEach((card, i) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card-stack';
            if (card.isSafe) {
                cardDiv.classList.add('safe');
            } else {
                cardDiv.classList.add('danger');
            }
            cardDiv.style.top = `${i * 2}px`;
            cardDiv.style.left = `${(i * 1.5)}px`;
            this.deckVisualEl.appendChild(cardDiv);
        });
    }
    
    /**
     * ★★★ 新規追加 ★★★
     * 「現在の天気」パネルにカードを描画する
     */
    renderCurrentWeather(card) {
        // 以前の天気を消去
        this.currentWeatherCardAreaEl.innerHTML = '';
        
        const cardEl = document.createElement('div');
        cardEl.className = 'drawn-card';
        
        if (card.info === this.STORM_CARD_INFO) {
            // 嵐(ゲームオーバー)の場合
            this.log("******************************\n     ！！！ 嵐 ！！！\n   ！！！ ゲーム終了 ！！！\n******************************", "storm");
            
            cardEl.classList.add('card-storm');
            cardEl.innerHTML = `
                <h3>${card.info}</h3>
                <div class="icon">⛈️</div>
                <h2>ゲーム終了</h2>
            `;
            // ★天気パネル自体を点滅させる
            this.currentWeatherPanelEl.classList.add('storm-game-over');
            
        } else {
            // 通常の天気の場合
            this.log(`結果: 降水量は ${card.value} です。`);
            let icon = '☀️';
            if (card.value === 1) icon = '💧';
            if (card.value === 2) icon = '🌧️';
            if (card.value === 3) icon = '🌊';
            
            cardEl.classList.add(card.value === 0 ? 'card-sun' : 'card-rain');
            cardEl.innerHTML = `
                <h3>${card.info}</h3>
                <div class="icon">${icon}</div>
                <div class="value">降水量: ${card.value}</div>
            `;
            // ★嵐の点滅を解除
            this.currentWeatherPanelEl.classList.remove('storm-game-over');
        }
        
        // 「現在の天気」パネルにカードを追加
        this.currentWeatherCardAreaEl.appendChild(cardEl);
    }


    /**
     * ＃＃天気カードを引く (r)
     * ★★★ 大幅変更 ★★★
     */
    draw_weather_card() {
        // アクション結果(fやw)の演出を消す
        this.clearActionVisualizer(); 
        
        // ★ ラウンドを進める
        this.round++;
        this.roundNumberEl.textContent = `Round ${this.round}`;
        this.log(`--- Round ${this.round} 開始 (天気) ---`);
        
        // デッキが空ならリセット (リセット内で round=0 になる)
        if (this.weather_deck.length === 0) {
            this.log("天気カードの山がなくなりました。新しい山を準備します。");
            this.setup_weather_deck();
            
            // setup_weather_deckでRound 0に戻るので、再度Round 1に進める
            this.round++; 
            this.roundNumberEl.textContent = `Round ${this.round}`;
            this.log(`--- Round ${this.round} 開始 (天気) ---`);
        }
        
        const card = this.weather_deck.shift(); // 先頭から1枚引く
        
        this.log(`引いたカード: ${card.info}`);
        this.renderDeckVisual(); // デッキの見た目を更新

        // ★★★ 「現在の天気」パネルにカードを描画 ★★★
        this.renderCurrentWeather(card);
    }

    /**
     * ＃＃木材獲得 (w)
     * ★★★ 変更: clearActionVisualizer を呼ぶように
     */
    get_wood(num_to_draw) {
        this.clearActionVisualizer(); // ★アクション結果欄をリセット
        this.log(`--- 木材獲得 (宣言: ${num_to_draw}個) ---`);
        
        if (num_to_draw < 1 || num_to_draw > 5) {
            this.log("エラー: 宣言する数は1から5の間でなければなりません。");
            return;
        }

        this.bagComponentEl.classList.add('shake');
        
        const drawn_balls = sample(this.master_bag, num_to_draw);
        this.log(`引いた球: ${drawn_balls.map(b => `{${b.color}, ${b.fish}}`).join(', ')}`);
        
        let has_black = false;
        
        drawn_balls.forEach(ball => {
            if (ball.color === 'black') has_black = true;
            
            const ballEl = document.createElement('div');
            ballEl.className = 'drawn-ball';
            ballEl.classList.add(ball.color === 'black' ? 'ball-black' : 'ball-white');
            ballEl.innerHTML = `
                ${ball.fish}
                <span>🐟</span>
            `;
            this.animationArea.appendChild(ballEl); // ★アクション結果欄に描画
        });
        
        if (has_black) {
            this.log("結果: 黒い球が出た！ 🐍毒蛇に噛まれてマヒ", "storm");
            const snakeEl = document.createElement('div');
            snakeEl.className = 'drawn-card card-storm';
            snakeEl.innerHTML = `<div class="icon">🐍</div><h3>毒蛇だ！</h3>`;
            this.animationArea.appendChild(snakeEl); // ★アクション結果欄に描画
            this.animationArea.classList.add('snake-bite');

        } else {
            this.log(`結果: 黒い球は出なかった。木材を ${num_to_draw}個 獲得！`);
            const woodEl = document.createElement('div');
            woodEl.className = 'drawn-card card-sun';
            woodEl.innerHTML = `<div class="icon">🪵</div><h3>木材 ${num_to_draw}個 獲得</h3>`;
            this.animationArea.appendChild(woodEl); // ★アクション結果欄に描画
        }
    }

    /**
     * ＃＃食料獲得 (f)
     * ★★★ 変更: clearActionVisualizer を呼ぶように
     */
    get_food() {
        this.clearActionVisualizer(); // ★アクション結果欄をリセット
        this.log("--- 食料獲得 (Fish) ---");

        this.bagComponentEl.classList.add('shake');

        const drawn_ball = this.master_bag[Math.floor(Math.random() * this.master_bag.length)];
        const food_gained = drawn_ball.fish;
        
        this.log(`結果: 魚が ${food_gained}匹。食料カウンターが ${food_gained} 進む。`);

        const ballEl = document.createElement('div');
        ballEl.className = 'drawn-ball';
        ballEl.classList.add(drawn_ball.color === 'black' ? 'ball-black' : 'ball-white');
        ballEl.innerHTML = `
            ${food_gained}
            <span>🐟</span>
        `;
        this.animationArea.appendChild(ballEl); // ★アクション結果欄に描画
    }
}


// --- メインの実行部分 (変更なし) ---
document.addEventListener('DOMContentLoaded', () => {
    
    const game = new GameSimulator();

    // --- アクションボタンのリスナー ---
    document.getElementById('fish-btn').addEventListener('click', () => game.get_food());
    document.getElementById('rain-btn').addEventListener('click', () => game.draw_weather_card());
    document.getElementById('wood-btn').addEventListener('click', () => {
        const inputEl = document.getElementById('wood-input');
        const num_to_draw = parseInt(inputEl.value, 10);
        
        if (isNaN(num_to_draw)) {
            game.log("エラー: 'w' の後に引く数を指定してください (例: w3)");
        } else {
            game.get_wood(num_to_draw);
        }
    });
    
    // --- ステータス調整ボタンのリスナー ---
    document.getElementById('food-plus').addEventListener('click', () => game.adjustResource('food', 1));
    document.getElementById('food-minus').addEventListener('click', () => game.adjustResource('food', -1));
    document.getElementById('water-plus').addEventListener('click', () => game.adjustResource('water', 1));
    document.getElementById('water-minus').addEventListener('click', () => game.adjustResource('water', -1));
    document.getElementById('wood-res-plus').addEventListener('click', () => game.adjustResource('wood', 1));
    document.getElementById('wood-res-minus').addEventListener('click', () => game.adjustResource('wood', -1));
    document.getElementById('raft-plus').addEventListener('click', () => game.adjustResource('raft', 1));
    document.getElementById('raft-minus').addEventListener('click', () => game.adjustResource('raft', -1));
});