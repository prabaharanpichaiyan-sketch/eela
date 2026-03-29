async function test() {
    try {
        const res = await fetch("https://eela.netlify.app/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                CustomerName: "Test Customer",
                CustomerId: null,
                OrderDate: new Date().toISOString(),
                BillDate: new Date().toISOString(),
                TotalAmount: 15.00,
                PaidAmount: 15.00,
                BalanceAmount: 0.00,
                PaymentType: "Cash",
                PaymentStatus: "Paid",
                OrderStatus: "Completed",
                items: [{ ProductId: "92hxWONQfbG2zvemqwgU", Quantity: 1, Price: 15.00, ProductName: "Test Product" }]
            })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}
test();
