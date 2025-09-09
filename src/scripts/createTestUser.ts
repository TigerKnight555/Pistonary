import "reflect-metadata";
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../database/connection';
import { User } from '../database/entities/User';
import { Car } from '../database/entities/Car';

async function createTestUser() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected");

        const userRepository = AppDataSource.getRepository(User);
        const carRepository = AppDataSource.getRepository(Car);

        // Create test user
        const hashedPassword = await bcrypt.hash('test123', 12);
        
        const testUser = userRepository.create({
            email: 'test@example.com',
            name: 'Test User',
            password: hashedPassword
        });

        const savedUser = await userRepository.save(testUser);
        console.log('Test user created:', savedUser.email);

        // Create test car for this user
        const testCar = carRepository.create({
            manufacturer: 'Toyota',
            model: 'Celica',
            year: 1995,
            power: 175,
            transmission: 'Manuell',
            licensePlate: 'TEST-123',
            fuel: 'Benzin',
            userId: savedUser.id,
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzNzNkYyIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRveW90YSBDZWXAY2E8L3RleHQ+Cjwvc3ZnPg=='
        });

        const savedCar = await carRepository.save(testCar);
        console.log('Test car created:', savedCar.manufacturer, savedCar.model);

        // Set this car as selected
        savedUser.selectedCarId = savedCar.id;
        await userRepository.save(savedUser);
        console.log('Selected car set to:', savedCar.manufacturer, savedCar.model);

        console.log('Test data setup complete');
        process.exit(0);
    } catch (error) {
        console.error('Error creating test user:', error);
        process.exit(1);
    }
}

createTestUser();
