import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Category } from "./category.js";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar" })
  description: string;

  @Column({ type: "decimal", scale: 2 })
  price: number;

  @Column({ type: "decimal", scale: 2 })
  subscriptionPrice: number;

  @Column({ type: "varchar" })
  imageUrl: string;

  @Column({ type: "bool", default: true })
  available: boolean;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
  })
  category: Category;
}
