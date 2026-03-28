import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'database.sqlite'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
const initDb = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS Users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            passwordHash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT DEFAULT 'staff',
            isActive INTEGER DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS Inventory (
            id TEXT PRIMARY KEY,
            IngredientName TEXT NOT NULL,
            Unit TEXT NOT NULL,
            QuantityAvailable REAL DEFAULT 0,
            LowStockLimit REAL DEFAULT 0,
            LastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
            IsActive INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS Products (
            id TEXT PRIMARY KEY,
            ProductName TEXT NOT NULL,
            SellingPrice REAL NOT NULL,
            Description TEXT,
            IsActive INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS Customers (
            id TEXT PRIMARY KEY,
            CustomerName TEXT NOT NULL,
            PhoneNumber TEXT,
            Email TEXT,
            Address TEXT,
            Notes TEXT,
            CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            IsActive INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS Orders (
            id TEXT PRIMARY KEY,
            CustomerName TEXT,
            CustomerId TEXT,
            OrderDate TEXT,
            BillDate TEXT,
            TotalAmount REAL NOT NULL,
            PaidAmount REAL DEFAULT 0,
            BalanceAmount REAL,
            PaymentType TEXT,
            PaymentStatus TEXT,
            OrderStatus TEXT,
            items TEXT, -- JSON stringified array of items
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
};
initDb();

// Generic helper to generate a random ID matching Firebase length (20 chars)
const generateId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let autoId = '';
    for (let i = 0; i < 20; i++) {
        autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
};

// Password hashing utility
const hashPassword = (password, salt) => {
    return crypto.scryptSync(password, salt, 64).toString('hex');
};
const generateSalt = () => crypto.randomBytes(16).toString('hex');

// Seed default admin if Users table is empty
const seedAdmin = () => {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM Users').get().count;
    if (userCount === 0) {
        const id = generateId();
        const salt = generateSalt();
        const hash = hashPassword('admin123', salt);
        const stmt = db.prepare('INSERT INTO Users (id, username, email, passwordHash, salt, role) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(id, 'Admin', 'admin@example.com', hash, salt, 'admin');
        console.log('Default admin seeded: admin@example.com / admin123');
    }
}
seedAdmin();

// --- AUTH ---
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM Users WHERE email = ? AND isActive = 1').get(email);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const hash = hashPassword(password, user.salt);
    if (hash === user.passwordHash) {
        // Exclude sensitive data
        const { passwordHash, salt, ...userData } = user;
        res.json({ success: true, user: userData });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// --- USERS ---
app.get('/api/users', (req, res) => {
    const users = db.prepare('SELECT id, username, email, role, isActive, createdAt FROM Users WHERE isActive = 1').all();
    res.json(users);
});

app.post('/api/users', (req, res) => {
    const { username, email, password, role } = req.body;
    
    // Check if email exists
    const existing = db.prepare('SELECT id FROM Users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already exists' });
    
    const id = generateId();
    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    
    const stmt = db.prepare('INSERT INTO Users (id, username, email, passwordHash, salt, role) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, username, email, hash, salt, role || 'staff');
    
    res.json({ success: true, id, username, email, role });
});

app.put('/api/users/:id/password', (req, res) => {
    const { newPassword } = req.body;
    const salt = generateSalt();
    const hash = hashPassword(newPassword, salt);
    
    const stmt = db.prepare('UPDATE Users SET passwordHash = ?, salt = ? WHERE id = ?');
    stmt.run(hash, salt, req.params.id);
    
    res.json({ success: true });
});

app.put('/api/users/:id/role', (req, res) => {
    const { role } = req.body;
    const stmt = db.prepare('UPDATE Users SET role = ? WHERE id = ?');
    stmt.run(role, req.params.id);
    res.json({ success: true });
});

app.delete('/api/users/:id', (req, res) => {
    const stmt = db.prepare('UPDATE Users SET isActive = 0 WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
});

// --- CUSTOMERS ---
app.get('/api/customers', (req, res) => {
    const stmt = db.prepare('SELECT * FROM Customers WHERE IsActive = 1');
    const customers = stmt.all();
    // Return id as CustomerId to match original behavior
    res.json(customers.map(c => ({ ...c, CustomerId: c.id, IsActive: Boolean(c.IsActive) })));
});

app.post('/api/customers', (req, res) => {
    const { CustomerName, PhoneNumber, Email, Address, Notes } = req.body;
    const id = generateId();
    const CreatedDate = new Date().toISOString();
    
    const stmt = db.prepare('INSERT INTO Customers (id, CustomerName, PhoneNumber, Email, Address, Notes, CreatedDate, IsActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, CustomerName, PhoneNumber, Email, Address, Notes, CreatedDate, 1);
    
    res.json({ id, CustomerId: id, CustomerName, PhoneNumber, Email, Address, Notes, CreatedDate, IsActive: true });
});

app.put('/api/customers/:id', (req, res) => {
    const { CustomerName, PhoneNumber, Email, Address, Notes, IsActive } = req.body;
    const isActiveInt = IsActive === false ? 0 : 1; // Handle soft delete as well if passed
    const stmt = db.prepare('UPDATE Customers SET CustomerName = ?, PhoneNumber = ?, Email = ?, Address = ?, Notes = ?, IsActive = ? WHERE id = ?');
    stmt.run(CustomerName, PhoneNumber, Email, Address, Notes, isActiveInt, req.params.id);
    res.json({ success: true });
});

// Used for soft deleting customers
app.delete('/api/customers/:id', (req, res) => {
    const stmt = db.prepare('UPDATE Customers SET IsActive = 0 WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
});

// --- INVENTORY ---
app.get('/api/inventory', (req, res) => {
    const stmt = db.prepare('SELECT * FROM Inventory WHERE IsActive = 1');
    const inventory = stmt.all();
    res.json(inventory.map(i => ({ ...i, InventoryId: i.id, IsActive: Boolean(i.IsActive) })));
});

app.post('/api/inventory', (req, res) => {
    const { IngredientName, Unit, QuantityAvailable, LowStockLimit } = req.body;
    const id = generateId();
    const LastUpdated = new Date().toISOString();
    
    const stmt = db.prepare('INSERT INTO Inventory (id, IngredientName, Unit, QuantityAvailable, LowStockLimit, LastUpdated, IsActive) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, IngredientName, Unit, QuantityAvailable || 0, LowStockLimit || 0, LastUpdated, 1);
    
    res.json({ id, InventoryId: id, IngredientName, Unit, QuantityAvailable, LowStockLimit, LastUpdated, IsActive: true });
});

app.put('/api/inventory/:id', (req, res) => {
    const { IngredientName, Unit, LowStockLimit, IsActive } = req.body;
    const isActiveInt = IsActive === false ? 0 : 1;
    const LastUpdated = new Date().toISOString();
    
    const stmt = db.prepare('UPDATE Inventory SET IngredientName = ?, Unit = ?, LowStockLimit = ?, IsActive = ?, LastUpdated = ? WHERE id = ?');
    stmt.run(IngredientName, Unit, LowStockLimit, isActiveInt, LastUpdated, req.params.id);
    res.json({ success: true });
});

app.patch('/api/inventory/:id/stock', (req, res) => {
    const { QuantityAvailable } = req.body;
    const LastUpdated = new Date().toISOString();
    const stmt = db.prepare('UPDATE Inventory SET QuantityAvailable = ?, LastUpdated = ? WHERE id = ?');
    stmt.run(QuantityAvailable, LastUpdated, req.params.id);
    res.json({ success: true });
});

app.delete('/api/inventory/:id', (req, res) => {
    const stmt = db.prepare('UPDATE Inventory SET IsActive = 0 WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
});

// --- PRODUCTS ---
app.get('/api/products', (req, res) => {
    const stmt = db.prepare('SELECT * FROM Products WHERE IsActive = 1');
    const products = stmt.all();
    res.json(products.map(p => ({ 
        ...p, 
        ProductId: p.id, 
        IsActive: Boolean(p.IsActive),
        ingredients: p.ingredients ? JSON.parse(p.ingredients) : [] 
    })));
});

app.post('/api/products', (req, res) => {
    const { ProductName, SellingPrice, Description, ingredients } = req.body;
    const id = generateId();
    
    // Attempt column migration if it doesn't exist
    try { db.exec('ALTER TABLE Products ADD COLUMN ingredients TEXT;'); } catch (e) {}
    
    const stmt = db.prepare('INSERT INTO Products (id, ProductName, SellingPrice, Description, IsActive, ingredients) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, ProductName, SellingPrice, Description, 1, ingredients ? JSON.stringify(ingredients) : '[]');
    
    res.json({ id, ProductId: id, ProductName, SellingPrice, Description, IsActive: true, ingredients: ingredients || [] });
});

app.put('/api/products/:id', (req, res) => {
    const { ProductName, SellingPrice, Description, IsActive, ingredients } = req.body;
    const isActiveInt = IsActive === false ? 0 : 1;
    
    try { db.exec('ALTER TABLE Products ADD COLUMN ingredients TEXT;'); } catch (e) {}

    const stmt = db.prepare('UPDATE Products SET ProductName = ?, SellingPrice = ?, Description = ?, IsActive = ?, ingredients = ? WHERE id = ?');
    stmt.run(ProductName, SellingPrice, Description, isActiveInt, ingredients ? JSON.stringify(ingredients) : '[]', req.params.id);
    res.json({ success: true });
});

app.delete('/api/products/:id', (req, res) => {
    const stmt = db.prepare('UPDATE Products SET IsActive = 0 WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
});

// --- ORDERS ---
app.get('/api/orders', (req, res) => {
    const stmt = db.prepare('SELECT * FROM Orders ORDER BY createdAt DESC');
    const orders = stmt.all();
    res.json(orders.map(o => ({
        ...o,
        OrderId: o.id,
        BillId: o.id,
        items: o.items ? JSON.parse(o.items) : []
    })));
});

app.post('/api/orders', (req, res) => {
    const orderData = req.body;
    
    // Generate Order ID similar to firebase logic: YYYYMMDD + counter
    // For simplicity, we can query the count of orders today
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const countStmt = db.prepare("SELECT COUNT(*) as count FROM Orders WHERE id LIKE ?");
    const todayCount = countStmt.get(`${dateStr}%`).count;
    const id = `${dateStr}${String(todayCount + 1).padStart(2, '0')}`;

    const {
        CustomerName, CustomerId, OrderDate, BillDate,
        TotalAmount, PaidAmount, BalanceAmount,
        PaymentType, PaymentStatus, OrderStatus, items
    } = orderData;

    const createdAt = new Date().toISOString();

    const insertStmt = db.prepare(`
        INSERT INTO Orders (
            id, CustomerName, CustomerId, OrderDate, BillDate,
            TotalAmount, PaidAmount, BalanceAmount, PaymentType,
            PaymentStatus, OrderStatus, items, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
        id, CustomerName, CustomerId, OrderDate, BillDate,
        TotalAmount, PaidAmount, BalanceAmount, PaymentType,
        PaymentStatus, OrderStatus, items ? JSON.stringify(items) : '[]', createdAt
    );

    res.json({ success: true, id });
});

app.patch('/api/orders/:id/status', (req, res) => {
    const { OrderStatus } = req.body;
    const stmt = db.prepare('UPDATE Orders SET OrderStatus = ? WHERE id = ?');
    stmt.run(OrderStatus, req.params.id);
    res.json({ success: true });
});

app.patch('/api/orders/:id/payment', (req, res) => {
    const { PaidAmount, BalanceAmount, PaymentStatus, PaymentType } = req.body;

    const order = db.prepare('SELECT * FROM Orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const pAmount = PaidAmount !== undefined ? PaidAmount : order.PaidAmount;
    const bAmount = BalanceAmount !== undefined ? BalanceAmount : order.BalanceAmount;
    const pStatus = PaymentStatus !== undefined ? PaymentStatus : order.PaymentStatus;
    const pType = PaymentType !== undefined ? PaymentType : order.PaymentType;

    const stmt = db.prepare('UPDATE Orders SET PaidAmount = ?, BalanceAmount = ?, PaymentStatus = ?, PaymentType = ? WHERE id = ?');
    stmt.run(pAmount, bAmount, pStatus, pType, req.params.id);

    res.json({ success: true });
});

app.delete('/api/orders/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM Orders WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
});

// --- CLEAR ALL DATA ---
app.delete('/api/clear-all', (req, res) => {
    try {
        db.exec(`
            DELETE FROM Orders;
            DELETE FROM Products;
            DELETE FROM Inventory;
            DELETE FROM Customers;
        `);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});
