import { GraphQLError } from "graphql";
import { Driver as Neo4jDriver, Neo4jError } from "neo4j-driver";
import { DataSource, In } from "typeorm";

import { MylistRegistration } from "../../db/entities/mylist_registrations.js";
import { Mylist, MylistShareRange } from "../../db/entities/mylists.js";
import { Tag } from "../../db/entities/tags.js";
import { MylistShareRange as MylistGQLShareRange } from "../../graphql.js";
import { Resolvers } from "../../graphql.js";
import { calcMylistIncludeTags } from "../../neo4j/mylist_include_tags.js";
import { addIDPrefix, ObjectType, removeIDPrefix } from "../../utils/id.js";
import { MylistRegistrationModel } from "../MylistRegistration/model.js";
import { TagModel } from "../Tag/model.js";
import { UserModel } from "../User/model.js";
import { resolveRecommendedVideos } from "./recommendedVideos.js";

export const resolveMylist = ({ dataSource, neo4jDriver }: { dataSource: DataSource; neo4jDriver: Neo4jDriver }) =>
  ({
    id: ({ id }) => addIDPrefix(ObjectType.Mylist, id),
    range: ({ range }) => {
      switch (range) {
        case MylistShareRange.PUBLIC:
          return MylistGQLShareRange.Public;
        case MylistShareRange.KNOW_LINK:
          return MylistGQLShareRange.KnowLink;
        case MylistShareRange.PRIVATE:
          return MylistGQLShareRange.Private;
        default:
          throw new Error("Unknown Mylist Range");
      }
    },
    holder: async ({ id: mylistId }) => {
      const mylist = await dataSource.getRepository(Mylist).findOne({
        where: { id: mylistId },
        relations: { holder: true },
      });
      if (!mylist) throw new GraphQLError(`holder for mylist ${mylistId} is not found`);
      return new UserModel(mylist.holder);
    },
    registrations: async ({ id: mylistId }, { input }) => {
      const regs = await dataSource.getRepository(MylistRegistration).find({
        where: { mylist: { id: mylistId } },
        relations: { mylist: true, video: true },
        order: {
          createdAt: input.order?.createdAt || undefined,
          updatedAt: input.order?.updatedAt || undefined,
        },
        take: input.limit,
        skip: input.skip,
      });
      return {
        nodes: regs.map((reg) => new MylistRegistrationModel(reg)),
      };
    },

    isIncludesVideo: async ({ id: mylistId }, { id: videoId }) =>
      dataSource
        .getRepository(MylistRegistration)
        .findOne({
          where: {
            mylist: { id: mylistId },
            video: { id: removeIDPrefix(ObjectType.Video, videoId) },
          },
        })
        .then((r) => !!r),

    recommendedVideos: resolveRecommendedVideos({ neo4jDriver }),
    includeTags: async ({ id: mylistId }, { input: { limit } }) => {
      try {
        const neo4jResults = await calcMylistIncludeTags(neo4jDriver)(mylistId, { limit });

        const items = await dataSource
          .getRepository(Tag)
          .find({ where: { id: In(neo4jResults.map(({ tagId }) => tagId)) } })
          .then((ts) =>
            neo4jResults.map(({ tagId, count }) => {
              const tag = ts.find((t) => t.id === tagId);
              if (!tag) throw new GraphQLError(`Data inconcistency is occuring for "tag:${tagId}"`);
              return { tag: new TagModel(tag), count };
            })
          );

        return { items };
      } catch (e) {
        if (e instanceof Neo4jError) throw new GraphQLError("Something wrong about Neo4j");
        throw new GraphQLError("Something wrong");
      }
    },
  } satisfies Resolvers["Mylist"]);
