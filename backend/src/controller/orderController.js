import Order from '../model/Order.js';
import Product from '../model/Product.js';
import User from '../model/User.js';
import UserGuest from '../model/UserGuest.js';
import Settings from '../model/Settings.js';
import { sendOrderConfirmationEmail, sendOrderStatusEmail, sendAdminOrderNotification } from '../services/emailService.js';

// @desc    Create new order (guest or user)
// @route   POST /api/orders
// @access  Public
export const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingInfo,
      paymentInfo,
      itemsPrice,
      deliveryPrice,
      totalPrice
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided'
      });
    }

    // Check if user is authenticated or guest
    const isGuest = !req.user;
    let userId = req.user ? req.user._id : null;

    // For guest users, check if a registered user exists with this email
    if (isGuest && shippingInfo.email) {
      // Normalize email
      const normalizedEmail = shippingInfo.email.toLowerCase().trim();
      
      // First check if a regular user exists with this email
      let existingUser = await User.findOne({ 
        email: normalizedEmail
      });
      
      if (existingUser) {
        // Link order to existing registered user
        userId = existingUser._id;
      } else {
        // Check for existing guest user or create new one in UserGuest collection
        let guestUser = await UserGuest.findOne({ 
          email: normalizedEmail
        });
        
        if (!guestUser) {
          try {
            guestUser = await UserGuest.create({
              name: shippingInfo.name || `${shippingInfo.firstName || ''} ${shippingInfo.lastName || ''}`.trim(),
              email: normalizedEmail,
              phone: shippingInfo.mobile ? `${shippingInfo.mobileCountryCode || '961'}${shippingInfo.mobile}` : shippingInfo.phone,
              address: {
                street: shippingInfo.address,
                city: shippingInfo.city,
                state: shippingInfo.state,
                zipCode: shippingInfo.zipCode,
                country: shippingInfo.country
              }
            });
          } catch (error) {
            // If guest creation fails, try to find existing guest
            guestUser = await UserGuest.findOne({ email: normalizedEmail });
            if (!guestUser) {
              return res.status(400).json({
                success: false,
                message: 'Error creating guest user',
                error: error.message
              });
            }
          }
        }
        // For guest orders, we'll store null in user field and use email to link
        // The order will be linked via shippingInfo.email
        userId = null;
      }
    } else if (!isGuest) {
      // User is authenticated, use their ID
      userId = req.user._id;
    }

    // Verify product stock and validate required variants
    const processedOrderItems = [];
    let totalCost = 0;
    let totalProfit = 0;
    
    for (let item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.name}`
        });
      }

      // Validate required variants - if product has sizes/colors, they must be selected
      if (product.sizes && product.sizes.length > 0 && !item.selectedSize) {
        return res.status(400).json({
          success: false,
          message: `Size is required for product: ${product.name}`
        });
      }

      if (product.colors && product.colors.length > 0 && !item.selectedColor) {
        return res.status(400).json({
          success: false,
          message: `Color is required for product: ${product.name}`
        });
      }

      // Calculate profit for this item
      const itemCostPrice = product.costPrice || 0;
      const itemSellingPrice = item.price;
      const itemProfit = (itemSellingPrice - itemCostPrice) * item.quantity;
      const itemCost = itemCostPrice * item.quantity;
      
      totalCost += itemCost;
      totalProfit += itemProfit;

      processedOrderItems.push({
        ...item,
        costPrice: itemCostPrice,
        profit: itemProfit,
        selectedColor: item.selectedColor || undefined,
        selectedSize: item.selectedSize || undefined
      });
    }

    // Use provided delivery price, or get default from settings if not provided
    let finalDeliveryPrice = deliveryPrice;
    if (finalDeliveryPrice === undefined || finalDeliveryPrice === null) {
      const settings = await Settings.getSettings();
      finalDeliveryPrice = settings.defaultDeliveryPrice || 0;
    }
    // If 0 is explicitly sent, use it (don't override with default)

    // Recalculate total price with delivery
    const finalTotalPrice = itemsPrice + finalDeliveryPrice;

    // Normalize email in shippingInfo for consistency
    const normalizedShippingInfo = {
      ...shippingInfo,
      email: shippingInfo.email ? shippingInfo.email.toLowerCase().trim() : shippingInfo.email
    };

    // Create order with processed order items (includes defaults)
    const order = await Order.create({
      user: userId,
      orderItems: processedOrderItems,
      shippingInfo: normalizedShippingInfo,
      paymentInfo: paymentInfo || {},
      itemsPrice,
      deliveryPrice: finalDeliveryPrice,
      totalPrice: finalTotalPrice,
      totalCost: totalCost,
      totalProfit: totalProfit,
      isGuestOrder: isGuest
    });

    // Update product stock
    for (let item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Populate order with product details for email
    const populatedOrder = await Order.findById(order._id)
      .populate('orderItems.product', 'name price imageUrl');

    // Send order confirmation email to customer
    try {
      await sendOrderConfirmationEmail(populatedOrder);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail order creation if email fails
    }

    // Send order notification email to all admins
    try {
      await sendAdminOrderNotification(populatedOrder);
    } catch (emailError) {
      console.error('Failed to send admin order notification:', emailError);
      // Don't fail order creation if email fails
    }

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    // Get user's email to also find guest orders with matching email
    const userEmail = req.user.email.toLowerCase().trim();
    
    // Find orders by user ID (for logged-in user orders)
    // OR by shipping email matching user's email (for guest orders placed with this email before registration)
    const orders = await Order.find({
      $or: [
        { user: req.user._id },
        { 'shippingInfo.email': userEmail }
      ]
    })
      .populate('orderItems.product', 'name price imageUrl')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('orderItems.product', 'name price')
      .sort('-createdAt');

    const totalAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);
    const totalDeliveryRevenue = orders.reduce((acc, order) => acc + (order.deliveryPrice || 0), 0);

    res.status(200).json({
      success: true,
      data: orders,
      totalOrders: orders.length,
      totalAmount,
      totalDeliveryRevenue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, deliveryPrice } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.orderStatus;
    
    if (orderStatus) {
      order.orderStatus = orderStatus;
      if (orderStatus === 'delivered') {
        order.deliveredAt = Date.now();
      }
    }

    if (paymentStatus) {
      order.paymentInfo.status = paymentStatus;
      if (paymentStatus === 'paid') {
        order.paymentInfo.paidAt = Date.now();
      }
    }

    // Update delivery price if provided
    if (deliveryPrice !== undefined && deliveryPrice !== null) {
      order.deliveryPrice = parseFloat(deliveryPrice);
      // Recalculate total price
      order.totalPrice = order.itemsPrice + order.deliveryPrice;
    }

    await order.save();

    // Send status update email if status changed to processing, delivered, or cancelled
    if (orderStatus && orderStatus !== oldStatus && ['processing', 'delivered', 'cancelled'].includes(orderStatus)) {
      try {
        await sendOrderStatusEmail(order, oldStatus);
      } catch (emailError) {
        console.error('Failed to send order status email:', emailError);
        // Don't fail order update if email fails
      }
    }

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating order',
      error: error.message
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Admin
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
      error: error.message
    });
  }
};

