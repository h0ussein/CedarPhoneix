import Order from '../model/Order.js';
import Product from '../model/Product.js';
import InventoryPurchase from '../model/InventoryPurchase.js';

// Helper function to calculate stats for a date range
const calculateStatsForPeriod = (orders) => {
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const totalCost = orders.reduce((sum, order) => sum + (order.totalCost || 0), 0);
  const totalProfit = orders.reduce((sum, order) => sum + (order.totalProfit || 0), 0);
  const totalOrders = orders.length;
  const totalItemsSold = orders.reduce((sum, order) => 
    sum + (order.orderItems || []).reduce((itemSum, item) => itemSum + (item.quantity || 0), 0), 0
  );
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0;

  // Get top selling products by profit
  const productProfitMap = {};
  orders.forEach(order => {
    if (order.orderItems && Array.isArray(order.orderItems)) {
      order.orderItems.forEach(item => {
        if (item && item.name) {
          const productId = item.product?._id?.toString() || item.product?.toString() || 'unknown';
          if (!productProfitMap[productId]) {
            productProfitMap[productId] = {
              productId,
              productName: item.name,
              quantity: 0,
              revenue: 0,
              cost: 0,
              profit: 0
            };
          }
          productProfitMap[productId].quantity += item.quantity || 0;
          productProfitMap[productId].revenue += (item.price || 0) * (item.quantity || 0);
          productProfitMap[productId].cost += (item.costPrice || 0) * (item.quantity || 0);
          productProfitMap[productId].profit += item.profit || 0;
        }
      });
    }
  });

  const topProducts = Object.values(productProfitMap)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    profitMargin: parseFloat(profitMargin),
    totalOrders,
    totalItemsSold,
    topProducts
  };
};

// @desc    Get profit statistics
// @route   GET /api/profit/stats
// @access  Admin
export const getProfitStats = async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;
    
    // Build date filter
    let dateFilter = {};
    
    // Handle predefined periods
    const now = new Date();
    if (period === 'lastWeek') {
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      dateFilter.createdAt = { $gte: lastWeek };
    } else if (period === 'lastMonth') {
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      dateFilter.createdAt = { $gte: lastMonth };
    } else if (period === 'lastYear') {
      const lastYear = new Date(now);
      lastYear.setFullYear(now.getFullYear() - 1);
      dateFilter.createdAt = { $gte: lastYear };
    } else if (period === 'allTime') {
      // No date filter - get all orders
      dateFilter = {};
    } else if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get all orders with profit data
    const orders = await Order.find(dateFilter)
      .populate('orderItems.product', 'name costPrice')
      .sort('-createdAt');

    // Calculate statistics for the selected period
    const currentPeriodStats = calculateStatsForPeriod(orders);

    // Calculate statistics for different time periods
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 7);
    const lastWeekOrders = await Order.find({ createdAt: { $gte: lastWeekStart } })
      .populate('orderItems.product', 'name costPrice');
    const lastWeekStats = calculateStatsForPeriod(lastWeekOrders);

    const lastMonthStart = new Date(now);
    lastMonthStart.setMonth(now.getMonth() - 1);
    const lastMonthOrders = await Order.find({ createdAt: { $gte: lastMonthStart } })
      .populate('orderItems.product', 'name costPrice');
    const lastMonthStats = calculateStatsForPeriod(lastMonthOrders);

    const lastYearStart = new Date(now);
    lastYearStart.setFullYear(now.getFullYear() - 1);
    const lastYearOrders = await Order.find({ createdAt: { $gte: lastYearStart } })
      .populate('orderItems.product', 'name costPrice');
    const lastYearStats = calculateStatsForPeriod(lastYearOrders);

    // All time stats
    const allTimeOrders = await Order.find()
      .populate('orderItems.product', 'name costPrice');
    const allTimeStats = calculateStatsForPeriod(allTimeOrders);

    // Get inventory purchases for the selected period
    let purchaseFilter = {};
    if (period === 'lastWeek') {
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      purchaseFilter.date = { $gte: lastWeek };
    } else if (period === 'lastMonth') {
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      purchaseFilter.date = { $gte: lastMonth };
    } else if (period === 'lastYear') {
      const lastYear = new Date(now);
      lastYear.setFullYear(now.getFullYear() - 1);
      purchaseFilter.date = { $gte: lastYear };
    } else if (startDate || endDate) {
      purchaseFilter.date = {};
      if (startDate) purchaseFilter.date.$gte = new Date(startDate);
      if (endDate) purchaseFilter.date.$lte = new Date(endDate);
    }

    const inventoryPurchases = await InventoryPurchase.find(purchaseFilter).sort('-date');
    const totalInventoryPurchases = inventoryPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const netProfit = currentPeriodStats.totalProfit - totalInventoryPurchases;

    res.status(200).json({
      success: true,
      data: {
        // Current period stats (based on filter)
        ...currentPeriodStats,
        totalInventoryPurchases,
        netProfit,
        // Time period breakdowns
        periods: {
          lastWeek: lastWeekStats,
          lastMonth: lastMonthStats,
          lastYear: lastYearStats,
          allTime: allTimeStats
        },
        orders: orders.map(order => ({
          _id: order._id,
          orderId: String(order._id).slice(-6).toUpperCase(),
          createdAt: order.createdAt,
          totalPrice: order.totalPrice,
          totalCost: order.totalCost || 0,
          totalProfit: order.totalProfit || 0,
          orderStatus: order.orderStatus,
          customerName: order.shippingInfo?.name || 'Guest',
          itemsCount: (order.orderItems || []).length
        }))
      }
    });
  } catch (error) {
    console.error('Error in getProfitStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profit statistics',
      error: error.message
    });
  }
};

