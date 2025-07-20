    const gameDiv = document.getElementById('game');
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // ✅ Fixed canvas size (ideal layout for your game)
    canvas.width = 360;
    canvas.height = 480;

    const tileSize = 15;
    let cols = Math.floor(canvas.width / tileSize);
    let rows = Math.floor(canvas.height / tileSize);

    let isCountingDown = false;
    let x, y, dx, dy, score, nTail, tail, fruit, fruitNo = 5, obstacles, gameOver = false, dir = 'UP', gameNo = 0, isPaused = false;
    let speed = 100, difficulty = ' Easy ', highScore = 0, gameInterval, gameRunning = false, obstacleCount = 20;
    let directionLocked = false;


    const startSound = document.getElementById('startSound');
    const eatSound = document.getElementById('eatSound');
    const CongratulationsSound = document.getElementById('CongratulationsSound');
    const gameOverSound = document.getElementById('gameOverSound');
    const countdownSound = document.getElementById('countdownSound');
    const goSound = document.getElementById('goSound');
    const buttonSound = document.getElementById("buttonSound");


    function isOccupied(x, y, snakeHead, tail, fruits,  obstacles) {
      if (y <= 1) return true;  // It will prevent fruits and obstacles from being generated on the score text area

      if (x === snakeHead.x && y < snakeHead.y) return true; 

      if (x === snakeHead.x && y === snakeHead.y) return true;

      for (let part of tail) {
        if (part.x === x && part.y === y) return true;
      }

      for (let f of fruits) {
        if (f.x === x && f.y === y) return true;
      }

      for (let obs of obstacles) {
        if (obs.x === x && obs.y === y) return true;
      }

      return false;
    }

    function getValidPosition(snakeHead, tail, fruits, obstacles, cols, rows) {
      let x, y;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * cols);
        y = Math.floor(Math.random() * rows);
        attempts++;
        if (attempts > 1000) break; // prevent infinite loop
      } while (isOccupied(x, y, snakeHead, tail, fruits, obstacles));
      return { x, y };
    }

    function initGame() {
      x = Math.floor(cols / 2);
      y = Math.floor(rows / 2);
      dx = dy = 0;
      score = 0;
      nTail = 0;
      dir = 'UP';
      tail = [];
      fruit = [];
      obstacles = [];

      let snakeHead = { x, y };

      // Generate 3 non-overlapping fruits
      for (let i = 0; i < fruitNo; i++) {
        let pos = getValidPosition(snakeHead, tail, fruit, obstacles, cols, rows);
        fruit.push(pos);
      }

      // Generate non-overlapping obstacles
      for (let i = 0; i < (obstacleCount || 5); i++) {
        let pos = getValidPosition(snakeHead, tail, fruit, obstacles, cols, rows);
        obstacles.push(pos);
      }

      gameOver = false;
    }

    function showMenu() {
      playButtonSound();

      document.getElementById("menu").style.display = "flex"; // 👈 restore buttons
      document.getElementById("difficultyModal").style.display = "none"; // Add this
      gameDiv.classList.add("hidden");
      document.getElementById("gameOver").classList.add("hidden");
      clearInterval(gameInterval);
      gameRunning = false;
    }

    function confirmExit() {
      playButtonSound();

      if (!isPaused) pauseGame();
      const confirmLeave = confirm("Are You Sure You Want To Exit To The Main Menu ?");
      if (confirmLeave) {
        showMenu();
      } else {
        startCountdownThenResume(); // Optional: resume if they cancel
      }
    }

    function drawCheckerboardBackground() {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Alternate between black and dark gray
          ctx.fillStyle = (row + col) % 2 === 0 ? "#000000" : "#111111";
          ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
        }
      }
    }


    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawCheckerboardBackground(); // 👈 Add this line first

      ctx.save();
      ctx.font = "20px monospace";
      ctx.fillStyle = "white";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 10, 20);

      ctx.textAlign = "right";
      ctx.fillText(`High Score: ${highScore}`, canvas.width - 10, 20);
      ctx.textAlign = "left"; // reset alignment
      ctx.restore(); // Restores all previous canvas state


      // 🐍 Head of the snake
      ctx.font = `${tileSize * 1.1}px Arial`;  // instead of tileSize + 2
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🟢", x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);


      // 🟩 Tail of the snake
      for (let i = 0; i < tail.length; i++) {
        ctx.fillText("🟢", tail[i].x * tileSize + tileSize / 2, tail[i].y * tileSize + tileSize / 2);
      }


      ctx.font = `${tileSize + 1}px Arial`; // Adjust font size as needed
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      fruit.forEach(f => {
        ctx.fillText("🍎", f.x * tileSize + tileSize / 2, f.y * tileSize + tileSize / 2);
      });


      ctx.fillStyle = "gray";
      obstacles.forEach(o => {
        ctx.fillRect(o.x * tileSize, o.y * tileSize, tileSize, tileSize);
      });
    }

    function update() {
        if (gameOver || isPaused) return;

        // Save current head position before moving
        const prevX = x;
        const prevY = y;

        // Move head first
        switch (dir) {
            case 'LEFT': x--; break;
            case 'RIGHT': x++; break;
            case 'UP': y--; break;
            case 'DOWN': y++; break;
        }

        
        // Prevent self-collision only if tail is longer than 1
        const hitSelf = nTail >= 2 && tail.some(t => t.x === x && t.y === y);

        // Check wall or obstacle
        const hitWall = x < 0 || x >= cols || y < 0 || y >= rows;
        const hitObstacle = obstacles.some(o => o.x === x && o.y === y);

        if (hitWall || hitSelf || hitObstacle) {
          console.log("GAME OVER at:", { x, y, hitWall, hitSelf, hitObstacle });
          vibrateMobile(500); // longer vibration pattern for ending

          gameOver = true;
          endGame();
          return;
        }


        // Update tail after head has moved
        tail.unshift({ x: prevX, y: prevY });
        if (tail.length > nTail) tail.pop();

        // Check for fruit collision
        for (let i = 0; i < fruit.length; i++) {
            if (fruit[i].x === x && fruit[i].y === y) {
              score += 10;
              nTail++;
              const eatClone = eatSound.cloneNode();
              eatClone.play();
              vibrateMobile(100);

              fruit[i] = getValidPosition({x, y}, tail, fruit, obstacles, cols, rows);
            }
        }

        directionLocked = false; // ✅ allow next input after frame is processed
    }


    function endGame() {
      clearInterval(gameInterval);
      gameRunning = false;

      if (score > highScore) {
        showCongratulations();
        CongratulationsSound.play();
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);

        saveHighScore(score); // ✅ Save to leaderboard without duplicates
      } else {
        gameOverSound.play();
      }

      gameDiv.classList.add("hidden");
      document.getElementById("gameOver").classList.remove("hidden");
      document.getElementById("gameOverText").textContent = `Score: ${score}\nHigh Score: ${highScore}`;
    }


    function gameLoop() {
      update();
      draw();
    }

    function startGame() {
      initGame();
      gameNo++;
      isPaused = true;          // ✅ Set paused to true initially
      gameRunning = true;

      document.getElementById("menu").style.display = "none";
      document.getElementById("gameOver").classList.add("hidden");
      gameDiv.classList.remove("hidden");

      // ❌ Don't start game loop here
      // ✅ Let countdown handle it after 3..2..1..Go!
      document.getElementById("pauseBtn").style.display = "none";
      document.getElementById("resumeBtn").style.display = "none";

      startCountdownThenResume(); // ✅ Countdown will start the game loop
    }


    function pauseGame() { isPaused = true; }
    function resumeGame() { if (gameRunning) isPaused = false; }

    function restartGame() {
      startGame();
    }

    function selectDifficulty() {
      playButtonSound();

      // Show the difficulty selection modal
      document.getElementById("difficultyModal").style.display = "flex";
    }

    function closeDifficulty() {
      playButtonSound();
      document.getElementById("difficultyModal").style.display = "none";
    }

    function setDifficulty(choice) {
      if (choice === 'e') {
        speed = 200; difficulty = "Easy"; obstacleCount = 20;
        canvas.style.borderColor = "#87CEEB";
      } else if (choice === 'm') {
        speed = 165; difficulty = "Medium"; obstacleCount = 35;
        canvas.style.borderColor = "#6495ED";
      } else if (choice === 'h') {
        speed = 130; difficulty = "Hard"; obstacleCount = 50;
        canvas.style.borderColor = "#4682B4";
      }

      document.getElementById("difficultyModal").style.display = "none";

      // ✅ Instead of startGame(), use this:
      initGame();

      document.getElementById("menu").style.display = "none";
      document.getElementById("gameOver").classList.add("hidden");
      gameDiv.classList.remove("hidden");

      startCountdownThenResume(); // ✅ Use the same function here
    }



    function showInstruction() {
      playButtonSound();
      document.getElementById("instructionModal").style.display = "flex";
    }

    function closeInstructions() {
      playButtonSound();
      document.getElementById("instructionModal").style.display = "none";
    }


    function showAbout() {
      playButtonSound();
      document.getElementById("aboutModal").style.display = "flex";
    }

    function closeAbout() {
      playButtonSound();
      document.getElementById("aboutModal").style.display = "none";
    }


    function showCongratulations() {
      document.getElementById("newHighScoreText").textContent = score;
      document.getElementById("CongratulationsModal").style.display = "flex";
    }

    function closeCongratulations() {
      playButtonSound();
      document.getElementById("CongratulationsModal").style.display = "none";
    }


    function move(newDir) {
      if (!gameRunning || directionLocked) return;

      if (!dir) {
        dir = newDir;
      } else {
        if (
          (newDir === 'UP' && dir !== 'DOWN') ||
          (newDir === 'DOWN' && dir !== 'UP') ||
          (newDir === 'LEFT' && dir !== 'RIGHT') ||
          (newDir === 'RIGHT' && dir !== 'LEFT')
        ) {
          dir = newDir;
          directionLocked = true; // ✅ prevent further change until next frame
        }
      }
    }


    // ✅ Keyboard Controls
    window.addEventListener("keydown", e => {
      const key = e.code;

      const startIfNeeded = (newDir, blockDir) => {
        if (!dir && gameRunning) {
          dir = newDir;
        } else if (dir !== blockDir) {
          dir = newDir;
        }
      };

      if (key === "ArrowUp") startIfNeeded("UP", "DOWN");
      else if (key === "ArrowDown") startIfNeeded("DOWN", "UP");
      else if (key === "ArrowLeft") startIfNeeded("LEFT", "RIGHT");
      else if (key === "ArrowRight") startIfNeeded("RIGHT", "LEFT");
      else if (key === "KeyP") isPaused = !isPaused;
      else if (key === "KeyR" && gameOver) startGame();
      else if (key === "KeyQ" && gameOver) showMenu();
    });

    // ✅ Load high score
    highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;


    function resizeGame() {
      const wrapper = document.getElementById('gameWrapper');
      const scaleBox = document.getElementById('gameScaleBox');
      
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const desiredWidth = 360;
      const desiredHeight = 540;

      // Padding around the scale box (can be adjusted)
      const paddingX = 40;  // horizontal padding
      const paddingY = 80;  // vertical padding (also makes room for controls)

      const scale = Math.min(
        (vw - paddingX) / desiredWidth,
        (vh - paddingY) / desiredHeight
      );

      wrapper.style.transform = `scale(${scale})`;
      wrapper.style.transformOrigin = 'top center';

      // Optional: add padding to the scale box for visibility
      scaleBox.style.padding = '10px'; // can tweak as needed

    }

   // ✅ Call resizeGame on page load and when resizing the window
    window.addEventListener("resize", resizeGame);
    window.addEventListener("load", resizeGame);

    // Detect if it's a touch device (mobile/tablet)
    function isMobileDevice() {
      const ua = navigator.userAgent || navigator.vendor || window.opera;

      // Check common mobile device indicators in user agent
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      const isMobileAgent = /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(ua);

      return isTouch || isMobileAgent;
    }


    // Show mobile controls only on mobile
    window.addEventListener('DOMContentLoaded', () => {
      const mobileControls = document.getElementById('mobileControls');
      if (isMobileDevice()) {
        mobileControls.style.display = 'flex';
      } else {
        mobileControls.style.display = 'none';
      }
    });

    
    window.addEventListener("load", () => {
      const userKey = localStorage.getItem("userKey");
      const playerName = localStorage.getItem("playerName");

      const loading = document.getElementById("loadingOverlay");
      const login = document.getElementById("loginModal");
      const menu = document.getElementById("menu");

      loading.style.display = "flex"; // Show loading first
      login.style.display = "none";
      menu.style.display = "none";

      if (userKey) {
        firebase.database().ref("users/" + userKey).once("value").then(snapshot => {
          const userData = snapshot.val();
          if (userData) {
            // ✅ Valid returning user
            localStorage.setItem("playerName", userData.name);
            loading.style.display = "none";
            menu.style.display = "flex";
          } else {
            // ❌ Invalid user key
            localStorage.removeItem("userKey");
            loading.style.display = "none";
            login.style.display = "flex";
          }
        });
      } else if (playerName) {
        // Might be an old user (no key, only name)
        firebase.database().ref("users").orderByChild("name").equalTo(playerName).once("value", snapshot => {
          if (snapshot.exists()) {
            snapshot.forEach(child => {
              localStorage.setItem("userKey", child.key);
            });
            loading.style.display = "none";
            menu.style.display = "flex";
          } else {
            loading.style.display = "none";
            login.style.display = "flex";
          }
        });
      } else {
        // First time user
        loading.style.display = "none";
        login.style.display = "flex";
      }
    });


    function submitName() {
      const input = document.getElementById("playerNameInput");
      const name = input.value.trim();
      const existingKey = localStorage.getItem("userKey");

      if (!name) {
        alert("Please enter your name.");
        return;
      }

      // ✅ If already registered, don't push again
      if (existingKey) {
        localStorage.setItem("playerName", name);
        document.getElementById("loginModal").style.display = "none";
        document.getElementById("menu").style.display = "flex";
        return;
      }

      // 👉 Push new user only if not already registered on this device
      const newRef = firebase.database().ref("users").push({
        name: name,
        timestamp: Date.now()
      });

      // ✅ Save key and name locally
      localStorage.setItem("userKey", newRef.key);
      localStorage.setItem("playerName", name);

      document.getElementById("loginModal").style.display = "none";
      document.getElementById("menu").style.display = "flex";
    }


    function showUsers() {
      playButtonSound();

      // ✅ Check for internet connection first
      if (!navigator.onLine) {
        alert("⚠️ Internet Connection Is Slow or Unavailable.\n Please Check Your Connection And Try Again.");
        return;
      }

      const list = document.querySelector("#usersModal #userList");
      const serialInfo = document.querySelector("#usersModal #serialInfo");
      list.innerHTML = "";
      serialInfo.innerHTML = "";

      const currentUser = localStorage.getItem("playerName");

      firebase.database().ref('users').once('value', (snapshot) => {
        const users = [];
        snapshot.forEach(child => {
          users.push(child.val().name);
        });

        users.forEach((user, index) => {
          const li = document.createElement("li");
          li.classList.add("community-item");

          const serial = document.createElement("span");
          serial.textContent = `${index + 1}.`;
          serial.classList.add("community-serial");

          const name = document.createElement("span");
          name.textContent = user;
          name.classList.add("community-name");

          if (user === currentUser) {
            name.style.color = "red";
            name.style.fontWeight = "bold";
            serialInfo.innerHTML = `👤 <strong>${index + 1}. ${user} (You) ❤️ </strong>`;
          }

          li.appendChild(serial);
          li.appendChild(name);
          list.appendChild(li);
        });

        document.getElementById("usersModal").style.display = "flex";
      });
    }



    function closeUsers() {
      playButtonSound();
      document.getElementById("usersModal").style.display = "none";
    }


    // ✅ Firebase Configuration
    const firebaseConfig = {
      apiKey: "AIzaSyD35N3rYOmW9gHjDJUQIBqatz-z4TgB4zg",
      authDomain: "snake-game-users-4b938.firebaseapp.com",
      databaseURL: "https://snake-game-users-4b938-default-rtdb.firebaseio.com",
      projectId: "snake-game-users-4b938",
      storageBucket: "snake-game-users-4b938.firebasestorage.app",
      messagingSenderId: "907563248454",
      appId: "1:907563248454:web:33340124d52b12e51e9347"
    };

    // ✅ Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // ✅ Recover missing userKey for old users
    window.addEventListener("load", () => {
      const currentName = localStorage.getItem("playerName");
      const storedKey = localStorage.getItem("userKey");

      if (currentName && !storedKey) {
        // Try to find the matching Firebase entry
        firebase.database().ref("users").orderByChild("name").equalTo(currentName).once("value", snapshot => {
          snapshot.forEach(child => {
            // Save the matched key
            localStorage.setItem("userKey", child.key);
          });
        });
      }
    });


    function togglePause() {
      playButtonSound();
      if (!gameRunning) return;

      if (isPaused) {
        // 👉 Resume with countdown
        startCountdownThenResume(); // call countdown first
      } else {
        // 👉 Pause immediately
        isPaused = true;
        document.getElementById("pauseBtn").style.display = "none";
        document.getElementById("resumeBtn").style.display = "inline-block";
      }
    }


    function confirmEdit() {
      playButtonSound();

      if (confirm('Are You Sure You Want To Edit Your User Name ?')) {
        editUsername()
      } else {
        return;
      }
    }


    function editUsername() {
      playButtonSound();

      if (!navigator.onLine) {
        alert("⚠️ Internet Connection Is Slow or Unavailable.\nPlease Check Your Connection And Try Again.");
        return;
      }

      const currentName = localStorage.getItem("playerName") || '';
      const input = document.getElementById("editNameInput");
      input.value = currentName.trim();
      document.getElementById("editUsernameModal").style.display = "flex";
      input.focus();
    }
    

    function submitEditedUsername() {
      playButtonSound();

      const newName = document.getElementById("editNameInput").value.trim(); // ✅ fixed ID
      const key = localStorage.getItem("userKey");

      if (!key || !newName) {
        alert("Invalid input or missing user ID.");
        return;
      }

      // ✅ Update in Firebase
      firebase.database().ref(`users/${key}`).update({
        name: newName
      })
      .then(() => {
        // ✅ Update locally
        localStorage.setItem("playerName", newName);
        document.getElementById("editUsernameModal").style.display = "none";
        CongratulationsSound.play();
        alert("Your name has been updated!");

        // ✅ Update name on screen if displayed somewhere (optional)
        const nameElement = document.getElementById("playerNameDisplay");
        if (nameElement) nameElement.textContent = newName;
      })
      .catch(error => {
        alert("Update failed: " + error.message);
      });
    }


    function closeEditUsername() {
      playButtonSound();
      document.getElementById("editUsernameModal").style.display = "none";
    }

    function startCountdownThenResume() {
      draw();

      if (window.isCountingDown) return;
      window.isCountingDown = true;

      const overlay = document.getElementById("countdownOverlay");
      const text = document.getElementById("countdownText");
      overlay.style.display = "flex";

      let count = 3;
      text.textContent = count;
      countdownSound.play();

      const interval = setInterval(() => {
        count--;

        if (count > 0) {
          text.textContent = count;
          countdownSound.play();
        } else if (count === 0) {
          text.textContent = "Go!";
          goSound.play();
          vibrateMobile(300); // subtle buzz to indicate game started

        } else {
          clearInterval(interval);
          overlay.style.display = "none";
          text.textContent = ""; // Optional reset

          // ✅ Fix: Clear any previous game interval before starting new one
          clearInterval(gameInterval); 

          // ✅ Start the game loop fresh
          gameInterval = setInterval(gameLoop, speed);

          isPaused = false;
          gameRunning = true;

          document.getElementById("pauseBtn").style.display = "inline-block";
          document.getElementById("resumeBtn").style.display = "none";

          window.isCountingDown = false;
        }
      }, 1000);
    }

    function saveHighScore(score) {
      const name = localStorage.getItem("playerName");
      const key = localStorage.getItem("userKey");

      if (!key || !name) return;

      // Save or update high score for the unique user
      firebase.database().ref("highscores/" + key).set({
        name: name,
        score: score
      });
    }


    function showLeaderboard() {
      playButtonSound();

      // ✅ Check for internet connection first
      if (!navigator.onLine) {
        alert("⚠️ Internet Connection Is Slow or Unavailable.\n Please Check Your Connection And Try Again.");
        return;
      }

      const list = document.getElementById("leaderboardList");
      list.innerHTML = "";

      firebase.database().ref("highscores")
        .once("value", snapshot => {
          const scores = [];

          snapshot.forEach(child => {
            const entry = child.val();
            scores.push({
              name: entry.name,
              score: entry.score
            });
          });

          // Sort scores descending
          scores.sort((a, b) => b.score - a.score);

          // Top 10
          scores.slice(0, 10).forEach((entry, index) => {
            const li = document.createElement("li");
            li.classList.add("leaderboard-item");

            const serial = document.createElement("span");
            serial.textContent = `${index + 1}.`;
            serial.classList.add("leaderboard-serial");

            const nameScore = document.createElement("span");
            nameScore.innerHTML = `${entry.name} – <span>${entry.score}</span>`;
            nameScore.classList.add("leaderboard-name-score");

            li.appendChild(serial);
            li.appendChild(nameScore);
            list.appendChild(li);
          });

          document.getElementById("leaderboardModal").style.display = "flex";
        });
    }


    function closeLeaderboard() {
      playButtonSound();
      document.getElementById("leaderboardModal").style.display = "none";
    }

    let selectedRating = 0;

    document.querySelectorAll(".star").forEach(star => {
      star.addEventListener("click", () => {
        selectedRating = parseInt(star.getAttribute("data-value"));

        // Clear all stars
        document.querySelectorAll(".star").forEach(s => s.classList.remove("selected"));

        // Highlight up to the selected star
        for (let i = 1; i <= selectedRating; i++) {
          document.querySelector(`.star[data-value="${i}"]`).classList.add("selected");
        }
      });
    });


    function submitFeedback() {
      playButtonSound();

      if (selectedRating === 0) {
        alert("Please Select A Rating.");
        return;
      }

      const userKey = localStorage.getItem("userKey");
      if (!userKey) {
        alert("User Not Identified. Please Log In Again.");
        return;
      }

      const feedbackRef = firebase.database().ref("feedbacks/" + userKey);

      const feedbackData = {
        rating: selectedRating,
        timestamp: Date.now()
      };

      // Save/overwrite feedback for this userKey
      feedbackRef.set(feedbackData).then(() => {
        CongratulationsSound.play();
        alert("Thank You For Your Feedback! 💖");
        selectedRating = 0;
        closeFeedback();
        document.querySelectorAll(".star").forEach(s => s.classList.remove("selected"));
      });
    }



    function showFeedback() {
      playButtonSound();

      // ✅ Check for internet connection first
      if (!navigator.onLine) {
        alert("⚠️ Internet Connection Is Slow or Unavailable.\nPlease Check Your Connection And Try Again.");
        return;
      }

      loadAverageRating(); // ✅ Load and show average stars
      document.getElementById("feedbackModal").style.display = "flex"; // ✅ Show modal
    }


    function closeFeedback() {
      playButtonSound();
      document.getElementById("feedbackModal").style.display = "none";
    }


    function loadAverageRating() {
      const avgEl = document.getElementById("avgRatingValue");
      const ref = firebase.database().ref("feedbacks");

      ref.once("value", snapshot => {
        const data = snapshot.val();
        if (!data) {
          avgEl.textContent = "No ratings yet.";
          return;
        }

        const ratings = Object.values(data).map(f => f.rating);
        const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;

        // Format to 1 decimal
        const formatted = average.toFixed(1);
        
        // Show stars with number
        avgEl.innerHTML = `⭐ ${formatted} (${ratings.length} votes)`;
      });
    }

    function playButtonSound() {      
      buttonSound.volume = 0.5;
      if (buttonSound) {
        try {
          buttonSound.currentTime = 0;
          buttonSound.play();
        } catch (e) {
          // Sound couldn't be played due to browser restrictions
        }
      }
    }

    function setupMobileControls() {
      const directions = [
        { id: "upBtn", dir: "UP" },
        { id: "downBtn", dir: "DOWN" },
        { id: "leftBtn", dir: "LEFT" },
        { id: "rightBtn", dir: "RIGHT" },
      ];

      directions.forEach(({ id, dir }) => {
        const btn = document.getElementById(id);

        // Instant response on mobile
        btn.addEventListener("touchstart", (e) => {
          e.preventDefault();  // Prevents ghost click
          move(dir);
        });

        // Fallback for desktop clicks
        btn.addEventListener("click", () => move(dir));
      });
    }

    window.addEventListener("DOMContentLoaded", setupMobileControls);

    function vibrateMobile(pattern) {
      if (/Mobi|Android|iPhone/i.test(navigator.userAgent) && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    }
