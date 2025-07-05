import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Order } from "./order.js";
import { Product } from "./product.js";

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  quantity: number;

  @Column("decimal", { scale: 2 })
  price: number;

  @ManyToOne("Order", (order: Order) => order.items)
  order: Order;

  @ManyToOne(() => Product)
  product: Product;
}
