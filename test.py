import random

class GameSimulator:
    """
    指定されたルールのためのシミュレーター
    - f: 食料獲得 (Fish)
    - r: 天気カード (Rain)
    - w[数]: 木材獲得 (Wood)
    """
    
    def __init__(self):
        """
        ゲームの初期設定。
        球の袋と天気カードの山を準備します。
        """
        
        # --- 1. 球（木材・食料）の準備 ---
        ball_w1 = {'color': 'white', 'fish': 1}
        ball_w2 = {'color': 'white', 'fish': 2}
        ball_b3 = {'color': 'black', 'fish': 3}
        
        self.master_bag = [ball_w1] * 3 + [ball_w2] * 2 + [ball_b3] * 1
        
        print(f"球の袋 準備完了。中身 (計{len(self.master_bag)}個): {self.master_bag}")
        
        # --- 2. 天気カードの準備 ---
        self.weather_deck = []
        # 嵐カードをクラス変数として定義（チェックのため）
        self.STORM_CARD_INFO = '降水量2 (嵐)'
        
        self.setup_weather_deck() 
        print("---")


    def setup_weather_deck(self):
        """
        ＃＃天気 のための山札をルール通りに構築する
        """
        print("天気カードの山を準備しています...")
        
        # 1. カードの定義
        storm_card = {'info': self.STORM_CARD_INFO, 'value': 2}
        
        other_cards = (
            [{'info': '降水量0', 'value': 0}] * 4 +
            [{'info': '降水量1', 'value': 1}] * 3 +
            [{'info': '降水量2', 'value': 2}] * 3 +
            [{'info': '降水量3', 'value': 3}] * 1
        )
        
        # 2. 嵐以外の11枚をシャッフル
        random.shuffle(other_cards)
        
        # 3. 5枚(下)と6枚(上)に分ける
        bottom_half_base = other_cards[:5]
        top_half = other_cards[5:]       
        
        # 4. 5枚の束に嵐カードを加え、シャッフル (山の下半分)
        bottom_pile = bottom_half_base + [storm_card]
        random.shuffle(bottom_pile)
        
        # 5. 上半分(嵐なし6枚) + 下半分(嵐あり6枚) で山を構築
        self.weather_deck = top_half + bottom_pile
        
        print(f"天気カードの山 (12枚) をルール通りに構築しました。")


    def draw_weather_card(self):
        """
        ＃＃天気 アクション (コマンド 'r')
        ★ 嵐が出たら目立つように変更
        """
        print("--- 天気カードを引く (Rain) ---")
        
        if not self.weather_deck:
            print("天気カードの山がなくなりました。新しい山を準備します。")
            self.setup_weather_deck() 
        
        card = self.weather_deck.pop(0)
        
        print(f"引いたカード: {card['info']}")
        
        # 嵐(ゲーム終了)カードかどうかをチェック
        if card['info'] == self.STORM_CARD_INFO:
            print("*" * 30)
            print("     ！！！ 嵐 ！！！")
            print("   ！！！ ゲーム終了 ！！！")
            print("*" * 30)
        else:
            # 通常の天気カードの場合
            print(f"結果: 降水量は {card['value']} です。")
        
        print(f"(天気カード残り {len(self.weather_deck)} 枚)")
        print("---")


    def get_wood(self, num_to_draw):
        """
        ＃＃木材獲得 (Wood) のシミュレーション (コマンド 'w[数]')
        """
        print(f"--- 木材獲得 (宣言: {num_to_draw}個) ---")
        
        if not 1 <= num_to_draw <= 5:
            print("エラー: 宣言する数は1から5の間でなければなりません。")
            print("---")
            return
        
        drawn_balls = random.sample(self.master_bag, num_to_draw)
        print(f"引いた球: {drawn_balls}")
        
        has_black = any(ball['color'] == 'black' for ball in drawn_balls)
        
        if has_black:
            print("結果: 黒い球が出た！ 毒蛇に噚まれてマヒ")
        else:
            print(f"結果: 黒い球は出なかった。木材を {num_to_draw}個 獲得！")
        
        print("---")

    def get_food(self):
        """
        ＃＃食料獲得 (Fish) のシミュレーション (コマンド 'f')
        """
        print("--- 食料獲得 ---")
        
        drawn_ball = random.choice(self.master_bag)
        
        food_gained = drawn_ball['fish']
        print(f"結果: 魚が {food_gained}匹。食料カウンターが {food_gained} 進む。")
        print("---")

# --- メインの実行部分 ---
if __name__ == "__main__":
    
    game = GameSimulator()
    
    print("コマンドを入力してください:")
    print(" 'f'     : 食料獲得 (Fish)")
    print(" 'r'     : 天気カードを引く (Rain)")
    print(" 'w[数]' : 木材獲得 (Wood) (例: w3)")
    print(" 'q'     : 終了")
    print("-" * 30)

    while True:
        command = input("> ").strip().lower()

        if command == 'f':
            game.get_food()
        
        elif command == 'r':
            game.draw_weather_card()

        elif command.startswith('w'):
            try:
                num_str = command[1:] 
                if not num_str:
                    print("エラー: 'w' の後に引く数を指定してください (例: w3)")
                    print("---")
                    continue
                
                num_to_draw = int(num_str)
                game.get_wood(num_to_draw)
                
            except ValueError:
                print(f"エラー: '{command}' は無効なコマンドです。wの後は数値(1-5)にしてください。")
                print("---")
            except Exception as e:
                print(f"予期せぬエラーが発生しました: {e}")
                print("---")

        elif command == 'q' or command == 'quit':
            print("シミュレーションを終了します。")
            break

        else:
            print(f"エラー: '{command}' は認識できないコマンドです。")
            print(" ( 'f', 'r', 'w[1-5]', 'q' のいずれかを入力してください )")
            print("---")