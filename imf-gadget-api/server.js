const express = require('express');
const cors = require('cors');
const gadgetRoutes = require('./routes/gadgets');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gadgets', gadgetRoutes);

// Error handler
app.use(errorHandler);

// Server start
app.listen(PORT, () => {
  console.log(`IMF Gadget API running on port ${PORT}`);
  console.log('This message will self-destruct in 5 seconds...');
});