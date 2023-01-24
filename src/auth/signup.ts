import * as argon2 from "argon2";
import { RouteHandlerMethod } from "fastify";
import { DataSource } from "typeorm";
import { ulid } from "ulid";
import { z } from "zod";

import { Mylist, MylistShareRange } from "../db/entities/mylists.js";
import { User, UserRole } from "../db/entities/users.js";
import { Result } from "../utils/Result";
import { createSession } from "./createSession.js";

const reqBodySchema = z.object({
  name: z.string(),
  displayName: z.string(),
  email: z.string(),
  password: z.string(),
});

export const registerUser = async (
  dataSource: DataSource,
  input: z.infer<typeof reqBodySchema>
): Promise<Result<{ message: "USER_NAME_ALREADY_REGISTERED" }, { user: User }>> => {
  const { name, displayName, email, password: rawPassword } = input;

  if (await dataSource.getRepository(User).findOneBy({ name }))
    return {
      status: "error",
      error: { message: "USER_NAME_ALREADY_REGISTERED" },
    };

  const user = new User();
  user.id = ulid();
  user.name = name;
  user.displayName = displayName;
  user.email = email;
  user.password = await argon2.hash(rawPassword, {
    type: 2,
    memoryCost: 15 * 1024,
    timeCost: 2,
    parallelism: 1,
  });
  user.icon = null;
  user.emailConfirmed = true; // FIXME: あとでなおす

  // Add user likes
  const userLikes = new Mylist();
  userLikes.id = ulid();
  userLikes.isLikeList = true;
  userLikes.title = `favorites for ${user.displayName}`;
  userLikes.range = MylistShareRange.PRIVATE;
  userLikes.holder = user;

  await dataSource.transaction(async (e) => {
    const repoUsers = e.getRepository(User);
    const repoMylists = e.getRepository(Mylist);

    if (!(await repoUsers.findOneBy({ role: UserRole.ADMINISTRATOR }))) user.role = UserRole.ADMINISTRATOR;
    else user.role = UserRole.NORMAL;

    await repoUsers.insert(user);
    await repoMylists.insert(userLikes);
  });

  return { status: "ok", data: { user } };
};

export const handlerSignup = ({ dataSource }: { dataSource: DataSource }) =>
  (async (req, reply) => {
    const parsedReqBody = reqBodySchema.safeParse(req.body);

    if (!parsedReqBody.success) return reply.status(400).send({ code: "INVALID_REQUEST" });

    const result = await registerUser(dataSource, parsedReqBody.data);
    if (result.status === "error") {
      switch (result.error.message) {
        case "USER_NAME_ALREADY_REGISTERED":
          return reply.status(400).send({ code: "USER_NAME_ALREADY_REGISTERED" });
      }
    }
    const {
      data: { user },
    } = result;

    const session = await createSession(dataSource, user);
    return reply
      .setCookie("otmd-session", session, {
        httpOnly: true,
        secure: "auto",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        path: "/",
      })
      .send({ id: user.id });
  }) satisfies RouteHandlerMethod;
