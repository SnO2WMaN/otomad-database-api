import { QueryResolvers } from "../../graphql.js";
import { GraphQLNotExistsInDBError, parseGqlID } from "../../id.js";
import { ResolverDeps } from "../../index.js";
import { SemitagModel } from "../../Semitag/model.js";

export const getSemitag = ({ prisma }: Pick<ResolverDeps, "prisma">) =>
  (async (_parent, { id }) =>
    prisma.semitag
      .findUniqueOrThrow({ where: { id: parseGqlID("Semitag", id) } })
      .then((v) => new SemitagModel(v))
      .catch(() => {
        throw new GraphQLNotExistsInDBError("Semitag", id);
      })) satisfies QueryResolvers["getSemitag"];