// @desc    Get products with cost prices
// @route   GET /api/profit/products
// @access  Admin
export const getProductsWithCost = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .select('name price costPrice stock category imageUrl')
      .sort('name');

    res.status(200).json({
      success: true,
      data: products.map(product => ({
        _id: product._id,
        name: product.name,
        sellingPrice: product.price,
        costPrice: product.costPrice || 0,
        profit: product.price - (product.costPrice || 0),
        profitMargin: product.price > 0 
          ? (((product.price - (product.costPrice || 0)) / product.price) * 100).toFixed(2)
          : 0,
        stock: product.stock,
        category: product.category,
        imageUrl: product.imageUrl
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Update product cost price
// @route   PUT /api/profit/products/:id/cost
// @access  Admin
export const updateProductCostPrice = async (req, res) => {
  try {
    const { costPrice } = req.body;

    if (costPrice === undefined || costPrice === null) {
      return res.status(400).json({
        success: false,
        message: 'Cost price is required'
      });
    }

    if (isNaN(costPrice) || costPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cost price'
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { costPrice: parseFloat(costPrice) },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: 'Cost price updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating cost price',
      error: error.message
    });
  }
};

// @desc    Bulk update product cost prices
// @route   PUT /api/profit/products/bulk-cost
// @access  Admin
export const bulkUpdateCostPrices = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { productId, costPrice }

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Updates must be an array'
      });
    }

    const updatePromises = updates.map(async ({ productId, costPrice }) => {
      if (isNaN(costPrice) || costPrice < 0) {
        return { productId, success: false, error: 'Invalid cost price' };
      }

      try {
        const product = await Product.findByIdAndUpdate(
          productId,
          { costPrice: parseFloat(costPrice) },
          { new: true, runValidators: true }
        );

        if (!product) {
          return { productId, success: false, error: 'Product not found' };
        }

        return { productId, success: true, product };
      } catch (error) {
        return { productId, success: false, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.status(200).json({
      success: true,
      message: `Updated ${successful.length} products${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      data: {
        successful: successful.length,
        failed: failed.length,
        results
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error bulk updating cost prices',
      error: error.message
    });
  }
};

