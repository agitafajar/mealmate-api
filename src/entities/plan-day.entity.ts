import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PlanDay {
  @PrimaryGeneratedColumn()
  id: number;
}
