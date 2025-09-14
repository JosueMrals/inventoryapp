import Dexie, { Table } from "dexie";
import { Product } from "@/types";

export interface PendingOperation {
  id?: number;
  type: "add" | "update" | "delete";
  product: Product;
}

export class OfflineDB extends Dexie {
  products!: Table<Product, number>;
  pendingOps!: Table<PendingOperation, number>;

  constructor() {
    super("OfflineInventoryDB");

    this.version(1).stores({
      products: "++id,name,price,barcode",
      pendingOps: "++id,type"
    });
  }
}

export const db = new OfflineDB();
