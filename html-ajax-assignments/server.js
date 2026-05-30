const express = require('express');
const path = require('path');

const app = express();
const PORT = 5004;

// Middleware to parse JSON body
app.use(express.json());

// Serve static HTML files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory array to store feedback for demonstration
const feedbackData = [];

// Endpoint to receive AJAX feedback
app.post('/api/feedback', (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  const newFeedback = {
    id: Date.now(),
    name,
    message,
    date: new Date().toLocaleString()
  };

  feedbackData.push(newFeedback);
  
  // Return the newly created feedback object
  res.status(201).json(newFeedback);
});

// Endpoint to list all feedback (optional, if we want to show existing feedback on load)
app.get('/api/feedback', (req, res) => {
  res.json(feedbackData);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`College Portal: http://localhost:${PORT}/college-portal.html`);
  console.log(`Feedback System: http://localhost:${PORT}/feedback-system.html`);
});
