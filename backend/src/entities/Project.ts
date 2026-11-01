import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./User"
import { Task } from "./Task"

@Entity()
export class Project {
    @PrimaryGeneratedColumn()                                   id!: number
    @CreateDateColumn()                                         created_at!: Date
    @Column({ type: "varchar", length: 100 })                   name!: string
    @Column({ type: "text" })                                   description!: string
    
    @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    owner!: User;

    @OneToMany(() => Task, (task) => task.project, { cascade: true })
    tasks!: Task[];
}