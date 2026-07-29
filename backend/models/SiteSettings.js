const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  logoUrl:     { type: String, default: null },
  publicId:    { type: String, default: null },
  pageContent: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true, strict: false });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);