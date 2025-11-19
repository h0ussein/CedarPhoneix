import mongoose from 'mongoose';

const inventoryPurchaseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Purchase amount is required'],
    min: [0, 'Cannot be negative'],
  },
  date: {
    type: Date,
    default: Date.now
  },
  supplier: {
    type: String,
    default: ''
  },
  note: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const InventoryPurchase = mongoose.model('InventoryPurchase', inventoryPurchaseSchema);
export default InventoryPurchase;
