export function calculateInventoryValue(
  products: any[],
  warehouseStocks: any[],
  companyId: string
) {
  const companyProducts = products.filter(
    (product) =>
      String(product.companyId) === String(companyId) &&
      product.trackInventory !== false
  );

  const companyStocks = warehouseStocks.filter(
    (stock) =>
      String(stock.companyId) === String(companyId)
  );

  const details = companyProducts.map((product) => {
    const stocks = companyStocks.filter(
      (stock) => String(stock.productId) === String(product.id)
    );

    const quantity = stocks.reduce(
      (total, stock) => total + Number(stock.quantity || 0),
      0
    );

    const purchasePrice = Number(product.purchasePrice || 0);

    return {
      productId: product.id,
      productName: product.name,
      quantity,
      purchasePrice,
      inventoryValue: quantity * purchasePrice,
    };
  });

  return {
    totalQuantity: details.reduce(
      (total, item) => total + item.quantity,
      0
    ),

    totalValue: details.reduce(
      (total, item) => total + item.inventoryValue,
      0
    ),

    details,
  };
}