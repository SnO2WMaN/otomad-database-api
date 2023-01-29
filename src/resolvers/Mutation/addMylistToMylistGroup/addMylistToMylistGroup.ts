import { UserRole } from "@prisma/client";

import { parseGqlID } from "../../../utils/id.js";
import { ensureContextUser } from "../../ensureContextUser.js";
import { MutationResolvers } from "../../graphql.js";
import { ResolverDeps } from "../../index.js";
import { MylistGroupMylistInclusionModel } from "../../MylistGroupMylistInclusion/model.js";

export const addMylistToMylistGroup = ({ prisma }: Pick<ResolverDeps, "prisma">) =>
  ensureContextUser(UserRole.NORMAL, async (_parent, { input: { mylistId: mylistGqlId, groupId: groupGqlId } }) => {
    const mylistId = parseGqlID("Mylist", mylistGqlId);
    const groupId = parseGqlID("MylistGroup", groupGqlId);

    const inc = await prisma.mylistGroupMylistInclsion.create({ data: { groupId, mylistId } });
    return { inclusion: new MylistGroupMylistInclusionModel(inc) };
  }) satisfies MutationResolvers["addMylistToMylistGroup"];
