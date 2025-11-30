import type { Request, Response } from 'express';
import { AppDataSource } from '../../database/connection';
import { Piston } from '../../database/entities/Piston';

const pistonRepository = AppDataSource.getRepository(Piston);

export const pistonController = {
    // Alle Kolben abrufen
    getAllPistons: async (_req: Request, res: Response) => {
        try {
            const pistons = await pistonRepository.find();
            return res.json(pistons);
        } catch (error) {
            return res.status(500).json({ message: "Error fetching pistons", error });
        }
    },

    // Einen Kolben anhand seiner ID abrufen
    getPistonById: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const piston = await pistonRepository.findOneBy({ id });
            
            if (!piston) {
                return res.status(404).json({ message: "Piston not found" });
            }
            
            return res.json(piston);
        } catch (error) {
            return res.status(500).json({ message: "Error fetching piston", error });
        }
    },

    // Einen neuen Kolben erstellen
    createPiston: async (req: Request, res: Response) => {
        try {
            const piston = pistonRepository.create(req.body);
            const result = await pistonRepository.save(piston);
            return res.json(result);
        } catch (error) {
            return res.status(500).json({ message: "Error creating piston", error });
        }
    },

    // Einen Kolben aktualisieren
    updatePiston: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const piston = await pistonRepository.findOneBy({ id });
            
            if (!piston) {
                return res.status(404).json({ message: "Piston not found" });
            }
            
            pistonRepository.merge(piston, req.body);
            const result = await pistonRepository.save(piston);
            return res.json(result);
        } catch (error) {
            return res.status(500).json({ message: "Error updating piston", error });
        }
    },

    // Einen Kolben löschen
    deletePiston: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const result = await pistonRepository.delete(id);
            
            if (result.affected === 0) {
                return res.status(404).json({ message: "Piston not found" });
            }
            
            return res.json({ message: "Piston deleted successfully" });
        } catch (error) {
            return res.status(500).json({ message: "Error deleting piston", error });
        }
    }
};
