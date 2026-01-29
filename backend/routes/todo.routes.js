const express = require('express');
const router = express.Router();
const Todo = require('../models/todo.model');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/todos - Get all todos for user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { status, category, universityId } = req.query;

        const query = { userId };
        if (status) query.status = status;
        if (category) query.category = category;
        if (universityId) query.universityId = universityId;

        const todos = await Todo.find(query).sort({ priority: -1, createdAt: -1 });
        res.json(todos);
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ message: 'Error fetching todos.' });
    }
});

// POST /api/todos - Create a new todo
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { title, description, category, dueDate, priority, universityId } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required.' });
        }

        const todo = await Todo.create({
            userId,
            title,
            description,
            category: category || 'Other',
            dueDate: dueDate ? new Date(dueDate) : null,
            priority: priority || 'medium',
            universityId: universityId || null,
            aiGenerated: false
        });

        res.status(201).json(todo);
    } catch (error) {
        console.error('Error creating todo:', error);
        res.status(500).json({ message: 'Error creating todo.' });
    }
});

// PATCH /api/todos/:id - Update a todo
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const todoId = req.params.id;
        const updates = req.body;

        const todo = await Todo.findOne({ _id: todoId, userId });
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found.' });
        }

        // If marking as completed, set completedAt
        if (updates.status === 'completed' && todo.status !== 'completed') {
            updates.completedAt = new Date();
        } else if (updates.status !== 'completed' && todo.status === 'completed') {
            updates.completedAt = null;
        }

        Object.assign(todo, updates);
        await todo.save();

        res.json(todo);
    } catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).json({ message: 'Error updating todo.' });
    }
});

// DELETE /api/todos/:id - Delete a todo
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const todoId = req.params.id;

        const todo = await Todo.findOne({ _id: todoId, userId });
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found.' });
        }

        await todo.deleteOne();
        res.json({ message: 'Todo deleted successfully.' });
    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ message: 'Error deleting todo.' });
    }
});

module.exports = router;
