import InventoryPurchase from '../model/InventoryPurchase.js';

// List purchases, optionally filtered by date
export const getPurchases = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const purchases = await InventoryPurchase.find(filter).sort('-date');
    const total = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    res.status(200).json({ success: true, data: purchases, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not fetch purchases', error: error.message });
  }
};

// Add a purchase
export const createPurchase = async (req, res) => {
  try {
    const { amount, date, supplier, note } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount required' });
    }
    const purchase = await InventoryPurchase.create({ amount, date, supplier, note });
    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Could not add purchase', error: error.message });
  }
};

// Delete a purchase by ID
export const deletePurchase = async (req, res) => {
  try {
    const deleted = await InventoryPurchase.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not delete purchase', error: error.message });
  }
};

// Update a purchase (optional)
export const updatePurchase = async (req, res) => {
  try {
    const { amount, date, supplier, note } = req.body;
    const updated = await InventoryPurchase.findByIdAndUpdate(
      req.params.id,
      { $set: { amount, date, supplier, note } },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not update purchase', error: error.message });
  }
};
