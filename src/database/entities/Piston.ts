import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Piston {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'text' })
    name: string

    @Column({ type: 'text' })
    manufacturer: string

    @Column("text")
    description: string

    @Column("float")
    diameter: number

    @Column("float")
    stroke: number

    @Column({ type: 'float' })
    compression_height: number

    @Column({ type: 'float' })
    pin_diameter: number

    @Column({ type: 'text', nullable: true })
    material: string

    @Column({ type: 'text', nullable: true })
    coating: string

    @Column({ type: "json", nullable: true })
    specifications: {
        compression_ratio?: number;
        weight?: number;
        ring_configuration?: string[];
    }

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}
