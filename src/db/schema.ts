import { relations } from 'drizzle-orm';
import { doublePrecision, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('user'),
  likedItems: text('likedItems').array(),
  cartItems: text('cartItems').array(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const shops = pgTable('shops', {
  id: text('id').primaryKey(),
  ownerId: text('ownerId').references(() => users.id).notNull(),
  ownerName: text('ownerName'),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone'),
  category: text('category'),
  gstNumber: text('gstNumber'),
  bankInfo: text('bankInfo'),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  image: text('image'),
  openingTime: text('openingTime'),
  closingTime: text('closingTime'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const items = pgTable('items', {
  id: text('id').primaryKey(),
  shopId: text('shopId').references(() => shops.id).notNull(),
  name: text('name').notNull(),
  price: text('price').notNull(),
  originalPrice: text('originalPrice'),
  discount: text('discount'),
  image: text('image').notNull(),
  tag: text('tag'),
  category: text('category'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});
