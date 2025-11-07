import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  imageUrl: {
    type: String
  },
  selectedSize: {
    type: String
  },
  selectedColor: {
    type: String
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  orderItems: [orderItemSchema],
  shippingInfo: {
    name: {
      type: String,
      required: [true, 'Name is required']
    },
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    email: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: {
      type: String
    },
    mobile: {
      type: String
    },
    mobileCountryCode: {
      type: String,
      default: '961'
    },
    address: {
      type: String
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String
    },
    zipCode: {
      type: String
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    }
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ['cash', 'card', 'paypal', 'stripe'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    paidAt: Date
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0
  },
  deliveryPrice: {
    type: Number,
    required: true,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'delivered', 'cancelled'],
    default: 'pending'
  },
  isGuestOrder: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

export default Order;

