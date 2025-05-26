// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const comboDisplay = document.getElementById('comboDisplay');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const finalScore = document.getElementById('finalScore');
const newHighScore = document.getElementById('newHighScore');

const gridSize = 20;
let snake = [{ x: 240, y: 240 }];
let direction = { x: 0, y: -gridSize };
let food = {};
let specialFood = null;
let powerUp = null;
let score = 0;
let level = 1;
let highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
let combo = 0;
let gameSpeed = 150;
let gameIntervalId;
let isPaused = false;
let particles = [];
let trail = [];
let gameStartTime = Date.now();
let difficulty = 'normal';
let shieldActive = false;
let fireMode = false;
let powerUpEffects = {
  shield: 0,
  fire: 0,
  speed: 0
};

// Difficulty settings
const difficultySettings = {
  easy: { speed: 200, scoreMultiplier: 0.8 },
  normal: { speed: 150, scoreMultiplier: 1.0 },
  hard: { speed: 100, scoreMultiplier: 1.5 },
  insane: { speed: 70, scoreMultiplier: 2.0 }
};

// Achievement system
const achievements = {
  'first-food': false,
  'score-100': false,
  'level-5': false,
  'length-10': false,
  'combo-5': false,
  'survive-60': false
};

// Load achievements from localStorage
Object.keys(achievements).forEach(key => {
  achievements[key] = localStorage.getItem(`achievement-${key}`) === 'true';
  if (achievements[key]) {
    document.getElementById(`achievement-${key}`).classList.add('unlocked');
  }
});

// Audio setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function generateBeep(frequency, duration, type = 'sine', volume = 0.3) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playEatSound() {
  generateBeep(800, 0.1);
  setTimeout(() => generateBeep(1000, 0.1), 50);
}

function playGameOverSound() {
  generateBeep(400, 0.3);
  setTimeout(() => generateBeep(300, 0.3), 150);
  setTimeout(() => generateBeep(200, 0.5), 300);
}

function playSpecialFoodSound() {
  for (let i = 0; i < 6; i++) {
    setTimeout(() => generateBeep(1200 + i * 150, 0.05), i * 40);
  }
}

function playPowerUpSound() {
  generateBeep(1500, 0.1, 'square');
  setTimeout(() => generateBeep(1800, 0.1, 'square'), 60);
  setTimeout(() => generateBeep(2100, 0.15, 'square'), 120);
}

function playAchievementSound() {
  for (let i = 0; i < 4; i++) {
    setTimeout(() => generateBeep(1000 + i * 200, 0.1, 'triangle'), i * 100);
  }
}

// Particle system
class Particle {
  constructor(x, y, color, velocity, size = 3) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.velocity = velocity;
    this.life = 1.0;
    this.decay = 0.02;
    this.size = size;
  }

  update() {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.life -= this.decay;
    this.velocity.x *= 0.98;
    this.velocity.y *= 0.98;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function createParticles(x, y, color, count = 8, size = 3) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const velocity = {
      x: Math.cos(angle) * (2 + Math.random() * 3),
      y: Math.sin(angle) * (2 + Math.random() * 3)
    };
    particles.push(new Particle(x + gridSize/2, y + gridSize/2, color, velocity, size));
  }
}

function updateParticles() {
  particles = particles.filter(particle => {
    particle.update();
    if (particle.life > 0) {
      particle.draw();
      return true;
    }
    return false;
  });
}

// Trail system
function updateTrail() {
  if (snake.length > 0) {
    trail.push({
      x: snake[0].x,
      y: snake[0].y,
      life: 1.0
    });
  }

  trail = trail.filter(segment => {
    segment.life -= 0.05;
    return segment.life > 0;
  });
}

function drawTrail() {
  trail.forEach(segment => {
    ctx.save();
    ctx.globalAlpha = segment.life * 0.3;
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
    ctx.restore();
  });
}

// Initialize displays
highScoreDisplay.textContent = highScore;

// Generate food
function generateFood() {
  food = {
    x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
    y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize,
    type: 'normal'
  };

  // Ensure food doesn't spawn on snake
  while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
    food.x = Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize;
    food.y = Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize;
  }
}

