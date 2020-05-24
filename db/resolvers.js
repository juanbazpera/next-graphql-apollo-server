const User = require('../models/user');
const { AuthenticationError } = require('apollo-server');
const Product = require('../models/product');
const Client = require('../models/client');
const Order = require('../models/order');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'var.env' });

const createToken = (user, secret, expiresIn) => {
  const { id, email, name, surname } = user;
  return jwt.sign({ id, email, name, surname }, secret, { expiresIn });
};

const resolvers = {
  Query: {
    getUser: (_, {}, ctx) => {
      if (!ctx.user) throw AuthenticationError('No autorizado');
      return ctx.user;
    },
    getProducts: async () => {
      try {
        const products = await Product.find({});
        return products;
      } catch (err) {
        console.log(err);
      }
    },
    getProduct: async (_, { id }) => {
      // exist product
      try {
        const product = await Product.findById(id);
        if (!product) return new Error('No existe el producto');
        return product;
      } catch (err) {
        console.log(err);
      }
    },
    getClients: async () => {
      try {
        const clients = await Client.find({});
        return clients;
      } catch (err) {
        console.log(err);
      }
    },
    getSellerClients: async (_, {}, ctx) => {
      if (!ctx || !ctx.user)
        throw new AuthenticationError('No tienes autorizacion');
      const clients = await Client.find({ seller: ctx.user.id.toString() });
      return clients;
    },
    getClient: async (_, { id }, ctx) => {
      if (!ctx || !ctx.user)
        throw new AuthenticationError('No tienes autorizacion');
      const client = await Client.findOne({
        _id: id,
        seller: ctx.user.id.toString(),
      });
      if (!client) return new Error('No existe cliente');
      return client;
    },
    getOrders: async () => {
      try {
        const orders = await Order.find({});
        return orders;
      } catch (err) {
        console.log(err);
      }
    },
    getSellerOrders: async (_, {}, ctx) => {
      if (!ctx.user || !ctx.user) return new Error('No autorizado');
      try {
        console.log();
        const orders = await Order.find({ seller: ctx.user.id }).populate(
          'client'
        );
        console.log(orders);
        return orders;
      } catch (err) {
        console.log(err);
      }
    },
    getOrder: async (_, { id }, ctx) => {
      const order = await Order.findById(id);
      if (!order) return new Error('No existe el pedido');
      if (order.seller != ctx.user.id) return new Error('No autorizado');
      return order;
    },
    getOrdersByState: async (_, { state }, ctx) => {
      if (!ctx.user || !ctx.user.id)
        throw new AuthenticationError('No autorizado');
      const orders = await Order.find({ state, seller: ctx.user.id });
      return orders;
    },
    getBestClients: async () => {
      const clients = await Order.aggregate([
        { $match: { state: 'COMPLETED' } },
        {
          $group: {
            _id: '$client',
            total: { $sum: '$total' },
          },
        },
        {
          $lookup: {
            from: 'clients',
            localField: '_id',
            foreignField: '_id',
            as: 'client',
          },
        },
        {
          $limit: 10,
        },
        {
          $sort: {
            total: -1,
          },
        },
      ]);
      return clients;
    },
    getBestSellers: async () => {
      const sellers = await Order.aggregate([
        { $match: { state: 'COMPLETED' } },
        {
          $group: {
            _id: '$seller',
            total: { $sum: '$total' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $limit: 3,
        },
        {
          $sort: {
            total: -1,
          },
        },
      ]);
      return sellers;
    },
    getProductsByText: async (_, { text }) => {
      const products = await Product.find({
        $text: {
          $search: text,
        },
      });
      return products;
    },
  },

  Mutation: {
    newUser: async (_, { input }) => {
      const { email, password } = input;
      // if user register
      const exist = await User.findOne({ email });
      if (exist) return new Error('El usuario ya esta registrado');

      // hash password
      const salt = await bcryptjs.genSalt(10);

      input.password = await bcryptjs.hash(password, salt);
      // save
      try {
        const user = new User(input);
        user.save();
        return user;
      } catch (err) {
        console.log(err);
      }
    },
    authUser: async (_, { input }) => {
      const { email, password } = input;
      // if exist user
      const user = await User.findOne({ email });
      if (!user) throw new Error('Usuario no existe');

      // is correct password
      const correctPassword = await bcryptjs.compare(password, user.password);
      if (!correctPassword) throw new Error('Password incorrecto');

      return {
        token: createToken(user, process.env.SECRET, 36000),
      };
    },
    newProduct: async (_, { input }) => {
      try {
        const product = new Product(input);
        const res = await product.save();
        return res;
      } catch (err) {
        console.log(err);
      }
    },
    updateProduct: async (_, { id, input }) => {
      try {
        // exist product
        let product = Product.findById(id);
        if (!product) return new Error('No existe el producto');

        // update product
        product = await Product.findOneAndUpdate({ _id: id }, input, {
          new: true,
        });
        return product;
      } catch (err) {
        console.log(err);
      }
    },
    deleteProduct: async (_, { id }) => {
      try {
        let product = await Product.findById(id);
        if (!product) return new Error('No existe el producto');

        await Product.findOneAndDelete({ _id: id });
        return 'Producto eliminado';
      } catch (err) {
        console.log(err);
      }
    },
    newClient: async (_, { input }, ctx) => {
      if (!ctx || !ctx.user)
        throw new AuthenticationError('No tienes autorizacion');
      // is client register
      let client = await Client.findOne({ email: input.email });
      if (client) return new Error('Ya existe cliente registrado');

      // asign to seller
      input.seller = ctx.user.id;

      client = new Client(input);
      const res = await client.save();
      return res;
    },
    updateClient: async (_, { id, input }, ctx) => {
      try {
        let client = await Client.findOne({ _id: id, seller: ctx.user.id });
        if (!client) return new Error('No existe cliente');
        client = await Client.findOneAndUpdate({ _id: id }, input, {
          new: true,
        });
        return client;
      } catch (err) {
        console.log(err);
      }
    },
    deleteClient: async (_, { id }, ctx) => {
      try {
        let client = await Client.findOne({ _id: id, seller: ctx.user.id });
        if (!client) return new Error('No existe cliente');
        await Client.findOneAndDelete({ _id: id });
        return `Se elimino '${client.name}' correctamente`;
      } catch (err) {
        console.log(err);
      }
    },
    newOrder: async (_, { input }, ctx) => {
      try {
        // exist client?
        const client = await Client.findOne({ _id: input.client });
        if (!client) return new Error('No existe cliente');
        // is seller client?
        if (
          !ctx.user ||
          !ctx.user.id ||
          client.seller.toString() !== ctx.user.id
        )
          throw new AuthenticationError('No autorizado');

        // has stock?
        for await (const order of input.orders) {
          const { id, quantity } = order;
          const product = await Product.findById(id);
          if (order.quantity > product.exists) {
            throw new Error(
              `El articulo '${product.name}' excede la cantidad disponible`
            );
          } else {
            product.exists -= quantity;
            await product.save();
          }
        }
        const newOrder = new Order(input);
        newOrder.seller = ctx.user.id;
        const result = await newOrder.save();
        return result;
      } catch (err) {
        console.log(err);
      }
    },
    updateOrder: async (_, { id, input }, ctx) => {
      // exist order?
      const orderDb = await Order.findById(id);
      if (!orderDb) return new Error('No existe pedido');

      // exist client?
      const client = await Client.findById(input.client);
      if (!client) return new Error('El cliente no existe');

      // is seller's client?
      if (!ctx.user || !ctx.user.id || client.seller != ctx.user.id)
        throw new AuthenticationError('No autorizado');

      let i = 0;
      // has stock?
      if (input.orders) {
        for await (const order of input.orders) {
          const { id, quantity } = order;
          const product = await Product.findById(id);
          if (quantity - orderDb.orders[i].quantity > product.exists) {
            return new Error(
              `El articulo '${product.name}' excede la cantidad disponible`
            );
          } else {
            product.exists =
              product.exists - (quantity - orderDb.orders[i].quantity);
            await product.save();
          }
          i++;
        }
      }
      const result = await Order.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return result;
    },
    deleteOrder: async (_, { id }, ctx) => {
      const order = await Order.findById(id);
      if (!order) return new Error('No existe el pedido');
      if (!ctx.user || !ctx.user.id || order.seller != ctx.user.id)
        throw new AuthenticationError('No autorizado');
      await Order.findOneAndDelete({ _id: id });
      return 'Orden eliminada';
    },
  },
};

module.exports = resolvers;
