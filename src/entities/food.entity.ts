import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Food {
  @PrimaryGeneratedColumn()
  id: number;
}
