const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect, authorize } = require('../middleware/auth');
const { 
  generateCodename, 
  generateMissionSuccessProbability,
  generateSelfDestructCode
} = require('../utils/codeGenerator');

const prisma = new PrismaClient();
const router = express.Router();

// Get all gadgets with optional status filter
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    
    const whereCondition = status ? { 
      status: status.toUpperCase() 
    } : {};
    
    const gadgets = await prisma.gadget.findMany({
      where: whereCondition
    });
    
    // Add mission success probability to each gadget
    const gadgetsWithProbability = gadgets.map(gadget => ({
      ...gadget,
      missionSuccessProbability: `${generateMissionSuccessProbability()}%`
    }));
    
    res.json(gadgetsWithProbability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve gadgets' });
  }
});

// Get a specific gadget by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const gadget = await prisma.gadget.findUnique({
      where: { id: req.params.id }
    });
    
    if (!gadget) {
      return res.status(404).json({ message: 'Gadget not found' });
    }
    
    const gadgetWithProbability = {
      ...gadget,
      missionSuccessProbability: `${generateMissionSuccessProbability()}%`
    };
    
    res.json(gadgetWithProbability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve gadget' });
  }
});

// Add a new gadget
router.post('/', protect, authorize(['HANDLER', 'ADMIN']), async (req, res) => {
  try {
    let { name, description, codename } = req.body;
    
    // Generate a random codename if not provided
    if (!codename) {
      let isUnique = false;
      let generatedCodename;
      
      // Ensure codename is unique
      while (!isUnique) {
        generatedCodename = generateCodename();
        
        const existingGadget = await prisma.gadget.findUnique({
          where: { codename: generatedCodename }
        });
        
        if (!existingGadget) {
          isUnique = true;
        }
      }
      
      codename = generatedCodename;
    }
    
    const gadget = await prisma.gadget.create({
      data: {
        name,
        codename,
        description
      }
    });
    
    res.status(201).json(gadget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create gadget' });
  }
});

// Update a gadget
router.patch('/:id', protect, authorize(['HANDLER', 'ADMIN']), async (req, res) => {
  try {
    const gadget = await prisma.gadget.findUnique({
      where: { id: req.params.id }
    });
    
    if (!gadget) {
      return res.status(404).json({ message: 'Gadget not found' });
    }
    
    const { name, description, status } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    
    const updatedGadget = await prisma.gadget.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    res.json(updatedGadget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update gadget' });
  }
});

// "Delete" a gadget (mark as decommissioned)
router.delete('/:id', protect, authorize(['ADMIN']), async (req, res) => {
  try {
    const gadget = await prisma.gadget.findUnique({
      where: { id: req.params.id }
    });
    
    if (!gadget) {
      return res.status(404).json({ message: 'Gadget not found' });
    }
    
    // Mark as decommissioned instead of actually deleting
    const decommissionedGadget = await prisma.gadget.update({
      where: { id: req.params.id },
      data: {
        status: 'DECOMMISSIONED',
        decommissionedAt: new Date()
      }
    });
    
    res.json({ 
      message: 'Gadget successfully decommissioned',
      gadget: decommissionedGadget
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to decommission gadget' });
  }
});

// Self-destruct sequence
router.post('/:id/self-destruct', protect, authorize(['HANDLER', 'ADMIN']), async (req, res) => {
  try {
    const gadget = await prisma.gadget.findUnique({
      where: { id: req.params.id }
    });
    
    if (!gadget) {
      return res.status(404).json({ message: 'Gadget not found' });
    }
    
    if (gadget.status === 'DESTROYED' || gadget.status === 'DECOMMISSIONED') {
      return res.status(400).json({ 
        message: `Gadget ${gadget.codename} is already ${gadget.status.toLowerCase()}`
      });
    }
    
    // Generate a confirmation code for self-destruct
    const confirmationCode = generateSelfDestructCode();
    
    // Simulate sending the code (in a real app, this might send an email or SMS)
    console.log(`Self-destruct confirmation code for ${gadget.codename}: ${confirmationCode}`);
    
    // Store confirmation code in session or cache for verification
    // For this example, we'll just send it back to the client, but in a real app
    // you would never do this - it would be stored server-side and verified later
    
    res.json({
      message: `Self-destruct sequence initiated for ${gadget.codename}`,
      confirmationCode,
      gadgetId: gadget.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to initiate self-destruct sequence' });
  }
});

// Confirm self-destruct
router.post('/:id/confirm-self-destruct', protect, authorize(['HANDLER', 'ADMIN']), async (req, res) => {
  try {
    const { confirmationCode } = req.body;
    
    if (!confirmationCode) {
      return res.status(400).json({ message: 'Confirmation code required' });
    }
    
    // In a real app, you would verify the confirmation code with what's stored
    // server-side, but for this example, we'll just assume it's correct
    
    const gadget = await prisma.gadget.findUnique({
      where: { id: req.params.id }
    });
    
    if (!gadget) {
      return res.status(404).json({ message: 'Gadget not found' });
    }
    
    const destroyedGadget = await prisma.gadget.update({
      where: { id: req.params.id },
      data: { status: 'DESTROYED' }
    });
    
    res.json({
      message: `${gadget.codename} has been destroyed. This message will self-destruct in 5 seconds.`,
      gadget: destroyedGadget
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to complete self-destruct sequence' });
  }
});

module.exports = router;