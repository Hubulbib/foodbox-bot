import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
} from "typeorm";
import { Order } from "./order.js";
import { Subscription } from "./subscription.js";
import { Cart } from "./cart.js";
import { Advice } from "./advice.js";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "bigint", unique: true })
  telegramId: string;

  @Column({ type: "varchar", nullable: true })
  name: string;

  @Column({ type: "varchar", nullable: true })
  phone: string;

  @Column({ type: "varchar", nullable: true })
  address: string;

  @OneToMany("Order", (order: Order) => order.user)
  orders: Order[];

  @OneToMany("Subscription", (subscription: Subscription) => subscription.user)
  subscription: Subscription[];

  @OneToOne(() => Cart, (cart) => cart.user)
  cart: Cart;

  @OneToMany(() => Advice, (advice) => advice.user)
  advices: Advice[];
}
