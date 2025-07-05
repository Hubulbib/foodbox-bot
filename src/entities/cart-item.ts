import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinColumn,
} from "typeorm";
import { Cart } from "./cart.js";
import { Product } from "./product.js";

@Entity()
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  cartId: number;

  @Column({ type: "int" })
  productId: number;

  @ManyToOne(() => Cart, (cart) => cart.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "cartId" })
  cart: Cart;

  @ManyToOne(() => Product, {
    eager: true,
  })
  @JoinColumn({ name: "productId" })
  product: Product;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
