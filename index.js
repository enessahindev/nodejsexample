const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");

app.use(express.json());
app.use(cors());

// Image Data Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

//mongoDBConnection
const uri = "YOUR_MONGODB_CONNECTION_URL";

//mongoose Use
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connection successful!"))
  .catch((err) => console.log("Wrong: " + err.message));

//User Collection
const userSchema = new mongoose.Schema({
  _id: String,
  name: String,
  lastName: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});
const User = mongoose.model("User", userSchema);
//Register
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;

  let user = new User({
    _id: uuidv4(),
    email: email,
    password: password,
  });

  await user.save();

  res.json({
    message: "Your registration has been successfully completed!",
  });
});
//Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await User.find({ email: email, password: password }); // Querying user information
    if (users.length == 0) {
      res
        .status(500)
        .json({ message: "User e-mail address or password is incorrect!" });
    } else {
      const payload = {
        id: users[0]._id,
        name: users[0].name,
        email: users[0].email,
      };
      const secretKey = "Secret Key";

      const options = {
        expiresIn: "1h",
      };
      const token = jwt.sign(payload, secretKey, options);

      res.json({ accesToken: token });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Product Collection
const productSchema = new mongoose.Schema({
  _id: String,
  name: String,
  price: Number,
  image: String,
});
const Product = mongoose.model("Product", productSchema);

//Product List with Pagination
app.post("/api/products", async (req, res) => {
  try {
    const { pageNumber, pageSize } = req.body;

    const products = await Product.find({})
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    const productsCount = await Product.find({}).count();
    let model = {
      data: products,
      pageNumber: pageNumber,
      pageSize: pageSize,
      totalPageCount: Math.ceil(productsCount / pageSize),
      isFirstPage: pageNumber == 1 ? true : false,
      isLastPage:
        pageNumber == Math.ceil(productsCount / pageSize) ? true : false,
    };
    res.json({ data: model });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Product Add
app.post("/api/product/add", upload.single("image"), async (req, res) => {
  try {
    const { name, price } = req.body;
    const product = new Product({
      _id: uuidv4(),
      name: name,
      price: price,
      image: req.file.path,
    });
    await product.save();
    res.json({ message: "The product has been successfully added!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Mail Gönderme
app.get("/api/mail/send", function (req, res) {
  try {
    const transporter = nodemailer.getTransporter({
      host: "smpt.gmail.com",
      port: 587,
      secure: true,
      html: true,
      auth: {
        user: "your mail",
        pass: "your password",
      },
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: "mail@from",
      to: "mail@to",
      subject: "Application Launched!",
      text: "Application Launched!",
    };

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log(err);
      } else {
        console.log("Email sent successfully!");
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//uygulama çalıştırma kodu
app.listen(5000, () => console.log("Application is Online..."));
