import fs from 'fs/promises';
import path from 'path';
import { Product, Order } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure directory exists
async function ensureDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Generic Read/Write
async function readJson<T>(file: string, defaultValue: T): Promise<T> {
    try {
        await ensureDir();
        const data = await fs.readFile(file, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return default and create it ??
        // Or just return default.
        return defaultValue;
    }
}

async function writeJson(file: string, data: any) {
    await ensureDir();
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
}

// --- Products ---
export async function getProducts(): Promise<Product[]> {
    return readJson<Product[]>(PRODUCTS_FILE, []); // Start empty or seed?
}

export async function saveProduct(product: Product) {
    const products = await getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
        products[index] = product;
    } else {
        products.unshift(product);
    }
    await writeJson(PRODUCTS_FILE, products);
    return product;
}

export async function deleteProduct(id: string) {
    const products = await getProducts();
    const filtered = products.filter(p => p.id !== id);
    await writeJson(PRODUCTS_FILE, filtered);
}

// --- Orders ---
export async function getOrders(): Promise<Order[]> {
    return readJson<Order[]>(ORDERS_FILE, []);
}

export async function getOrder(id: string): Promise<Order | undefined> {
    const orders = await getOrders();
    return orders.find(o => o.id === id);
}

export async function createOrder(order: Order) {
    const orders = await getOrders();
    orders.unshift(order);
    await writeJson(ORDERS_FILE, orders);
    return order;
}

export async function updateOrder(order: Order) {
    const orders = await getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index >= 0) {
        orders[index] = order;
        await writeJson(ORDERS_FILE, orders);
    }
    return order;
}
