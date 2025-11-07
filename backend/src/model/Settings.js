import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  defaultDeliveryPrice: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({ defaultDeliveryPrice: 0 });
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;

