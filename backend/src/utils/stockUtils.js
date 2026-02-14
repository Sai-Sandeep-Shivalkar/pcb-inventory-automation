function thresholdQuantity(component) {
  return Number(component.monthly_required_quantity) * (Number(component.low_stock_threshold_percent || 20) / 100);
}

function isLowStock(component) {
  return Number(component.current_stock_quantity) < thresholdQuantity(component);
}

module.exports = {
  thresholdQuantity,
  isLowStock,
};
