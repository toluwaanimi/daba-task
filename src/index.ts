import {generatorSchema} from "./lib/generator";
import * as fs from "fs";
import {printSchema} from "graphql/utilities";


export function generateAndSaveSchema(inputPath: string, outputPath: string) {
    const schema = generatorSchema(inputPath);
    const schemaString = printSchema(schema);
    fs.writeFileSync(outputPath, schemaString);
    console.log(`GraphQL schema has been written to ${outputPath}`);
}
