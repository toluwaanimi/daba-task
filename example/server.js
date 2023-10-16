const express = require('express');
const {graphqlHTTP} = require('express-graphql');
const {makeExecutableSchema} = require('graphql-tools');
const fs = require('fs');
const {generateAndSaveSchema} = require('../dist/index')
const app = express();
const books = require('./data');

const inputPath = __dirname + '/test.ts';
const outputPath = __dirname + '/schema.graphql';
generateAndSaveSchema(inputPath, outputPath);

const schemaString = fs.readFileSync(outputPath, 'utf8');

const resolverSchema = fs.readFileSync('resolver.graphql', 'utf8');

const combinedSchema = schemaString + resolverSchema;


// Define your GraphQL resolvers
const resolvers = {
    Query: {
        book: (root, args) => {
            if (args.input.rating) {
                const result = books.filter((book) => book.rating === args.input.rating);
                return {
                    books: result,
                };
            }
            return {
                books: [],
            };
        },
    },
};

const executableSchema = makeExecutableSchema({
    typeDefs: combinedSchema,
    resolvers,
});

// GraphQL endpoint
app.use(
    '/graphql',
    graphqlHTTP({
        schema: executableSchema,
        graphiql: true,
    })
);

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`GraphQL server is running on http://localhost:${port}/graphql`);
});
