const mongoose = require('mongoose');

const salesPrediction = async (req, res) => {
  try {
    const Invoice = mongoose.model('Invoice');

    // Get invoices from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const invoices = await Invoice.find({
      created: { $gte: sixMonthsAgo },
      removed: false,
      status: { $nin: ['draft', 'cancelled'] },
    });

    // Group sales by month
    const monthlySales = {};
    invoices.forEach((inv) => {
      const monthYear = `${inv.created.getFullYear()}-${String(inv.created.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlySales[monthYear]) {
        monthlySales[monthYear] = 0;
      }
      monthlySales[monthYear] += inv.total || 0;
    });

    // Simple Linear Regression (Y = mX + b)
    // X = Month Index (1, 2, 3...)
    // Y = Total Sales Amount
    const months = Object.keys(monthlySales).sort(); // Sort chronologically
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = months.length;

    if (n === 0) {
      return res.status(200).json({
        success: true,
        result: {
          prediction: 0,
          historical: monthlySales,
          trend: 'neutral'
        },
        message: 'No historical data available for prediction'
      });
    }

    months.forEach((month, index) => {
      const x = index + 1;
      const y = monthlySales[month];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
    const b = (sumY - m * sumX) / n || 0;

    // Predict for next month (X = n + 1)
    const nextMonthPrediction = Math.max(m * (n + 1) + b, 0); // No negative prediction

    return res.status(200).json({
      success: true,
      result: {
        prediction: nextMonthPrediction,
        historical: monthlySales,
        trend: m > 0 ? 'up' : m < 0 ? 'down' : 'neutral'
      },
      message: 'Sales prediction generated'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = salesPrediction;
