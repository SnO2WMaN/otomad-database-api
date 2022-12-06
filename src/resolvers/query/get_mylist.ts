import { GraphQLError } from "graphql";

import { dataSource } from "../../db/data-source.js";
import { Mylist, MylistShareRange as MylistEntityShareRange } from "../../db/entities/mylists.js";
import { MylistModel } from "../../graphql/models.js";
import { QueryResolvers } from "../../graphql/resolvers.js";
import { ObjectType, removeIDPrefix } from "../../utils/id.js";

export const MYLIST_NOT_FOUND_OR_PRIVATE_ERROR = "Mylist Not Found or Private";
export const MYLIST_NOT_HOLDED_BY_YOU = "This mylist is not holded by you";

export const getMylist: QueryResolvers["mylist"] = async (_parent, { id }, { user }) => {
  const mylist = await dataSource.getRepository(Mylist).findOne({
    where: {
      id: removeIDPrefix(ObjectType.Mylist, id),
      isLikeList: false,
    },
    relations: {
      holder: true,
    },
  });

  if (!mylist) throw new GraphQLError(MYLIST_NOT_FOUND_OR_PRIVATE_ERROR);
  if (mylist.holder.id !== user?.id && mylist.range === MylistEntityShareRange.PRIVATE) {
    throw new GraphQLError(MYLIST_NOT_FOUND_OR_PRIVATE_ERROR);
  }

  return new MylistModel(mylist);
};
