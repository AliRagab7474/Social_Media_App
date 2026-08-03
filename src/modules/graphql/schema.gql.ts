import { GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { userGQLSchema } from "../user";

const query = new GraphQLObjectType({
  name: "RootQuery",
  description: "Root query for the application",
  fields: {
    sayHi: {
      type: GraphQLString,
      resolve: () => {
        return "hello world";
      },
    },
    ...bind("query"),
  },
});

const mutation = new GraphQLObjectType({
  name: "RootMutation",
  description: "Root mutation for the application",
  fields: {
    ...bind("mutation"),
  },
});

function bind(type: "query" | "mutation") {
  const modules = [userGQLSchema];
  let fields = {};

  for (const mod of modules) {
    if (type === "query") {
      fields = { ...fields, ...mod.registerQuery() };
    } else {
      fields = { ...fields, ...mod.registerMutation() };
    }
  }

  return fields;
}

function toJSon(schema: GraphQLSchema) {
  return schema.toConfig();
}

export const schema = new GraphQLSchema({
  query,
  mutation,
});

// Export schema config for introspection if needed
export const schemaConfig = toJSon(schema);
