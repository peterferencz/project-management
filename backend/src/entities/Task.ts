import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./User"
import { Project } from "./Project"

@Entity()
export class Task {
    @PrimaryGeneratedColumn()                                   id!: number
    @CreateDateColumn()                                         created_at!: Date
    @Column({ type: "varchar", length: 100 })                   name!: string
    @Column({ type: "text" })                                   description!: string
    @Column({ type: "int", nullable: true })                    expected_minutes?: number | null;


    // --- Relationship 1: Belongs to a Project (Optional container) ---
    @ManyToOne(() => Project, (project) => project.tasks, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project?: Project | null;

    @Column({ type: "int", nullable: true })
    project_id?: number | null;


    
    // --- Relationship 2: Self-Referencing (Sub-tasks) ---
    @ManyToOne(() => Task, (task) => task.subTasks, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parent_task_id' })
    parentTask?: Task | null;

    @Column({ type: "int", nullable: true })
    parent_task_id?: number | null;

    @OneToMany(() => Task, (task) => task.parentTask)
    subTasks!: Task[];
}