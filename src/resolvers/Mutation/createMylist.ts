import { GraphQLError } from "graphql";
import { Driver as Neo4jDriver } from "neo4j-driver";
import { DataSource } from "typeorm";
import { ulid } from "ulid";

import { Mylist, MylistShareRange as MylistEntityShareRange } from "../../db/entities/mylists.js";
import { MutationResolvers, MylistShareRange as MylistGQLShareRange } from "../../graphql.js";
import { createMylist as createMylistInNeo4j } from "../../neo4j/create_mylist.js";
import { MylistModel } from "../Mylist/model.js";

export const createMylist = ({ dataSource, neo4jDriver }: { dataSource: DataSource; neo4jDriver: Neo4jDriver }) =>
  (async (_parent, { input: { title, range } }, { user }) => {
    if (!user) throw new GraphQLError("need to authenticate");

    const mylist = new Mylist();

    mylist.id = ulid();
    mylist.title = title;
    switch (range) {
      case MylistGQLShareRange.Public:
        mylist.range = MylistEntityShareRange.PUBLIC;
        break;
      case MylistGQLShareRange.KnowLink:
        mylist.range = MylistEntityShareRange.KNOW_LINK;
        break;
      case MylistGQLShareRange.Private:
        mylist.range = MylistEntityShareRange.PRIVATE;
        break;
    }
    mylist.holder = user;
    mylist.isLikeList = false;

    await dataSource.getRepository(Mylist).insert(mylist);

    await createMylistInNeo4j(neo4jDriver)({
      userId: user.id,
      mylistId: mylist.id,
    });

    return { mylist: new MylistModel(mylist) };
  }) satisfies MutationResolvers["createMylist"];
