import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./user.js";

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "timestamp" })
  startDate: Date;

  @Column({ type: "timestamp" })
  endDate: Date;

  @Column({ type: "bool" })
  isActive: boolean;

  @Column({ type: "int" })
  userId: number;

  @ManyToOne(() => User, (user: User) => user.subscription)
  @JoinColumn({ name: "userId" })
  user: User;
}
