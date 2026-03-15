const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const { calculate } = require('@/helpers');
const { increaseBySettingKey } = require('@/middlewares/settings');
const schema = require('./schemaValidate');

const create = async (req, res) => {
  let body = req.body;

  const { error, value } = schema.validate(body);
  if (error) {
    const { details } = error;
    return res.status(400).json({
      success: false,
      result: null,
      message: details[0]?.message,
    });
  }

  const { items = [], taxRate = 0, discount = 0 } = value;

  // default
  let subTotal = 0;
  let taxTotal = 0;
  let total = 0;

  //Calculate the items array with subTotal, total, taxTotal
  items.map((item) => {
    let total = calculate.multiply(item['quantity'], item['price']);
    //sub total
    subTotal = calculate.add(subTotal, total);
    //item total
    item['total'] = total;
  });
  taxTotal = calculate.multiply(subTotal, taxRate / 100);
  total = calculate.add(subTotal, taxTotal);

  body['subTotal'] = subTotal;
  body['taxTotal'] = taxTotal;
  body['total'] = total;
  body['items'] = items;

  let paymentStatus = calculate.sub(total, discount) === 0 ? 'paid' : 'unpaid';

  body['paymentStatus'] = paymentStatus;
  body['createdBy'] = req.admin._id;

  // AI Fraud Detection Logic
  // Check if invoice total is unusually high compared to client history
  const clientInvoices = await Model.find({ client: body['client'], removed: false });
  if (clientInvoices.length > 2) { // Need at least 2 past invoices for history
    const totalHistoryAmount = clientInvoices.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const avgAmount = totalHistoryAmount / clientInvoices.length;
    
    // If the new invoice is 3x larger than the historical average, flag as suspicious
    if (avgAmount > 0 && total > avgAmount * 3) {
      body['isSuspicious'] = true;
      body['fraudRiskScore'] = Math.min(Math.round((total / avgAmount) * 10), 99); // Generates a logic score
    } else {
      body['isSuspicious'] = false;
      body['fraudRiskScore'] = 0;
    }
  }

  // Creating a new document in the collection
  const result = await new Model(body).save();
  const fileId = 'invoice-' + result._id + '.pdf';
  const updateResult = await Model.findOneAndUpdate(
    { _id: result._id },
    { pdf: fileId },
    {
      new: true,
    }
  ).exec();
  // Returning successfull response

  increaseBySettingKey({
    settingKey: 'last_invoice_number',
  });

  await updateClientLeadScore(body['client']);

  // Returning successfull response
  return res.status(200).json({
    success: true,
    result: updateResult,
    message: 'Invoice created successfully',
  });
};

const updateClientLeadScore = async (clientId) => {
  const Client = mongoose.model('Client');
  const client = await Client.findById(clientId);
  if (client) {
    client.interactionsCount = (client.interactionsCount || 0) + 1;
    client.leadScore = Math.min((client.leadScore || 0) + 10, 100); // Add 10 points per invoice
    await client.save();
  }
};

module.exports = create;
