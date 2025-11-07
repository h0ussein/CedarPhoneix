/**
 * Calculate the final price after discount
 * @param {number} originalPrice - The original price of the product
 * @param {number} discountPercent - The discount percentage (0-100)
 * @returns {number} - The final price after discount
 */
export const calculateDiscountedPrice = (originalPrice, discountPercent = 0) => {
  if (!discountPercent || discountPercent <= 0) {
    return originalPrice
  }
  const discount = (originalPrice * discountPercent) / 100
  return Math.max(0, originalPrice - discount)
}

/**
 * Get the effective price to use (discounted price if discount exists, otherwise original)
 * @param {object} product - The product object
 * @returns {number} - The effective price to use
 */
export const getEffectivePrice = (product) => {
  if (!product) return 0
  const discountPercent = product.discountPercent || 0
  return calculateDiscountedPrice(product.price, discountPercent)
}

/**
 * Check if a product has a discount
 * @param {object} product - The product object
 * @returns {boolean} - True if product has discount
 */
export const hasDiscount = (product) => {
  return product && product.discountPercent && product.discountPercent > 0
}

