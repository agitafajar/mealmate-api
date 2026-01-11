import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class MealSlot {
  @PrimaryGeneratedColumn()
  id: number;
}
