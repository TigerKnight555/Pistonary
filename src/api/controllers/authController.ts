import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../../database/connection';
import { User } from '../../database/entities/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export const authController = {
    // Benutzer registrieren
    register: async (req: Request, res: Response) => {
        try {
            const { email, password, name } = req.body;
            
            const userRepository = AppDataSource.getRepository(User);
            
            // Check if user already exists
            const existingUser = await userRepository.findOneBy({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);
            
            // Create user
            const user = userRepository.create({
                email,
                password: hashedPassword,
                name
            });
            
            await userRepository.save(user);
            
            // Generate JWT
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email,
                    selectedCarId: user.selectedCarId 
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;
            
            return res.status(201).json({
                user: userWithoutPassword,
                token
            });
        } catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ message: 'Registration failed', error });
        }
    },

    // Benutzer anmelden
    login: async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            
            const userRepository = AppDataSource.getRepository(User);
            
            // Find user
            const user = await userRepository.findOneBy({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            // Generate JWT
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email,
                    selectedCarId: user.selectedCarId 
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;
            
            return res.json({
                user: userWithoutPassword,
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ message: 'Login failed', error });
        }
    },

    // Ausgewähltes Auto aktualisieren
    selectCar: async (req: Request, res: Response) => {
        try {
            const { carId } = req.body;
            const userId = (req as any).user.userId;
            
            const userRepository = AppDataSource.getRepository(User);
            
            // Update user's selected car
            await userRepository.update(userId, { selectedCarId: carId });
            
            // Generate new JWT with updated selectedCarId
            const user = await userRepository.findOneBy({ id: userId });
            
            const token = jwt.sign(
                { 
                    userId: user!.id, 
                    email: user!.email,
                    selectedCarId: carId 
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            return res.json({ token });
        } catch (error) {
            console.error('Select car error:', error);
            return res.status(500).json({ message: 'Failed to select car', error });
        }
    },

    // Benutzer-Profil abrufen
    getProfile: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOneBy({ id: userId });
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;
            
            return res.json(userWithoutPassword);
        } catch (error) {
            console.error('Get profile error:', error);
            return res.status(500).json({ message: 'Failed to get profile', error });
        }
    }
};
