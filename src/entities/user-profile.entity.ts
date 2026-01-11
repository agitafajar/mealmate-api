import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";

@Entity()
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id" })
  userId: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  age: number;

  @Column({ type: "float", nullable: true })
  height: number;

  @Column({ type: "float", nullable: true })
  weight: number;

  @Column({ name: "activity_level", nullable: true })
  activityLevel: string;

  @Column({ nullable: true })
  goal: string;

  @Column({ type: "json", nullable: true })
  preferences: Record<string, any>;

  @Column({ name: "is_shift_worker", nullable: true })
  isShiftWorker: boolean;

  @Column({ name: "work_start_time", nullable: true })
  workStartTime: string;

  @Column({ name: "work_end_time", nullable: true })
  workEndTime: string;

  @Column({ name: "workout_time", nullable: true })
  workoutTime: string;

  @Column({ name: "has_office_catering", nullable: true })
  hasOfficeCatering: boolean;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: "user_id" })
  user: UserEntity;
}