// Generate special food (golden apple)
function generateSpecialFood() {
  if (Math.random() < 0.15) { // 15% chance
    specialFood = {
      x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
      y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize,
      timer: 500 // Lives for 500 frames
    };
  }
}

// Generate power-ups
function generatePowerUp() {
  if (Math.random() < 0.1) { // 10% chance
    const powerTypes = ['speed', 'shield', 'fire', 'bonus'];
    powerUp = {
      x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
      y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize,
      type: powerTypes[Math.floor(Math.random() * powerTypes.length)],
      timer: 400
    };
  }
}

// Apply power-up effects
function applyPowerUp(type) {
  playPowerUpSound();

  switch(type) {
    case 'speed':
      powerUpEffects.speed = 300; // 300 frames
      // If speed boost just started, update the game interval
      clearInterval(gameIntervalId); // Clear existing interval
      gameIntervalId = setInterval(gameLoop, gameSpeed * 0.7); // Set to faster speed
      break;
    case 'shield':
      powerUpEffects.shield = 200;
      shieldActive = true;
      break;
    case 'fire':
      powerUpEffects.fire = 250;
      fireMode = true;
      break;
    case 'bonus':
      score += Math.floor(50 * difficultySettings[difficulty].scoreMultiplier);
      combo += 2;
      break;
  }
}

// Update power-up effects
function updatePowerUpEffects() {
  Object.keys(powerUpEffects).forEach(effect => {
    if (powerUpEffects[effect] > 0) {
      powerUpEffects[effect]--;
      if (powerUpEffects[effect] === 0) {
        switch(effect) {
          case 'shield':
            shieldActive = false;
            break;
          case 'fire':
            fireMode = false;
            break;
          case 'speed':
            // Speed boost ended, revert interval to normal gameSpeed
            clearInterval(gameIntervalId);
            gameIntervalId = setInterval(gameLoop, gameSpeed);
            break;
        }
      }
    }
  });
}

// Check achievements
function checkAchievements() {
  // First food
  if (!achievements['first-food'] && score > 0) {
    unlockAchievement('first-food');
  }

  // Score 100
  if (!achievements['score-100'] && score >= 100) {
    unlockAchievement('score-100');
  }

  // Level 5
  if (!achievements['level-5'] && level >= 5) {
    unlockAchievement('level-5');
  }

  // Snake length 10
  if (!achievements['length-10'] && snake.length >= 10) {
    unlockAchievement('length-10');
  }

  // Combo 5
  if (!achievements['combo-5'] && combo >= 5) {
    unlockAchievement('combo-5');
  }

  // Survive 60 seconds
  if (!achievements['survive-60'] && (Date.now() - gameStartTime) >= 60000) {
    unlockAchievement('survive-60');
  }
}

function unlockAchievement(achievementId) {
  achievements[achievementId] = true;
  localStorage.setItem(`achievement-${achievementId}`, 'true');
  document.getElementById(`achievement-${achievementId}`).classList.add('unlocked');
  playAchievementSound();

  // Show achievement notification (you could add a popup here)
  console.log(`Achievement unlocked: ${achievementId}`);
}

// Draw functions
function drawSnake() {
  snake.forEach((segment, index) => {
    ctx.save();

    // Head has special effects
    if (index === 0) {
      // Shield effect
      if (shieldActive) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
      }

      // Fire mode effect
      if (fireMode) {
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 20;
      }

      ctx.fillStyle = shieldActive ? '#00ffff' : (fireMode ? '#ff4444' : '#00ff88');
    } else {
      ctx.fillStyle = `rgba(0, 255, 136, ${1 - (index * 0.05)})`;
    }

    ctx.fillRect(segment.x, segment.y, gridSize - 2, gridSize - 2);

    // Add inner glow
    ctx.fillStyle = index === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(segment.x + 4, segment.y + 4, gridSize - 10, gridSize - 10);

    ctx.restore();
  });
}

