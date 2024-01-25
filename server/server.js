import "dotenv/config";
import express from "express";
import path from "path";

import braintree from "braintree";

const app = express();

// static file
app.use(express.static("client"));

// analyse POST params sent in JSON
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join("views"));

const {
  BRAINTREE_MERCHANT_ID,
  BRAINTREE_API_KEY,
  BRAINTREE_API_SECRET,
  BRAINTREE_CURRENCY,
  PORT
} = process.env;

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: BRAINTREE_MERCHANT_ID,
  publicKey: BRAINTREE_API_KEY,
  privateKey: BRAINTREE_API_SECRET
});


// Helper function to map a single status string to a Braintree status field
function mapStatusField(status) {
  switch (status) {
    case "GATEWAY_REJECTED":
      return braintree.Transaction.Status.GatewayRejected;
    case "SETTLED":
      return braintree.Transaction.Status.Settled;
    default:
      throw new Error(`Invalid status: ${status}`);
  }
}

// Helper function to map an array of status strings to an array of Braintree status fields
function mapStatusFields(statusArray) {
  return statusArray.map(mapStatusField);
}

// Method to refund a transaction based on ID
app.post("/refundTransaction", async (req, res) => {
  try {
    console.log(req.body);
    // const transactionAmount = req.body.amountToRefund;
    const transactionId = req.body.transactionId;
    const amount = req.body.amount;

    // Use the gateway.transaction.refund method with or without the amount
    const result = await gateway.transaction.refund(transactionId, amount);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle POST request for searching transactions
app.post("/searchTransaction", async (req, res) => {
  try {
    let collection;
    const resultSearch = [];

    // Check various search criteria provided in the request body
    if (req.body.amountMax && req.body.amountMin) {
      // Search by transaction amount range
      const amountMax = req.body.amountMax;
      const amountMin = req.body.amountMin;

      collection = gateway.transaction.search((search) => {
        search.amount().between(amountMin, amountMax);
      });
    } else if (req.body.statusIs) {
      // Search by transaction status
      const status = req.body.statusIs;
      const statusField = mapStatusField(status);

      collection = gateway.transaction.search((search) => {
        search.status().is(statusField);
      });
    } else if (req.body.amountMaxSA && req.body.amountMinSA && req.body.statusSA) {
      // Search by transaction amount range and status
      const amountMaxSA = req.body.amountMaxSA;
      const amountMinSA = req.body.amountMinSA;
      const statusSA = req.body.statusSA;
      const statusFields = mapStatusFields([statusSA]);

      collection = gateway.transaction.search((search) => {
        search.amount().between(amountMinSA, amountMaxSA);
        search.status().in(statusFields);
      });
    } else if (req.body.from && req.body.to) {
      // Search by transaction creation date range
      const from = req.body.from;
      const to = req.body.to;

      collection = gateway.transaction.search((search) => {
        search.createdAt().between(from, to);
      });
    }

    // Process search results
    collection.on("data", (transaction) => {
      resultSearch.push({
        id: transaction.id,
        orderid: transaction.orderId,
        type: transaction.type,
        date: transaction.createdAt,
        status: transaction.status,
        amount: transaction.amount,
        customer: transaction.customer,
        paymentInstrumentType: transaction.paymentInstrumentType,
        link: `https://sandbox.braintreegateway.com/merchants/${BRAINTREE_MERCHANT_ID}/transactions/${transaction.id}`
      });
    });

    // Send the search results as a JSON response when the search is complete
    collection.on("end", () => {
      res.json(resultSearch);
    });

    // Resume the search stream
    collection.resume();
  } catch (error) {
    // Handle errors and send a 500 Internal Server Error response
    console.error(error);
    res.status(500).json({
      error: 'Internal Server Error'
    });
  }
});

// Endpoint to manage the search for customers
app.post('/searchCustomer', async (req, res) => {
  try {
    let collection;
    const resultSearch = [];

    // Verify the search criteria provided in the request body
    if (req.body.firstName && req.body.lastName) {
      // Search by first name and last name
      const firstName = req.body.firstName;
      const lastName = req.body.lastName;

      collection = gateway.customer.search((search) => {
        search.firstName().is(firstName);
        search.lastName().is(lastName);
      });
    } else if (req.body.customerId) {
      // Search by customer ID
      const customerId = req.body.customerId;

      collection = gateway.customer.search((search) => {
        search.id().is(customerId);
      });
    } else if (req.body.email) {
      // Search by email
      const customerEmail = req.body.email;

      console.log(req.body.email)

      collection = gateway.customer.search((search) => {
        search.email().is(customerEmail);
      });
    } else if (req.body.createdAtStartDate && req.body.createdAtEndDate) {
      // Search by creation date
      const createdAtStartDate = req.body.createdAtStartDate;
      const createdAtEndDate = req.body.createdAtEndDate;

      collection = gateway.customer.search((search) => {
        search.createdAt().between(createdAtStartDate, createdAtEndDate);
      });
    } else if (req.body.PMToken) {
      // Search by payment method token
      const PMToken = req.body.PMToken;

      collection = gateway.customer.search((search) => {
        search.paymentMethodToken().is(PMToken);
      });
    }

    // Processus of the search results
    collection.on('data', (customer) => {
      resultSearch.push({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        createdAt: customer.createdAt,
        email: customer.email,
        phone: customer.phone,
        link: `https://sandbox.braintreegateway.com/merchants/${BRAINTREE_MERCHANT_ID}/customers/${customer.id}`
      });
    });

    // Send the search results as a JSON response when the search is complete
    collection.on('end', () => {
      res.json(resultSearch);
    });

    // Resume the search stream
    collection.resume();
  } catch (error) {
    // Handle errors and send a 500 Internal Server Error response
    console.error(error);
    res.status(500).json({
      error: 'Internal Server Error'
    });
  }
});


app.post('/searchDispute', async (req, res) => {
  try {
    let collection;
    const resultSearch = [];

    // Verify the search criteria provided in the request body
    if (req.body.createdAtStartDate && req.body.createdAtEndDate) {
      // Search by creation date
      const createdAtStartDate = req.body.createdAtStartDate;
      const createdAtEndDate = req.body.createdAtEndDate;

      collection = gateway.dispute.search((search) => {
        search.receivedDate().between(createdAtStartDate, createdAtEndDate);
      });
    }

    // Processus of the search results
    collection.on('data', (dispute) => {
      resultSearch.push({
        id: dispute.id,
        receivedDate: dispute.receivedDate,
        status: dispute.status,
        reason: dispute.reason,
        createdAt: dispute.createdAt,
        link: `https://sandbox.braintreegateway.com/merchants/${BRAINTREE_MERCHANT_ID}/disputes/${dispute.id}`
      });
    });

    // Send the search results as a JSON response when the search is complete
    collection.on('end', () => {
      res.json(resultSearch);
    });

    // Resume the search stream
    collection.resume();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Internal Server Error'
    });
  }
});

// Endpoint to find a customer by ID
app.post('/findCustomer', async (req, res) => {
  try {
    const customerId = req.body.customerId;
    // Verify that customerId is provided in the request
    if (!customerId) {
      return res.status(400).json({
        error: 'Missing customerId parameter'
      });
    }

    // Use the gateway.customer.find method
    gateway.customer.find(customerId, (err, customer) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          error: 'Internal Server Error'
        });
      }

      if (!customer) {
        return res.status(404).json({
          error: 'Customer not found'
        });
      }

      // Send back the customer as a JSON response
      res.json(customer);
    });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({
      error: 'Internal Server Error'
    });
  }
});

