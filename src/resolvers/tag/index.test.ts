import { describe, expect, it } from "vitest";

import { TagModel } from "../../graphql/models.js";
import { resolveHistory, resolveId } from "./index.js";

describe("resolver Tag.id", () => {
  it("prefixを付ける", () => {
    const actual = resolveId({ id: "1" } as TagModel);
    expect(actual).eq("tag:1");
  });
});

describe("resolver Tag.history", () => {
  it("現状は空配列を返す", () => {
    const actual = resolveHistory();
    expect(actual).eqls([]);
  });
});
