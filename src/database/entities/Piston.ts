import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Piston {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name: string

    @Column()
    manufacturer: string

    @Column("text")
    description: string

    @Column("float")
    diameter: number

    @Column("float")
    stroke: number

    @Column()
    compression_height: number

    @Column()
    pin_diameter: number

    @Column({ nullable: true })
    material: string

    @Column({ nullable: true })
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
