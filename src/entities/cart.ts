import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";
import type { User } from "./user.js";
import type { CartItem } from "./cart-item.js";

@Entity()
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: true })
  userId: number;

  @OneToOne("User", (user: User) => user.cart)
  @JoinColumn({ name: "userId" })
  user: User;

  @OneToMany("CartItem", (cartItem: CartItem) => cartItem.cart, {
    cascade: true,
    eager: true,
  })
  items: CartItem[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
