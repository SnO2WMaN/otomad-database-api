import { Database } from "mongo/mod.ts";
import { MongoClient } from "mongo/mod.ts";

export const getTagsCollection = (db: Database) =>
  db.collection<{
    _id: string;

    names: { name: string; primary?: boolean }[];
    name_primary: string;

    type: string;
    context?: string;
  }>("tags");

export const getVideosCollection = (db: Database) =>
  db.collection<{
    _id: string;

    titles: { title: string; primary?: boolean }[];
    title_primary: string;

    images: { image: string; primary?: boolean }[];
    image_primary: string;

    tags: string[];
  }>("videos");

export const getUsersCollections = (db: Database) =>
  db.collection<{
    _id: string;

    name: string;
    email: string;
    is_email_confirmed: boolean;
    password: string;

    display_name: string;
  }>("users");

export const getTagsCollection2 = (mongo: MongoClient) =>
  mongo.database().collection<{
    _id: string;

    names: { name: string; primary?: boolean }[];
    name_primary: string;

    type: string;
    context?: string;
  }>("tags");

export const getVideosCollection2 = (mongo: MongoClient) =>
  mongo.database().collection<{
    _id: string;

    titles: { title: string; primary?: boolean }[];
    title_primary: string;

    images: { image: string; primary?: boolean }[];
    image_primary: string;

    tags: string[];
  }>("videos");

export const getUsersCollection2 = (mongo: MongoClient) =>
  mongo.database().collection<{
    _id: string;

    name: string;
    display_name: string;
    // email: string;
    // is_email_confirmed: boolean;
    // password: string;
  }>("users");
