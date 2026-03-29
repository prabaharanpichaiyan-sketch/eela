import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
    console.log("Seeding Admin user...");
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync('admin123', salt, 64).toString('hex');

    const { data, error } = await supabase
        .from('users')
        .insert([{
            id: 'admin-' + Math.random().toString(36).substr(2, 9),
            username: 'Admin',
            email: 'admin@example.com',
            passwordhash: hash,
            salt,
            role: 'admin',
            isactive: 1
        }]);

    if (error) {
        console.error("Error seeding admin:", error.message);
    } else {
        console.log("✅ Admin user created successfully!");
        console.log("Email: admin@example.com");
        console.log("Password: admin123");
    }
}

seed();
