import {
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { UserModel } from "../../../DB/models/user.model";
import { Types } from "mongoose";

// GraphQL type for User
const UserType = new GraphQLObjectType({
  name: "User",
  description: "A user in the system",
  fields: () => ({
    _id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    slug: { type: GraphQLString },
    username: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    profilePicture: { type: GraphQLString },
    profileCoverPictures: { type: new GraphQLList(GraphQLString) },
    gender: { type: GraphQLString },
    role: { type: GraphQLString },
    provider: { type: GraphQLString },
  }),
});

export class UserGQLSchema {
  private userModel;

  constructor() {
    this.userModel = UserModel;
  }

  registerQuery() {
    return {
      ...this.welcome(),
      ...this.profile(),
      ...this.find1(),
    };
  }

  registerMutation() {
    return {
      ...this.like(),
    };
  }

  private welcome() {
    return {
      welcome: {
        type: GraphQLString,
        description: "test graphql welcome",
        resolve: () => {
          return "welcome";
        },
      },
    };
  }

  private profile() {
    return {
      profile: {
        type: UserType,
        description: "Get user profile by ID",
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
        resolve: async (_: any, { id }: { id: string }) => {
          const user = await this.populate(id);
          return user?.toJSON();
        },
      },
    };
  }

  private like() {
    return {
      likeUser: {
        type: GraphQLString,
        description: "Toggle like/follow on a user",
        args: {
          userId: { type: new GraphQLNonNull(GraphQLID) },
          targetUserId: { type: new GraphQLNonNull(GraphQLID) },
        },
        resolve: async (
          _: any,
          { userId, targetUserId }: { userId: string; targetUserId: string },
        ) => {
          const user = await this.userModel.findById(userId);
          if (!user) return "user not found";

          const target = await this.userModel.findById(targetUserId);
          if (!target) return "target user not found";

          const friendIndex = user.friends?.findIndex(
            (f) => f.toString() === targetUserId,
          );

          if (friendIndex !== undefined && friendIndex > -1) {
            user.friends?.splice(friendIndex, 1);
            await user.save();
            return "unfollowed";
          }

          (user.friends as Types.ObjectId[])?.push(target._id);
          await user.save();
          return "followed";
        },
      },
    };
  }

  private async populate(id: string) {
    return await this.userModel
      .findById(id)
      .populate("friends");
  }

  private async find1(filter?: Record<string, any>) {
    return await this.userModel.findOne(filter || {});
  }
}

export const userGQLSchema = new UserGQLSchema();