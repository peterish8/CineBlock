/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as blocks from "../blocks.js";
import type * as cineblocks from "../cineblocks.js";
import type * as cineswipe from "../cineswipe.js";
import type * as crons from "../crons.js";
import type * as dataExport from "../dataExport.js";
import type * as http from "../http.js";
import type * as lists from "../lists.js";
import type * as maintenance from "../maintenance.js";
import type * as news from "../news.js";
import type * as radar from "../radar.js";
import type * as stamps from "../stamps.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  blocks: typeof blocks;
  cineblocks: typeof cineblocks;
  cineswipe: typeof cineswipe;
  crons: typeof crons;
  dataExport: typeof dataExport;
  http: typeof http;
  lists: typeof lists;
  maintenance: typeof maintenance;
  news: typeof news;
  radar: typeof radar;
  stamps: typeof stamps;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
