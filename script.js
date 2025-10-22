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
        this.logArea = document.getElementById('log-area');
        
        // --- 1. アクション用の設定 ---
        const ball_w1 = { color: 'white', fish: 1 };
        const ball_w2 = { color: 'white', fish: 2 };
        const ball_b3 = { color: 'black', fish: 3 };

        this.master_bag = [
            ...Array(3).fill(ball_w1),
            ...Array(2).fill(ball_w2),
            ...Array(1).fill(ball_b3)
        ];

        this.log(`球の袋 準備完了。中身 (計${this.master_bag.length}個):`);
        this.log(this.master_bag.map(b => `{${b.color}, ${b.fish}}`).join(', '));
        
        this.weather_deck = [];
        this.STORM_CARD_INFO = '降水量2 (嵐)';
        
        this.setup_weather_deck(); 
        this.log("---");
        
        // --- 2. ★★ここから追加：手動パラメータ★★ ---
        // プレイヤーのステータス
        this.food = 0;
        this.water = 0;
        this.wood = 0;
        this.raft = 0;
        
        // 表示用エレメントの参照
        this.foodValueEl = document.getElementById('food-value');
        this.waterValueEl = document.getElementById('water-value');
        this.woodValueEl = document.getElementById('wood-value');
        this.raftValueEl = document.getElementById('raft-value');
        
        // 初期値を表示に反映
        this.updateDisplay();
        // --- ★★ここまで追加★★ ---
    }
    
    // --- ★★ここから追加：手動パラメータ用メソッド★★ ---
    
    /**
     * パラメータを指定して増減させる
     * @param {string} resource - 'food', 'water', 'wood', 'raft' のいずれか
     * @param {number} amount - 増減量 (例: 1 または -1)
     */
    adjustResource(resource, amount) {
        switch(resource) {
            case 'food':
                this.food = Math.max(0, this.food + amount); // 0未満にならないように
                break;
            case 'water':
                this.water = Math.max(0, this.water + amount);
                break;
            case 'wood':
                this.wood = Math.max(0, this.wood + amount);
                break;
            case 'raft':
                this.raft = Math.max(0, this.raft + amount);
                break;
        }
        // 表示を更新
        this.updateDisplay();
    }
    
    /**
     * すべてのステータス表示を現在の値で更新する
     */
    updateDisplay() {
        this.foodValueEl.textContent = this.food;
        this.waterValueEl.textContent = this.water;
        this.woodValueEl.textContent = this.wood;
        this.raftValueEl.textContent = this.raft;
    }
    
    // --- ★★ここまで追加★★ ---
    
    /**
     * ログエリアにメッセージを追記するヘルパー関数
     */
    log(message) {
        if (message.includes('！！！ 嵐 ！！！')) {
            const lines = message.split('\n');
            for (const line of lines) {
                const p = document.createElement('p');
                p.textContent = line;
                if (line.includes('！！！')) {
                    p.className = 'storm-warning';
                }
                this.logArea.appendChild(p);
            }
        } else {
            this.logArea.textContent += message + '\n';
        }
        this.logArea.scrollTop = this.logArea.scrollHeight;
    }

    /**
     * 天気のための山札をルール通りに構築する
     */
    setup_weather_deck() {
        this.log("天気カードの山を準備しています...");
        
        const storm_card = { info: this.STORM_CARD_INFO, value: 2 };
        
        let other_cards = [
            ...Array(4).fill({ info: '降水量0', value: 0 }),
            ...Array(3).fill({ info: '降水量1', value: 1 }),
            ...Array(3).fill({ info: '降水量2', value: 2 }),
            ...Array(1).fill({ info: '降水量3', value: 3 })
        ];
        
        shuffle(other_cards);
        
        const bottom_half_base = other_cards.slice(0, 5); 
        const top_half = other_cards.slice(5);
        
        let bottom_pile = [...bottom_half_base, storm_card];
        shuffle(bottom_pile);
        
        this.weather_deck = [...top_half, ...bottom_pile];
        
        this.log("天気カードの山 (12枚) をルール通りに構築しました。");
    }

    /**
     * ＃＃天気 アクション
     */
    draw_weather_card() {
        this.log("--- 天気カードを引く (Rain) ---");
        
        if (this.weather_deck.length === 0) {
            this.log("天気カードの山がなくなりました。新しい山を準備します。");
            this.setup_weather_deck(); 
        }
        
        const card = this.weather_deck.shift();
        
        this.log(`引いたカード: ${card.info}`);
        
        if (card.info === this.STORM_CARD_INFO) {
            this.log("******************************\n     ！！！ 嵐 ！！！\n   ！！！ ゲーム終了 ！！！\n******************************");
        } else {
            this.log(`結果: 降水量は ${card.value} です。`);
        }
        
        this.log(`(天気カード残り ${this.weather_deck.length} 枚)`);
        this.log("---");
    }

    /**
     * ＃＃木材獲得 (Wood) のシミュレーション
     */
    get_wood(num_to_draw) {
        this.log(`--- 木材獲得 (宣言: ${num_to_draw}個) ---`);
        
        if (num_to_draw < 1 || num_to_draw > 5) {
            this.log("エラー: 宣言する数は1から5の間でなければなりません。");
            this.log("---");
            return;
        }
        
        const drawn_balls = sample(this.master_bag, num_to_draw);
        
        const balls_str = drawn_balls.map(b => `{color: '${b.color}', fish: ${b.fish}}`).join(', ');
        this.log(`引いた球: [${balls_str}]`);
        
        const has_black = drawn_balls.some(ball => ball.color === 'black');
        
        if (has_black) {
            this.log("結果: 黒い球が出た！ 毒蛇に噙まれてマヒ");
        } else {
            this.log(`結果: 黒い球は出なかった。木材を ${num_to_draw}個 獲得！`);
            // ★もし将来的にアクションと連動させたくなった場合は、
            // ここで this.adjustResource('wood', num_to_draw); を呼び出します。
        }
        
        this.log("---");
    }

    /**
     * ＃＃食料獲得 (Fish) のシミュレーション
     */
    get_food() {
        this.log("--- 食料獲得 ---");
        
        const drawn_ball = this.master_bag[Math.floor(Math.random() * this.master_bag.length)];
        
        const food_gained = drawn_ball.fish;
        this.log(`結果: 魚が ${food_gained}匹。食料カウンターが ${food_gained} 進む。`);
        
        // ★もし将来的にアクションと連動させたくなった場合は、
        // ここで this.adjustResource('food', food_gained); を呼び出します。
        
        this.log("---");
    }
}


