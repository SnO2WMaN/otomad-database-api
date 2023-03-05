import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";

import { cleanPrisma } from "../../../test/cleanPrisma.js";
import { Err, ErrError, Ok, OkData } from "../../../utils/Result.js";
import { ResolverDeps } from "../../index.js";
import { explicitize } from "./prisma.js";

describe("Register video by Prisma", () => {
  let prisma: ResolverDeps["prisma"];

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: process.env.TEST_PRISMA_DATABASE_URL } } });
    await prisma.$connect();
  });

  beforeEach(async () => {
    await cleanPrisma(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("親子関係が存在しない", async () => {
    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: "u1",
          name: "user1",
          displayName: "User1",
          email: "user1@example.com",
          password: "password",
        },
      }),
    ]);

    const actual = (await explicitize(prisma, {
      userId: "u1",
      relationId: "r1",
    })) as Err<Awaited<ReturnType<typeof explicitize>>>;
    expect(actual.status).toBe("error");
    expect(actual.error).toStrictEqual({
      type: "NOT_EXISTS",
      id: "r1",
    } satisfies ErrError<Awaited<ReturnType<typeof explicitize>>>);
  });

  test("既に明示的な親子関係が存在する", async () => {
    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: "u1",
          name: "user1",
          displayName: "User1",
          email: "user1@example.com",
          password: "password",
        },
      }),
      prisma.tag.createMany({
        data: [
          { id: "t1", meaningless: false },
          { id: "t2", meaningless: false },
        ],
      }),
      prisma.tagParent.create({
        data: {
          id: "r1",
          isExplicit: true,
          parentId: "t1",
          childId: "t2",
        },
      }),
    ]);

    const actual = (await explicitize(prisma, {
      userId: "u1",
      relationId: "r1",
    })) as Err<Awaited<ReturnType<typeof explicitize>>>;
    expect(actual.status).toBe("error");
    expect(actual.error).toStrictEqual({
      type: "IS_EXPLICIT",
      relation: expect.objectContaining({
        id: "r1",
        isExplicit: true,
      }),
    } satisfies ErrError<Awaited<ReturnType<typeof explicitize>>>);
  });

  test("非明示的な親子関係を昇格する", async () => {
    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: "u1",
          name: "user1",
          displayName: "User1",
          email: "user1@example.com",
          password: "password",
        },
      }),
      prisma.tag.createMany({
        data: [
          { id: "t1", meaningless: false },
          { id: "t2", meaningless: false },
        ],
      }),
      prisma.tagParent.create({
        data: {
          id: "r1",
          isExplicit: false,
          parentId: "t1",
          childId: "t2",
        },
      }),
    ]);

    const actual = (await explicitize(prisma, {
      userId: "u1",
      relationId: "r1",
    })) as Ok<Awaited<ReturnType<typeof explicitize>>>;
    expect(actual.status).toBe("ok");
    expect(actual.data).toStrictEqual(
      expect.objectContaining({
        id: "r1",
        isExplicit: true,
      }) satisfies OkData<Awaited<ReturnType<typeof explicitize>>>
    );
  });
});
