const mongose = require('mongoose');
require('dotenv').config({ path: 'var.env' });

const connectDB = async () => {
  try {
    await mongose.connect(process.env.DB_MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
    console.log('DB Connected');
  } catch (err) {
    console.log('error');
    console.log(err);
    process.exit(1);
  }
};

module.exports = connectDB;