function drawFood() {
  // Regular food
  ctx.save();
  ctx.shadowColor = '#ff0080';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ff0080';
  ctx.fillRect(food.x, food.y, gridSize - 2, gridSize - 2);

  // Inner highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillRect(food.x + 4, food.y + 4, gridSize - 10, gridSize - 10);
  ctx.restore();

  // Special food (golden apple)
  if (specialFood) {
    ctx.save();
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 15;
    ctx.fillStyle = `hsl(${Date.now() * 0.1 % 360}, 100%, 60%)`;
    ctx.fillRect(specialFood.x, specialFood.y, gridSize - 2, gridSize - 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(specialFood.x + 6, specialFood.y + 6, gridSize - 14, gridSize - 14);
    ctx.restore();

    specialFood.timer--;
    if (specialFood.timer <= 0) {
      specialFood = null;
    }
  }
}

function drawPowerUp() {
  if (!powerUp) return;

  ctx.save();
  const colors = {
    speed: '#ffff00',
    shield: '#00ffff',
    fire: '#ff4444',
    bonus: '#ff00ff'
  };

  ctx.shadowColor = colors[powerUp.type];
  ctx.shadowBlur = 12;
  ctx.fillStyle = colors[powerUp.type];
  ctx.fillRect(powerUp.x, powerUp.y, gridSize - 2, gridSize - 2);

  // Pulsing effect
  const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
  ctx.fillRect(powerUp.x + 3, powerUp.y + 3, gridSize - 8, gridSize - 8);
  ctx.restore();

  powerUp.timer--;
  if (powerUp.timer <= 0) {
    powerUp = null;
  }
}

function drawEffects() {
  // Speed boost indicator
  if (powerUpEffects.speed > 0) {
    ctx.save();
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    ctx.restore();
  }
}

// Game logic
function moveSnake() {
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // Wall collision (unless fire mode is active)
  if (!fireMode && (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height)) {
    gameOver();
    return;
  }

  // Fire mode: wrap around walls
  if (fireMode) {
    if (head.x < 0) head.x = canvas.width - gridSize;
    if (head.x >= canvas.width) head.x = 0;
    if (head.y < 0) head.y = canvas.height - gridSize;
    if (head.y >= canvas.height) head.y = 0;
  }

  // Self collision (unless shield is active)
  if (!shieldActive && snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  // Check food collision
  let ateFood = false;
  if (head.x === food.x && head.y === food.y) {
    ateFood = true;
    const baseScore = 10;
    const levelBonus = level * 2;
    const comboBonus = combo * 5;
    const scoreGain = Math.floor((baseScore + levelBonus + comboBonus) * difficultySettings[difficulty].scoreMultiplier);

    score += scoreGain;
    combo++;

    playEatSound();
    createParticles(food.x, food.y, '#ff0080', 6);
    generateFood();
    generateSpecialFood();
    generatePowerUp();

    // Level up every 100 points
    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
      level = newLevel;
      gameSpeed = Math.max(50, gameSpeed - 10);
      clearInterval(gameIntervalId);
      gameIntervalId = setInterval(gameLoop, powerUpEffects.speed > 0 ? gameSpeed * 0.7 : gameSpeed);
    }
  }

  // Check special food collision
  if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
    ateFood = true;
    const specialScore = Math.floor(50 * difficultySettings[difficulty].scoreMultiplier);
    score += specialScore;
    combo += 3;

    playSpecialFoodSound();
    createParticles(specialFood.x, specialFood.y, '#ffff00', 12, 5);
    specialFood = null;
  }

  // Check power-up collision
  if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
    applyPowerUp(powerUp.type);
    createParticles(powerUp.x, powerUp.y, '#ffffff', 10);
    powerUp = null;
  }

  if (!ateFood) {
    snake.pop();
    if (combo > 0) combo = Math.max(0, combo - 1);
  }
}

function gameLoop() {
  if (isPaused) return;

  // Clear canvas
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update trail
  updateTrail();
  drawTrail();

  // Move snake
  moveSnake();

  // Update power-up effects
  updatePowerUpEffects();

  // Update speed if speed boost is active
  if (powerUpEffects.speed > 0 && gameIntervalId) {
    clearInterval(gameIntervalId);
    gameIntervalId = setInterval(gameLoop, gameSpeed * 0.7);
  } else if (powerUpEffects.speed === 0 && gameIntervalId) {
    clearInterval(gameIntervalId);
    gameIntervalId = setInterval(gameLoop, gameSpeed);
  }

  // Draw everything
  drawFood();
  drawPowerUp();
  drawSnake();
  drawEffects();

  // Update particles
  updateParticles();

  // Update displays
  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;
  comboDisplay.textContent = combo;

  // Check achievements
  checkAchievements();
}

