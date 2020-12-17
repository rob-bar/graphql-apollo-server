const { ApolloServer, gql, PubSub } = require("apollo-server");
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const mongoose = require("mongoose");
const { Schema } = mongoose;

mongoose.connect(
  "mongodb+srv://robbie:mongo@cluster0.lvduk.mongodb.net/kungfu?retryWrites=true&w=majority",
  { useNewUrlParser: true }
);
const db = mongoose.connection;
const movieSchema = new Schema({
  title: String,
  releaseDate: Date,
  rating: Number,
  status: String,
  actorIds: [String],
});

const Movie = mongoose.model("Movie", movieSchema);

const typeDefs = gql`
  # fragment Meta on Movie {
  #   releaseDate: Date
  #   rating: Int
  # }

  scalar Date

  enum Status {
    WATCHED
    INTERESTED
    NOT_INTERESTED
    UNKNOWN
  }

  type Actor {
    id: ID!
    name: String!
  }

  type Movie {
    id: ID!
    title: String!
    releaseDate: Date
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

  input ActorInput {
    id: ID
  }

  input MovieInput {
    id: ID
    title: String
    releaseDate: Date
    rating: Int
    status: Status
    actor: [ActorInput]
  }

  type Mutation {
    addMovie(movie: MovieInput): [Movie]
  }

  type Subscription {
    movieAdded: Movie
  }
`;

const pubsub = new PubSub();
const MOVIE_ADDED = "MOVIE_ADDED";

const resolvers = {
  Subscription: {
    movieAdded: {
      subscribe: () => {
        return pubsub.asyncIterator([MOVIE_ADDED]);
      },
    },
  },
  Query: {
    movies: async () => {
      try {
        return await Movie.find();
      } catch (e) {
        console.log(e);
        return [];
      }
    },
    movie: async (obj, { id }) => {
      try {
        return await Movie.findById(id);
      } catch (e) {
        console.log(e);
        return [];
      }
    },
  },
  Mutation: {
    addMovie: async (obj, { movie }, { userId }) => {
      try {
        if (userId) {
          const newMovie = await Movie.create({
            ...movie,
          });
          pubsub.publish(MOVIE_ADDED, { movieAdded: newMovie });
          const allMovies = await Movie.find();
          return allMovies;
        }
        return movies;
      } catch (e) {
        console.log(e);
        return [];
      }
    },
  },
  Movie: {
    actor: (obj, arg, context) => {
      const actorIds = obj.actor.map((actor) => actor.id);
      const foundActors = actors.filter((actor) => actorIds.includes(actor.id));
      return foundActors;
    },
  },
  Date: new GraphQLScalarType({
    name: "Date",
    description: "A normal date",
    parseValue(value) {
      // value from the client

      return new Date(value);
    },
    serialize(value) {
      // value from the servere
      return value.getTime();
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(ast.value);
      }
      return null;
    },
  }),
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
  context: ({ req }) => {
    const fakeUser = {
      userId: "iamuser",
    };
    return { ...fakeUser };
  },
});

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("CONNECTED");

  server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`Server started at ${url}`);
  });
});
