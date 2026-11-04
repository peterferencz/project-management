import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { UserEntity } from "./UserEntity"
import { Project } from "./Project"

@Entity()
export class Task {
    @PrimaryGeneratedColumn()                                   id!: number
    @CreateDateColumn()                                         created_at!: Date
    @Column({ type: "varchar", length: 100 })                   name!: string
    @Column({ type: "text" })                                   description!: string


    // --- Relationship 1: Belongs to a Project (Optional container) ---
    @ManyToOne(() => Project, (project) => project.tasks, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project!: Project;

    @Column({ type: "int"})
    project_id!: number;

    @Column({ type: "date", nullable: true })
    due_date!: Date|null;

    @Column({ type: "datetime", nullable: true })
    completed_at!: Date|null;

    // --- Relationship 2: Self-Referencing (Sub-tasks) ---
    @ManyToOne(() => Task, (task) => task.subTasks, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parent_task_id' })
    parentTask?: Task | null;

    @Column({ type: "int", nullable: true })
    parent_task_id!: number | null;

    @OneToMany(() => Task, (task) => task.parentTask)
    subTasks!: Task[];
}
