import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class UserSetting {
  @PrimaryGeneratedColumn()
  id: number;
}
