# QOTD - Question of the Day

A modern, sleek web application that presents users with a new multiple-choice question each day. Built with vanilla HTML, CSS, and JavaScript.

## Features

- **Daily Questions**: Get exactly one new question each day
- **No Repetition**: Questions won't repeat until all questions have been answered
- **Streak Tracking**: Build and maintain your daily question streak
- **Progress Calendar**: Visual calendar showing your daily progress
- **Progress Tracking**: Monitor your performance with statistics
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Modern UI**: Beautiful gradient design with smooth animations
- **Local Storage**: Progress is saved locally in your browser

## How to Use

1. **Open the Application**: Simply open `index.html` in your web browser
2. **Answer Questions**: Click on your chosen answer from the multiple choice options
3. **Submit Answer**: Click the "Submit Answer" button to check your response
4. **View Results**: See if your answer was correct and view the correct answer
5. **Daily Limit**: Only one question per day - come back tomorrow for more!
6. **Track Progress**: Monitor your streak and view your progress calendar

## File Structure

```
QOTD/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── questions.json      # Question database
└── README.md           # This file
```

## Question Format

The `questions.json` file contains an array of question objects with the following structure:

```json
{
  "id": 1,
  "question": "What is the capital of France?",
  "choices": ["London", "Berlin", "Paris", "Madrid"],
  "correct": 2
}
```

- `id`: Unique identifier for the question
- `question`: The question text
- `choices`: Array of 4 answer choices
- `correct`: Index of the correct answer (0-based)

## Adding New Questions

To add more questions:

1. Open `questions.json`
2. Add new question objects following the same format
3. Ensure each question has a unique ID
4. Save the file and refresh the application

## Technical Details

- **Storage**: Uses `localStorage` to save progress, statistics, and answered dates
- **Daily Limit**: Only one question per day to encourage consistent learning
- **Streak Tracking**: Maintains daily streaks with visual indicators
- **Progress Calendar**: Monthly calendar view showing answered days
- **Responsive**: Built with CSS Grid and Flexbox for mobile-first design
- **Animations**: Smooth transitions and hover effects for better UX
- **No Dependencies**: Pure vanilla JavaScript, no external libraries required

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Local Development

To run this locally:

1. Download all files to a folder
2. Open `index.html` in your web browser
3. No server setup required - it's a static application

## Customization

You can easily customize the application by:

- Modifying colors in `styles.css`
- Adding more questions to `questions.json`
- Changing the question display format in `script.js`
- Adjusting animations and transitions

## License

This project is open source and available under the MIT License.

---

**Note**: This application works entirely in your browser and doesn't require an internet connection after the initial load. All data is stored locally in your browser's localStorage.
