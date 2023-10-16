import {
    GraphQLBoolean, GraphQLError, GraphQLFieldConfigArgumentMap, GraphQLFieldConfigMap,
    GraphQLFloat,
    GraphQLID, GraphQLInputObjectType, GraphQLInputType,
    GraphQLInt, GraphQLList, GraphQLNamedType, GraphQLNonNull, GraphQLObjectType, GraphQLOutputType,
    GraphQLScalarType, GraphQLSchema,
    GraphQLString,
    GraphQLType, GraphQLUnionType, Kind
} from "graphql";
import * as ts from 'typescript';
import {AllTypes, Interface, InterfaceLiteral, Primitive, typeAST, Union, UnionLiteral} from 'ts-type-ast';
import {typing} from "../shared/enum";
import {DateType} from "../shared";

type CustomScalarFactory = (type: Primitive) => GraphQLScalarType | undefined;


export function generatorSchema(
    fileName: string,
    options: { customScalars?: GraphQLScalarType[]; customScalarFactory?: CustomScalarFactory } = {},
) {
    const customScalarsMap = new Map<string, GraphQLScalarType>();
    (options.customScalars || []).forEach(value => customScalarsMap.set(value.name, value));
    const customScalar = options.customScalarFactory;

    const program = ts.createProgram({options: {strict: true}, rootNames: [fileName]});
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(fileName)!;
    //@ts-ignore
    const types = typeAST(checker, sourceFile);
    const map = new Map<AllTypes, GraphQLType>();
    let anonTypeIdx = 0;
    return createSchemaFromTypes();

    function add(type: AllTypes, gqltype: GraphQLType) {
        map.set(type, gqltype);
        return gqltype;
    }

    function nullable(nullable: boolean, type: GraphQLType) {
        return nullable || type instanceof GraphQLNonNull ? type : new GraphQLNonNull(type);
    }

    function removeKindMember(type: AllTypes) {
        // @ts-ignore
        const kindMemberIndex = type.members.findIndex(
            (member: any) => member.name === '__kind' && (member.type.literal === typing.TYPE || member.type.literal === typing.INPUT)
        );

        if (kindMemberIndex === -1) {
            return;
        }
        // @ts-ignore
        const kindMember = type.members[kindMemberIndex];
        // @ts-ignore
        type.members.splice(kindMemberIndex, 1);
        return {
            kindMember,
            type
        }
    }

    function createSchemaFromTypes() {
        const typesInSchema: GraphQLNamedType[] = [];
        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            const {kindMember, type: newType} = removeKindMember(type) || {};
            if (!kindMember) {
                continue
            }
            if (kindMember.type.literal === typing.TYPE || kindMember.type.literal === typing.INPUT) {
                const isInput = kindMember.type.literal === typing.INPUT
                // @ts-ignore
                const gqlType = createInterfaceGQL(newType, isInput);

                if (gqlType instanceof GraphQLObjectType || gqlType instanceof GraphQLInputObjectType) {
                    typesInSchema.push(gqlType);
                }
            }
        }

        return new GraphQLSchema({
            types: typesInSchema,
        });
    }


    function createInterfaceGQL(type: AllTypes, isInput: boolean): GraphQLType {
        const gqlType = map.get(type);
        if (gqlType) return gqlType;
        switch (type.kind) {
            case 'interface':
            case 'interfaceLiteral':
                return createGQLType(type, isInput);
            case "union":
            case 'unionLiteral':
                if (isInput) return add(type, createGQLInputUnion(type));
                else if (type.members.every(member => member.kind === 'primitive' && member.type === 'string')) return GraphQLString;
                else if (type.members.every(member => member.kind === 'primitive' && member.type === 'number' && member.rawType === 'Int')) return GraphQLInt;
                else if (type.members.every(member => member.kind === 'primitive' && member.type === 'number')) return GraphQLFloat;
                else if (type.members.every(member => member.kind === 'primitive')) throw new Error('Union primitives are not supported');
                return add(type, createGQLUnion(type));

            case "array":
                // @ts-ignore
                return new GraphQLList(add(type, nullable(false, createInterfaceGQL(type.element, isInput))));
            case "native":
                if (type.name === 'Date') {
                    return nonNull(DateType);
                }
                throw new Error('Unexpected type: ' + type.name);
            case  "primitive":
                return add(type, createGQLPrimitive(type));
        }
        throw new Error('Unexpected type: ' + JSON.stringify(type));
    }

    function createGQLType(type: Interface | InterfaceLiteral, isInput: boolean): GraphQLType {
        let typeName = type.kind === 'interface' ? type.name : '';
        const Class = isInput ? (GraphQLInputObjectType as unknown as typeof GraphQLObjectType) : GraphQLObjectType;
        const fields = {} as GraphQLFieldConfigMap<{}, {}>;
        if (type.kind === 'interfaceLiteral') {
            for (let i = 0; i < type.members.length; i++) {
                const member = type.members[i];
                if (
                    member.name === '__typename' &&
                    member.type.kind === 'primitive' &&
                    typeof member.type.literal === 'string'
                ) {
                    typeName = member.type.literal;

                }
            }
        }
        if (typeName === '') typeName = 'Anonymous' + (isInput ? 'Input' : '') + ++anonTypeIdx;
        const gqlType = new Class({
            name: typeName,
            description: type.kind === 'interface' ? type.doc : undefined,
            fields: fields,
        });
        removeKindMember(type);
        add(type, gqlType);
        type.members.reduce((obj, member) => {
            const memberType = {
                type: nullable(member.orNull || member.orUndefined, createInterfaceGQL(member.type, false)) as GraphQLOutputType,
                args:
                    member.args && member.args.length === 1
                        ? (member.args[0].type as InterfaceLiteral).members.reduce(
                            (acc, arg) => {
                                acc[arg.name] = {
                                    description: arg.doc,
                                    defaultValue: undefined,
                                    type: nullable(arg.orNull, createInterfaceGQL(arg.type, true)) as GraphQLInputType,
                                };
                                return acc;
                            },
                            {} as GraphQLFieldConfigArgumentMap,
                        )
                        : undefined,
                deprecationReason: undefined,
                description: member.doc,
            };

            if (member.name !== '__typename') {
                obj[member.name] = memberType;
            }
            return obj;
        }, fields);
        return gqlType;
    }

    function createGQLUnion(type: Union | UnionLiteral): GraphQLType {
        return new GraphQLUnionType({
            name: type.kind === 'union' ? type.name : 'AnonymousUnion' + ++anonTypeIdx,
            description: type.kind === 'union' ? type.doc : undefined,
            types: type.members.map(member => createInterfaceGQL(member, false) as GraphQLObjectType),
        });
    }

    function createGQLInputUnion(type: Union | UnionLiteral): GraphQLType {
        if (!type.members.every(m => m.kind === 'primitive' && m.type === 'string'))
            throw new Error('Input union supports only string unions');
        const union = type.members.map(m => m.kind === 'primitive' && m.literal);
        const validate = (val: string) => {
            if (!union.includes(val))
                throw new GraphQLError(`Input union: "${union.join(' | ')}" doesn't have value: ${val}`);
            return val;
        };

        return new GraphQLScalarType({
            name: type.kind === 'union' ? type.name : union.map(u => String(u).replace(/[^a-z]+/gi, '_')).join('__'),
            description: type.kind === 'union' ? type.doc : undefined,
            // @ts-ignore
            serialize: validate,
            // @ts-ignore
            parseValue: validate,
            // @ts-ignore
            parseLiteral(ast: any) {
                if (ast.kind === Kind.STRING) {
                    return validate(ast.value);
                }
                return null;
            },
        });
    }


    function createGQLPrimitive(type: Primitive): GraphQLType {
        if (type.rawType === 'ID') return GraphQLID;
        const customType = customScalarsMap.get(type.type);
        if (customType) return customType;
        if (customScalar) {
            const res = customScalar(type);
            if (res) return res;
        }
        switch (type.type) {
            case 'number':
                return type.rawType === 'Int' ? GraphQLInt : GraphQLFloat;
            case 'string':
                return GraphQLString;
            case 'boolean':
                return GraphQLBoolean;
        }
        throw new Error('Unexpected type: ' + JSON.stringify(type));
    }

}

function never(never: never): never {
    throw new Error('Never possible');
}

function nonNull<T>(val: T | undefined): T {
    if (val === undefined) throw new Error('Undefined is not expected here');
    return val;
}
