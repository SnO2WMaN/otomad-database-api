import { buildHTTPExecutor, HTTPExecutorOptions } from "@graphql-tools/executor-http";
import { SyncExecutor } from "@graphql-tools/utils";
import { PrismaClient, UserRole } from "@prisma/client";
import { parse } from "graphql";
import { createSchema, createYoga } from "graphql-yoga";
import { auth as neo4jAuth, driver as createNeo4jDriver } from "neo4j-driver";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { DeepMockProxy, mock, mockDeep, mockReset } from "vitest-mock-extended";

import typeDefs from "../../../schema.graphql";
import { cleanPrisma } from "../../../test/cleanPrisma.js";
import { NicovideoRegistrationRequest, RequestNicovideoRegistrationSucceededPayload } from "../../graphql.js";
import { buildGqlId } from "../../id.js";
import { makeResolvers } from "../../index.js";
import { CurrentUser, ResolverDeps, ServerContext, UserContext } from "../../types.js";

describe("Mutation.requestNicovideoRegistration e2e", () => {
  let prisma: ResolverDeps["prisma"];
  let neo4j: ResolverDeps["neo4j"];
  let logger: ResolverDeps["logger"];
  let meilisearch: DeepMockProxy<ResolverDeps["meilisearch"]>;

  let executor: SyncExecutor<unknown, HTTPExecutorOptions>;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    neo4j = createNeo4jDriver(
      process.env.NEO4J_URL,
      neo4jAuth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
    );

    logger = mock<ResolverDeps["logger"]>();
    meilisearch = mockDeep<ResolverDeps["meilisearch"]>();

    const schema = createSchema({
      typeDefs,
      resolvers: makeResolvers({ prisma, neo4j, logger, meilisearch }),
    });
    const yoga = createYoga<ServerContext, UserContext>({ schema });
    executor = buildHTTPExecutor({ fetch: yoga.fetch });
  });

  beforeEach(async () => {
    await cleanPrisma(prisma);
    // TODO: neo4jのreset処理
    mockReset(logger);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await neo4j.close();
  });

  /**
   * ユーザu1でログインしていればリクエストに成功する
   */
  test("シナリオ2", async () => {
    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: "u1",
          name: "user1",
          displayName: "User 1",
          email: "user1@example.com",
          password: "password",
          role: UserRole.NORMAL,
        },
      }),
      prisma.tag.createMany({
        data: [
          { id: "t1", isCategoryTag: false },
          { id: "t2", isCategoryTag: false },
        ],
      }),
    ]);

    const requestResult = await executor({
      document: parse(/* GraphQL */ `
        mutation Request($input: RequestNicovideoRegistrationInput!) {
          requestNicovideoRegistration(input: $input) {
            __typename

            ... on MutationTagNotFoundError {
              tagId
            }
            ... on RequestNicovideoRegistrationVideoAlreadyRegisteredError {
              source {
                id
              }
            }
            ... on RequestNicovideoRegistrationOtherErrorsFallback {
              message
            }
            ... on RequestNicovideoRegistrationSucceededPayload {
              request {
                id
              }
            }
          }
        }
      `),
      variables: {
        input: {
          sourceId: "sm9",
          title: "タイトル1",
          thumbnailUrl: "https://example.com/thumbnail.jpg",
          taggings: [
            { tagId: buildGqlId("Tag", "t1"), note: "a" },
            { tagId: buildGqlId("Tag", "t2"), note: "b" },
          ],
          semitaggings: [
            { name: "Semitag 1", note: "c" },
            { name: "Semitag 2", note: "d" },
          ],
        },
      },
      context: {
        currentUser: {
          id: "u1",
          permissions: ["create:registration_request"],
        } satisfies CurrentUser,
      },
    });

    expect(requestResult.data).toStrictEqual({
      requestNicovideoRegistration: {
        __typename: "RequestNicovideoRegistrationSucceededPayload",
        request: { id: expect.any(String) } as NicovideoRegistrationRequest,
      } satisfies RequestNicovideoRegistrationSucceededPayload,
    });

    const getRequestsResult = await executor({
      document: parse(/* GraphQL */ `
        query GetRequest($id: ID!) {
          getNicovideoRegistrationRequest(id: $id) {
            id
            title
            sourceId
            thumbnailUrl
            taggings {
              tag {
                id
              }
              note
            }
            semitaggings {
              name
              note
            }
            requestedBy {
              id
            }
          }
        }
      `),
      variables: { id: requestResult.data.requestNicovideoRegistration.request.id },
    });
    expect(getRequestsResult.data.getNicovideoRegistrationRequest).toStrictEqual({
      id: requestResult.data.requestNicovideoRegistration.request.id,
      requestedBy: {
        id: buildGqlId("User", "u1"),
      },
      sourceId: "sm9",
      title: "タイトル1",
      thumbnailUrl: "https://example.com/thumbnail.jpg",
      taggings: expect.arrayContaining([
        {
          tag: { id: buildGqlId("Tag", "t1") },
          note: "a",
        },
        {
          tag: { id: buildGqlId("Tag", "t2") },
          note: "b",
        },
      ]),
      semitaggings: expect.arrayContaining([
        {
          name: "Semitag 1",
          note: "c",
        },
        {
          name: "Semitag 2",
          note: "d",
        },
      ]),
    });

    const findRequestsResult = await executor({
      document: parse(/* GraphQL */ `
        query FindRequests {
          findNicovideoRegistrationRequests(first: 2) {
            nodes {
              id
            }
          }
        }
      `),
    });
    expect(findRequestsResult.data.findNicovideoRegistrationRequests.nodes).toHaveLength(1);
    expect(findRequestsResult.data.findNicovideoRegistrationRequests.nodes).toStrictEqual(
      expect.arrayContaining([{ id: requestResult.data.requestNicovideoRegistration.request.id }])
    );
  });
});
