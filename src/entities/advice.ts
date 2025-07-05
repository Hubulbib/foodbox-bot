import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import type { User } from "./user.js";

@Entity()
export class Advice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne("User", (user: User) => user.advices)
  user: User;

  @Column({ type: "varchar" })
  text: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
