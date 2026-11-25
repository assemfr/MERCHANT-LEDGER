import type { Activity, Deal, Expense, Product, ShareLink, Shop } from "@/db/schema";

export type ShopView = Omit<Shop, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};
export type ActivityView = Omit<Activity, "createdAt"> & { createdAt: string };
export type ProductView = Omit<Product, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};
export type DealView = Omit<Deal, "createdAt" | "date"> & {
  createdAt: string;
  date: string;
};
export type ExpenseView = Omit<Expense, "createdAt" | "date"> & {
  createdAt: string;
  date: string;
};
export type ShareView = Omit<ShareLink, "createdAt" | "periodStart" | "periodEnd"> & {
  createdAt: string;
  periodStart: string | null;
  periodEnd: string | null;
};

export type DashboardData = {
  user: { id: number; name: string; email: string };
  shop: ShopView;
  activities: ActivityView[];
  products: ProductView[];
  deals: DealView[];
  expenses: ExpenseView[];
  shares: ShareView[];
};
