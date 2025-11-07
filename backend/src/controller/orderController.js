import Order from '../model/Order.js';
import Product from '../model/Product.js';
import User from '../model/User.js';
import Settings from '../model/Settings.js';

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
      // First check if a regular user exists with this email
      let existingUser = await User.findOne({ 
        email: shippingInfo.email,
        isGuest: { $ne: true } 
      });
      
      if (existingUser) {
        // Link order to existing registered user
        userId = existingUser._id;
      } else {
        // Check for existing guest user or create new one
        let guestUser = await User.findOne({ 
          email: shippingInfo.email,
          isGuest: true 
        });
        
        if (!guestUser) {
          try {
            guestUser = await User.create({
              name: shippingInfo.name || `${shippingInfo.firstName || ''} ${shippingInfo.lastName || ''}`.trim(),
              email: shippingInfo.email,
              phone: shippingInfo.mobile ? `${shippingInfo.mobileCountryCode || '961'}${shippingInfo.mobile}` : shippingInfo.phone,
              role: 'guest',
              isGuest: true
            });
          } catch (error) {
            // If user creation fails, try to find existing user
            guestUser = await User.findOne({ email: shippingInfo.email });
            if (!guestUser) {
              return res.status(400).json({
                success: false,
                message: 'Error creating guest user',
                error: error.message
              });
            }
          }
        }
        userId = guestUser._id;
      }
    } else if (!isGuest) {
      // User is authenticated, use their ID
      userId = req.user._id;
    }

    // Verify product stock and validate required variants
    const processedOrderItems = [];
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

      processedOrderItems.push({
        ...item,
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

    // Create order with processed order items (includes defaults)
    const order = await Order.create({
      user: userId,
      orderItems: processedOrderItems,
      shippingInfo,
      paymentInfo: paymentInfo || {},
      itemsPrice,
      deliveryPrice: finalDeliveryPrice,
      totalPrice: finalTotalPrice,
      isGuestOrder: isGuest
    });

    // Update product stock
    for (let item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
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
    const userEmail = req.user.email;
    
    // Find orders by user ID (for logged-in user orders)
    // OR by shipping email matching user's email (for guest orders placed with this email)
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

