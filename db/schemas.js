const { gql } = require('apollo-server');

//Schema
const typeDefs = gql`
  # USER
  type User {
    id: ID
    name: String
    surname: String
    email: String
    created: String
  }

  type Token {
    token: String
  }

  # PRODUCT
  type Product {
    id: ID
    name: String
    exists: Int
    price: Float
    created: String
  }

  type TopSeller {
    total: Float
    user: [User]
  }

  # CLIENT
  type Client {
    id: ID
    name: String
    surname: String
    email: String
    company: String
    phone: String
    created: String
    seller: ID
  }

  type TopClient {
    total: Float
    client: [Client]
  }

  # ORDER
  type Order {
    id: ID
    orders: [OrderGroup]
    total: Float
    client: Client
    seller: ID
    created: String
    state: OrderState
  }

  type OrderGroup {
    id: ID
    quantity: Int
    name: String
    price: Float
  }

  # USER
  input UserInput {
    name: String!
    surname: String!
    email: String!
    password: String!
  }

  input AuthInput {
    email: String!
    password: String!
  }

  # PRODUCT
  input ProductInput {
    name: String!
    exists: Int!
    price: Float!
  }

  # ORDERS
  input ClientInput {
    name: String!
    surname: String!
    email: String!
    company: String!
    phone: String
  }

  # ORDERS
  input OrderProductInput {
    id: ID
    quantity: Int
    name: String
    price: Float
  }

  enum OrderState {
    PENDING
    COMPLETED
    CANCELED
  }

  input OrderInput {
    orders: [OrderProductInput]
    total: Float
    client: ID!
    state: OrderState
  }

  type Query {
    # USER
    getUser: User

    # PRODUCT
    getProducts: [Product]
    getProduct(id: ID!): Product

    # CLIENT
    getClients: [Client]
    getSellerClients: [Client]
    getClient(id: ID!): Client

    # ORDERS
    getOrders: [Order]
    getSellerOrders: [Order]
    getOrder(id: ID!): Order
    getOrdersByState(state: OrderState!): [Order]

    # ADVANCED QUERIES
    getBestClients: [TopClient]
    getBestSellers: [TopSeller]
    getProductsByText(text: String!): [Product]
  }

  type Mutation {
    # USERS
    newUser(input: UserInput): User
    authUser(input: AuthInput): Token

    # PRODUCTS
    newProduct(input: ProductInput): Product
    updateProduct(id: ID!, input: ProductInput): Product
    deleteProduct(id: ID!): String

    # CLIENTS
    newClient(input: ClientInput): Client
    updateClient(id: ID!, input: ClientInput): Client
    deleteClient(id: ID!): String

    # ORDERS
    newOrder(input: OrderInput): Order
    updateOrder(id: ID!, input: OrderInput): Order
    deleteOrder(id: ID!): String
  }
`;

module.exports = typeDefs;
