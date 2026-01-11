import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "onboarding_steps" })
export class OnboardingStepEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "step_order" })
  stepOrder: number;

  @Column({ unique: true })
  key: string;

  @Column()
  label: string;

  @Column()
  type: string;

  @Column({ default: true })
  required: boolean;

  @Column({ type: "jsonb", default: {} })
  options: any;

  @Column({ type: "jsonb", default: {} })
  validation: any;

  @Column({ type: "jsonb", default: [] })
  affects: any;

  @Column({ nullable: true })
  mapping?: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
