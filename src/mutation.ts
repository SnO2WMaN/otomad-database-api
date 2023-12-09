/* eslint sort-keys: 2 */

import { mkRegisterBilibiliMADResolver } from "./BilibiliMADSource/registerBilibiliMAD.resolver.js";
import { mkRequestBilibiliRegistrationResolver } from "./BilibiliRegistrationRequest/requestBilibiliRegistration.resolver.js";
import { resolverRejectRequestNicovideoRegistration } from "./NicovideoRegistrationRequest/rejectNicovideoRegistrationRequest.resolver.js";
import { resolverRequestNicovideoRegistration } from "./NicovideoRegistrationRequest/requestNicovideoRegistration.resolver.js";
import { resolverRegisterVideoFromNicovideo } from "./NicovideoVideoSource/registerVideoFromNicovideo.resolver.js";
import { type Resolvers } from "./resolvers/graphql.js";
import { addMylistToMylistGroup } from "./resolvers/Mutation/addMylistToMylistGroup/addMylistToMylistGroup.js";
import { addSemitagToVideo } from "./resolvers/Mutation/addSemitagToVideo/addSemitagToVideo.js";
import { addVideoToMylist } from "./resolvers/Mutation/addVideoToMylist/addVideoToMylist.js";
import { resolverChangeMylistShareRange } from "./resolvers/Mutation/changeMylistShareRange/resolver.js";
import { resolverChangeUserDisplayName } from "./resolvers/Mutation/changeUserDisplayName/resolver.js";
import { createMylist } from "./resolvers/Mutation/createMylist/createMylist.js";
import { createMylistGroup } from "./resolvers/Mutation/createMylistGroup/createMylistGroup.js";
import { resolverLikeVideo } from "./resolvers/Mutation/likeVideo/resolver.js";
import { resolverRejectSemitag } from "./resolvers/Mutation/rejectSemitag/resolver.js";
import { removeVideoFromMylist } from "./resolvers/Mutation/removeVideoFromMylist/removeVideoFromMylist.js";
import { resolverResolveSemitag } from "./resolvers/Mutation/resolveSemitag/resolver.js";
import { resolverUndoLikeVideo } from "./resolvers/Mutation/undoLikeVideo/resolver.js";
import { resolverWatchNotifications } from "./resolvers/Mutation/watchNotifications/resolver.js";
import { ResolverDeps } from "./resolvers/types.js";
import { mkRegisterSoundcloudMADResolver } from "./SoundcloudMADSource/registerSoundcloudMAD.resolver.js";
import { mkRequestSoundcloudRegistrationResolver } from "./SoundcloudRegistrationRequest/requestSoundcloudRegistration.resolver.js";
import { resolverAddTagToVideo } from "./Tag/addTagToVideo.resolver.js";
import { resolverExplicitizeTagParent } from "./Tag/explicitizeTagParent.resolver.js";
import { resolverImplicitizeTagParent } from "./Tag/implicitizeTagParent.resolver.js";
import { registerCategoryTag } from "./Tag/registerCategoryTag.resolver.js";
import { resolverRegisterCategoryTagTyping } from "./Tag/registerCategoryTagTyping.resolver.js";
import { resolverRegisterTag } from "./Tag/registerTag.resolver.js";
import { resolverRegisterTagParentRelation } from "./Tag/registerTagParentRelation.resolver.js";
import { resolverRemoveTagFromVideo } from "./Tag/removeTagFromVideo.resolver.js";
import { mkRequestYoutubeRegistrationResolver } from "./YoutubeRegistrationRequest/requestYoutubeRegistration.resolver.js";
import { resolverRegisterVideoFromYoutube } from "./YoutubeVideoSource/registerVideoFromYoutube.resolver.js";

export const resolveMutation = (deps: ResolverDeps) =>
  ({
    addMylistToMylistGroup: addMylistToMylistGroup(deps),
    addSemitagToVideo: addSemitagToVideo(deps),
    addTagToVideo: resolverAddTagToVideo(deps),
    addVideoToMylist: addVideoToMylist(deps),
    changeMylistShareRange: resolverChangeMylistShareRange(deps),
    changeUserDisplayName: resolverChangeUserDisplayName(deps),
    createMylist: createMylist(deps),
    createMylistGroup: createMylistGroup(deps),
    explicitizeTagParent: resolverExplicitizeTagParent(deps),
    implicitizeTagParent: resolverImplicitizeTagParent(deps),
    likeVideo: resolverLikeVideo(deps),
    registerBilibiliMAD: mkRegisterBilibiliMADResolver(deps),
    registerCategoryTag: registerCategoryTag(deps),
    registerCategoryTagTyping: resolverRegisterCategoryTagTyping(deps),
    registerSoundcloudMAD: mkRegisterSoundcloudMADResolver(deps),
    registerTag: resolverRegisterTag(deps),
    registerTagParentRelation: resolverRegisterTagParentRelation(deps),
    registerVideoFromNicovideo: resolverRegisterVideoFromNicovideo(deps),
    registerVideoFromYoutube: resolverRegisterVideoFromYoutube(deps),
    rejectNicovideoRegistrationRequest: resolverRejectRequestNicovideoRegistration(deps),
    rejectSemitag: resolverRejectSemitag(deps),
    removeTagFromVideo: resolverRemoveTagFromVideo(deps),
    removeVideoFromMylist: removeVideoFromMylist(deps),
    requestBilibiliRegistration: mkRequestBilibiliRegistrationResolver(deps),
    requestNicovideoRegistration: resolverRequestNicovideoRegistration(deps),
    requestSoundcloudRegistration: mkRequestSoundcloudRegistrationResolver(deps),
    requestYoutubeRegistration: mkRequestYoutubeRegistrationResolver(deps),
    resovleSemitag: resolverResolveSemitag(deps),
    undoLikeVideo: resolverUndoLikeVideo(deps),
    watchNotifications: resolverWatchNotifications(deps),
  }) satisfies Required<Resolvers["Mutation"]>;