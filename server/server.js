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
        orderid: transaction.id,
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

// Endpoint pour gérer la recherche des clients
app.post('/searchCustomer', async (req, res) => {
  try {
    let collection;
    const resultSearch = [];

    // Vérifier les différents critères de recherche fournis dans le corps de la requête
    if (req.body.firstName && req.body.lastName) {
      // Recherche par prénom et nom de famille
      const firstName = req.body.firstName;
      const lastName = req.body.lastName;

      collection = gateway.customer.search((search) => {
        search.firstName().is(firstName);
        search.lastName().is(lastName);
      });
    } else if (req.body.customerId) {
      // Recherche par ID client
      const customerId = req.body.customerId;

      collection = gateway.customer.search((search) => {
        search.id().is(customerId);
      });
    } else if (req.body.email) {
      // Recherche par e-mail client
      const customerEmail = req.body.email;

      console.log(req.body.email)

      collection = gateway.customer.search((search) => {
        search.email().is(customerEmail);
      });
    } else if (req.body.createdAtStartDate && req.body.createdAtEndDate) {
      // Recherche par plage de dates de création
      const createdAtStartDate = req.body.createdAtStartDate;
      const createdAtEndDate = req.body.createdAtEndDate;

      collection = gateway.customer.search((search) => {
        search.createdAt().between(createdAtStartDate, createdAtEndDate);
      });
    } else if (req.body.PMToken) {
      // Recherche par PM Token
      const PMToken = req.body.PMToken;

      collection = gateway.customer.search((search) => {
        search.paymentMethodToken().is(PMToken);
      });
    }

    // Processus des résultats de la recherche
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

    // Envoyer les résultats de la recherche en tant que réponse JSON lorsque la recherche est terminée
    collection.on('end', () => {
      res.json(resultSearch);
    });

    // Reprendre le flux de recherche
    collection.resume();
  } catch (error) {
    // Gérer les erreurs et envoyer une réponse 500 Internal Server Error
    console.error(error);
    res.status(500).json({
      error: 'Internal Server Error'
    });
  }
});

// Endpoint pour trouver un client par ID
app.post('/findCustomer', async (req, res) => {
  try {
    const customerId = req.body.customerId;

    // Vérifier si customerId est présent dans la requête
    if (!customerId) {
      return res.status(400).json({
        error: 'Missing customerId parameter'
      });
    }

    // Utiliser la méthode find pour rechercher le client par ID
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

      // Renvoyer le client trouvé en tant que réponse JSON
      res.json(customer);
    });
  } catch (error) {
    // Gérer les erreurs et envoyer une réponse 500 Internal Server Error
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