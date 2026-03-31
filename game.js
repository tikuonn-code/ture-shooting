// --- 初期設定とDOM要素の取得 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreValue = document.getElementById('scoreValue');
const finalScore = document.getElementById('finalScore');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const homeBtn = document.getElementById('home-btn');

// 追加UI要素
const levelValue = document.getElementById('levelValue');
const expBarFill = document.getElementById('exp-bar-fill');
const levelUpScreen = document.getElementById('level-up-screen');
const powerupContainer = document.getElementById('powerup-container');
const dictScreen = document.getElementById('dictionary-screen');
const dictBtn = document.getElementById('dict-btn');
const dictBackBtn = document.getElementById('dict-back-btn');
const dictContainer = document.getElementById('dict-container');
const helpScreen = document.getElementById('help-screen');
const helpBtn = document.getElementById('help-btn');
const helpBackBtn = document.getElementById('help-back-btn');
const collectionScreen = document.getElementById('collection-screen');
const collectionBtn = document.getElementById('collection-btn');
const collectionBackBtn = document.getElementById('collection-back-btn');
const gachaScreen = document.getElementById('gacha-screen');
const gachaBtn = document.getElementById('gacha-btn');
const gachaBackBtn = document.getElementById('gacha-back-btn');
const luminousCount = document.getElementById('luminousCount');
const gachaLuminousCount = document.getElementById('gachaLuminousCount');
const gachaSingleBtn = document.getElementById('gacha-single-btn');
const gachaMultiBtn = document.getElementById('gacha-multi-btn');
const gachaResultArea = document.getElementById('gacha-result-area');
const collectionContainer = document.getElementById('collection-container');
const gachaHandle = document.getElementById('gacha-handle');
const gachaCapsuleDispense = document.getElementById('gacha-capsule-dispense');

const targetDisplay = document.getElementById('target-display');
const targetIcon = document.getElementById('targetIcon');
const targetCountEl = document.getElementById('targetCount');
const bossHpContainer = document.getElementById('boss-hp-container');
const bossHpFill = document.getElementById('boss-hp-fill');

// ガチャアイテム定義
const GACHA_ITEMS = [
    { id: 'item_01', name: '強化チップ:β', rarity: 'N', icon: '💾', desc: '基本的な回路の一部' },
    { id: 'item_02', name: 'エナジーコア:小', rarity: 'N', icon: '🔋', desc: '少量のエネルギー' },
    { id: 'item_03', name: 'ナノリペアキット', rarity: 'N', icon: '🔧', desc: '微細な傷を修復する' },
    { id: 'item_04', name: '未知の残骸', rarity: 'N', icon: '🧱', desc: '何かの部品のようだ' },
    { id: 'item_05', name: '拡張バレル:A', rarity: 'R', icon: '🔫', desc: '射程を伸ばすパーツ' },
    { id: 'item_06', name: '冷却水タンク', rarity: 'R', icon: '💧', desc: 'オーバーヒートを防ぐ' },
    { id: 'item_07', name: '強化チップ:α', rarity: 'R', icon: '💿', desc: '高度な演算回路' },
    { id: 'item_08', name: 'エナジーコア:大', rarity: 'SR', icon: '⚡', desc: '膨大なエネルギーの塊' },
    { id: 'item_09', name: '高出力モーター', rarity: 'SR', icon: '⚙️', desc: '機動力を底上げする' },
    { id: 'item_10', name: '量子プロセッサ', rarity: 'SSR', icon: '🌌', desc: '時空を超える演算能力' },
    { id: 'item_11', name: '古の動力源', rarity: 'SSR', icon: '💎', desc: '伝説のエネルギー体' },
];

// --- ゲームの状態変数 ---
let animationId;
let score = 0;
let luminousMatter = parseInt(localStorage.getItem('luminousMatter')) || 0;
let isLuminousBoostActive = false;
let luminousBoostTimer = 0;
let luminousBoostDuration = 15000; // 15秒
let lastBoostCheckScore = 0;
let isGameOver = false;
let isPlaying = false;
let gameScale = 1.0; // スマホ/PCのスケーリング用

// ボス・ターゲット関連
let currentTargetType = 'normal';
let currentTargetKills = 0;
const targetRequiredKills = 10;
let isBossActive = false;
let boss = null;

// コレクション管理
let ownedItems = {};
try {
    let rawOwnedData = localStorage.getItem('neonShooterCollection');
    if (rawOwnedData) {
        let parsed = JSON.parse(rawOwnedData);
        if (Array.isArray(parsed)) {
            // 旧フォーマット（配列）からの移行
            parsed.forEach(id => {
                ownedItems[id] = (ownedItems[id] || 0) + 1;
            });
        } else {
            ownedItems = parsed;
        }
    }
} catch (e) {
    ownedItems = {};
}

