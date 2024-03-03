const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

async function collectCustomerInformation(req, res, next) {
  try {
    const name = req.body.name;
    let phoneNumber = req.body.phoneNumber;
    
    if (!name || !phoneNumber) {
      res.status(400).send('Name and phone number are required.');
      return;
    }

    // Remove non-numeric characters from phone number
    phoneNumber = phoneNumber.replace(/\D/g, '');

    if (!validatePhoneNumber(phoneNumber)) {
      res.status(400).send('Invalid phone number format.');
      return;
    }

    req.customerInfo = { name, phoneNumber };
    next();
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
}

function validatePhoneNumber(phoneNumber) {
  return /^\d{10}$/.test(phoneNumber);
}

async function collectOrderDetails(req, res, next) {
  try {
    const orderDetails = [];
    const menuItems = {
      "Dosa": 30.99,
      "Puri": 25.99,
      "Vada": 20.99,
      "Bonda": 40.99
    };

    for (const item in menuItems) {
      const quantity = req.body[item];
      if (quantity && parseInt(quantity) > 0) {
        const totalPrice = parseInt(quantity) * menuItems[item];
        orderDetails.push({ name: item, quantity: parseInt(quantity), totalPrice });
      }
    }
    req.orderDetails = orderDetails;
    next();
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
}

async function main() {
  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient('mongodb://mongodb:27017/sapient', { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db('sapient');

    console.log('Connected to MongoDB');
    

    // Serve HTML page to input customer information and order details
    app.get('/', (req, res) => {
      res.sendFile(__dirname + '/index.html');
    });

    // Handle form submission
    app.post('/submit', collectCustomerInformation, collectOrderDetails, async (req, res) => {
      const customerInfo = req.customerInfo;
      const orderDetails = req.orderDetails;

      try {
        // Ensure the client is connected
        if (!client) {
          throw new Error('MongoClient is not connected');
        }

        // Insert customer data into MongoDB
        const customersCollection = db.collection('customers');
        await customersCollection.insertOne(customerInfo);

        // Insert order details into MongoDB
        const ordersCollection = db.collection('orders');
        await ordersCollection.insertMany(orderDetails);

        // Calculate total price
        const totalPrice = orderDetails.reduce((total, item) => total + item.totalPrice, 0);

        console.log('Customer Details:', customerInfo);
        console.log('Order Details:', orderDetails);
        console.log('Total Price: $' + totalPrice.toFixed(2));

        // Display customer details, order summary, and total price in the browser
        const htmlResponse = `
      <style>
        body {
          font-family: Arial, sans-serif;
          background-image: url('https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?cs=srgb&dl=chairs-coffee-shop-drinking-glasses-67468.jpg&fm=jpg');
          background-size: cover;
          background-position: center;
          color: #333;
          padding: 50px;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .container {
          background-color: rgba(255, 255, 255, 0.8);
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
        .details-container {
          margin-bottom: 50px;
        }
        .details-container h1 {
          margin-bottom: 10px;
        }
        .details-container ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
          text-align: left;
        }
        .details-container li {
          margin-bottom: 5px;
        }
      </style>
      <div class="container">
      <div class="details-container">
        <h1>Customer Details</h1>
        <p>Name: ${customerInfo.name}</p>
        <p>Phone Number: ${customerInfo.phoneNumber}</p>
        </div>
        <div class="details-container">
        <h1>Order Summary</h1>
        <ul>
          ${orderDetails.map(item => `<li>${item.name}: Quantity: ${item.quantity}, Total Price: $${item.totalPrice.toFixed(2)}</li>`).join('')}
        </ul>
        </div>
        <div class=details-container">
        <h1>Total Price</h1>
        <p>$${totalPrice.toFixed(2)}</p>
      </div>
      </div>
    `;

    // Send the HTML response
    res.send(htmlResponse);
        /*res.send(`
          <style>
            body {
              font-family: Arial, sans-serif;
              background-image: url('https://th.bing.com/th/id/R.3beac3abce8f231f5a2603b29b2ecc5e?rik=JQHz5yWhHeq27w&riu=http%3a%2f%2fwww.pixelstalk.net%2fwp-content%2fuploads%2f2016%2f09%2fAll-White-HD-Background.png&ehk=TKbhAk9OTvETmynepNT77P8L5t%2bgd3Y%2fWwEmavOMdAI%3d&risl=&pid=ImgRaw&r=0');
              background-size: cover;
              background-position: center;
              color: #333;
              text-align: center;
              padding: 50px;
            }
            h1, h2 {
              color: #333;
            }
            ul {
              list-style-type: none;
            }
            li {
              margin-bottom: 10px;
            }
          </style>
          <h1>Customer Details</h1>
          <p>Name: ${customerInfo.name}</p>
          <p>Phone Number: ${customerInfo.phoneNumber}</p>
          <h1>Order Summary</h1>
          <ul>
            ${orderDetails.map(item => `<li>${item.name}: Quantity: ${item.quantity}, Total Price: $${item.totalPrice.toFixed(2)}</li>`).join('')}
          </ul>
          <h1>Total Price</h1>
          <p>$${totalPrice.toFixed(2)}</p>
        `);*/

      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error occurred while processing the order. Please try again.');
      }
    });

    // Start the Express server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    if (client) {
      await client.close();
    }
  }
}

// Start the program
main();