const { ApolloServer } = require('apollo-server');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'var.env' });
const typeDefs = require('./db/schemas');
const resolvers = require('./db/resolvers');

const connectDB = require('./config/db');
connectDB();

//Servidor
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers['authorization'] || '';
    if (token) {
      try {
        const user = await jwt.verify(
          token.replace('Bearer ', ''),
          process.env.SECRET
        );
        return { user };
      } catch (err) {
        console.log(err);
      }
    }
  },
});

server.listen().then(({ url }) => {
  console.log(`Server in ${url}`);
});
