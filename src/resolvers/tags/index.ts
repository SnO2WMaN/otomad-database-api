import { GraphQLError } from "graphql";

import { Resolvers, TagType } from "~/codegen/resolvers.js";
import { dataSource } from "~/db/data-source.js";
import { TagName } from "~/db/entities/tag_names.js";
import { TagParent } from "~/db/entities/tag_parents.js";
import { VideoTag } from "~/db/entities/video_tags.js";
import { TagParentModel } from "~/models/tag_parent.js";
import { addIDPrefix, ObjectType } from "~/utils/id.js";

export const resolveTag: Resolvers["Tag"] = {
  id: ({ id }) => addIDPrefix(ObjectType.Tag, id),
  type: () => TagType.Material,

  names: async ({ id: tagId }) => {
    const names = await dataSource.getRepository(TagName).find({
      where: { tag: { id: tagId } },
    });
    return names.map((n) => ({
      name: n.name,
      primary: n.primary,
    }));
  },
  name: async ({ id: tagId }) => {
    const name = await dataSource.getRepository(TagName).findOne({
      where: { tag: { id: tagId }, primary: true },
    });
    if (!name) throw new GraphQLError(`primary name for tag ${tagId} is not found`);
    return name.name;
  },

  parents: async ({ id: tagId }) => {
    const rel = await dataSource.getRepository(TagParent).find({
      where: { child: { id: tagId } },
      relations: TagParentModel.needRelations,
    });
    return rel.map(({ parent, explicit }) => ({
      tag: { id: parent.id, meaningless: parent.meaningless },
      explicit,
    }));
  },

  explicitParent: async ({ id: tagId }) => {
    const rel = await dataSource.getRepository(TagParent).findOne({
      where: { child: { id: tagId }, explicit: true },
      relations: TagParentModel.needRelations,
    });
    if (!rel) return null;

    const { parent } = rel;
    return { id: parent.id, meaningless: parent.meaningless };
  },

  taggedVideos: async ({ id: tagId }) => {
    const videoTags = await dataSource
      .getRepository(VideoTag)
      .find({ where: { tag: { id: tagId } }, relations: { video: true } });

    return videoTags.map(({ video }) => ({
      id: video.id,
      registeredAt: video.createdAt,
    }));
  },

  history() {
    return [];
  },
};
