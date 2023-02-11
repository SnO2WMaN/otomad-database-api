import { Session } from "@prisma/client";
import { serialize as serializeCookie } from "cookie";

import { extractSessionFromReq, OTOMADB_SESSION_COOKIE_NAME } from "../../../auth/session.js";
import { Result } from "../../../utils/Result.js";
import { MutationResolvers, SignoutFailedMessage } from "../../graphql.js";
import { ResolverDeps } from "../../index.js";
import { SessionModel } from "../../Session/model.js";

export const expire = async (
  prisma: ResolverDeps["prisma"],
  sessionId: string
): Promise<Result<"SESSION_NOT_FOUND", Session>> => {
  if (!(await prisma.session.findUnique({ where: { id: sessionId } })))
    return { status: "error", error: "SESSION_NOT_FOUND" };

  const session = await prisma.session.update({
    where: { id: sessionId },
    data: { isExpired: true },
  });
  return { status: "ok", data: session };
};

export const signout = ({ prisma }: Pick<ResolverDeps, "prisma">) =>
  (async (_parent, _args, { req, res }) => {
    const resultExtractSession = extractSessionFromReq(req);
    if (resultExtractSession.status === "error") {
      switch (resultExtractSession.error) {
        case "NO_COOKIE":
          // TODO: ここでログを残す
          return {
            __typename: "SignoutFailedPayload",
            message: SignoutFailedMessage.NoSessionId,
          };
        case "INVALID_FORM":
          // TODO: ここでログを残す
          return {
            __typename: "SignoutFailedPayload",
            message: SignoutFailedMessage.NoSessionId,
          };
      }
    }

    const { id, secret } = resultExtractSession.data;
    // TODO: 不正なsessionのチェック

    const result = await expire(prisma, id);
    if (result.status === "error") {
      switch (result.error) {
        case "SESSION_NOT_FOUND":
          return { __typename: "SignoutFailedPayload", message: SignoutFailedMessage.SessionNotFound };
      }
    }

    const session = result.data;

    res.setHeader(
      "Set-Cookie",
      serializeCookie(OTOMADB_SESSION_COOKIE_NAME, "", {
        domain: process.env.DOMAIN,
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
      })
    );

    return {
      __typename: "SignoutSuccessedPayload",
      session: new SessionModel(session),
    };
  }) satisfies MutationResolvers["signout"];
