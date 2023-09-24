import { VideoThumbnailScale } from "../gql/graphql.js";

export class ImagesService {
  private constructor(private baseUrl: string) {}

  public static make({ env: { baseUrl } }: { env: { baseUrl: string } }) {
    return new ImagesService(baseUrl);
  }

  public originalYoutube(vid: string) {
    const url = new URL(`original/youtube/${vid}`, this.baseUrl);
    url.searchParams.set("size", "960x720");
    return url.toString();
  }

  public originalNicovideo(vid: string) {
    const url = new URL(`original/nicovideo/${vid}`, this.baseUrl);
    url.searchParams.set("size", "960x720");
    return url.toString();
  }

  public originalBilibili(vid: string) {
    const url = new URL(`original/bilibili/${vid}`, this.baseUrl);
    url.searchParams.set("size", "960x720");
    return url.toString();
  }

  public thumbnailPrimary(serial: number, size: VideoThumbnailScale) {
    const url = new URL(`/mads/${serial}/primary`, this.baseUrl);
    switch (size) {
      case VideoThumbnailScale.Large:
        url.searchParams.set("scale", "large");
        break;
      case VideoThumbnailScale.Ogp:
        url.searchParams.set("scale", "ogp");
        break;
    }
    return url.toString();
  }
}