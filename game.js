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

// --- ゲームの状態変数 ---
let animationId;
let score = 0;
let isGameOver = false;
let isPlaying = false;
let gameScale = 1.0; // スマホ/PCのスケーリング用

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
            for(let i=0; i<6; i++) {
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

    update(targetX, targetY) {
        // マウス/タッチされた位置を追従（現在位置から目標位置へ近づく）
        // スムーズな移動(Lerp処理)
        this.x += (targetX - this.x) * this.speedFactor;
        this.y += (targetY - this.y) * this.speedFactor;

        // 画面外に出ないように制限
        if (this.x < this.width / 2) this.x = this.width / 2;
        if (this.x > canvas.width - this.width / 2) this.x = canvas.width - this.width / 2;
        if (this.y < this.height / 2) this.y = this.height / 2;
        // 画面下部はキャンバスの高さギリギリまで移動できるようにする。
        // （指やマウスでターゲットを設定した際、指の上に少しずらして描画する事で操作しやすくなる）
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
                projectiles.push(new Projectile(this.x, this.y - this.height / 2, {x:0, y:-10}));
            } else if (this.shotType === 'twin') {
                projectiles.push(new Projectile(this.x - 10, this.y - this.height / 2, {x:0, y:-10}));
                projectiles.push(new Projectile(this.x + 10, this.y - this.height / 2, {x:0, y:-10}));
            } else if (this.shotType === 'triple') {
                projectiles.push(new Projectile(this.x, this.y - this.height / 2, {x:0, y:-10}));
                projectiles.push(new Projectile(this.x - 10, this.y - this.height / 2, {x:-2, y:-9.8}));
                projectiles.push(new Projectile(this.x + 10, this.y - this.height / 2, {x:2, y:-9.8}));
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

    update() {
        // ホーミング機能
        if (this.homing && enemies.length > 0) {
            let closest = null;
            let minDist = Infinity;
            enemies.forEach(e => {
                if(e.markedForDeletion) return;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if(dist < minDist) {
                    minDist = dist;
                    closest = e;
                }
            });
            if (closest) {
                const angle = Math.atan2(closest.y - this.y, closest.x - this.x);
                // 追尾性能をさらに抑制（0.15 -> 0.07）して滑らかなカーブにする
                this.velocity.x += Math.cos(angle) * 0.07;
                this.velocity.y += Math.sin(angle) * 0.07;
                // 最大速度をクリップ
                const currentSpeed = Math.hypot(this.velocity.x, this.velocity.y);
                const maxSpeed = 10;
                if (currentSpeed > maxSpeed) {
                    this.velocity.x = (this.velocity.x / currentSpeed) * maxSpeed;
                    this.velocity.y = (this.velocity.y / currentSpeed) * maxSpeed;
                }
            }
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
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
        switch(this.type) {
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
            ctx.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        }

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.damageFlash > 0 ? '#fff' : this.color;
        
        ctx.strokeStyle = this.damageFlash > 0 ? '#fff' : this.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = this.damageFlash > 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        ctx.fill();
        
        if (this.damageFlash > 0) this.damageFlash--;

        if (this.type === 'normal') {
            ctx.beginPath();
            ctx.moveTo(-this.radius, 0); ctx.lineTo(this.radius, 0);
            ctx.moveTo(0, -this.radius); ctx.lineTo(0, this.radius);
            ctx.stroke();
        }

        ctx.restore();
    }

    update() {
        let speedMod = this.isFrozen > 0 ? 0.3 : 1.0;
        this.x += this.velocity.x * speedMod;
        this.y += this.velocity.y * speedMod;
        this.angle += this.spinSpeed * speedMod;

        // シューターの攻撃射撃ロジック
        if (this.type === 'shooter' && !isGameOver) {
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
            this.onFire--;
            if (this.onFire % 30 === 0) {
                this.takeDamage(0.5); 
                for(let i=0; i<3; i++) particles.push(new Particle(this.x, this.y, '#f50'));
            }
        }
        if (this.isFrozen > 0) this.isFrozen--;

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

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        if (this.y < -this.radius || this.x < -this.radius || 
            this.x > canvas.width + this.radius || this.y > canvas.height + this.radius) {
            this.markedForDeletion = true;
        }
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

    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        // 徐々に透明にする
        this.alpha -= 0.02;
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

    update() {
        // ゆっくり下に落ちる
        if (!this.magnetized) {
            this.y += 0.5;
            
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
            
            this.speed += 0.5;
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
            
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
    if(!isPlaying) return;
    
    // キャンバスが中央揃えされている場合、マウスのX座標からキャンバスの左端のズレを引く
    const canvasRect = canvas.getBoundingClientRect();
    targetPos.x = x - canvasRect.left;
    
    // 指で自機が隠れないように、少し上（-60px程度）にオフセットとしてずらす
    targetPos.y = y - canvasRect.top - 60; 
}

// PC用マウスイベント
window.addEventListener('mousemove', (e) => {
    updateTargetObject(e.clientX, e.clientY);
});

// 左クリックでレーザー発射
window.addEventListener('mousedown', (e) => {
    if (!isPlaying) return;
    if (e.button === 0) { // 左クリック
        player.fireLaser();
    }
});

let lastTouchTime = 0;

// スマホ用タッチイベント（スクロールも防ぐ）
window.addEventListener('touchmove', (e) => {
    e.preventDefault(); // デフォルトのスクロール動作をキャンセル
    if (e.touches.length > 0) {
        updateTargetObject(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: false }); // passive: false にして preventDefault を有効化

window.addEventListener('touchstart', (e) => {
    if(!isPlaying) return; // UI操作の邪魔になるため、プレイ中のみ座標取得
    
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
    
    isGameOver = false;
    
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
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
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
            <div class="powerup-title">${p.name} <span style="font-size:0.8rem; color:#aaa;">Lv ${currentLvl}→${currentLvl+1}</span></div>
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
    switch(id) {
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

    // 前フレームからの経過時間（デルタタイム）を計算して敵出現に使用
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    // 前のフレームを少し残して軌跡を描画する (Trail Effect)
    ctx.fillStyle = 'rgba(5, 5, 16, 0.3)'; // 完全にクリアせず少し残す
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isGameOver) {
        // --- 敵の生成 ---
        enemySpawnTimer += deltaTime;
        if (enemySpawnTimer > enemySpawnInterval) {
            enemies.push(new Enemy());
            enemySpawnTimer = 0;
            // スコアに応じて出現間隔を短くする（難易度アップ）最小400ms
            enemySpawnInterval = Math.max(400, 1000 - (score * 5)); 
        }

        // --- 更新と描画 ---
        
        // 自機
        player.update(targetPos.x, targetPos.y);
        player.draw();
        
        // 自動射撃
        player.shoot();

        // 弾
        projectiles.forEach((proj) => {
            proj.update();
            proj.draw();
        });

        // 敵の弾
        enemyProjectiles.forEach((eproj) => {
            eproj.update();
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
            enemy.update();
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
                                    if(d < minDist) { minDist = d; closest = other; }
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
                        
                        // 貫通弾でなければ削除
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
                
                // スコア加算
                score += enemy.type === 'tank' ? 50 : (enemy.type === 'speed' ? 20 : 10);
                scoreValue.innerText = score;
            }
        });

        // 経験値ジェム
        expGems.forEach(gem => {
            gem.update();
            gem.draw();
        });

        // パーティクル
        particles.forEach((particle) => {
            particle.update();
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

// 背景の初期描画用（プレイ前）
function drawBackground() {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
drawBackground();
