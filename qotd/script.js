class QOTDApp {
    constructor() {
        this.questions = [];
        this.currentQuestion = null;
        this.selectedAnswer = null;
        this.answeredQuestions = new Set();
        this.stats = {
            questionsAnswered: 0,
            correctAnswers: 0,
            accuracy: 0
        };
        
        // Add calendar state tracking
        this.currentCalendarDate = new Date();
        this.isCalendarNavigating = false;
        
        this.init();
    }

    async init() {
        await this.loadQuestions();
        this.loadStats();
        this.loadAnsweredQuestions();
        
        // Always generate calendar first
        this.generateCalendar(new Date());
        
        this.displayQuestion();
        this.setupEventListeners();
        
        // Update stats after everything is loaded
        setTimeout(() => this.updateStats(), 200);
    }

    async loadQuestions() {
        try {
            const response = await fetch('questions.csv');
            const csvText = await response.text();
            this.questions = this.parseCSV(csvText);
        } catch (error) {
            console.error('Error loading questions:', error);
            this.showError('Failed to load questions. Please refresh the page.');
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        const questions = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const values = this.parseCSVLine(line);
            
            if (values.length >= 7) {
                const question = {
                    id: parseInt(values[0]),
                    question: values[1].replace(/^"|"$/g, ''), // Remove quotes
                    choices: values[2].split(',').map(choice => choice.trim()),
                    correct: parseInt(values[3]),
                    explanation: values[4].replace(/^"|"$/g, ''), // Remove quotes
                    subject: values[5].replace(/^"|"$/g, ''), // Remove quotes
                    difficulty: values[6].replace(/^"|"$/g, '') // Remove quotes
                };
                questions.push(question);
            }
        }
        
        return questions;
    }

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }

    loadStats() {
        const savedStats = localStorage.getItem('qotd_stats');
        if (savedStats) {
            this.stats = JSON.parse(savedStats);
            console.log('Loaded saved stats:', this.stats);
        } else {
            console.log('No saved stats found, using defaults:', this.stats);
        }
        
        // Calculate accuracy based on loaded stats
        if (this.stats.questionsAnswered > 0) {
            this.stats.accuracy = Math.round((this.stats.correctAnswers / this.stats.questionsAnswered) * 100);
        }
        
        console.log('Final stats after loading:', this.stats);
    }

    saveStats() {
        localStorage.setItem('qotd_stats', JSON.stringify(this.stats));
        console.log('Stats saved to localStorage:', this.stats);
    }

    loadAnsweredQuestions() {
        const saved = localStorage.getItem('qotd_answered');
        if (saved) {
            this.answeredQuestions = new Set(JSON.parse(saved));
        }
    }

    saveAnsweredQuestions() {
        localStorage.setItem('qotd_answered', JSON.stringify([...this.answeredQuestions]));
    }

    getRandomQuestion() {
        const today = new Date().toDateString();
        const lastQuestionDate = localStorage.getItem('qotd_last_question_date');
        
        // If we already showed a question today, return null
        if (lastQuestionDate === today) {
            return null;
        }
        
        // Get a random question that hasn't been answered today
        const availableQuestions = this.questions.filter(q => !this.answeredQuestions.has(q.id));
        
        if (availableQuestions.length === 0) {
            // All questions answered, reset for new day
            this.resetForNewDay();
            return this.questions[Math.floor(Math.random() * this.questions.length)];
        }
        
        return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    }

    resetForNewDay() {
        const today = new Date().toDateString();
        const lastReset = localStorage.getItem('qotd_last_reset');
        
        if (lastReset !== today) {
            this.answeredQuestions.clear();
            this.saveAnsweredQuestions();
            localStorage.setItem('qotd_last_reset', today);
        }
    }

    displayQuestion() {
        this.currentQuestion = this.getRandomQuestion();
        
        if (!this.currentQuestion) {
            this.showTodaysQuestion();
            return;
        }

        // Update question display
        document.getElementById('questionNumber').textContent = this.currentQuestion.subject;
        document.getElementById('questionDifficulty').textContent = this.currentQuestion.difficulty;
        document.getElementById('questionText').textContent = this.currentQuestion.question;
        document.getElementById('questionDate').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Create choice elements
        this.createChoices();
        
        // Reset UI state
        this.selectedAnswer = null;
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('nextBtn').style.display = 'none';
        
        // Ensure calendar is available even when showing a new question
        if (!this.currentCalendarDate) {
            this.generateCalendar(new Date());
        }
    }

    showTodaysQuestion() {
        const questionCard = document.getElementById('questionCard');
        questionCard.innerHTML = `
            <div class="todays-question">
                <div class="question-header">
                    <span class="question-number">Today's Question</span>
                    <span class="question-date">${new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                </div>
                <div class="question-content">
                    <h2 class="question-text">You've already answered today's question!</h2>
                    <p class="come-back-tomorrow">Come back tomorrow for a new challenge!</p>
                    <div class="streak-info">
                        <i class="fas fa-fire"></i>
                        <span>Current Streak: <strong>${this.getCurrentStreak()}</strong> days</span>
                    </div>
                </div>
            </div>
        `;
        
        // Ensure calendar is generated when showing today's question
        this.generateCalendar();
        
        // Verify calendar navigation is working
        setTimeout(() => {
            const prevMonthBtn = document.getElementById('prevMonth');
            const nextMonthBtn = document.getElementById('nextMonth');
            console.log('Calendar navigation buttons after showTodaysQuestion:', {
                prevMonth: prevMonthBtn,
                nextMonth: nextMonthBtn,
                prevMonthOnclick: prevMonthBtn?.onclick,
                nextMonthOnclick: nextMonthBtn?.onclick
            });
        }, 100);
        
        // Update stats display
        setTimeout(() => this.updateStats(), 100);
    }

    createChoices() {
        const container = document.getElementById('choicesContainer');
        container.innerHTML = '';

        const letters = ['A', 'B', 'C', 'D'];
        
        this.currentQuestion.choices.forEach((choice, index) => {
            const choiceDiv = document.createElement('div');
            choiceDiv.className = 'choice';
            choiceDiv.dataset.index = index;
            
            choiceDiv.innerHTML = `
                <label class="choice-label">
                    <span class="choice-letter">${letters[index]}</span>
                    <span class="choice-text">${choice}</span>
                </label>
            `;
            
            choiceDiv.addEventListener('click', () => this.selectChoice(index));
            container.appendChild(choiceDiv);
        });
    }

    selectChoice(index) {
        // Remove previous selection
        document.querySelectorAll('.choice').forEach(choice => {
            choice.classList.remove('selected');
        });
        
        // Select new choice
        const selectedChoice = document.querySelector(`[data-index="${index}"]`);
        selectedChoice.classList.add('selected');
        
        this.selectedAnswer = index;
        document.getElementById('submitBtn').disabled = false;
    }

    submitAnswer() {
        if (this.selectedAnswer === null) return;

        const choices = document.querySelectorAll('.choice');
        const correctIndex = this.currentQuestion.correct;
        
        // Disable all choices
        choices.forEach(choice => choice.classList.add('disabled'));
        
        // Show correct/incorrect answers
        choices.forEach((choice, index) => {
            if (index === correctIndex) {
                choice.classList.add('correct');
            } else if (index === this.selectedAnswer && index !== correctIndex) {
                choice.classList.add('incorrect');
            }
        });

        // Update stats
        this.stats.questionsAnswered++;
        if (this.selectedAnswer === correctIndex) {
            this.stats.correctAnswers++;
        }
        this.saveStats();
        this.updateStats();

        // Mark question as answered
        this.answeredQuestions.add(this.currentQuestion.id);
        this.saveAnsweredQuestions();

        // Mark today's question as completed
        const today = new Date().toDateString();
        localStorage.setItem('qotd_last_question_date', today);
        
        // Save answered date for calendar
        this.saveAnsweredDate(today);
        
        // Update streak (continues regardless of correct/incorrect answer)
        this.updateStreak(this.selectedAnswer === correctIndex);

        // Show explanation and completion message
        this.showExplanation();
        
        // Update stats (which will handle calendar updates if needed)
        this.updateStats();
    }

    nextQuestion() {
        this.displayQuestion();
    }

    showExplanation() {
        const questionCard = document.getElementById('questionCard');
        const isCorrect = this.selectedAnswer === this.currentQuestion.correct;
        const correctChoice = this.currentQuestion.choices[this.currentQuestion.correct];
        
        questionCard.innerHTML = `
            <div class="explanation-message">
                <div class="question-header">
                    <span class="question-number">Question Completed!</span>
                    <span class="question-date">${new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                </div>
                <div class="question-content">
                    <div class="result-feedback ${isCorrect ? '' : 'incorrect'}">
                        <i class="fas ${isCorrect ? 'fa-trophy' : 'fa-lightbulb'}"></i>
                        <h2 class="result-text">${isCorrect ? 'That\'s correct!' : 'Not quite right, but here\'s why:'}</h2>
                    </div>
                    
                    <div class="correct-answer">
                        <span class="correct-label">Correct Answer:</span>
                        <span class="correct-value">${correctChoice}</span>
                    </div>
                    
                    <div class="explanation-section">
                        <h3 class="explanation-title">Explanation:</h3>
                        <p class="explanation-text">${this.currentQuestion.explanation}</p>
                    </div>
                    
                    <div class="streak-info">
                        <i class="fas fa-fire"></i>
                        <span>Current Streak: <strong>${this.getCurrentStreak()}</strong> days</span>
                    </div>
                    
                    <p class="come-back-tomorrow">Come back tomorrow for a new challenge!</p>
                </div>
            </div>
        `;
        
        // Update stats after showing completion message
        setTimeout(() => this.updateStats(), 100);
    }

    showCompletionMessage() {
        const questionCard = document.getElementById('questionCard');
        questionCard.innerHTML = `
            <div class="completion-message">
                <div class="question-header">
                    <span class="question-number">Question Completed!</span>
                    <span class="question-date">${new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                </div>
                <div class="question-content">
                    <h2 class="question-text">Great job! You've completed today's question.</h2>
                    <p class="come-back-tomorrow">Come back tomorrow for a new challenge!</p>
                    <div class="streak-info">
                        <i class="fas fa-fire"></i>
                        <span>Current Streak: <strong>${this.getCurrentStreak()}</strong> days</span>
                    </div>
                </div>
            </div>
        `;
        
        // Update stats after showing completion message
        setTimeout(() => this.updateStats(), 100);
    }

    updateStreak(correct) {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        const lastStreakDate = localStorage.getItem('qotd_last_streak_date');
        const currentStreak = parseInt(localStorage.getItem('qotd_current_streak') || '0');
        
        // Streak continues as long as any answer is given (correct or incorrect)
        if (lastStreakDate === yesterday || lastStreakDate === today) {
            // Continue streak
            const newStreak = lastStreakDate === yesterday ? currentStreak + 1 : currentStreak;
            localStorage.setItem('qotd_current_streak', newStreak.toString());
            localStorage.setItem('qotd_last_streak_date', today);
        } else if (lastStreakDate !== today) {
            // Start new streak
            localStorage.setItem('qotd_current_streak', '1');
            localStorage.setItem('qotd_last_streak_date', today);
        }
    }

    getCurrentStreak() {
        return localStorage.getItem('qotd_current_streak') || '0';
    }

    generateCalendar(targetDate = new Date()) {
        const calendarGrid = document.getElementById('calendarGrid');
        const calendarMonth = document.getElementById('calendarMonth');
        
        // Safety check - ensure calendar elements exist
        if (!calendarGrid || !calendarMonth) {
            console.warn('Calendar elements not found, retrying in 100ms');
            // Retry after a short delay if elements aren't available yet
            setTimeout(() => this.generateCalendar(targetDate), 100);
            return;
        }
        
        // Update the current calendar date
        this.currentCalendarDate = new Date(targetDate);
        
        console.log('Generating calendar for:', this.currentCalendarDate.toDateString());
        
        const today = new Date();
        const currentMonth = targetDate.getMonth();
        const currentYear = targetDate.getFullYear();
        
        // Update calendar month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        calendarMonth.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Get the first day of the month
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        // Clear previous calendar
        calendarGrid.innerHTML = '';
        
        // Add day headers
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const dateString = new Date(currentYear, currentMonth, day).toDateString();
            const isToday = dateString === today.toDateString();
            const isAnswered = this.isDateAnswered(dateString);
            
            if (isToday) {
                dayElement.classList.add('today');
            }
            if (isAnswered) {
                dayElement.classList.add('answered');
            }
            
            dayElement.innerHTML = `
                <span class="day-number">${day}</span>
                ${isAnswered ? '<i class="fas fa-fire"></i>' : ''}
            `;
            
            calendarGrid.appendChild(dayElement);
        }
        
        // Re-setup calendar navigation event listeners after regenerating
        this.setupCalendarEventListeners();
        
        console.log(`Calendar generated for ${monthNames[currentMonth]} ${currentYear} with ${daysInMonth} days`);
    }

    isDateAnswered(dateString) {
        const answeredDates = JSON.parse(localStorage.getItem('qotd_answered_dates') || '[]');
        return answeredDates.includes(dateString);
    }

    saveAnsweredDate(dateString) {
        const answeredDates = JSON.parse(localStorage.getItem('qotd_answered_dates') || '[]');
        if (!answeredDates.includes(dateString)) {
            answeredDates.push(dateString);
            localStorage.setItem('qotd_answered_dates', JSON.stringify(answeredDates));
        }
    }

    updateStats() {
        // Safety check - ensure all DOM elements exist before updating
        const currentStreakElement = document.getElementById('currentStreakStats');
        const correctAnswersElement = document.getElementById('correctAnswers');
        const accuracyElement = document.getElementById('accuracy');
        
        if (!currentStreakElement || !correctAnswersElement || !accuracyElement) {
            console.warn('Stats elements not found, skipping stats update');
            return;
        }
        
        console.log('Updating stats display with:', this.stats);
        
        // Update both streak displays
        const currentStreak = this.getCurrentStreak();
        currentStreakElement.textContent = currentStreak;
        
        // Calculate and update accuracy
        if (this.stats.questionsAnswered > 0) {
            this.stats.accuracy = Math.round((this.stats.correctAnswers / this.stats.questionsAnswered) * 100);
        }
        
        correctAnswersElement.textContent = this.stats.correctAnswers;
        accuracyElement.textContent = `${this.stats.accuracy}%`;
        
        console.log('Stats display updated. Current streak:', currentStreak, 'Correct answers:', this.stats.correctAnswers, 'Accuracy:', this.stats.accuracy + '%');
        
        // Save all stats to localStorage
        this.saveStats();
        
        // Only regenerate calendar if it's not already showing the current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const calendarMonth = this.currentCalendarDate.getMonth();
        const calendarYear = this.currentCalendarDate.getFullYear();
        
        if (currentMonth !== calendarMonth || currentYear !== calendarYear) {
            this.generateCalendar(new Date());
        }
    }

    setupEventListeners() {
        document.getElementById('submitBtn').addEventListener('click', () => this.submitAnswer());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
        
        // Setup calendar navigation event listeners
        this.setupCalendarEventListeners();
    }

    setupCalendarEventListeners() {
        // Setup calendar navigation event listeners
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');
        
        if (prevMonthBtn) {
            // Remove existing event listeners by using a unique handler
            prevMonthBtn.onclick = (e) => {
                e.preventDefault();
                console.log('Previous month button clicked');
                this.navigateMonth(-1);
            };
        }
        
        if (nextMonthBtn) {
            // Remove existing event listeners by using a unique handler
            nextMonthBtn.onclick = (e) => {
                e.preventDefault();
                console.log('Next month button clicked');
                this.navigateMonth(1);
            };
        }
        
        // Log the setup for debugging
        console.log('Calendar event listeners setup:', {
            prevMonth: prevMonthBtn,
            nextMonth: nextMonthBtn,
            prevMonthOnclick: prevMonthBtn?.onclick,
            nextMonthOnclick: nextMonthBtn?.onclick
        });
    }

    navigateMonth(direction) {
        // Prevent multiple rapid clicks
        if (this.isCalendarNavigating) {
            console.log('Calendar navigation already in progress, ignoring click');
            return;
        }
        
        try {
            this.isCalendarNavigating = true;
            
            // Disable navigation buttons temporarily
            const prevMonthBtn = document.getElementById('prevMonth');
            const nextMonthBtn = document.getElementById('nextMonth');
            
            if (prevMonthBtn) prevMonthBtn.disabled = true;
            if (nextMonthBtn) nextMonthBtn.disabled = true;
            
            // Create a new date object based on the current calendar date
            const newDate = new Date(this.currentCalendarDate);
            newDate.setMonth(newDate.getMonth() + direction);
            
            console.log(`Navigating calendar: ${direction > 0 ? 'next' : 'previous'} month`);
            console.log(`From: ${this.currentCalendarDate.toDateString()}`);
            console.log(`To: ${newDate.toDateString()}`);
            
            // Generate calendar with the new date
            this.generateCalendar(newDate);
            
            // Re-enable navigation buttons after a short delay
            setTimeout(() => {
                if (prevMonthBtn) prevMonthBtn.disabled = false;
                if (nextMonthBtn) nextMonthBtn.disabled = false;
                this.isCalendarNavigating = false;
            }, 300);
            
        } catch (error) {
            console.error('Error navigating calendar month:', error);
            // Fallback to current month if navigation fails
            this.generateCalendar(new Date());
            this.isCalendarNavigating = false;
            
            // Re-enable navigation buttons
            const prevMonthBtn = document.getElementById('prevMonth');
            const nextMonthBtn = document.getElementById('nextMonth');
            if (prevMonthBtn) prevMonthBtn.disabled = false;
            if (nextMonthBtn) nextMonthBtn.disabled = false;
        }
    }

    showError(message) {
        const questionCard = document.getElementById('questionCard');
        questionCard.innerHTML = `
            <div class="loading">
                <h2>${message}</h2>
            </div>
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QOTDApp();
});

// Add some nice animations and interactions
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add loading animation
    const questionCard = document.getElementById('questionCard');
    questionCard.style.opacity = '0';
    questionCard.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        questionCard.style.transition = 'all 0.6s ease-out';
        questionCard.style.opacity = '1';
        questionCard.style.transform = 'translateY(0)';
    }, 100);
    
    // Add hover effects for choices
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('.choice')) {
            const choice = e.target.closest('.choice');
            if (!choice.classList.contains('disabled')) {
                choice.style.transform = 'translateX(5px)';
            }
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.choice')) {
            const choice = e.target.closest('.choice');
            if (!choice.classList.contains('disabled')) {
                choice.style.transform = 'translateX(0)';
            }
        }
    });
});
