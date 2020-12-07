const { ApolloServer, gql } = require("apollo-server");

const movies = [
  {
    id: "1",
    title: "5 Deadly Venoms",
    releaseDate: "10-10-1983",
    rating: 5,
  },
  {
    id: "2",
    title: "36th Chamber",
    releaseDate: "10-12-1983",
    rating: 3,
    actor: [{ id: "2321", name: "Gordon Liu" }],
  },
];

const typeDefs = gql`
  enum Status {
    WATCHED
    INTERESTED
    NOT_INTERESTED
    UNKNOWN
  }

  type Actor {
    id: ID!
    name: String
  }

  type Movie {
    id: ID!
    title: String!
    releaseDate: String!
    rating: Int
    status: Status
    actor: [Actor] # valid: null, [], [...someData]
    # actor: [Actor]! # Valid: [], [...someData]
    # actor: [Actor!]! # valid [...someData]
    # fake: Float
    # isFake: Boolean
  }

  type Query {
    movies: [Movie]
    movie(id: ID): Movie
  }
`;

const resolvers = {
  Query: {
    movies: () => {
      return movies;
    },
    movie: (obj, { id }, context, info) => {
      return movies.find((movie) => movie.id === id);
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`Server started at ${url}`);
});
