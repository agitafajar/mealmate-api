import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class MealItem {
  @PrimaryGeneratedColumn()
  id: number;
}
