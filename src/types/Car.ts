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
    additionalInfo?: {
        vin?: string;
        color?: string;
        lastService?: string;
    };
    created_at: Date;
    updated_at: Date;
}
