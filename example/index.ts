// Usage example:
import {generateAndSaveSchema} from "../src";

const inputPath = __dirname + '/test.ts';
const outputPath = __dirname + '/schema.graphql';

generateAndSaveSchema(inputPath, outputPath);