// --- メインの実行部分 ---
document.addEventListener('DOMContentLoaded', () => {
    
    const game = new GameSimulator();

    // --- アクションボタンのリスナー (既存) ---
    
    document.getElementById('fish-btn').addEventListener('click', () => {
        game.get_food();
    });

    document.getElementById('rain-btn').addEventListener('click', () => {
        game.draw_weather_card();
    });

    document.getElementById('wood-btn').addEventListener('click', () => {
        const inputEl = document.getElementById('wood-input');
        const num_to_draw = parseInt(inputEl.value, 10);
        
        if (isNaN(num_to_draw)) {
            game.log("エラー: 'w' の後に引く数を指定してください (例: w3)");
            game.log("---");
        } else {
            game.get_wood(num_to_draw);
        }
    });
    
    // --- ★★ここから追加：ステータス調整ボタンのリスナー★★ ---
    
    // 食料
    document.getElementById('food-plus').addEventListener('click', () => game.adjustResource('food', 1));
    document.getElementById('food-minus').addEventListener('click', () => game.adjustResource('food', -1));
    
    // 水
    document.getElementById('water-plus').addEventListener('click', () => game.adjustResource('water', 1));
    document.getElementById('water-minus').addEventListener('click', () => game.adjustResource('water', -1));
    
    // 木材 (IDが木材獲得ボタンと被らないよう 'wood-res-plus' にしています)
    document.getElementById('wood-res-plus').addEventListener('click', () => game.adjustResource('wood', 1));
    document.getElementById('wood-res-minus').addEventListener('click', () => game.adjustResource('wood', -1));
    
    // イカダ
    document.getElementById('raft-plus').addEventListener('click', () => game.adjustResource('raft', 1));
    document.getElementById('raft-minus').addEventListener('click', () => game.adjustResource('raft', -1));

});