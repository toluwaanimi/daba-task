# Typescript to Graphql Generator

## Documentation of Task

## Author 🚀

> ADEBAYO EMMANUEL TOLUWANIMI
---

# Video Demo: [Daba Task](https://vimeo.com/874926138/621b316025?share=copy)
## Technologies

- Node JS
- Typescript
- GraphQL

---

## Install NodeJS

To Install NodeJS, kindly go to [Nodejs](https://nodejs.com) and follow the necessary instructions required depending on
your PC Operating System

## MACOS

using a [package](https://nodejs.org/en/#download) simply download the installer

using [homebrew](https://github.com/Homebrew/legacy-homebrew)

```markdown
brew install node
```

---

## Windows

using a [package](https://nodejs.org/en/#download) simply download the installer

using [chocolatey](http://chocolatey.org/) to install Node

```markdown
cinst nodejs
```

---


# Package Setup and Usage Guide

This guide will walk you through the setup and usage of the package, which allows you to generate GraphQL schemas from TypeScript files.



## Usage

### Step 1: Import the Package

Import the package in your file where you want to generate a GraphQL schema.

```javascript
const {generateAndSaveSchema} = require('../dist/index')
```

### Step 2: Define Your Input and Output Paths

Specify the input and output paths for your TypeScript file and the generated GraphQL schema file. Replace `inputPath` and `outputPath` with your desired file paths.

```typescript
const inputPath = __dirname + '/your-input.ts';
const outputPath = __dirname + '/your-schema.graphql';
```

### Step 3: Generate and Save the Schema

Use the `generateAndSaveSchema` function to generate the GraphQL schema from your  file and save it to the specified output file.

```typescript
generateAndSaveSchema(inputPath, outputPath);
```

### Step 4: Customize Scalar Types (Optional)

If you need to customize scalar types, you can provide options to the `generateAndSaveSchema` function. This is particularly useful if you have custom scalar types in your file.

```typescript
generateAndSaveSchema(inputPath, outputPath, {
  customScalars: [/* Array of custom scalar types */],
  customScalarFactory: /* Custom scalar factory function */,
});
```

### Step 5: Run the Script

Run your TypeScript file with Node.js to generate the GraphQL schema.

```bash
npm run example
```

Your generated GraphQL schema will be saved to the specified output file.

# Server Setup and Usage

This section will guide you on how to set up and run a GraphQL server using Express and the generated GraphQL schema.

## Server Installation

You need to install the required dependencies for setting up the GraphQL server. Make sure you have already installed Express and the package you've generated the schema with.

```bash
npm install express express-graphql graphql graphql-tools
```

## Server Code

Create an Express server and set up your GraphQL endpoint using the generated schema. Here's an example server code:

```javascript
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { makeExecutableSchema } = require('graphql-tools');
const fs = require('fs');

const app = express();

// Load your generated schema from a file
const schemaString = fs.readFileSync('your-schema.graphql', 'utf8');
const resolverSchema = fs.readFileSync('resolver.graphql', 'utf8'); // Add resolver schema if needed

const combinedSchema = schemaString + resolverSchema;

// Define your GraphQL resolvers
const resolvers = {
    // Define your resolvers here
    Query: {
        // Example resolver
        book: (root, args) => {
            // Your resolver logic here
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
        graphiql: true, // Enable the GraphQL IDE (GraphiQL)
    })
);

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`GraphQL server is running on http://localhost:${port}/graphql`);
});
```

Make sure to replace `'your-schema.graphql'` and `'resolver.graphql'` with the actual paths to your generated schema and resolver schema if needed.

## Running the Server

To start the GraphQL server, run your server script with Node.js:

```bash
node your-server.js
```

Your GraphQL server will be accessible at `http://localhost:4000/graphql` (or the specified port) with GraphiQL enabled for testing and exploring your GraphQL API.

This concludes the setup and usage guide for the "daba-graphql-generator" package and your GraphQL server. You can now create, generate, and run your GraphQL APIs with ease.
