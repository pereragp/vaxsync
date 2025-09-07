import express from 'express';
import { registerUser, getUserById, loginUser } from '../controllers/userController';

const router = express.Router();

// User registration route
router.post('/register', registerUser);
router.post('/login', loginUser);


//User profile routes
router.get('/:id', getUserById);

export default router; 