function gameOver() {
  clearInterval(gameIntervalId);
  playGameOverSound();

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHighScore', highScore.toString());
    highScoreDisplay.textContent = highScore;
    newHighScore.style.display = 'block';
  } else {
    newHighScore.style.display = 'none';
  }

  finalScore.textContent = `Final Score: ${score}`;
  gameOverScreen.style.display = 'flex';
}

function restartGame() {
  // Reset game state
  snake = [{ x: 240, y: 240 }];
  direction = { x: 0, y: -gridSize };
  score = 0;
  level = 1;
  combo = 0;
  particles = [];
  trail = [];
  specialFood = null;
  powerUp = null;
  gameStartTime = Date.now();
  shieldActive = false;
  fireMode = false;
  powerUpEffects = { shield: 0, fire: 0, speed: 0 };

  // Set speed based on difficulty
  gameSpeed = difficultySettings[difficulty].speed;

  // Hide screens
  gameOverScreen.style.display = 'none';
  pauseScreen.style.display = 'none';
  isPaused = false;

  // Generate initial food
  generateFood();

  // Start game loop
  clearInterval(gameIntervalId);
  gameIntervalId = setInterval(gameLoop, gameSpeed);
}

function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    pauseScreen.style.display = 'flex';
    clearInterval(gameIntervalId);
  } else {
    pauseScreen.style.display = 'none';
    gameIntervalId = setInterval(gameLoop, powerUpEffects.speed > 0 ? gameSpeed * 0.7 : gameSpeed);
  }
}

function showDifficultySelect() {
  gameOverScreen.style.display = 'none';
  // The difficulty selector is always visible, so just scroll to top
  window.scrollTo(0, 0);
}

// Event listeners
document.addEventListener('keydown', (e) => {
  if (gameOverScreen.style.display === 'flex' || pauseScreen.style.display === 'flex') return;

  switch(e.key) {
    case 'ArrowUp':
      if (direction.y === 0) direction = { x: 0, y: -gridSize };
      break;
    case 'ArrowDown':
      if (direction.y === 0) direction = { x: 0, y: gridSize };
      break;
    case 'ArrowLeft':
      if (direction.x === 0) direction = { x: -gridSize, y: 0 };
      break;
    case 'ArrowRight':
      if (direction.x === 0) direction = { x: gridSize, y: 0 };
      break;
    case ' ':
      e.preventDefault();
      togglePause();
      break;
    case 'r':
    case 'R':
      restartGame();
      break;
  }
});

// Difficulty selector
document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = btn.dataset.difficulty;
    restartGame();
  });
});

// Background particles
function createBackgroundParticles() {
  const container = document.querySelector('.bg-particles');
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 20 + 's';
    particle.style.animationDuration = (15 + Math.random() * 10) + 's';
    container.appendChild(particle);
  }
}

// Initialize game
createBackgroundParticles();
generateFood();
restartGame();

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  e.preventDefault();
});

canvas.addEventListener('touchend', (e) => {
  if (!touchStartX || !touchStartY) return;

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;

  const diffX = touchStartX - touchEndX;
  const diffY = touchStartY - touchEndY;

  if (Math.abs(diffX) > Math.abs(diffY)) {
    // Horizontal swipe
    if (diffX > 0 && direction.x === 0) {
      direction = { x: -gridSize, y: 0 }; // Left
    } else if (diffX < 0 && direction.x === 0) {
      direction = { x: gridSize, y: 0 }; // Right
    }
  } else {
    // Vertical swipe
    if (diffY > 0 && direction.y === 0) {
      direction = { x: 0, y: -gridSize }; // Up
    } else if (diffY < 0 && direction.y === 0) {
      direction = { x: 0, y: gridSize }; // Down
    }
  }

  touchStartX = 0;
  touchStartY = 0;
  e.preventDefault();
});