app.post('/findDispute', async (req, res) => {
  try {
    const disputeId = req.body.disputeId;
    // Verify that disputeId is provided in the request
    if (!disputeId) {
      return res.status(400).json({
        error: 'Missing disputeId parameter'
      });
    }

    // Use the gateway.customer.find method
    gateway.dispute.find(disputeId, (err, dispute) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          error: 'Internal Server Error'
        });
      }

      if (!dispute) {
        return res.status(404).json({
          error: 'dispute not found'
        });
      }

      res.json(dispute);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Internal Server Error'
    });
  }
});


app.get("/transaction", async (req, res) => {
  res.render('template', {
    body: 'transaction',
    currency: BRAINTREE_CURRENCY,
    MID: BRAINTREE_MERCHANT_ID,
  });
});

app.get("/dispute", async (req, res) => {
  res.render('template', {
    body: 'dispute',
    currency: BRAINTREE_CURRENCY,
    MID: BRAINTREE_MERCHANT_ID,
  });
});

app.get("/customer", async (req, res) => {
  res.render('template', {
    body: 'customer',
    currency: BRAINTREE_CURRENCY,
    MID: BRAINTREE_MERCHANT_ID,
  });
});

app.get("/", async (req, res) => {
  res.render('template', {
    body: 'index',
  });
});

app.listen(PORT, () => {
  console.log(`Node server listening at http://localhost:${PORT}/`);
});