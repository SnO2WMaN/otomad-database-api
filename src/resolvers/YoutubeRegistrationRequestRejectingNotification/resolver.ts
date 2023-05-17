import { GraphQLError } from "graphql";
import z from "zod";

import { Resolvers } from "../graphql.js";
import { resolverNotification } from "../Notification/resolver.js";
import { ResolverDeps } from "../types.js";
import { YoutubeRegistrationRequestRejectingModel } from "../YoutubeRegistrationRequestRejecting/model.js";

export const resolverYoutubeRegistrationRequestRejectingNotification = ({
  prisma,
  logger,
  userRepository,
}: Pick<ResolverDeps, "logger" | "prisma" | "userRepository">) =>
  ({
    ...resolverNotification({ prisma, userRepository, logger }),
    rejecting: ({ dbId, payload }, _args, _ctx, info) => {
      const p = z.object({ id: z.string() }).safeParse(payload);
      if (!p.success) {
        logger.error(
          { error: p.error, path: info.path, notificationId: dbId, payload },
          "NotificationpPayload is not valid"
        );
        throw new GraphQLError("Something wrong happened");
      }
      return prisma.youtubeRegistrationRequestChecking
        .findUniqueOrThrow({ where: { id: p.data.id } })
        .then((c) => YoutubeRegistrationRequestRejectingModel.fromPrisma(c))
        .catch((e) => {
          logger.error({ error: e, path: info.path }, "Accepting not found");
          throw new GraphQLError("Something wrong happened");
        });
    },
  } satisfies Resolvers["YoutubeRegistrationRequestRejectingNotification"]);
