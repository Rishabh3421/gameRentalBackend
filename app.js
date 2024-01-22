// app.js
const express = require("express");
const bodyParser = require("body-parser");
const User = require("./models/Users");
const Product = require("./models/Product");
const Cart = require("./models/Cart");
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'test' ? 6000 : 3000);

app.use(bodyParser.json());

// viNS9nb0gHx16k6D

const { MONGO_USERNAME, MONGO_PASSWORD, MONGO_CLUSTER_URL, MONGO_DB_NAME } = process.env;

// Construct the connection string
const connectionString = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_CLUSTER_URL}/${MONGO_DB_NAME}?retryWrites=true&w=majority`;

// Connect to MongoDB Atlas
mongoose.connect(connectionString, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
})
.then(() => {
  console.log("MongoDB connected successfully");
})
.catch((error) => {
  console.error("MongoDB connection error:", error);
});

// Home page
app.get("/", (req, res) => {
  res.send("Welcome to the Game Rental API!");
});

// Registration endpoint
app.post("/register", async (req, res) => {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    contactNumber,
    userType,
  } = req.body;

  try {
    // Validate required fields
    if (
      !username ||
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !contactNumber ||
      !userType
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Validate user type for sellers
    if (userType === "Seller" && !email.endsWith("@admin.com")) {
      return res
        .status(400)
        .json({
          message:
            "Sellers can only register with an admin domain email address",
        });
    }

    // Create a new user
    const newUser = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      contactNumber,
      userType,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    res.status(200).json({
      userId: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      // Omitting password here
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      contactNumber: savedUser.contactNumber,
      userType: savedUser.userType,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ message: "Please provide both username and password" });
    }

    // Find the user by username
    const user = await User.findOne({ username });

    // Check if the user exists and the password matches
    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid Login Credentials" });
    }

    // Respond with success data
    res.status(200).json({ userId: user._id, message: "Login Successful" });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Fetch all products endpoint
app.get("/products", async (req, res) => {
  try {
    // Query all products from the database
    const products = await Product.find({}, {
      _id: 1,
      title: 1,
      thumbnailURL: 1,
      sellerUsername: 1,
      unitsAvailable: 1,
      productType: 1,
      rentalPricePerWeek: 1,
      rentalPricePerMonth: 1,
    });
  
    // Respond with the array of products
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Homepage API to fetch all products
app.get("/homepage", async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await Product.find({}, {
      _id: 1,
      title: 1,
      thumbnailURL: 1,
      sellerUsername: 1,
      unitsAvailable: 1,
      productType: 1,
      rentalPricePerWeek: 1,
      rentalPricePerMonth: 1,
    });

    // Respond with the array of products
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Product Details API
app.get("/product/:productId", async (req, res) => {
  const productId = req.params.productId;

  try {
    // Fetch the product details based on productId
    const product = await Product.findById(productId);

    // Check if the product with the given ID exists
    if (!product) {
      return res.status(404).json({ message: "Product Not Found" });
    }

    // Respond with the details of the product
    res.status(200).json({
      productID: product._id,
      title: product.title,
      thumbnailURL: product.thumbnailURL,
      sellerUsername: product.sellerUsername,
      unitsAvailable: product.unitsAvailable,
      productType: product.productType,
      productImages: product.productImages || [],
      rentalPricePerWeek: product.rentalPricePerWeek,
      rentalPricePerMonth: product.rentalPricePerMonth,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Save/Remove from Wishlist API
app.put("/wishlist", async (req, res) => {
  const { userID, productID } = req.body;

  try {
    // Find the user by userID
    let user = await User.findById(userID);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    // Initialize wishlist array if it's undefined
    if (!user.wishlist) {
      user.wishlist = [];
    }

    // Check if the productID is in the user's wishlist
    const index = user.wishlist.indexOf(productID);

    if (index === -1) {
      // Product is not in the wishlist, add it
      user.wishlist.push(productID);
    } else {
      // Product is in the wishlist, remove it
      user.wishlist.splice(index, 1);
    }

    // Save the updated user with the modified wishlist
    await user.save();

    // Fetch the details of products in the wishlist
    const wishlistProducts = await Product.find({ _id: { $in: user.wishlist } });

    // Respond with the products in the wishlist
    const responseProducts = wishlistProducts.map(product => ({
      productID: product._id,
      title: product.title,
      thumbnailURL: product.thumbnailURL,
      sellerUsername: product.sellerUsername,
      unitsAvailable: product.unitsAvailable,
      productType: product.productType,
      rentalStartingFromPrice: product.rentalPricePerWeek,
    }));

    res.status(200).json(responseProducts);
  } catch (error) {
    console.error("Error saving/removing from wishlist:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Endpoint to add/remove products from the cart
app.put("/cart", async (req, res) => {
  const { userID, productID, count, bookingStartDate, bookingEndDate } = req.body;

  try {
    // Validate required fields
    if (!userID || !productID || !count) {
      return res.status(400).json({ message: "Please provide userID, productID, and count" });
    }

    // Retrieve the user from the database
    const user = await User.findById(userID);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize user.cart as an empty array if it's undefined
    user.cart = user.cart || [];

    // Check if the product is already in the user's cart
    const cartItemIndex = user.cart.findIndex(item => item.productID.toString() === productID);

    if (cartItemIndex !== -1) {
      // If the product is in the cart, update the count and booking dates
      user.cart[cartItemIndex].count = count;
      user.cart[cartItemIndex].bookingStartDate = bookingStartDate;
      user.cart[cartItemIndex].bookingEndDate = bookingEndDate;
    } else {
      // If the product is not in the cart, add it
      user.cart.push({
        productID,
        count,
        bookingStartDate,
        bookingEndDate,
      });
    }

    // Save the updated user data to the database
    await user.save();

    // Respond with the updated cart
    res.status(200).json(user.cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Place Order API
app.post("/placeOrder", async (req, res) => {
  const { userID } = req.body;

  try {
    // Validate required fields
    if (!userID) {
      return res.status(400).json({ message: "Please provide userID" });
    }

    // Retrieve the user from the database
    const user = await User.findById(userID);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    // Check if the user has any products in the cart
    if (!user.cart.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Array to store the products ordered
    const orderedProducts = [];

    // Iterate through products in the user's cart
    for (const cartItem of user.cart) {
      const { productID, count, bookingStartDate, bookingEndDate } = cartItem;

      // Retrieve the product from the database
      const product = await Product.findById(productID);

      // Check if the product exists
      if (!product) {
        return res.status(404).json({ message: "Product Not Found" });
      }

      // Check if there are enough units available for the order
      if (count > product.unitsAvailable) {
        return res.status(400).json({ message: `Not enough units available for ${product.title}` });
      }

      // Calculate rentedAtPrice based on the current rental price of the product
      const rentedAtPrice = count * product.rentalPricePerWeek;

      // Update unitsAvailable for the product
      product.unitsAvailable -= count;

      // Save the updated product data to the database
      await product.save();

      // Add the ordered product details to the array
      orderedProducts.push({
        productID: product._id,
        title: product.title,
        thumbnailURL: product.thumbnailURL,
        sellerUsername: product.sellerUsername,
        unitsAvailable: product.unitsAvailable,
        productType: product.productType,
        bookingStartDate,
        bookingEndDate,
        rentedAtPrice,
      });
    }

    // Empty the user's cart after placing the order
    user.cart = [];

    // Save the updated user data to the database
    await user.save();

    // Respond with the array of ordered products
    res.status(200).json(orderedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// View User Details API -> localhost:3000/user/john_doe (exapmle url)
app.get("/user/:username", async (req, res) => {
  const username = req.params.username;

  try {
    // Fetch user details based on the username
    const user = await User.findOne({ username });

    // Check if the user with the given username exists
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    // Respond with user details
    res.status(200).json({
      userID: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      userType: user.userType,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Search user Details
app.put("/user/:username", async (req, res) => {
  try {
    const data = JSON.parse(req.body);  // Assuming body-parser middleware is used
    // Process the data
  } catch (error) {
    console.error("JSON Parsing Error:", error);
    res.status(400).json({ message: "Invalid JSON format" });
  }
});

// Update User Details API -> http://localhost:3000/user/:username (example url)
app.put("/user/:username", async (req, res) => {
  const username = req.params.username;
  const { firstName, lastName, email, contactNumber, userType } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ username });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    // Update user details
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.contactNumber = contactNumber || user.contactNumber;
    user.userType = userType || user.userType;

    // Save the updated user
    await user.save();

    // Respond with the updated user details
    res.status(200).json({
      userID: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      userType: user.userType,
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// ********************* Seller Functionalities ************************

// Create Product API
app.post("/products", async (req, res) => {
  const {
    title,
    thumbnailURL,
    sellerUsername,
    unitsAvailable,
    productType,
    rentalPricePerWeek,
    rentalPricePerMonth,
    productImages, // Added this line to extract productImages from req.body
  } = req.body;

  try {
    // Validate required fields
    if (!title || !thumbnailURL || !sellerUsername || !unitsAvailable || !productType || !rentalPricePerWeek || !rentalPricePerMonth) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Create a new product
    const newProduct = new Product({
      title,
      thumbnailURL,
      sellerUsername,
      unitsAvailable,
      productType,
      productImages: productImages || [],
      rentalPricePerWeek,
      rentalPricePerMonth,
    });

    // Save the product to the database
    const savedProduct = await newProduct.save();

    // Respond with the created product
    res.status(200).json(savedProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update Product API
app.put("/products/:productID", async (req, res) => {
  const productID = req.params.productID;
  const {
    title,
    thumbnailURL,
    sellerUsername,
    unitsAvailable,
    productType,
    productImages,
    rentalPricePerWeek,
    rentalPricePerMonth,
  } = req.body;

  try {
    // Validate required fields
    if (!title || !thumbnailURL || !sellerUsername || !unitsAvailable || !productType || !rentalPricePerWeek || !rentalPricePerMonth) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Find and update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      productID,
      {
        title,
        thumbnailURL,
        sellerUsername,
        unitsAvailable,
        productType,
        productImages: productImages || [],
        rentalPricePerWeek,
        rentalPricePerMonth,
      },
      { new: true } // Return the updated document
    );

    // Check if the product with the given ID exists
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product Not Found" });
    }

    // Respond with the updated product
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
