import React, { useState } from 'react';
import { InventoryProvider } from './contexts/InventoryContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { OrdersProvider } from './contexts/OrdersContext';
import { CustomersProvider } from './contexts/CustomersContext';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Billing from './pages/Billing';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import CustomerLedger from './pages/CustomerLedger';
import CustomerOrderHistory from './pages/CustomerOrderHistory';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';


function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'inventory': return <Inventory />;
            case 'products': return <Products />;
            case 'billing': return <Billing />;
            case 'orders': return <Orders />;
            case 'customers': return <Customers />;
            case 'ledger': return <CustomerLedger />;
            case 'history': return <CustomerOrderHistory />;
            case 'reports': return <Reports />;
            default: return <Dashboard />;
        }
    };

    if (!isAuthenticated) {
        return <Login onLogin={() => setIsAuthenticated(true)} />;
    }

    return (
        <InventoryProvider>
            <ProductsProvider>
                <CustomersProvider>
                    <OrdersProvider>
                        <div className="app-container">
                        <Sidebar 
                            activeTab={activeTab} 
                            setActiveTab={setActiveTab} 
                            onLogout={() => setIsAuthenticated(false)} 
                        />
                        <main className="content-area">
                            {renderContent()}
                        </main>
                    </div>
                    </OrdersProvider>
                </CustomersProvider>
            </ProductsProvider>
        </InventoryProvider>
    );
}

export default App;