// 画面サイズをキャンバスに合わせる
// 画面サイズをキャンバスに合わせる
// スマホ（縦長）以外の場合は、画面幅を制限して敵が極端に分散しないようにする
function resizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // スケーリング：基準となる高さを 900px とし、それに対する比率でスケールを決定
    // これにより、解像度の高いPCでも小さいスマホでも、相対的なサイズ感が一定になる
    gameScale = h / 900;
    if (w < 800) {
        gameScale *= 1.2; // スマホでは少しだけ拡大して見やすくする
    }

    // プレイエリアの幅を決定
    let canvasW = w;
    if (w > 800) {
        // PCなどの横長画面の場合、最大幅を制限（縦長に見えるように）
        canvasW = Math.min(800, w * 0.8);
    }

    canvas.width = canvasW;
    canvas.height = h;

    // キャンバスを中央に配置するためのCSS調整
    canvas.style.position = 'absolute';
    canvas.style.left = `${(window.innerWidth - canvasW) / 2}px`;

    // UIレイヤーの幅もキャンバスに合わせる
    const uiLayer = document.getElementById('ui-layer');
    if (uiLayer) {
        uiLayer.style.width = `${canvasW}px`;
        uiLayer.style.left = `${(window.innerWidth - canvasW) / 2}px`;
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // 初期化

// --- クラス定義 ---

// プレイヤー（自機）
class Player {
    constructor() {
        this.width = 30 * gameScale;
        this.height = 30 * gameScale;
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.color = '#0ff'; // ネオンシアン

        // 射撃制御
        this.lastShotTime = 0;
        this.fireRate = 200; // ミリ秒間隔
        this.shotType = 'single'; // 'single', 'twin', 'triple'
        this.shotSize = 4 * gameScale;
        this.shotDamage = 1;
        this.pierce = false;
        this.homing = false;
        this.element = 'none'; // 'flame', 'frost', 'thunder'

        // レーザー制御
        this.isLaserActive = false;
        this.laserDuration = 500; // 0.5秒間
        this.laserCooldown = 3000; // 3秒クールダウン
        this.lastLaserTime = 0;
        this.laserWidth = 30 * gameScale;

        // その他の能力
        this.magnetRange = 150 * gameScale;
        this.speedFactor = 0.2;

        // シールド
        this.shieldActive = false;
        this.shieldAngle = 0;
    }

    draw() {
        ctx.save();

        // レーザーの描画
        if (this.isLaserActive) {
            ctx.beginPath();
            // 先端位置から画面上部まで
            ctx.rect(this.x - this.laserWidth / 2, 0, this.laserWidth, this.y - this.height / 2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.8)'; // 半透明のシアン
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#0ff';
            ctx.fill();
        }

        ctx.beginPath();
        // 自機を三角形で描画
        ctx.moveTo(this.x, this.y - this.height / 2); // 先端
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2); // 右下
        ctx.lineTo(this.x, this.y + this.height / 4); // 底辺中央のへこみ
        ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2); // 左下
        ctx.closePath();

        // ネオン効果（グロー）
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // シールドの描画
        if (this.shieldActive) {
            ctx.beginPath();
            const sx = this.x + Math.cos(this.shieldAngle) * 40;
            const sy = this.y + Math.sin(this.shieldAngle) * 40;
            const sRadius = 8;

            // 六角形シールド
            for (let i = 0; i < 6; i++) {
                ctx.lineTo(sx + sRadius * Math.cos(i * Math.PI / 3), sy + sRadius * Math.sin(i * Math.PI / 3));
            }
            ctx.closePath();
            ctx.shadowColor = '#0f0';
            ctx.strokeStyle = '#0f0';
            ctx.stroke();
            this.shieldAngle += 0.05;
        }

        ctx.restore();
    }

    update(targetX, targetY, dt) {
        // マウス/タッチされた位置を追従（現在位置から目標位置へ近づく）
        // スムーズな移動(Lerp処理) にDelta Timeを考慮
        this.x += (targetX - this.x) * this.speedFactor * dt;
        this.y += (targetY - this.y) * this.speedFactor * dt;

        // 画面外に出ないように制限
        if (this.x < this.width / 2) this.x = this.width / 2;
        if (this.x > canvas.width - this.width / 2) this.x = canvas.width - this.width / 2;
        if (this.y < this.height / 2) this.y = this.height / 2;
        // 画面下部はキャンバスの高さギリギリまで移動できるようにする。
        if (this.y > canvas.height - this.height / 2) this.y = canvas.height - this.height / 2;

        // レーザーの状態更新
        if (this.isLaserActive) {
            const now = Date.now();
            if (now - this.lastLaserTime > this.laserDuration) {
                this.isLaserActive = false; // 持続時間終了でオフ
            }
        }
    }

    shoot() {
        const now = Date.now();
        // レーザー発射中は通常弾を撃たない
        if (this.isLaserActive) return;

        if (now - this.lastShotTime > this.fireRate) {
            // ショットタイプに応じて弾を生成
            if (this.shotType === 'single') {
                projectiles.push(new Projectile(this.x, this.y - this.height / 2, { x: 0, y: -10 }));
            } else if (this.shotType === 'twin') {
                projectiles.push(new Projectile(this.x - 10, this.y - this.height / 2, { x: 0, y: -10 }));
                projectiles.push(new Projectile(this.x + 10, this.y - this.height / 2, { x: 0, y: -10 }));
            } else if (this.shotType === 'triple') {
                projectiles.push(new Projectile(this.x, this.y - this.height / 2, { x: 0, y: -10 }));
                projectiles.push(new Projectile(this.x - 10, this.y - this.height / 2, { x: -2, y: -9.8 }));
                projectiles.push(new Projectile(this.x + 10, this.y - this.height / 2, { x: 2, y: -9.8 }));
            }
            this.lastShotTime = now;
        }
    }

    fireLaser() {
        const now = Date.now();
        // クールダウン経過後のみ発動可能
        if (!this.isLaserActive && now - this.lastLaserTime > this.laserCooldown) {
            this.isLaserActive = true;
            this.lastLaserTime = now;
        }
    }
}

// 弾
class Projectile {
    constructor(x, y, velocity) {
        this.x = x;
        this.y = y;
        this.radius = player.shotSize;
        this.velocity = velocity;
        this.damage = player.shotDamage;
        this.pierce = player.pierce;
        this.homing = player.homing;
        this.element = player.element; // 'flame', 'frost', 'thunder'

        // 属性による色の変化
        this.color = '#ff0'; // 基本はイエロー
        if (this.element === 'flame') this.color = '#f50';
        if (this.element === 'frost') this.color = '#8cf';
        if (this.element === 'thunder') this.color = '#ff5';

        this.markedForDeletion = false;

        // 貫通機能用（既に当てた敵のIDを記録するが、今回は簡易的に衝突時に処理）
        this.hitEnemies = new Set();
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        // ネオン効果
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update(dt) {
        // ホーミング機能
        if (this.homing && enemies.length > 0) {
            let closest = null;
            let minDist = Infinity;
            enemies.forEach(e => {
                if (e.markedForDeletion) return;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = e;
                }
            });
            if (closest) {
                const angle = Math.atan2(closest.y - this.y, closest.x - this.x);
                // 追尾性能もDelta Timeで補正
                this.velocity.x += Math.cos(angle) * 0.07 * dt;
                this.velocity.y += Math.sin(angle) * 0.07 * dt;
                // 最大速度をクリップ
                const currentSpeed = Math.hypot(this.velocity.x, this.velocity.y);
                const maxSpeed = 10;
                if (currentSpeed > maxSpeed) {
                    this.velocity.x = (this.velocity.x / currentSpeed) * maxSpeed;
                    this.velocity.y = (this.velocity.y / currentSpeed) * maxSpeed;
                }
            }
        }

        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;

        // 画面外に出たら削除フラグを立てる（X軸も考慮）
        if (this.y < -this.radius || this.x < -this.radius ||
            this.x > canvas.width + this.radius || this.y > canvas.height + this.radius) {
            this.markedForDeletion = true;
        }
    }
}

// 敵
class Enemy {
    constructor(x, y, type = null) {
        const typeRand = Math.random();

        if (type) {
            this.type = type;
        } else {
            if (typeRand < 0.1) this.type = 'shooter'; // 10%で射撃型
            else if (typeRand < 0.2) this.type = 'splitter'; // 10%で分裂型
            else if (typeRand < 0.35) this.type = 'tank'; // 15%でタンク型
            else if (typeRand < 0.6) this.type = 'speed'; // 25%でスピード型
            else this.type = 'normal'; // 40%でノーマル型
        }

        // タイプに応じた初期設定
        switch (this.type) {
            case 'tank':
                this.radius = (Math.random() * 10 + 25) * gameScale;
                this.color = '#f04';
                this.hp = 5;
                this.speedMultiplier = 0.5;
                this.expValue = 5;
                break;
            case 'speed':
                this.radius = (Math.random() * 5 + 15) * gameScale;
                this.color = '#ff0';
                this.hp = 1;
                this.speedMultiplier = 2.0;
                this.expValue = 2;
                break;
            case 'shooter':
                this.radius = (Math.random() * 5 + 20) * gameScale;
                this.color = '#0af'; // 青・水色系
                this.hp = 2;
                this.speedMultiplier = 0.7;
                this.expValue = 4;
                this.lastShootTime = 0;
                this.shootInterval = 2000; // 2秒おき
                break;
            case 'splitter':
                this.radius = (Math.random() * 5 + 23) * gameScale;
                this.color = '#a0f'; // 紫系
                this.hp = 3;
                this.speedMultiplier = 0.6;
                this.expValue = 6;
                break;
            case 'mini-splitter':
                this.radius = (Math.random() * 3 + 10) * gameScale;
                this.color = '#a0f';
                this.hp = 1;
                this.speedMultiplier = 1.2;
                this.expValue = 1;
                break;
            default: // normal
                this.radius = (Math.random() * 10 + 20) * gameScale;
                this.color = '#f0f';
                this.hp = 2;
                this.speedMultiplier = 1.0;
                this.expValue = 1;
        }

        this.x = x || Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = y || -this.radius;

        // レベル5以上でのステータス補正（底上げ）
        if (currentLevel >= 5) {
            const levelFactor = currentLevel - 4;
            // HPをレベルに応じて増加 (レベル5で1.4倍、以降+40%ずつ)
            const hpScale = 1 + (levelFactor * 0.4);
            this.hp = Math.ceil(this.hp * hpScale);
            
            // 速度を段階的に上昇
            this.speedMultiplier *= (1 + levelFactor * 0.08);
            
            // シューターの攻撃間隔を短縮
            if (this.type === 'shooter') {
                this.shootInterval = Math.max(600, this.shootInterval - levelFactor * 150);
            }
        }

        const baseSpeed = (40 * gameScale - this.radius) * 0.1;
        this.velocity = { x: (Math.random() - 0.5) * 2, y: baseSpeed * this.speedMultiplier + 1 };

        this.markedForDeletion = false;
        this.angle = 0;
        this.spinSpeed = (Math.random() - 0.5) * 0.1;
        this.damageFlash = 0;
        this.onFire = 0;
        this.isFrozen = 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.damageFlash = 5;
        if (this.hp <= 0) {
            this.markedForDeletion = true;

            // 分裂ロジック
            if (this.type === 'splitter') {
                const count = Math.floor(Math.random() * 2) + 2; // 2-3体
                for (let i = 0; i < count; i++) {
                    const child = new Enemy(this.x, this.y, 'mini-splitter');
                    // 放射状に飛ぶように調整
                    const angle = (i / count) * Math.PI * 2;
                    child.velocity.x = Math.cos(angle) * 4;
                    child.velocity.y = Math.sin(angle) * 4 + 2;
                    enemies.push(child);
                }
            }

            // 発光体のドロップ判定（死亡時のみ）
            this.dropLuminous();
        }
    }

