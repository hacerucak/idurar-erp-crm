const mongoose = require('mongoose');

const inventoryPrediction = async (req, res) => {
  try {
    const Invoice = mongoose.model('Invoice');

    // Get invoices from the last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const invoices = await Invoice.find({
      created: { $gte: threeMonthsAgo },
      removed: false,
      status: { $nin: ['draft', 'cancelled'] },
    });

    const itemSales = {};

    // Calculate total quantity sold for each item in the last 3 months
    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const itemName = item.itemName;
        if (!itemName) return;
        
        if (!itemSales[itemName]) {
          itemSales[itemName] = { totalSold: 0, firstSold: inv.created };
        }
        itemSales[itemName].totalSold += item.quantity || 1;
        
        // Track the earliest date this item was sold within the window
        if (inv.created < itemSales[itemName].firstSold) {
          itemSales[itemName].firstSold = inv.created;
        }
      });
    });

    const suggestions = [];
    const now = new Date();

    Object.keys(itemSales).forEach((itemName) => {
      const data = itemSales[itemName];
      const daysSinceFirstSold = Math.max(
        (now - new Date(data.firstSold)) / (1000 * 60 * 60 * 24),
        1
      );
      
      // Calculate Daily Run Rate (DRR)
      const dailyRunRate = data.totalSold / daysSinceFirstSold;
      
      // If an item sells more than 1 per day on average, we suggest restocking
      if (dailyRunRate > 0.5 && data.totalSold > 5) {
        const daysRemaining = Math.max(Math.floor(10 / dailyRunRate), 1); // Mock: assuming 10 items left in stock
        suggestions.push({
          itemName,
          dailyRunRate: dailyRunRate.toFixed(2),
          totalSold: data.totalSold,
          suggestion: `⚠️ '${itemName}' stokta azalıyor. ${daysRemaining} gün içinde ürün bitebilir! (Günlük ${dailyRunRate.toFixed(1)} satış)`
        });
      }
    });

    // Sort by highest run rate
    suggestions.sort((a, b) => b.dailyRunRate - a.dailyRunRate);

    // Return top 5 suggestions
    return res.status(200).json({
      success: true,
      result: suggestions.slice(0, 5),
      message: 'Inventory predictions generated'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = inventoryPrediction;
