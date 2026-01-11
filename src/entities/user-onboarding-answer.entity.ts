import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class UserOnboardingAnswer {
  @PrimaryGeneratedColumn()
  id: number;
}
