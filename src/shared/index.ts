import {GraphQLScalarType, Kind, GraphQLError} from 'graphql';


function validateAndParseDate(val: string) {
    const date = new Date(val);
    if (val.length !== 24 || Number.isNaN(date.getTime())) {
        throw new GraphQLError('Invalid date : ' + val);
    }
    return date;
}


export const DateType = new GraphQLScalarType({
    name: 'Date',
    serialize(date: any) {
        if (Number.isNaN(date.getTime())) {
            throw new Error('Invalid date format');
        }
        return date.toISOString();
    },
    parseValue(val: any) {
        return validateAndParseDate(val);
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return validateAndParseDate(ast.value);
        }
        return null;
    },
});
