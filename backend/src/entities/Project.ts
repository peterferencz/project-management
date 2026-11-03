import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { UserEntity } from "./UserEntity"
import { Task } from "./Task"

@Entity()
export class Project {
    @PrimaryGeneratedColumn()                                   id!: number
    @CreateDateColumn()                                         created_at!: Date
    @Column({ type: "varchar", length: 100 })                   name!: string
    @Column({ type: "text", nullable: true })                   description!: string | null
    
    @ManyToOne(() => UserEntity, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    owner!: UserEntity;

    @OneToMany(() => Task, (task) => task.project, { cascade: true })
    tasks!: Task[];
}