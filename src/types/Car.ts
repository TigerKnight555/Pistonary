export interface Car {
    id: number;
    manufacturer: string;
    model: string;
    year: number;
    power: number;
    transmission: string;
    fuel: string;
    engineSize?: number;
    mileage?: number;
    powerUnit?: string; // Einheit für Leistung (PS oder kW)
    mileageUnit?: string; // Einheit für Kilometerstand (km oder mi)
    licensePlate?: string;
    image?: string;
    notes?: string;
    additionalInfo?: {
        vin?: string;
        color?: string;
        lastService?: string;
    };
    // Wartungsintervalle
    useStandardIntervals?: boolean;
    maintenanceCategories?: {
        id: number;
        name: string;
        timeInterval: number | null; // Monate
        mileageInterval: number | null; // km
        description?: string;
    }[];
    created_at: Date;
    updated_at: Date;
}
