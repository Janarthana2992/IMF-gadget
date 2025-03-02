const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Register a new agent
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Check if user already exists
    const userExists = await prisma.user.findUnique({
      where: { username }
    });
    
    if (userExists) {
      return res.status(400).json({ message: 'Agent already exists in database' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'AGENT'
      }
    });
    
    // Generate token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'imf_top_secret_key',
      { expiresIn: '12h' }
    );
    
    res.status(201).json({
      id: user.id,
      username: user.username,
      role: user.role,
      token
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'imf_top_secret_key',
      { expiresIn: '12h' }
    );
    
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      token
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current agent profile
router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;