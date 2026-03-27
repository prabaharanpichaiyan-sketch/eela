-- Database Schema for Home Baking Manager

-- 1. Inventory Table
CREATE TABLE Inventory (
    InventoryId INT PRIMARY KEY IDENTITY(1,1),
    IngredientName NVARCHAR(100) NOT NULL,
    Unit NVARCHAR(20) NOT NULL, -- 'g', 'ml', 'pcs'
    QuantityAvailable DECIMAL(10, 2) DEFAULT 0,
    LowStockLimit DECIMAL(10, 2) DEFAULT 0,
    LastUpdated DATETIME DEFAULT GETDATE()
);

-- 2. Products Table
CREATE TABLE Products (
    ProductId INT PRIMARY KEY IDENTITY(1,1),
    ProductName NVARCHAR(100) NOT NULL,
    SellingPrice DECIMAL(10, 2) NOT NULL,
    Description NVARCHAR(MAX),
    IsActive BIT DEFAULT 1
);

-- 3. ProductIngredients (Mapping Table)
CREATE TABLE ProductIngredients (
    MappingId INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    InventoryId INT NOT NULL,
    QuantityRequired DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (ProductId) REFERENCES Products(ProductId),
    FOREIGN KEY (InventoryId) REFERENCES Inventory(InventoryId)
);

-- 4. Customers Table
CREATE TABLE Customers (
    CustomerId INT PRIMARY KEY IDENTITY(1,1),
    CustomerName NVARCHAR(100) NOT NULL,
    PhoneNumber NVARCHAR(20),
    Email NVARCHAR(100),
    Address NVARCHAR(MAX),
    Notes NVARCHAR(MAX),
    CreatedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

-- 5. Billing Table
CREATE TABLE Billing (
    BillId INT PRIMARY KEY IDENTITY(1,1),
    CustomerId INT, -- Foreign Key to Customers
    CustomerName NVARCHAR(100), -- Denormalized for snapshotted name or walk-ins without ID? Or remove? Let's keep for flexibility but add FK.
    BillDate DATETIME DEFAULT GETDATE(),
    TotalAmount DECIMAL(10, 2) NOT NULL,
    PaymentStatus NVARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Paid', 'Partial', 'Cancelled'
    PaymentType NVARCHAR(50), -- 'Cash', 'UPI', 'BankTransfer'
    PaidAmount DECIMAL(10, 2) DEFAULT 0,
    BalanceAmount AS (TotalAmount - PaidAmount), -- Computed Column
    FOREIGN KEY (CustomerId) REFERENCES Customers(CustomerId)
);

-- 5. BillingItems Table
CREATE TABLE BillingItems (
    BillingItemId INT PRIMARY KEY IDENTITY(1,1),
    BillId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    Price DECIMAL(10, 2) NOT NULL, -- Snapshot of price at time of billing
    FOREIGN KEY (BillId) REFERENCES Billing(BillId),
    FOREIGN KEY (ProductId) REFERENCES Products(ProductId)
);
