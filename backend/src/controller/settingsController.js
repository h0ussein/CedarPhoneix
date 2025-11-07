import Settings from '../model/Settings.js';
import Order from '../model/Order.js';

// @desc    Get default delivery price (public)
// @route   GET /api/settings/delivery-price
// @access  Public
export const getDefaultDeliveryPrice = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.status(200).json({
      success: true,
      defaultDeliveryPrice: settings.defaultDeliveryPrice || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery price',
      error: error.message,
      defaultDeliveryPrice: 0
    });
  }
};

// @desc    Get settings
// @route   GET /api/settings
// @access  Admin
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
};

// @desc    Update default delivery price
// @route   PUT /api/settings/delivery-price
// @access  Admin
export const updateDefaultDeliveryPrice = async (req, res) => {
  try {
    const { defaultDeliveryPrice, applyToAllOrders } = req.body;

    if (defaultDeliveryPrice === undefined || defaultDeliveryPrice === null) {
      return res.status(400).json({
        success: false,
        message: 'Default delivery price is required'
      });
    }

    if (isNaN(defaultDeliveryPrice) || defaultDeliveryPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery price'
      });
    }

    const settings = await Settings.getSettings();
    settings.defaultDeliveryPrice = parseFloat(defaultDeliveryPrice);
    await settings.save();

    // If applyToAllOrders is true, update all existing orders
    if (applyToAllOrders) {
      const orders = await Order.find({});
      for (const order of orders) {
        order.deliveryPrice = parseFloat(defaultDeliveryPrice);
        order.totalPrice = order.itemsPrice + order.deliveryPrice;
        await order.save();
      }
    }

    res.status(200).json({
      success: true,
      data: settings,
      message: applyToAllOrders 
        ? 'Default delivery price updated and applied to all orders'
        : 'Default delivery price updated'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating delivery price',
      error: error.message
    });
  }
};

