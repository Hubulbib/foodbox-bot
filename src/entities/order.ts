import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.js";
import { OrderItem } from "./order-item.js";

export enum OrderStatus {
  PROCESSING = "Обработка",
  ACCEPTED = "Принят",
  ASSEMBLING = "Сборка",
  TRANSFERRED_TO_COURIER = "Передан курьеру",
  IN_TRANSIT = "В пути",
  DELIVERED = "Доставлен",
  CANCELED = "Отменен",
}

export const ORDER_STATUS_EMOJI = {
  [OrderStatus.PROCESSING]: "🛠️",
  [OrderStatus.ACCEPTED]: "✅",
  [OrderStatus.ASSEMBLING]: "📦",
  [OrderStatus.TRANSFERRED_TO_COURIER]: "🚚",
  [OrderStatus.IN_TRANSIT]: "🚴",
  [OrderStatus.DELIVERED]: "✅",
  [OrderStatus.CANCELED]: "❌",
};

export enum PayType {
  CASH = "Наличные",
  ONLINE = "Онлайн",
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar" })
  orderNumber: string;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PROCESSING,
  })
  status: OrderStatus;

  @Column("decimal", { scale: 2 })
  totalAmount: number;

  @Column({ type: "varchar" })
  deliveryAddress: string;

  @Column({ type: "varchar" })
  residentialComplex: string;

  @Column({ type: "varchar" })
  customerPhone: string;

  @Column({ type: "varchar" })
  customerName: string;

  @Column({ nullable: true, type: "varchar" })
  paymentId: string;

  @Column({
    type: "enum",
    enum: PayType,
    default: PayType.CASH,
  })
  payType: PayType;

  @ManyToOne("User", (user: User) => user.orders)
  user: User;

  @OneToMany("OrderItem", (item: OrderItem) => item.order)
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
