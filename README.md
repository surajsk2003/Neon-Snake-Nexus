# NEON SNAKE NEXUS

A modern and visually enhanced version of the classic Snake game, built with HTML5, CSS3, and JavaScript. Dive into a neon-drenched world with dynamic particle effects, challenging power-ups, and an engaging achievement system.

## 🚀 Live Demo

Play Neon Snake Nexus here: [https://surajsk2003.github.io/Neon-Snake-Nexus/](https://surajsk2003.github.io/Neon-Snake-Nexus/)

## 🌟 Features

*   **Vibrant Neon Aesthetics:** Eye-catching visuals with glowing elements, particle effects, and smooth animations.
*   **Multiple Difficulty Levels:** Choose from Easy, Normal, Hard, or Insane to match your skill. Difficulty affects game speed and score multipliers.
*   **Dynamic Scoring System:** Track your Score, current Level, and Combo streaks.
*   **High Score Persistence:** Your best score is saved locally using `localStorage`.
*   **Engaging Power-Ups:**
    *   ⚡ **Speed Boost:** Temporarily increases snake speed.
    *   💎 **Bonus Points:** Grants extra score.
    *   🛡️ **Shield:** Provides temporary invincibility against self-collision.
    *   🔥 **Fire Mode:** Allows the snake to pass through walls for a short period.
*   **Achievement System:** Unlock various achievements as you play, such as "First Bite," "Century," "Speedster," and more. Achievements are saved locally.
*   **Programmatic Sound Effects:** Immersive audio feedback for game events using the Web Audio API.
*   **Snake Trail Effect:** A cool visual trail follows the snake's head.
*   **Responsive UI Elements:** Game Over and Pause screens provide clear game state information.
*   **Keyboard and Touch Controls:** Play on desktop with keyboard or on mobile with touch swipes.

## 🎮 How to Play

The objective is to guide the snake to eat food, grow longer, and achieve the highest score possible without colliding with the walls (unless in Fire Mode) or its own body (unless Shield is active).

### Controls

*   **Arrow Keys (↑, ↓, ←, →):** Control the snake's direction.
*   **Spacebar:** Pause or Resume the game.
*   **R Key:** Restart the game.
*   **Touch Swipe (Mobile):** Swipe in the desired direction to control the snake.

### Gameplay

1.  **Select Difficulty:** Choose your preferred difficulty level at the start.
2.  **Eat Food:**
    *   Regular food (Red) increases your score and snake length.
    *   Special food (Golden, pulsating) appears occasionally for a limited time and grants a larger score bonus.
3.  **Collect Power-Ups:** Various icons will appear on the map. Collect them to activate their special effects.
4.  **Level Up:** As your score increases, you'll level up, and the game speed will increase.
5.  **Combos:** Eating food items in quick succession can build up a score combo.
6.  **Avoid Collisions:**
    *   Hitting the walls will end the game (unless Fire Mode is active).
    *   Hitting your own snake body will end the game (unless Shield is active).
7.  **Achievements:** Try to unlock all the achievements for an extra challenge!

## 🚀 How to Run Locally

1.  Clone this repository or download the game files (`index.html`, `style.css`, `script.js`).
2.  Ensure all three files are in the same directory.
3.  Open the `index.html` file in any modern web browser (e.g., Chrome, Firefox, Safari, Edge).

No special build steps or dependencies are required.

## 🛠️ Technologies Used

*   **HTML5:** For the basic structure and layout of the game.
*   **CSS3:** For styling, animations, neon effects, and responsive design.
    *   Flexbox and Grid for layout.
    *   Custom properties (CSS Variables).
    *   Keyframe animations.
*   **JavaScript (ES6+):** For all game logic, including:
    *   **Canvas API:** For rendering the game elements (snake, food, power-ups, effects).
    *   **Web Audio API:** For generating dynamic sound effects.
    *   **localStorage:** For persisting high scores and achievements.
    *   DOM manipulation for UI updates.

## 🔮 Potential Future Enhancements

*   More power-up types.
*   Obstacles on the game board.
*   Different game modes (e.g., timed mode, survival mode with shrinking play area).
*   Customizable snake skins/colors.
*   Leaderboard (if a backend was integrated).
*   More complex sound design or background music.
*   Visual achievement notifications/popups within the game.

---

Enjoy playing Neon Snake Nexus!

```

This `README.md` provides a good starting point. You can, of course, add more details, screenshots, or a GIF of the gameplay if you like!