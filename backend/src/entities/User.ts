import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()                                   id!: number
    @Column({ type: "varchar", unique: true, length: 100 })     displayname!: string
    @Column({ type: "varchar", length: 255 })                   password_hash!: string
    @CreateDateColumn()                                         created_at!: Date;
}