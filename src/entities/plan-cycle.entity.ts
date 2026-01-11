import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PlanCycle {
  @PrimaryGeneratedColumn()
  id: number;
}