    // 発光体のドロップロジック
    dropLuminous() {
        let dropProb = 0;
        // 色からタイプを判定し、指定の確率を設定
        if (this.color === '#f04') dropProb = 0.0001; // Pink (Tank) -> 0.01%
        else if (this.color === '#0af') dropProb = 0.01;   // Blue (Shooter) -> 1% (ご指定通り：赤1%だがコード上のShooterは青なのでこちらに適用)
        else if (this.color === '#ff0' && this.type === 'speed') dropProb = 0.03; // Yellow/Speed (Redの代わりとして3%?)
        else if (this.type === 'splitter') dropProb = 0.05; // Yellow (Splitter) -> 5%
        else if (this.type === 'mini-splitter') dropProb = 0.05; // Purple (Mini-Splitter) -> 5%
        else if (this.color === '#f0f') dropProb = 0.03; // Normal (Blue?) -> 3%
        
        // 元の指示の解釈: 
        // ピンク(Tank系) 0.01% / 赤(Shooter?) 1% / 黄(Splitter) 5% / 青(Normal?) 3% / 紫(分裂時) 5%
        // 現在のコードの色: tank=#f04(pink), shooter=#0af(blue), speed=#ff0(yellow), splitter=#a0f(purple), normal=#f0f(magenta/pink)
        
        // 指示に厳密に合わせるための再調整:
        if (this.type === 'tank') dropProb = 0.0001; // ピンク 0.01%
        if (this.type === 'shooter') dropProb = 0.01; // 赤(指示) -> シューター 1%
        if (this.type === 'normal') dropProb = 0.03; // 青(指示) -> ノーマル 3%
        if (this.type === 'splitter') dropProb = 0.05; // 黄色(指示) -> スプリッター 5%
        if (this.type === 'mini-splitter') dropProb = 0.05; // 紫(指示) -> 分裂時 5%

        // ブースト期間中は確率10倍
        if (isLuminousBoostActive) {
            dropProb *= 10;
        }

        if (Math.random() < dropProb) {
            luminousMatter++;
            updateLuminousUI();
            saveLuminous();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath();

        if (this.type === 'tank') {
            for (let i = 0; i < 6; i++) {
                ctx.lineTo(this.radius * Math.cos(i * Math.PI / 3), this.radius * Math.sin(i * Math.PI / 3));
            }
            ctx.closePath();
        } else if (this.type === 'speed') {
            ctx.moveTo(0, this.radius);
            ctx.lineTo(this.radius * 0.866, -this.radius * 0.5);
            ctx.lineTo(-this.radius * 0.866, -this.radius * 0.5);
            ctx.closePath();
        } else if (this.type === 'shooter') {
            // シューターは菱形に近い八角形
            for (let i = 0; i < 8; i++) {
                const r = i % 2 === 0 ? this.radius : this.radius * 0.7;
                ctx.lineTo(r * Math.cos(i * Math.PI / 4), r * Math.sin(i * Math.PI / 4));
            }
            ctx.closePath();
        } else if (this.type === 'splitter' || this.type === 'mini-splitter') {
            // スプリッターは星型っぽく
            for (let i = 0; i < 10; i++) {
                const r = i % 2 === 0 ? this.radius : this.radius * 0.4;
                ctx.lineTo(r * Math.cos(i * Math.PI / 5), r * Math.sin(i * Math.PI / 5));
            }
            ctx.closePath();
        } else {
            // 通常敵（ピンク）の場合、レベル5以上では元の体を描画せず目玉のみにする
            if (!(currentLevel >= 5 && this.type === 'normal')) {
                ctx.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
            }
        }

        ctx.shadowBlur = currentLevel >= 5 ? 25 : 15; // レベル5以上はより強く発光
        ctx.shadowColor = this.damageFlash > 0 ? '#fff' : this.color;

        ctx.strokeStyle = this.damageFlash > 0 ? '#fff' : this.color;
        ctx.lineWidth = currentLevel >= 5 ? 5 : 3; // レベル5以上は輪郭を太く
        ctx.stroke();

        ctx.fillStyle = this.damageFlash > 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        ctx.fill();

        // 強化レベル(Lv5+)に応じて「ナッツ型の瞳を持つ一つ目」を描画
        if (currentLevel >= 5 && this.type === 'normal') {
            const w = this.radius * 1.4;
            const h = this.radius * 0.9;
            
            // プレイヤーの方向を計算して瞳をわずかにずらす（凝視エフェクト）
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            const pupilOffset = 3 * gameScale;
            const px = Math.cos(angleToPlayer) * pupilOffset;
            const py = Math.sin(angleToPlayer) * pupilOffset;

            // 目玉の本体（ナッツ型/横長の楕円）
            ctx.beginPath();
            ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#f00';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#f00';
            ctx.fill();
            
            // 瞳孔（ナッツ型・縦長の楕円）
            ctx.beginPath();
            ctx.ellipse(px, py, w * 0.4, h * 0.8, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#111';
            ctx.shadowBlur = 0;
            ctx.fill();

            // 瞳孔の中にさらに細いスリット（爬虫類のような瞳）
            ctx.beginPath();
            ctx.ellipse(px, py, w * 0.1, h * 0.6, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();

            // ハイライト
            ctx.beginPath();
            ctx.arc(px - w * 0.4, py - h * 0.4, w * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();
            
            // 血管・筋肉のような筋
            ctx.strokeStyle = '#a00';
            ctx.lineWidth = 1;
            for(let i = 0; i < 4; i++) {
                const side = i < 2 ? 1 : -1;
                ctx.beginPath();
                ctx.moveTo(side * w * 0.6, 0);
                ctx.quadraticCurveTo(side * w, side * h, side * w * 0.9, 0);
                ctx.stroke();
            }
        } else if (currentLevel >= 5 && this.type !== 'mini-splitter') {
            // 他の敵種の場合は従来通り上に目を重ねる
            const eyeSize = this.radius * 0.8;
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            const pupilOffset = 2 * gameScale;
            const px = Math.cos(angleToPlayer) * pupilOffset;
            const py = Math.sin(angleToPlayer) * pupilOffset;

            ctx.beginPath();
            ctx.arc(0, 0, eyeSize, 0, Math.PI * 2);
            ctx.fillStyle = '#f00';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#f00';
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(px, py, eyeSize * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = '#111';
            ctx.fill();
        }

        if (this.damageFlash > 0) this.damageFlash--;

        if (this.type === 'normal') {
            // レベル5以上でピンクの模様（十字のライン）を消す
            if (!(currentLevel >= 5)) {
                ctx.beginPath();
                ctx.moveTo(-this.radius, 0); ctx.lineTo(this.radius, 0);
                ctx.moveTo(0, -this.radius); ctx.lineTo(0, this.radius);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    update(dt) {
        let speedMod = this.isFrozen > 0 ? 0.3 : 1.0;
        this.x += this.velocity.x * speedMod * dt;
        this.y += this.velocity.y * speedMod * dt;
        this.angle += this.spinSpeed * speedMod * dt;

        // ボス出現中は通常の敵は積極的には攻撃してこないようにする（またはボスの邪魔をしない）
        if (isBossActive) speedMod *= 0.5;

        // シューターの攻撃射撃ロジック
        if (this.type === 'shooter' && !isGameOver && !isBossActive) {
            const now = Date.now();
            if (now - this.lastShootTime > this.shootInterval) {
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                enemyProjectiles.push(new EnemyProjectile(this.x, this.y, {
                    x: Math.cos(angle) * 4, // 弾速を少しアップ (3 -> 4)
                    y: Math.sin(angle) * 4
                }));
                this.lastShootTime = now;
            }
        }

        // 炎上ダメージ
        if (this.onFire > 0) {
            this.onFire -= dt;
            if (Math.floor(this.onFire) % 30 === 0) {
                this.takeDamage(0.5);
                for (let i = 0; i < 3; i++) particles.push(new Particle(this.x, this.y, '#f50'));
            }
        }
        if (this.isFrozen > 0) this.isFrozen -= dt;

        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.velocity.x *= -1;
        }

        if (this.y > canvas.height + this.radius) {
            this.markedForDeletion = true;
        }
    }
}

// 敵の弾
class EnemyProjectile {
    constructor(x, y, velocity) {
        this.x = x;
        this.y = y;
        this.radius = 5 * gameScale;
        this.velocity = velocity;
        this.color = '#f00'; // 敵の弾は赤
        this.markedForDeletion = false;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update(dt) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;

        if (this.y < -this.radius || this.x < -this.radius ||
            this.x > canvas.width + this.radius || this.y > canvas.height + this.radius) {
            this.markedForDeletion = true;
        }
    }
}

// ボス敵
class Boss {
    constructor() {
        this.width = 120 * gameScale;
        this.height = 100 * gameScale;
        this.x = canvas.width / 2;
        this.y = -this.height; // 上から登場
        this.targetY = 150 * gameScale; // この高さで止まる
        this.color = '#f00'; // ボスは不気味な赤
        // ボスHPをレベル5から段階的に強化（半分程度に調整）
        const levelBonus = currentLevel >= 5 ? (currentLevel - 4) * 50 : 0;
        this.hpMax = 60 + (currentLevel * 30) + levelBonus;
        this.hp = this.hpMax;
        
        this.velocity = { x: 2, y: 1 };
        this.lastAttackTime = 0;
        this.attackInterval = 2500;
        this.attackPhase = 0;
        
        this.markedForDeletion = false;
        this.isEntering = true;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // メインボディ (初期デザインの復元)
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(this.width/2, 0);
        ctx.lineTo(0, this.height/2);
        ctx.lineTo(-this.width/2, 0);
        ctx.closePath();
        
        ctx.shadowBlur = 30;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        ctx.stroke();
        
        // 内部コア
        ctx.beginPath();
        ctx.arc(0, 0, 20 * gameScale, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#fff';
        ctx.stroke();
        
        // 腕（のようなパーツ）
        ctx.lineWidth = 3;
        const armWave = Math.sin(Date.now() / 500) * 20;
        ctx.beginPath();
        ctx.moveTo(-this.width/2, 0);
        ctx.lineTo(-this.width/2 - 30, armWave);
        ctx.moveTo(this.width/2, 0);
        ctx.lineTo(this.width/2 + 30, -armWave);
        ctx.stroke();
        
        ctx.restore();
    }

    update(dt) {
        if (this.isEntering) {
            this.y += (this.targetY - this.y) * 0.05 * dt;
            if (Math.abs(this.y - this.targetY) < 1) {
                this.isEntering = false;
                bossHpContainer.style.display = 'block';
            }
            return;
        }

        // 左右に移動
        this.x += this.velocity.x * dt;
        if (this.x < this.width/2 + 20 || this.x > canvas.width - this.width/2 - 20) {
            this.velocity.x *= -1;
        }

        // 攻撃パターン
        const now = Date.now();
        if (now - this.lastAttackTime > this.attackInterval) {
            this.attack();
            this.lastAttackTime = now;
            this.attackPhase = (this.attackPhase + 1) % 3;
        }

        // HPバー更新
        const hpPercent = (this.hp / this.hpMax) * 100;
        bossHpFill.style.width = hpPercent + '%';
    }

    attack() {
        switch (this.attackPhase) {
            case 0: // 全方位 12弾
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2;
                    enemyProjectiles.push(new EnemyProjectile(this.x, this.y, {
                        x: Math.cos(angle) * 4,
                        y: Math.sin(angle) * 4
                    }));
                }
                break;
            case 1: // 3連狙い撃ち
                let count = 0;
                const interval = setInterval(() => {
                    if (!isPlaying || isGameOver) {
                        clearInterval(interval);
                        return;
                    }
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    enemyProjectiles.push(new EnemyProjectile(this.x, this.y, {
                        x: Math.cos(angle) * 6,
                        y: Math.sin(angle) * 6
                    }));
                    count++;
                    if (count >= 3) clearInterval(interval);
                }, 200);
                break;
            case 2: // 高速拡散弾
                for (let i = -2; i <= 2; i++) {
                    enemyProjectiles.push(new EnemyProjectile(this.x, this.y, {
                        x: i * 1.5,
                        y: 7
                    }));
                }
                break;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.markedForDeletion = true;
        isBossActive = false;
        bossHpContainer.style.display = 'none';
        
        // 爆発エフェクト
        for (let i = 0; i < 50; i++) {
            particles.push(new Particle(this.x, this.y, this.color));
        }

        // 報酬
        score += 2000;
        scoreValue.innerText = score;
        
        // 大量ドロップ
        luminousMatter += 20;
        updateLuminousUI();
        saveLuminous();

        // 30秒間の10倍フィーバー！
        isLuminousBoostActive = true;
        luminousBoostTimer = 30000;
        luminousCount.parentElement.classList.add('boost-active');
        createBoostEffect("MEGA BOOST!! 30s");

        // 次のターゲット設定
        setupNewTarget();
    }
}

// パーティクル（爆発エフェクト）
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 2 + 1;
        this.color = color;
        this.velocity = {
            x: (Math.random() - 0.5) * 8, // ランダムな方向に散る
            y: (Math.random() - 0.5) * 8
        };
        this.alpha = 1; // 透明度
        this.markedForDeletion = false;
        // 摩擦（徐々に減速する）
        this.friction = 0.95;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }

    update(dt) {
        // 徐々に減速する（Delta Time考慮）
        const currentFriction = Math.pow(this.friction, dt);
        this.velocity.x *= currentFriction;
        this.velocity.y *= currentFriction;
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        // 徐々に透明にする
        this.alpha -= 0.02 * dt;
        if (this.alpha <= 0) {
            this.markedForDeletion = true;
        }
    }
}

// 経験値ジェム
class ExpGem {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.radius = Math.min(6 + value * 0.5, 12); // 価値が高いほど少し大きい
        this.value = value;
        this.color = '#0f0'; // ネオングリーン
        this.markedForDeletion = false;
        this.magnetized = false; // プレイヤーに引き寄せられているか
        this.speed = 0;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        // 菱形で描画
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x + this.radius * 0.8, this.y);
        ctx.lineTo(this.x, this.y + this.radius);
        ctx.lineTo(this.x - this.radius * 0.8, this.y);
        ctx.closePath();

        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update(dt) {
        // ゆっくり下に落ちる
        if (!this.magnetized) {
            this.y += 0.5 * dt;

            // プレイヤーに一定距離（マグネット範囲）近づいたら引き寄せ開始
            const magnetRange = player.magnetRange; // パワーアップで広がる
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            if (dist < magnetRange) {
                this.magnetized = true;
            }
        } else {
            // プレイヤーに向かって加速しながら飛んでいく
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);

            this.speed += 0.5 * dt;
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;

            // 取得判定
            if (dist < player.width) {
                this.markedForDeletion = true;
                gainExp(this.value); // 経験値獲得処理
            }
        }

        // 画面下部に消えたら削除
        if (this.y > canvas.height + this.radius) {
            this.markedForDeletion = true;
        }
    }
}

// --- グローバル変数 ---
let player;
let projectiles = [];
let enemies = [];
let enemyProjectiles = []; // 敵の弾用配列
let particles = [];
let expGems = [];
let targetPos = { x: window.innerWidth / 2, y: window.innerHeight - 100 };

// 経験値・レベル関連
let currentExp = 0;
let currentLevel = 1;
let expToNextLevel = 10;
let enemySpawnTimer = 0;
let enemySpawnInterval = 1000; // 敵の出現間隔（ミリ秒）
let lastFrameTime = 0;

// パワーアップの定義
// パワーアップの定義
// 潤滑油(fire_rate)と形質変化(laser_xxx)以外はすべてmaxLevel: 1に変更
const POWERUPS = [
    { id: 'fire_rate', name: '潤滑油', desc: '通常攻撃の発射間隔が短くなる', maxLevel: 3 },
    { id: 'twin', name: 'ツインブラスター', desc: '通常攻撃が2列になって同時発射される', maxLevel: 1 },
    { id: 'triple', name: 'トリプルブラスター', desc: '通常攻撃が3方向（扇状）に発射される', maxLevel: 1 },
    { id: 'pierce', name: '貫通弾', desc: '通常攻撃が敵を貫通するようになる', maxLevel: 1 },
    { id: 'big_shot', name: '巨大化', desc: '通常弾のサイズとダメージが大きくなる', maxLevel: 1 },
    { id: 'flame', name: 'フレイム', desc: '弾が当たった敵を炎上状態にする', maxLevel: 1 },
    { id: 'frost', name: 'フロスト', desc: '弾が当たった敵の移動速度を遅くする', maxLevel: 1 },
    { id: 'thunder', name: 'サンダー', desc: '弾が当たった際、近くの敵に電撃が連鎖', maxLevel: 1 },
    { id: 'laser_width', name: '形質変化：ワイド', desc: 'レーザーの幅が大幅に増加する', maxLevel: 3 },
    { id: 'laser_duration', name: '形質変化：ロング', desc: 'レーザーの照射時間が長くなる', maxLevel: 3 },
    { id: 'laser_cooldown', name: '形質変化：クイック', desc: 'レーザーの再装填時間が短縮される', maxLevel: 3 },
    { id: 'shield', name: 'ハニカムシールド', desc: '敵とぶつかった際に身代わりになってくれるバリア', maxLevel: 1 },
    { id: 'magnet', name: 'マグネット', desc: '経験値を引き寄せる範囲が広くなる', maxLevel: 1 },
    { id: 'speed', name: 'オーバードライブ', desc: '自機の移動速度が上がり、機敏に動ける', maxLevel: 1 },
    { id: 'homing', name: 'ホーミング弾', desc: '通常弾が近くの敵に向かって自動追尾する', maxLevel: 1 },
];

let playerPowerUps = {}; // { 'fire_rate': 1, 'twin': 1 } など取得済みレベルを管理

// --- 入力制御 (マウス & タッチ) ---

function updateTargetObject(x, y) {
    if (!isPlaying) return;

    // キャンバスが中央揃えされている場合、マウスのX座標からキャンバスの左端のズレを引く
    const canvasRect = canvas.getBoundingClientRect();
    targetPos.x = x - canvasRect.left;

    // 指で自機が隠れないように、少し上（-60px程度）にオフセットとしてずらす
    targetPos.y = y - canvasRect.top - 60;
}

// PC用マウスイベント
canvas.addEventListener('mousemove', (e) => {
    updateTargetObject(e.clientX, e.clientY);
});

// 左クリックでレーザー発射
canvas.addEventListener('mousedown', (e) => {
    if (!isPlaying) return;
    if (e.button === 0) { // 左クリック
        player.fireLaser();
    }
});

let lastTouchTime = 0;

// スマホ用タッチイベント（スクロールも防ぐ）
window.addEventListener('touchmove', (e) => {
    if (isPlaying) {
        e.preventDefault(); // ゲームプレイ中のみデフォルトのスクロール動作をキャンセル
        if (e.touches.length > 0) {
            updateTargetObject(e.touches[0].clientX, e.touches[0].clientY);
        }
    }
}, { passive: false }); // passive: false にして preventDefault を有効化

window.addEventListener('touchstart', (e) => {
    if (!isPlaying) return; // UI操作の邪魔になるため、プレイ中のみ座標取得

    // ダブルタップ検知（300ms以内）
    const now = Date.now();
    if (now - lastTouchTime < 300) {
        player.fireLaser();
    }
    lastTouchTime = now;

    if (e.touches.length > 0) {
        updateTargetObject(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: false });


// --- メインゲームループ ---

function init() {
    resizeCanvas();
    player = new Player();
    projectiles = [];
    enemies = [];
    enemyProjectiles = [];
    particles = [];
    expGems = [];
    score = 0;
    currentExp = 0;
    currentLevel = 1;
    // 初回レベルアップに必要な経験値を20に設定
    expToNextLevel = 20;

    // playerPowerUpsの初期化（リトライ用）
    playerPowerUps = {};

    scoreValue.innerText = score;
    levelValue.innerText = currentLevel;
    updateExpBar();
    updateLuminousUI();

    isGameOver = false;

    // ターゲット初期化
    setupNewTarget();
    isBossActive = false;
    boss = null;
    bossHpContainer.style.display = 'none';

    // 初期位置をリセット
    targetPos = { x: canvas.width / 2, y: canvas.height - 100 };
    player.x = targetPos.x;
    player.y = targetPos.y;
    player.isLaserActive = false; // レーザー状態リセット
    player.lastLaserTime = 0;     // 最初から撃てる状態に

    lastFrameTime = performance.now();
    enemySpawnTimer = 0;
}

// 衝突判定（円と円）
function checkCollision(obj1, obj2) {
    // プレイヤーの当たり判定は少し小さくする
    let radius1 = obj1.radius || (obj1.width / 2) * 0.7;
    let radius2 = obj2.radius || (obj2.width / 2) * 0.7;
    const dist = Math.hypot(obj1.x - obj2.x, obj1.y - obj2.y);
    return dist - radius1 - radius2 < 0;
}

// 爆発エフェクト生成
function createExplosion(x, y, color) {
    const pCount = isBossActive ? 25 : 15;
    for (let i = 0; i < pCount; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function setupNewTarget() {
    const types = ['normal', 'speed', 'tank', 'shooter', 'splitter'];
    currentTargetType = types[Math.floor(Math.random() * types.length)];
    currentTargetKills = 0;
    updateTargetUI();
}

function updateTargetUI() {
    targetCountEl.innerText = `${currentTargetKills} / ${targetRequiredKills}`;
    
    // アイコンの形状設定
    targetIcon.className = currentTargetType; // CSSクラス適用
    targetIcon.style.borderColor = getEnemyColor(currentTargetType);
}

function spawnBoss() {
    isBossActive = true;
    boss = new Boss();
    createBoostEffect("BOSS INCOMING!!");
}

function getEnemyColor(type) {
    switch(type) {
        case 'tank': return '#f04';
        case 'speed': return '#ff0';
        case 'shooter': return '#0af';
        case 'splitter': return '#a0f';
        default: return '#f0f';
    }
}

// 経験値・UI更新処理
function updateExpBar() {
    const percentage = Math.min(100, (currentExp / expToNextLevel) * 100);
    expBarFill.style.width = percentage + '%';
}

function gainExp(amount) {
    currentExp += amount;
    updateExpBar();

    if (currentExp >= expToNextLevel) {
        levelUp();
    }
}

function levelUp() {
    currentExp -= expToNextLevel;
    currentLevel++;
    // レベルが上がるごとに必要経験値を +50% (+1.5倍)
    expToNextLevel = Math.floor(expToNextLevel * 1.5);

    levelValue.innerText = currentLevel;
    updateExpBar();

    // レベル5到達時に難易度上昇の警告を表示
    if (currentLevel === 5) {
        createBoostEffect("WARNING: DIFFICULTY UP !!");
    }

    // ゲームを一時停止
    isPlaying = false;

    // 選べるパワーアップをランダムに3つ抽出（最大レベルに達していないもの）
    const available = POWERUPS.filter(p => !playerPowerUps[p.id] || playerPowerUps[p.id] < p.maxLevel);

    // シャッフルして3つ取得
    const shuffled = available.sort(() => 0.5 - Math.random());
    let choices = shuffled.slice(0, 3);

    // もし選べるものが無ければ（全てカンスト）、ステータス回復などにする
    if (choices.length === 0) {
        // 仮でスコア付与など
        score += 1000;
        scoreValue.innerText = score;
        isPlaying = true; // そのまま再開
        lastFrameTime = performance.now();
        requestAnimationFrame(animate);
        return;
    }

    // UIの生成
    powerupContainer.innerHTML = '';
    choices.forEach(p => {
        const btn = document.createElement('div');
        btn.className = 'powerup-card';
        const currentLvl = playerPowerUps[p.id] || 0;
        btn.innerHTML = `
            <div class="powerup-title">${p.name} <span style="font-size:0.8rem; color:#aaa;">Lv ${currentLvl}→${currentLvl + 1}</span></div>
            <p class="powerup-desc">${p.desc}</p>
        `;
        btn.addEventListener('click', () => {
            applyPowerUp(p.id);
            levelUpScreen.classList.remove('active');

            // 少し待ってから再開（連続クリック防止）
            setTimeout(() => {
                isPlaying = true;
                lastFrameTime = performance.now();
                requestAnimationFrame(animate);
            }, 100);
        });
        powerupContainer.appendChild(btn);
    });

    levelUpScreen.classList.add('active');
}

function applyPowerUp(id) {
    // 取得履歴のカウントアップ（図鑑・上限管理用）
    if (!playerPowerUps[id]) playerPowerUps[id] = 0;
    playerPowerUps[id]++;

    // 図鑑用にlocalStorageに記録
    saveUnlockedPowerup(id);

    // 実際の効果適用
    switch (id) {
        case 'fire_rate': player.fireRate = Math.max(50, player.fireRate - 40); break;
        case 'twin': player.shotType = 'twin'; break;
        case 'triple': player.shotType = 'triple'; break;
        case 'pierce': player.pierce = true; break;
        case 'big_shot':
            player.shotSize += 2;
            player.shotDamage += 1;
            break;
        case 'flame': player.element = 'flame'; break;
        case 'frost': player.element = 'frost'; break;
        case 'thunder': player.element = 'thunder'; break;
        case 'laser_width': player.laserWidth += 20; break;
        case 'laser_duration': player.laserDuration += 500; break;
        case 'laser_cooldown': player.laserCooldown = Math.max(500, player.laserCooldown - 800); break;
        case 'shield': player.shieldActive = true; break;
        case 'magnet': player.magnetRange += 100; break;
        case 'speed': player.speedFactor = Math.min(1.0, player.speedFactor + 0.1); break;
        case 'homing': player.homing = true; break;
    }

    // 初回レベルアップ（ゲーム開始時のボーナスボーナス後）の特別なリセット処理
    if (currentExp === 0 && currentLevel === 2) {
        lastFrameTime = performance.now();
        enemySpawnTimer = 0; // ここから敵が出現開始
    }
}

// 図鑑用のセーブ処理
function saveUnlockedPowerup(id) {
    let unlocked = JSON.parse(localStorage.getItem('neonShooterUnlockedPowerups')) || [];
    if (!unlocked.includes(id)) {
        unlocked.push(id);
        localStorage.setItem('neonShooterUnlockedPowerups', JSON.stringify(unlocked));
    }
}

// ゲームオーバー処理
function triggerGameOver() {
    isGameOver = true;
    isPlaying = false;
    finalScore.innerText = score;
    createExplosion(player.x, player.y, player.color); // 自機の爆発
    setTimeout(() => {
        gameOverScreen.classList.add('active');
    }, 1000); // 1秒遅延
}

function animate(currentTime) {
    if (!isPlaying) return;

    // 前フレームからの経過時間（デルタタイム）を計算
    let deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    // 長すぎるデルタタイム（タブの切り替えなど）を制限し、1フレごとの移動を抑える
    if (deltaTime > 100) deltaTime = 16.666;

    // 60FPS(16.666ms)を1.0とした係数
    const dt = deltaTime / 16.666;

    // 前のフレームを少し残して軌跡を描画する (Trail Effect)
    ctx.fillStyle = 'rgba(5, 5, 16, 0.3)'; // 完全にクリアせず少し残す
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isGameOver) {
        // --- 敵の生成 ---
        enemySpawnTimer += deltaTime;
        
        // ブーストタイマーの更新
        if (isLuminousBoostActive) {
            luminousBoostTimer -= deltaTime;
            if (luminousBoostTimer <= 0) {
                isLuminousBoostActive = false;
                luminousCount.parentElement.classList.remove('boost-active');
            }
        }

        if (!isBossActive && enemySpawnTimer > enemySpawnInterval) {
            enemies.push(new Enemy());
            enemySpawnTimer = 0;
            // レベルに応じて出現間隔を短くする
            const baseInterval = 1000;
            const levelReduction = (currentLevel - 1) * 80;
            const bossReduction = isBossActive ? 200 : 0;
            
            enemySpawnInterval = Math.max(250, baseInterval - levelReduction - bossReduction);
        }

        // ボスの更新
        if (isBossActive && boss) {
            boss.update(dt);
            boss.draw();
        }

        // --- 更新と描画 ---

        // 自機
        player.update(targetPos.x, targetPos.y, dt);
        player.draw();

        // 自動射撃
        player.shoot();

        // 弾
        projectiles.forEach((proj) => {
            proj.update(dt);
            proj.draw();
        });

        // 敵の弾
        enemyProjectiles.forEach((eproj) => {
            eproj.update(dt);
            eproj.draw();

            // 敵弾 vs 自機
            if (!isGameOver && checkCollision(player, eproj)) {
                if (player.shieldActive) {
                    player.shieldActive = false;
                    eproj.markedForDeletion = true;
                    createExplosion(player.x, player.y, '#0f0');
                } else {
                    triggerGameOver();
                }
            }
        });

        // 敵と衝突判定
        enemies.forEach((enemy) => {
            enemy.update(dt);
            enemy.draw();

            // 自機（シールド含む）と敵の衝突
            if (!isGameOver && checkCollision(player, enemy)) {
                if (player.shieldActive) {
                    // シールドで防御
                    player.shieldActive = false;
                    enemy.takeDamage(10); // 敵に大ダメージ
                    createExplosion(player.x, player.y, '#0f0'); // シールド破壊エフェクト
                } else {
                    triggerGameOver();
                }
            }


            // レーザーと敵の衝突
            if (player.isLaserActive && !enemy.markedForDeletion) {
                if (enemy.x + enemy.radius > player.x - player.laserWidth / 2 &&
                    enemy.x - enemy.radius < player.x + player.laserWidth / 2 &&
                    enemy.y + enemy.radius > 0 &&
                    enemy.y - enemy.radius < player.y - player.height / 2) {

                    // レーザーのダメージ判定（毎フレーム当たるので調整が必要だが、今は即死か大ダメージとする）
                    enemy.takeDamage(10); // レーザーは強力
                }
            }


            // 弾と敵の衝突
            projectiles.forEach((proj) => {
                if (!proj.markedForDeletion && !enemy.markedForDeletion && !proj.hitEnemies.has(enemy)) {
                    if (checkCollision(proj, enemy)) {
                        proj.hitEnemies.add(enemy);

                        // 敵にダメージ
                        enemy.takeDamage(proj.damage);

                        // 属性効果
                        if (proj.element === 'flame') {
                            enemy.onFire = 120; // 120フレーム（約2秒）燃焼
                        } else if (proj.element === 'frost') {
                            enemy.isFrozen = 120; // 120フレーム減速
                        } else if (proj.element === 'thunder') {
                            // 雷エフェクト
                            createExplosion(enemy.x, enemy.y, '#ff5');
                            // 周囲のもっとも近い敵1体に連鎖ダメージ
                            let closest = null; let minDist = 200;
                            enemies.forEach(other => {
                                if (other !== enemy && !other.markedForDeletion) {
                                    const d = Math.hypot(other.x - enemy.x, other.y - enemy.y);
                                    if (d < minDist) { minDist = d; closest = other; }
                                }
                            });
                            if (closest) {
                                // 連鎖の描画（線）
                                ctx.save();
                                ctx.beginPath();
                                ctx.moveTo(enemy.x, enemy.y);
                                ctx.lineTo(closest.x, closest.y);
                                ctx.strokeStyle = '#ff5';
                                ctx.lineWidth = 2;
                                ctx.shadowBlur = 10;
                                ctx.shadowColor = '#ff5';
                                ctx.stroke();
                                ctx.restore();

                                closest.takeDamage(proj.damage);
                            }
                        }

                        if (!proj.pierce) {
                            proj.markedForDeletion = true;
                        }
                    }
                }
            });


            // 敵が倒された時の処理（takeDamage内で判定済）
            if (enemy.markedForDeletion && enemy.hp <= 0 && !isGameOver) {
                // 爆発エフェクト
                createExplosion(enemy.x, enemy.y, enemy.color);

                // 経験値ジェムをドロップ
                expGems.push(new ExpGem(enemy.x, enemy.y, enemy.expValue));

                score += enemy.type === 'tank' ? 50 : (enemy.type === 'speed' ? 20 : 10);
                scoreValue.innerText = score;

                // ターゲット撃破判定
                if (!isBossActive && enemy.type === currentTargetType) {
                    currentTargetKills++;
                    updateTargetUI();
                    if (currentTargetKills >= targetRequiredKills) {
                        spawnBoss();
                    }
                }

                // スコア1000ごとにブースト判定
                const currentThousand = Math.floor(score / 1000);
                if (currentThousand > lastBoostCheckScore) {
                    lastBoostCheckScore = currentThousand;
                    // 20%の確率でブースト発生
                    if (Math.random() < 0.2) {
                        isLuminousBoostActive = true;
                        luminousBoostTimer = luminousBoostDuration;
                        luminousCount.parentElement.classList.add('boost-active');
                        createBoostEffect();
                    }
                }
            }
        });

        // --- ボスの個別衝突判定 (ザコ敵ループの外で1回だけ実行) ---
        if (isBossActive && boss) {
            // 自機とボスの衝突
            if (!isGameOver && checkCollision(player, boss)) {
                if (player.shieldActive) {
                    player.shieldActive = false;
                    boss.takeDamage(5);
                    createExplosion(player.x, player.y, '#0f0');
                } else {
                    triggerGameOver();
                }
            }

            // レーザー vs ボス
            if (player.isLaserActive) {
                if (boss.x + boss.width/2 > player.x - player.laserWidth / 2 &&
                    boss.x - boss.width/2 < player.x + player.laserWidth / 2) {
                    boss.takeDamage(1.5); // ザコ敵ループ外になったのでダメージ値を再調整
                }
            }

            // 弾 vs ボス
            projectiles.forEach(proj => {
                // hitEnemies.has(boss) をチェックして貫通弾の多段ヒットを防止
                if (!proj.markedForDeletion && !proj.hitEnemies.has(boss)) {
                    if (checkCollision(proj, boss)) {
                        proj.hitEnemies.add(boss);
                        boss.takeDamage(proj.damage);
                        if (!proj.pierce) proj.markedForDeletion = true;
                        createExplosion(proj.x, proj.y, boss.color);
                    }
                }
            });
        }

        // 経験値ジェム
        expGems.forEach(gem => {
            gem.update(dt);
            gem.draw();
        });

        // パーティクル
        particles.forEach((particle) => {
            particle.update(dt);
            particle.draw();
        });

        // 不要になったオブジェクトを配列から削除
        projectiles = projectiles.filter(proj => !proj.markedForDeletion);
        enemyProjectiles = enemyProjectiles.filter(eproj => !eproj.markedForDeletion);
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
        particles = particles.filter(particle => !particle.markedForDeletion);
        expGems = expGems.filter(g => !g.markedForDeletion);

        animationId = requestAnimationFrame(animate);
    } else {
        // ゲームオーバー後もパーティクルだけ描画を続ける
        particles.forEach((particle) => {
            particle.update();
            particle.draw();
        });
        particles = particles.filter(particle => !particle.markedForDeletion);
        if (particles.length > 0) {
            animationId = requestAnimationFrame(animate);
        }
    }
}

// --- UIイベントリスナー ---

startBtn.addEventListener('click', () => {
    startScreen.classList.remove('active');
    init();

    // ゲーム開始時に初期設定としてレベルアップ画面を表示させ、能力を1つ選ばせる
    // 一時的にEXPを水増しして疑似的にレベルアップ（初回ボーナス）
    currentExp = expToNextLevel;
    gainExp(0); // レベルアップ処理を呼び出す
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.remove('active');
    init();

    // リトライ時も初回ボーナス付与
    currentExp = expToNextLevel;
    gainExp(0);
});

homeBtn.addEventListener('click', () => {
    gameOverScreen.classList.remove('active');
    startScreen.classList.add('active');
    // ホーム画面に戻る際は背景描画のみ更新
    drawBackground();
});

// 図鑑ボタン
dictBtn.addEventListener('click', () => {
    startScreen.classList.remove('active');
    dictScreen.classList.add('active');

    dictContainer.innerHTML = '';
    const unlocked = JSON.parse(localStorage.getItem('neonShooterUnlockedPowerups')) || [];

    POWERUPS.forEach(p => {
        const isUnlocked = unlocked.includes(p.id);
        const card = document.createElement('div');
        card.className = 'powerup-card';
        // クリックイベントは無効化（図鑑は見るだけ）
        card.style.cursor = 'default';
        card.style.transform = 'none';

        if (!isUnlocked) {
            card.style.opacity = '0.5';
            card.style.filter = 'grayscale(100%)';
            card.innerHTML = `
                <div class="powerup-title">???</div>
                <p class="powerup-desc">未取得</p>
            `;
        } else {
            card.innerHTML = `
                <div class="powerup-title">${p.name}</div>
                <p class="powerup-desc">${p.desc}</p>
            `;
        }
        dictContainer.appendChild(card);
    });
});

dictBackBtn.addEventListener('click', () => {
    dictScreen.classList.remove('active');
    startScreen.classList.add('active');
});

// ヘルプボタン
helpBtn.addEventListener('click', () => {
    startScreen.classList.remove('active');
    helpScreen.classList.add('active');
});

helpBackBtn.addEventListener('click', () => {
    helpScreen.classList.remove('active');
    startScreen.classList.add('active');
});

// コレクションボタン
collectionBtn.addEventListener('click', () => {
    startScreen.classList.remove('active');
    collectionScreen.classList.add('active');
    updateCollectionUI();
});

function updateCollectionUI() {
    collectionContainer.innerHTML = '';
    
    GACHA_ITEMS.forEach(item => {
        const count = ownedItems[item.id] || 0;
        const isOwned = count > 0;
        const card = document.createElement('div');
        card.className = `collection-card ${isOwned ? 'unlocked rarity-' + item.rarity : ''}`;
        
        if (isOwned) {
            card.innerHTML = `
                <div class="item-icon">${item.icon}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-rarity" style="color:${getRarityColor(item.rarity)}">${item.rarity}</div>
                <div class="item-count">×${count}</div>
            `;
            card.title = item.desc;
        } else {
            card.innerHTML = `
                <div class="item-icon" style="filter: grayscale(1); opacity: 0.3;">❓</div>
                <div class="item-name" style="color: #444;">???</div>
                <div class="item-rarity">LOCKED</div>
            `;
        }
        collectionContainer.appendChild(card);
    });
}

function getRarityColor(rarity) {
    if (rarity === 'SSR') return '#ff0';
    if (rarity === 'SR') return '#f0f';
    if (rarity === 'R') return '#0ff';
    return '#fff';
}

collectionBackBtn.addEventListener('click', () => {
    collectionScreen.classList.remove('active');
    startScreen.classList.add('active');
});

// ガチャボタン
gachaBtn.addEventListener('click', () => {
    startScreen.classList.remove('active');
    gachaScreen.classList.add('active');
});

gachaBackBtn.addEventListener('click', () => {
    gachaScreen.classList.remove('active');
    startScreen.classList.add('active');
});

// ガチャロジック
function updateLuminousUI() {
    luminousCount.innerText = luminousMatter;
    gachaLuminousCount.innerText = luminousMatter;
    
    // ボタンの活性・非活性制御
    gachaSingleBtn.disabled = luminousMatter < 10;
    gachaMultiBtn.disabled = luminousMatter < 100;
}

function saveLuminous() {
    localStorage.setItem('luminousMatter', luminousMatter);
}

function saveCollection() {
    localStorage.setItem('neonShooterCollection', JSON.stringify(ownedItems));
}

let isGachaAnimating = false;

async function executeGacha(count) {
    if (isGachaAnimating) return;
    const cost = count === 1 ? 10 : 100;
    if (luminousMatter < cost) return;

    luminousMatter -= cost;
    saveLuminous();
    updateLuminousUI();
    
    isGachaAnimating = true;
    gachaResultArea.innerHTML = '';
    
    // アニメーション開始：ハンドル回転
    gachaHandle.classList.add('rotating');
    
    // 1秒待機（ハンドルの回転に合わせて）
    await new Promise(resolve => setTimeout(resolve, 1000));
    gachaHandle.classList.remove('rotating');

    // 演出用カプセル排出（10連の場合は高速化するか、代表で1個出す）
    gachaCapsuleDispense.classList.add('active');
    await new Promise(resolve => setTimeout(resolve, 800));
    gachaCapsuleDispense.classList.remove('active');

    // 結果の生成
    const results = [];
    for (let i = 0; i < count; i++) {
        // レアリティ抽選
        const rand = Math.random();
        let rarity = 'N';
        if (rand < 0.02) rarity = 'SSR';
        else if (rand < 0.1) rarity = 'SR';
        else if (rand < 0.3) rarity = 'R';
        
        // そのレアリティのアイテムから抽選
        const possible = GACHA_ITEMS.filter(it => it.id.includes('item_') && it.rarity === rarity);
        const item = possible[Math.floor(Math.random() * possible.length)];
        results.push(item);

        // コレクションに追加（カウントアップ）
        ownedItems[item.id] = (ownedItems[item.id] || 0) + 1;
    }
    
    saveCollection();

    // 結果表示
    results.forEach((item, index) => {
        setTimeout(() => {
            const itemEl = document.createElement('div');
            itemEl.className = 'gacha-item';
            itemEl.style.borderColor = getRarityColor(item.rarity);
            itemEl.innerText = `${item.icon} [${item.rarity}] ${item.name}`;
            gachaResultArea.appendChild(itemEl);
            
            // 全て表示し終わったらフラグ解除
            if (index === results.length - 1) {
                isGachaAnimating = false;
            }
        }, index * 100);
    });
    
    if (count === 0) isGachaAnimating = false;
}

gachaSingleBtn.addEventListener('click', () => executeGacha(1));
gachaMultiBtn.addEventListener('click', () => executeGacha(10));

// 初期UI更新
updateLuminousUI();

// 背景の初期描画用（プレイ前）
drawBackground();

// ブースト発生時の簡易演出
function createBoostEffect(text = 'LUMINOUS BOOST!!') {
    const boostMsg = document.createElement('div');
    boostMsg.style.position = 'absolute';
    boostMsg.style.top = '50%';
    boostMsg.style.left = '50%';
    boostMsg.style.transform = 'translate(-50%, -50%)';
    boostMsg.style.fontSize = '3rem';
    boostMsg.style.fontWeight = '900';
    boostMsg.style.color = '#ff0';
    boostMsg.style.textShadow = '0 0 20px #ff0, 0 0 40px #ff0';
    boostMsg.style.zIndex = '100';
    boostMsg.style.pointerEvents = 'none';
    boostMsg.innerText = text;
    boostMsg.style.animation = 'boostPopMsg 1.5s ease-out forwards';
    document.getElementById('ui-layer').appendChild(boostMsg);

    // 削除
    setTimeout(() => boostMsg.remove(), 1500);
}
