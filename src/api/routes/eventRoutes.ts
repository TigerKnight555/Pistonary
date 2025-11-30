import { Router } from 'express';
import { eventController } from '../controllers/eventController';

const router = Router();

// Event routes
router.post('/events', eventController.addEvent);
router.get('/events', eventController.getEvents);
router.get('/events/:id', eventController.getEventById);
router.put('/events/:id', eventController.updateEvent);
router.delete('/events/:id', eventController.deleteEvent);
router.get('/cars/:carId/events', eventController.getEvents);

export default router;
