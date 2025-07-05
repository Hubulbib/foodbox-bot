import { DataSource } from "typeorm";
import { User } from "../entities/user.js";
import { Product } from "../entities/product.js";
import { Category } from "../entities/category.js";
import { Order } from "../entities/order.js";
import { OrderItem } from "../entities/order-item.js";
import { Subscription } from "../entities/subscription.js";
import { Cart } from "../entities/cart.js";
import { CartItem } from "../entities/cart-item.js";
import { Advice } from "../entities/advice.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [
    User,
    Product,
    Category,
    Order,
    OrderItem,
    Subscription,
    Cart,
    CartItem,
    Advice,
  ],
  synchronize: true,
  logging: false,
});

export class DatabaseService {
  private connection: DataSource;

  async initialize() {
    this.connection = await AppDataSource.initialize();

    console.log("Database connected");
  }

  getConnection(): DataSource {
    return this.connection;
  }
}
