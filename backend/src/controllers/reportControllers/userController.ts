import { Request, Response } from 'express';
import User from '../../models/userModels/user';
import bcrypt from 'bcryptjs';

export const registerUser = async (req: Request, res: Response) => {

    try {
        const { username, firstName, lastName, email, password, dateOfBirth, phone, avatar } = req.body;

        // Basic validation
        if (!username || !firstName || !lastName || !email || !password || !dateOfBirth || !phone) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        //username validation
        const existingUser = await User.find({ $or: [{username }, { email }] });
        if(existingUser){
            return res.status(400).json({ message: 'Username or Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            dateOfBirth,
            phone,
            avatar
        });

        //Save user to database
        const savedUser = await newUser.save();

        return res.status(201).json({
            message: 'User registered successfully',
            _id: savedUser._id,
            username: savedUser.username,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            email: savedUser.email,
            dateOfBirth: savedUser.dateOfBirth,
            phone: savedUser.phone,            
        });

    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ message: 'Server error', error });
    }

}

