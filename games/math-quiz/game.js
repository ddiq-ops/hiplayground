/**
 * Math Quiz Game
 * Quick math quiz for kids
 */

(function() {
  let currentQuestion = null;
  let score = 0;
  let totalQuestions = 0;
  let correctAnswers = 0;
  let level = 1;
  let callbacks = {};
  let container = null;
  
  const Game = {
    init: function(gameContainer, options = {}) {
      container = gameContainer;
      callbacks = options;
      
      // Load saved progress
      const saved = Storage.getGameProgress('math-quiz');
      if (saved) {
        level = saved.level || 1;
      }
      
      this.generateQuestion();
      this.render();
      
      if (callbacks.onLevelChange) {
        callbacks.onLevelChange(level);
      }
    },
    
    generateQuestion: function() {
      // Generate numbers based on level
      let maxNum = 10 + (level * 5);
      if (maxNum > 50) maxNum = 50;
      
      const num1 = Math.floor(Math.random() * maxNum) + 1;
      const num2 = Math.floor(Math.random() * maxNum) + 1;
      const operations = ['+', '-', '×'];
      const operation = operations[Math.floor(Math.random() * operations.length)];
      
      let answer;
      let questionText;
      
      if (operation === '+') {
        answer = num1 + num2;
        questionText = `${num1} + ${num2} = ?`;
      } else if (operation === '-') {
        // Make sure result is positive
        const larger = Math.max(num1, num2);
        const smaller = Math.min(num1, num2);
        answer = larger - smaller;
        questionText = `${larger} - ${smaller} = ?`;
      } else { // ×
        // Limit multiplication to smaller numbers for kids
        const smallNum1 = Math.min(num1, 10);
        const smallNum2 = Math.min(num2, 10);
        answer = smallNum1 * smallNum2;
        questionText = `${smallNum1} × ${smallNum2} = ?`;
      }
      
      // Generate wrong answers
      const wrongAnswers = [];
      while (wrongAnswers.length < 3) {
        const wrong = answer + Math.floor(Math.random() * 20) - 10;
        if (wrong !== answer && wrong > 0 && !wrongAnswers.includes(wrong)) {
          wrongAnswers.push(wrong);
        }
      }
      
      // Shuffle answers
      const allAnswers = [answer, ...wrongAnswers];
      this.shuffleArray(allAnswers);
      
      currentQuestion = {
        question: questionText,
        answer: answer,
        answers: allAnswers,
        operation: operation
      };
    },
    
    shuffleArray: function(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    },
    
    render: function() {
      if (!container || !currentQuestion) return;
      
      const progress = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      
      container.innerHTML = `
        <div class="math-quiz-game">
          <div class="math-quiz-header">
            <h2 class="math-quiz-title">🔢 수학 퀴즈</h2>
            <div class="math-quiz-stats">
              <div class="math-quiz-stat">
                <div class="math-quiz-stat-label">점수</div>
                <div class="math-quiz-stat-value" id="math-score">${score}</div>
              </div>
              <div class="math-quiz-stat">
                <div class="math-quiz-stat-label">레벨</div>
                <div class="math-quiz-stat-value" id="math-level">${level}</div>
              </div>
              <div class="math-quiz-stat">
                <div class="math-quiz-stat-label">정답률</div>
                <div class="math-quiz-stat-value" id="math-accuracy">${totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%</div>
              </div>
            </div>
          </div>
          
          <div class="math-quiz-progress">
            <div class="math-quiz-progress-bar" style="width: ${progress}%"></div>
          </div>
          
          <div class="math-quiz-question">
            <div class="math-quiz-question-text">${currentQuestion.question}</div>
            <div class="math-quiz-feedback" id="math-feedback"></div>
          </div>
          
          <div class="math-quiz-answers" id="math-answers">
            ${currentQuestion.answers.map((ans, idx) => `
              <button class="math-quiz-answer" data-answer="${ans}">${ans}</button>
            `).join('')}
          </div>
        </div>
      `;
      
      this.setupEvents();
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(score);
      }
    },
    
    setupEvents: function() {
      const answerButtons = document.querySelectorAll('.math-quiz-answer');
      answerButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const selectedAnswer = parseInt(e.target.dataset.answer);
          this.handleAnswer(selectedAnswer, e.target);
        });
      });
    },
    
    handleAnswer: function(selectedAnswer, buttonElement) {
      // Disable all buttons
      const allButtons = document.querySelectorAll('.math-quiz-answer');
      allButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
      });
      
      totalQuestions++;
      const isCorrect = selectedAnswer === currentQuestion.answer;
      
      if (isCorrect) {
        correctAnswers++;
        score += 10 * level;
        buttonElement.classList.add('correct');
        
        const feedbackEl = document.getElementById('math-feedback');
        if (feedbackEl) {
          feedbackEl.textContent = '정답입니다! 🎉';
          feedbackEl.classList.add('correct');
          feedbackEl.classList.remove('incorrect');
        }
        
        // Level up every 5 correct answers
        if (correctAnswers % 5 === 0 && correctAnswers > 0) {
          level++;
          if (callbacks.onLevelChange) {
            callbacks.onLevelChange(level);
          }
        }
      } else {
        buttonElement.classList.add('incorrect');
        
        // Highlight correct answer
        allButtons.forEach(btn => {
          if (parseInt(btn.dataset.answer) === currentQuestion.answer) {
            btn.classList.add('correct');
          }
        });
        
        const feedbackEl = document.getElementById('math-feedback');
        if (feedbackEl) {
          feedbackEl.textContent = `틀렸습니다. 정답은 ${currentQuestion.answer}입니다.`;
          feedbackEl.classList.add('incorrect');
          feedbackEl.classList.remove('correct');
        }
      }
      
      // Update stats
      const scoreEl = document.getElementById('math-score');
      if (scoreEl) scoreEl.textContent = score;
      
      const levelEl = document.getElementById('math-level');
      if (levelEl) levelEl.textContent = level;
      
      const accuracyEl = document.getElementById('math-accuracy');
      if (accuracyEl) {
        accuracyEl.textContent = `${Math.round((correctAnswers / totalQuestions) * 100)}%`;
      }
      
      // Update progress bar
      const progress = (correctAnswers / totalQuestions) * 100;
      const progressBar = document.querySelector('.math-quiz-progress-bar');
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
      
      // Save progress
      Storage.saveGameProgress('math-quiz', {
        lastScore: score,
        level: level,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions
      });
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(score);
      }
      
      // Generate next question after delay
      setTimeout(() => {
        this.generateQuestion();
        this.render();
      }, 1500);
    },
    
    reset: function() {
      score = 0;
      totalQuestions = 0;
      correctAnswers = 0;
      level = 1;
      this.generateQuestion();
      this.render();
      
      if (callbacks.onLevelChange) {
        callbacks.onLevelChange(level);
      }
      
      Storage.saveGameProgress('math-quiz', {
        lastScore: 0,
        level: 1,
        correctAnswers: 0,
        totalQuestions: 0
      });
    },
    
    setMuted: function(muted) {
      // This game doesn't use sound
    }
  };
  
  // Export game
  if (typeof window !== 'undefined') {
    window.Game = Game;
  }
})();

