import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("WARNING: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder');

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

// --- HEALTH CHECK / PING ---
app.get('/api/ping', (req, res) => {
    res.json({ success: true, message: 'Serverless API is running!', timestamp: new Date().toISOString() });
});

// --- AUTH ---
app.post('/api/auth/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('isactive', 1)
        .maybeSingle();
    
    if (error || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
        const hash = hashPassword(password, user.salt);
        if (hash === user.passwordhash) {
            // Exclude sensitive data
            const { passwordhash, salt, ...userData } = user;
            res.json({ success: true, user: userData });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        next(err);
    }
});


// --- USERS ---
app.get('/api/users', async (req, res) => {
    const { data: users, error } = await supabase
        .from('users')
        .select('id, username, email, role, isactive, createdat')
        .eq('isactive', 1);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(users);
});

app.post('/api/users', async (req, res) => {
    const { username, email, password, role } = req.body;
    
    // Check if email exists
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (existing) return res.status(400).json({ error: 'Email already exists' });
    
    const id = generateId();
    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    
    const { error } = await supabase
        .from('users')
        .insert([{
            id,
            username,
            email,
            passwordhash: hash,
            salt,
            role: role || 'staff'
        }]);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, id, username, email, role });
});

app.put('/api/users/:id/password', async (req, res) => {
    const { newPassword } = req.body;
    const salt = generateSalt();
    const hash = hashPassword(newPassword, salt);
    
    const { error } = await supabase
        .from('users')
        .update({ passwordhash: hash, salt })
        .eq('id', req.params.id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.put('/api/users/:id/role', async (req, res) => {
    const { role } = req.body;
    const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.delete('/api/users/:id', async (req, res) => {
    const { error } = await supabase
        .from('users')
        .update({ isactive: 0 })
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// --- CUSTOMERS ---
app.get('/api/customers', async (req, res) => {
    const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('isactive', 1);
    
    if (error) return res.status(500).json({ error: error.message });
    
    res.json(customers.map(c => ({ 
        ...c, 
        CustomerId: c.id, 
        IsActive: Boolean(c.isactive),
        CustomerName: c.customername,
        PhoneNumber: c.phonenumber,
        CreatedDate: c.createddate
    })));
});

app.post('/api/customers', async (req, res) => {
    const { CustomerName, PhoneNumber, Email, Address, Notes } = req.body;
    const id = generateId();
    
    const { error } = await supabase
        .from('customers')
        .insert([{
            id,
            customername: CustomerName,
            phonenumber: PhoneNumber,
            email: Email,
            address: Address,
            notes: Notes,
            isactive: 1
        }]);
    
    if (error) return res.status(500).json({ error: error.message });
    
    res.json({ 
        id, 
        CustomerId: id, 
        CustomerName, 
        PhoneNumber, 
        Email, 
        Address, 
        Notes, 
        IsActive: true 
    });
});

app.put('/api/customers/:id', async (req, res) => {
    const { CustomerName, PhoneNumber, Email, Address, Notes, IsActive } = req.body;
    const isActiveInt = IsActive === false ? 0 : 1;
    
    const { error } = await supabase
        .from('customers')
        .update({
            customername: CustomerName,
            phonenumber: PhoneNumber,
            email: Email,
            address: Address,
            notes: Notes,
            isactive: isActiveInt
        })
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.delete('/api/customers/:id', async (req, res) => {
    const { error } = await supabase
        .from('customers')
        .update({ isactive: 0 })
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// --- INVENTORY ---
app.get('/api/inventory', async (req, res) => {
    const { data: inventory, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('isactive', 1);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(inventory.map(i => ({ 
        ...i, 
        InventoryId: i.id, 
        IsActive: Boolean(i.isactive),
        IngredientName: i.ingredientname,
        QuantityAvailable: i.quantityavailable,
        LowStockLimit: i.lowstocklimit,
        CostPerUnit: i.costperunit || 0,
        LastUpdated: i.lastupdated
    })));
});

app.post('/api/inventory', async (req, res) => {
    const { IngredientName, Unit, QuantityAvailable, LowStockLimit, CostPerUnit } = req.body;
    const id = generateId();
    
    const { error } = await supabase
        .from('inventory')
        .insert([{
            id,
            ingredientname: IngredientName,
            unit: Unit,
            quantityavailable: QuantityAvailable || 0,
            lowstocklimit: LowStockLimit || 0,
            costperunit: CostPerUnit || 0,
            isactive: 1
        }]);
    
    if (error) return res.status(500).json({ error: error.message });
    
    res.json({ 
        id, 
        InventoryId: id, 
        IngredientName, 
        Unit, 
        QuantityAvailable, 
        LowStockLimit, 
        CostPerUnit: CostPerUnit || 0,
        IsActive: true 
    });
});

app.put('/api/inventory/:id', async (req, res) => {
    const { IngredientName, Unit, LowStockLimit, CostPerUnit, IsActive } = req.body;
    const isActiveInt = IsActive === false ? 0 : 1;
    const lastupdated = new Date().toISOString();
    
    const { error } = await supabase
        .from('inventory')
        .update({
            ingredientname: IngredientName,
            unit: Unit,
            lowstocklimit: LowStockLimit,
            costperunit: CostPerUnit,
            isactive: isActiveInt,
            lastupdated
        })
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.patch('/api/inventory/:id/stock', async (req, res) => {
    const { QuantityAvailable } = req.body;
    const lastupdated = new Date().toISOString();
    
    const { error } = await supabase
        .from('inventory')
        .update({
            quantityavailable: QuantityAvailable,
            lastupdated
        })
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.delete('/api/inventory/:id', async (req, res) => {
    const { error } = await supabase
        .from('inventory')
        .update({ isactive: 0 })
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// --- PRODUCTS ---
app.get('/api/products', async (req, res) => {
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('isactive', 1);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(products.map(p => ({ 
        ...p, 
        ProductId: p.id, 
        IsActive: Boolean(p.isactive),
        ProductName: p.productname,
        SellingPrice: p.sellingprice,
        ingredients: p.ingredients ? JSON.parse(p.ingredients) : [],
        image: p.image || null
    })));
});

app.post('/api/products', async (req, res) => {
    const { ProductName, SellingPrice, Description, ingredients, image } = req.body;
    const id = generateId();
    
    const { error } = await supabase
        .from('products')
        .insert([{
            id,
            productname: ProductName,
            sellingprice: SellingPrice,
            description: Description,
            isactive: 1,
            ingredients: ingredients ? JSON.stringify(ingredients) : '[]',
            image: image || null
        }]);
    
    if (error) return res.status(500).json({ error: error.message });
    
    res.json({ 
        id, 
        ProductId: id, 
        ProductName, 
        SellingPrice, 
        Description, 
        IsActive: true, 
        ingredients: ingredients || [], 
        image: image || null 
    });
});

app.put('/api/products/:id', async (req, res) => {
    const { ProductName, SellingPrice, Description, IsActive, ingredients, image } = req.body;
    const isActiveInt = IsActive === false ? 0 : 1;

    const updateData = {
        productname: ProductName,
        sellingprice: SellingPrice,
        description: Description,
        isactive: isActiveInt,
        ingredients: ingredients ? JSON.stringify(ingredients) : '[]'
    };
    if (image !== undefined) updateData.image = image || null;

    const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.patch('/api/products/:id/image', async (req, res) => {
    const { image } = req.body;
    const { error } = await supabase
        .from('products')
        .update({ image: image || null })
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.delete('/api/products/:id', async (req, res) => {
    const { error } = await supabase
        .from('products')
        .update({ isactive: 0 })
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// --- ORDERS ---
app.get('/api/orders', async (req, res) => {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('createdat', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(orders.map(o => ({
        ...o,
        OrderId: o.id,
        BillId: o.id,
        CustomerName: o.customername,
        CustomerId: o.customerid,
        OrderDate: o.orderdate,
        BillDate: o.billdate,
        TotalAmount: o.totalamount,
        PaidAmount: o.paidamount,
        BalanceAmount: o.balanceamount,
        PaymentType: o.paymenttype,
        PaymentStatus: o.paymentstatus,
        OrderStatus: o.orderstatus,
        items: o.items ? JSON.parse(o.items) : []
    })));
});

app.post('/api/orders', async (req, res) => {
    const orderData = req.body;
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .ilike('id', `${dateStr}%`);
    
    const id = `${dateStr}${String((count || 0) + 1).padStart(2, '0')}`;

    const {
        CustomerName, CustomerId, OrderDate, BillDate,
        TotalAmount, PaidAmount, BalanceAmount,
        PaymentType, PaymentStatus, OrderStatus, items
    } = orderData;

    const { error } = await supabase
        .from('orders')
        .insert([{
            id,
            customername: CustomerName,
            customerid: CustomerId,
            orderdate: OrderDate,
            billdate: BillDate,
            totalamount: TotalAmount,
            paidamount: PaidAmount || 0,
            balanceamount: BalanceAmount,
            paymenttype: PaymentType,
            paymentstatus: PaymentStatus,
            orderstatus: OrderStatus,
            items: items ? JSON.stringify(items) : '[]'
        }]);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, id });
});

app.patch('/api/orders/:id/status', async (req, res) => {
    const { OrderStatus } = req.body;
    const { error } = await supabase
        .from('orders')
        .update({ orderstatus: OrderStatus })
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.patch('/api/orders/:id/payment', async (req, res) => {
    const { PaidAmount, BalanceAmount, PaymentStatus, PaymentType } = req.body;

    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', req.params.id)
        .maybeSingle();
    
    if (fetchError || !order) return res.status(404).json({ error: "Order not found" });

    const updateData = {
        paidamount: PaidAmount !== undefined ? PaidAmount : order.paidamount,
        balanceamount: BalanceAmount !== undefined ? BalanceAmount : order.balanceamount,
        paymentstatus: PaymentStatus !== undefined ? PaymentStatus : order.paymentstatus,
        paymenttype: PaymentType !== undefined ? PaymentType : order.paymenttype
    };

    const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', req.params.id);

    if (updateError) return res.status(500).json({ error: updateError.message });
    res.json({ success: true });
});

app.delete('/api/orders/:id', async (req, res) => {
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// --- CLEAR ALL DATA ---
app.delete('/api/clear-all', async (req, res) => {
    try {
        await supabase.from('orders').delete().neq('id', '0');
        await supabase.from('products').delete().neq('id', '0');
        await supabase.from('inventory').delete().neq('id', '0');
        await supabase.from('customers').delete().neq('id', '0');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware to prevent 502 Gateway crashes
app.use((err, req, res, next) => {
    console.error("Unhandled API Error:", err);
    res.status(500).json({ 
        error: 'Internal Server Error', 
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined 
    });
});

const PORT = process.env.PORT || 3000;
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
    app.listen(PORT, () => {
        console.log(`API server running on port ${PORT} (Local Mode)`);
    });
}

export default app;
