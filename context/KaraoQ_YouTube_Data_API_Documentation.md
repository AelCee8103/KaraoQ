# YouTube Data API v3: Documentation for KaraoQ

> **Scope rule for this document:** every technical statement below comes from the official YouTube Data API and YouTube API Services documentation on developers.google.com. Nothing is added from outside that documentation. Where the source pages are marked "Last updated 2026-10-15 UTC", that is the version reflected here. Documentation retrieved: **28 October 2026**.
>
> **Licence/attribution:** Google states that, except as otherwise noted, the content of these pages is licensed under the Creative Commons Attribution 4.0 License and code samples under the Apache 2.0 License. This document reproduces and condenses that material with attribution to *Google for Developers, YouTube Data API*.

---

## Table of contents

1. [Sources and coverage](#1-sources-and-coverage)
2. [Overview](#2-overview)
3. [Before you start](#3-before-you-start)
4. [Authorization credentials (API key vs OAuth 2.0)](#4-authorization-credentials-api-key-vs-oauth-20)
5. [Quota](#5-quota)
6. [Partial resources: `part` and `fields`](#6-partial-resources-part-and-fields)
7. [Performance: ETags and gzip](#7-performance-etags-and-gzip)
8. [`search.list` method](#8-searchlist-method)
9. [Search result resource](#9-search-result-resource)
10. [Search request examples (implementation guide)](#10-search-request-examples-implementation-guide)
11. [`videos.list` method](#11-videoslist-method)
12. [Video resource](#12-video-resource)
13. [Pagination](#13-pagination)
14. [Errors](#14-errors)
15. [YouTube API Services: Developer Policies](#15-youtube-api-services-developer-policies)
16. [Required Minimum Functionality (embedded player)](#16-required-minimum-functionality-embedded-player)
17. [Supported topic IDs](#17-supported-topic-ids)
18. [Other resources and methods in the API](#18-other-resources-and-methods-in-the-api)
19. [Where each part of the KaraoQ brief is covered in this document](#19-where-each-part-of-the-karaoq-brief-is-covered-in-this-document)

---

## 1. Sources and coverage

### 1.1 Pages used

| # | Official page | Used for |
|---|---|---|
| 1 | YouTube Data API Overview (`/youtube/data/getting-started`) | Overview, resources, operations, quota summary, `part`/`fields`, ETags, gzip |
| 2 | Quota Calculator (`/youtube/data/determine_quota_cost`) | Quota allocation and per-method costs |
| 3 | Search: list (`/youtube/v3/docs/search/list`, canonical `/youtube/data/reference/rest/v3/search/list`) | Full `search.list` reference |
| 4 | Search resource (`/youtube/v3/docs/search`) | Search result representation |
| 5 | Videos: list (`/youtube/data/reference/rest/v3/videos/list`) | `videos.list` reference |
| 6 | Videos resource (`/youtube/data/reference/rest/v3/videos`) | Video resource representation and properties |
| 7 | Implementation: Search requests | Search request examples |
| 8 | Implementation: Pagination | Pagination behaviour |
| 9 | Obtaining authorization credentials (`/youtube/registering_an_application`) | API keys and OAuth 2.0 |
| 10 | YouTube Data API: Errors (`/youtube/data/reference/rest/v3/errors`) | YouTube-specific error tables |
| 11 | Google APIs: Global domain errors (`/youtube/data/reference/rest/v3/core_errors`) | Global error codes |
| 12 | YouTube API Services: Developer Policies | Policies |
| 13 | YouTube API Services: Required Minimum Functionality | Embedded player rules |

### 1.2 Coverage limits (read this)

* The **videos.list** English page could not be retrieved in English. It was retrieved in Hebrew and in Chinese (both marked by Google as AI-translated), plus English fragments from search results. The parameter names, types, defaults, ranges, filter rules and error tables are identical across versions and are given here in English. Treat the wording as a faithful rendering, not a verbatim quote.
* The **Pagination** guide is summarised from the retrievable English text of that page.
* **Not retrieved** and therefore **not documented here:** the YouTube API Services *Terms of Service* itself (only the Developer Policies and RMF that sit under it are covered), the *Revision History* page, the *Made For Kids status* guide (it is only referenced by the Developer Policies), the *Quota and Compliance Audits* guide, the `videoCategories` reference, the Branding Guidelines page, and the YouTube IFrame Player API reference (a separate API from the Data API).
* The `snippet` of the sample responses in the official pages is reproduced as written. Sample IDs and values are from the documentation, not from KaraoQ.

---

## 2. Overview

### 2.1 Purpose of the API

The YouTube Data API lets applications interact with YouTube. Its overview document "explains basic concepts of YouTube and of the API itself" and gives an overview of the functions the API supports. The API can be used to search for videos matching specific search terms, topics, locations, publication dates and more; the `search.list` method also supports searches for playlists and channels.

### 2.2 Resources

A resource is an individual data entity with a unique identifier.

| Resource | Description |
|---|---|
| `activity` | Information about an action that a particular user has taken on YouTube (rating a video, sharing a video, marking a favorite, posting a channel bulletin, etc.). |
| `channel` | Information about a single YouTube channel. |
| `channelBanner` | The URL to use to set a newly uploaded image as a channel's banner image. |
| `channelSection` | A set of videos a channel has chosen to feature (for example latest uploads, most popular uploads, or videos from playlists). |
| `guideCategory` | A category YouTube associates with channels based on their content or other indicators such as popularity. Channels can be associated with one or more guide categories but are not guaranteed to be in any. |
| `i18nLanguage` | An application (UI) language that the YouTube website supports. |
| `i18nRegion` | A geographic area a YouTube user can select as the preferred content region (content locale). |
| `playlist` | A single YouTube playlist: a collection of videos that can be viewed sequentially and shared. |
| `playlistItem` | A resource, such as a video, that is part of a playlist, with details about how it is used in the playlist. |
| `search result` | A YouTube video, channel, or playlist matching the search parameters. A search result points to a uniquely identifiable resource but "does not have its own persistent data". |
| `subscription` | A user's subscription. |
| `thumbnail` | Thumbnail images associated with a resource. |
| `video` | A single YouTube video. |
| `videoCategory` | A category that has been or could be associated with uploaded videos. |
| `watermark` | An image displayed during playback of a channel's videos. |

Resources often reference other resources. For example, a `playlistItem` resource's `snippet.resourceId.videoId` identifies a video resource, and a search result contains a `videoId`, `playlistId`, or `channelId` identifying a particular video, playlist or channel resource.

### 2.3 Supported operations

| Operation | HTTP | Meaning |
|---|---|---|
| `list` | `GET` | Retrieves a list of zero or more resources. |
| `insert` | `POST` | Creates a new resource. |
| `update` | `PUT` | Modifies an existing resource to reflect data in the request. |
| `delete` | `DELETE` | Removes a specific resource. |

* Operations that insert, update, or delete resources **always require user authorization**.
* In some cases, `list` methods support both authorized and unauthorized requests: unauthorized requests only retrieve public data, authorized requests can also retrieve information about or private to the authenticated user.
* Some resources support other methods, for example `videos.rate` and `thumbnails.set`.

---

## 3. Before you start

From the overview document:

1. You need a **Google Account** to access the Google Cloud console, request an API key, and register your application.
2. Create a project in the Google Developers Console and **obtain authorization credentials** so your application can submit API requests.
3. After creating the project, confirm that the **YouTube Data API is one of the enabled services**: go to the Cloud console, select the project, open the *Enabled APIs* page; if the YouTube Data API is not listed, open the *API Library* and enable it.
4. If the application uses API methods that require user authorization, read the authentication guide to implement OAuth 2.0.
5. Select a client library to simplify the API implementation.
6. Be familiar with the core concepts of the **JSON** data format.

---

## 4. Authorization credentials (API key vs OAuth 2.0)

Source: *Obtaining authorization credentials*.

The application must have authorization credentials to use the YouTube Data API. The API supports **two** credential types; create whichever is appropriate:

| Credential | When it is used |
|---|---|
| **OAuth 2.0** | Whenever the application requests **private user data**, it must send an OAuth 2.0 token with the request. The application first sends a client ID and possibly a client secret to obtain a token. OAuth 2.0 credentials can be generated for web applications, service accounts, or installed applications. |
| **API key** | A request that **does not provide an OAuth 2.0 token must send an API key**. The key identifies the project and provides API access, quota and reports. |

Creating an API key: open the *Credentials* page in the API Console, then **Create credentials > API key**. The API supports several types of restrictions on API keys; you can restrict the key before using it in production via **Restrict key** and one of the Restrictions. The source tells you to follow Google's best practices for securely using API keys.

Related facts stated elsewhere in the documentation:

* The YouTube Data API "service requires authorization for some actions. For example, an API Client can search for public videos but does not need user authorization to do so" (Developer Policies III.D.2).
* The **YouTube IFrame Player API** "does not require authorization" (Developer Policies III.D.2).
* The YouTube Data API **does not support Service Accounts**. Using the OAuth 2.0 Service Account flow commonly yields the `youtubeSignupRequired` error (see [§14](#14-errors)).
* API key errors: `keyInvalid`, `keyExpired` (see [§14.3](#143-global-domain-errors-selection-relevant-to-keys-quota-and-rate)).
* Credentials are tied to a project: you must create **exactly one API Project per API Client**, may not share credentials with third parties, and may not embed credentials in open source projects (Developer Policies III.D.1; see [§15](#15-youtube-api-services-developer-policies)).

Example from the overview: `https://www.googleapis.com/youtube/v3/videos?id=7lCDEYXw3mM&key=YOUR_API_KEY&part=snippet,contentDetails,statistics,status`.

---

## 5. Quota

### 5.1 Rules

Source: *Quota Calculator* and *YouTube Data API Overview*.

* The API uses a quota "to ensure that developers use the service as intended and do not create applications that unfairly reduce service quality or limit access for others."
* **All API requests, including invalid requests, incur at least a one-point quota cost.**
* **Default quota allocation** for projects that enable the YouTube Data API: **100 `search.list` calls, 100 `videos.insert` calls, and 10,000 units per day combined for all other endpoints.** The overview adds that default quota "is subject to change".
* `search.list` and `videos.insert` have **their own quota buckets**. Each has a default daily limit of **100 per day**, and **the quota cost is 1 per call** in that bucket.
* `search.list` reference: *"Quota impact: 100 calls per day. A call to this method has a quota cost of 1 unit in the Search Queries quota bucket."*
* **Daily quotas reset at midnight Pacific Time (PT).**
* You can see quota usage on the **Quotas** page in the Google Cloud console (API Console).
* If a method returns multiple pages (for example `search.list`), **each request for an additional page incurs the quota cost**.
* YouTube Live Streaming API methods are part of the YouTube Data API and also incur quota costs; they are listed in the cost table.
* If you reach the quota limit, you can request additional quota by completing the **Quota extension request form** (API Compliance Audit) for YouTube API Services.

> **Documentation note on versions.** An older version of the quota documentation (still visible in some cached copies) described a single 10,000-unit daily allocation with `search.list` costing 100 units. The current pages (updated 2026-10-15) describe the model above (100 `search.list` calls in a separate bucket, 1 unit each, plus 10,000 units for everything else). This document follows the current pages.

### 5.2 Typical costs (from the overview)

* A read operation that retrieves a list of resources (channels, videos, playlists) usually costs **1 unit**.
* A write operation that creates, updates, or deletes a resource usually costs **50 units**.
* A search query costs **1 unit** (in its own bucket).
* A video upload costs **1 unit** (in its own bucket).

### 5.3 Quota cost per method

| Resource | Method | Cost |
|---|---|---|
| activities | list | 1 |
| captions | list | 50 |
| | insert | 400 |
| | update | 450 |
| | delete | 50 |
| channelBanners | insert | 50 |
| channels | list | 1 |
| | update | 50 |
| channelSections | list | 1 |
| | insert / update / delete | 50 each |
| comments | list | 1 |
| | insert / update / setModerationStatus / delete | 50 each |
| commentThreads | list | 1 |
| | insert / update | 50 each |
| guideCategories | list | 1 |
| i18nLanguages | list | 1 |
| i18nRegions | list | 1 |
| liveBroadcasts | bind / delete / insert / insertCuepoint / list / transition / update | 1 each |
| liveChatBans | delete / insert | 200 each |
| liveChatMessages | delete / insert / transition | 20 each |
| | list / streamList | 5 each |
| liveChatModerators | delete / insert | 200 each |
| | list | 50 |
| liveStreams | delete / insert / list / update | 1 each |
| members | list | 1 |
| membershipsLevels | list | 1 |
| playlistItems | list | 1 |
| | insert / update / delete | 50 each |
| playlists | list | 1 |
| | insert / update / delete | 50 each |
| **search** | **list** | **100 calls per day; each call costs 1 (Search Queries bucket)** |
| subscriptions | list | 1 |
| | insert / delete | 50 each |
| superChatEvents | list | 1 |
| thumbnails | set | 50 |
| videoAbuseReportReasons | list | 1 |
| videoCategories | list | 1 |
| **videos** | **list** | **1** |
| | insert | 100 calls per day; each call costs 1 |
| | update | 50 |
| | rate | 50 |
| | getRating | 1 |
| | reportAbuse | 50 |
| | delete | 50 |
| watermarks | set / unset | 50 each |

> `videos.batchGetStats` appears in the Videos resource method list but is **not listed in the quota cost table** that was retrieved.

### 5.4 Quota errors

* `quotaExceeded (403)`: "The request cannot be completed because you have exceeded your quota."
* Global-domain codes related to limits: `dailyLimitExceeded`, `rateLimitExceeded`, `userRateLimitExceeded`, `limitExceeded`, `servingLimitExceeded` (see [§14.3](#143-global-domain-errors-selection-relevant-to-keys-quota-and-rate)).

---

## 6. Partial resources: `part` and `fields`

The API **allows, and actually requires,** retrieving partial resources so applications avoid transferring, parsing and storing unneeded data.

### 6.1 `part` parameter

* **Required** for any API request that retrieves or returns a resource.
* Identifies one or more **top-level (non-nested)** resource properties to include in the response.
* For a `video` resource, the parts are: `snippet`, `contentDetails`, `fileDetails`, `player`, `processingDetails`, `recordingDetails`, `statistics`, `status`, `suggestions`, `topicDetails` (the `videos.list` reference additionally lists `brandPartner`, `id`, `liveStreamingDetails`, `localizations`, `paidProductPlacementDetails`).
* All parts are objects of nested properties; the requirement to choose parts: (1) reduces **latency** by not retrieving unused metadata, and (2) reduces **bandwidth**.
* If `part` identifies a property that contains child properties, the child properties are included. Example: in a `video`, the `snippet` property contains `channelId`, `title`, `description`, `tags`, `categoryId`, so `part=snippet` returns all of them.
* For `search.list`, `part` must be set to **`snippet`**.

### 6.2 `fields` parameter

* Filters the response (which already only contains the requested parts) to a specific set of fields. It can remove nested properties; `part` cannot.
* Syntax (loosely based on XPath):
  * comma-separated list: `fields=a,b`
  * wildcard: `fields=*`
  * parentheses for groups of nested properties: `fields=a(b,c)`
  * forward slash for a nested property: `fields=a/b`
* These are equivalent ways to get playlist item id, title and position:
  * `fields=items/id,playlistItems/snippet/title,playlistItems/snippet/position`
  * `fields=items(id,snippet/title,snippet/position)`
  * `fields=items(id,snippet(title,position))`
* The `fields` value **must be URL encoded** (the documentation omits encoding for readability).

### 6.3 Sample partial requests (from the overview)

1. `…/videos?id=7lCDEYXw3mM&key=YOUR_API_KEY&part=snippet,contentDetails,statistics,status` returns a video resource with four parts plus `kind` and `etag`.
2. `…&part=snippet,statistics` returns two parts plus `kind` and `etag`.
3. `…&part=snippet,statistics&fields=items(id,snippet,statistics)` returns two parts and removes `kind` and `etag`.
4. `…&fields=items(id,snippet(channelId,title,categoryId),statistics)&part=snippet,statistics` also trims `snippet` to `channelId`, `title`, `categoryId`.

---

## 7. Performance: ETags and gzip

### 7.1 ETags

ETags (a standard part of HTTP) let applications refer to a specific version of an API resource (an entire feed or an item in it).

* **Caching and conditional retrieval:** cache resources and their ETags. When requesting a stored resource again, specify its ETag. If the resource changed, the API returns the modified resource and its new ETag. If it has not changed, the API returns **HTTP 304 (Not Modified)**, reducing latency and bandwidth.
* **Protection against inadvertent overwrites:** when updating or deleting, specify the resource's ETag; if it does not match the latest version, the request fails.
* The JavaScript client library supports `If-Match` and `If-None-Match` via a header allow-list, so that ordinary browser caching can serve unchanged resources. The Obj-C client does not support ETags (as stated in the source).
* Related global errors: `notModified (304)`, `conditionNotMet (412)`, `preconditionRequired (428)`.

### 7.2 gzip

To receive a gzip-encoded response:

* Set the `Accept-Encoding` HTTP request header to `gzip`.
* Modify the user agent to contain the string `gzip`.

```
Accept-Encoding: gzip
User-Agent: my program (gzip)
```

The source notes extra CPU time is needed to uncompress, but the benefit of fewer network resources usually outweighs it.

---

## 8. `search.list` method

Returns a collection of search results that match the query parameters specified in the API request. By default, a search result set identifies matching `video`, `channel`, and `playlist` resources, but queries can be configured to retrieve a specific type of resource.

**Quota impact:** 100 calls per day. One call costs 1 unit in the Search Queries quota bucket.

### 8.1 HTTP request

```
GET https://www.googleapis.com/youtube/v3/search
```

All parameters are **query parameters**. Do not provide a request body.

### 8.2 Required parameter

| Parameter | Type | Description |
|---|---|---|
| `part` | string | Comma-separated list of one or more `search` resource properties the response will include. **Set the value to `snippet`.** |

### 8.3 Filters (specify 0 or 1 of the following)

| Parameter | Type | Description |
|---|---|---|
| `forContentOwner` | boolean | Only in a properly authorized request; intended **exclusively for YouTube content partners**. Restricts the search to videos owned by the content owner in `onBehalfOfContentOwner`. If `true`: `onBehalfOfContentOwner` is required; the user must use an account linked to that content owner; `type` must be `video`; none of `videoDefinition`, `videoDimension`, `videoDuration`, `videoEmbeddable`, `videoLicense`, `videoPaidProductPlacement`, `videoSyndicated`, `videoType` may be set. |
| `forDeveloper` | boolean | Only in a properly authorized request. Restricts the search to videos **uploaded via the developer's application or website**. The server uses the request's authorization credentials to identify the developer. Each uploaded video is automatically tagged with the project number associated with the developer's application in the Google Developers Console. Can be combined with optional parameters like `q`. |
| `forMine` | boolean | Only in a properly authorized request. Restricts the search to videos **owned by the authenticated user**. If `true`, `type` must be `video`, and none of `videoDefinition`, `videoDimension`, `videoDuration`, `videoEmbeddable`, `videoLicense`, `videoPaidProductPlacement`, `videoSyndicated`, `videoType` may be set. |

### 8.4 Optional parameters

| Parameter | Type | Description and values |
|---|---|---|
| `channelId` | string | Response only contains resources created by the channel. **Note:** results are constrained to a **maximum of 500 videos** if the request specifies `channelId`, sets `type=video`, and does not also set `forContentOwner`, `forDeveloper` or `forMine`. |
| `channelType` | string | Restrict a search to a type of channel. `any` – all channels. `show` – only shows. |
| `eventType` | string | Restricts a search to broadcast events. If specified, `type` must be `video`. Values: `completed`, `live`, `upcoming`. |
| `location` | string | With `locationRadius`, defines a circular area and restricts the search to videos whose metadata has a geographic location inside it. Value: latitude/longitude, e.g. `37.42307,-122.08427`. The API returns an error if `location` is given without `locationRadius`. If specified, `type` must be `video`. |
| `locationRadius` | string | Floating point number + unit. Valid units: `m`, `km`, `ft`, `mi` (e.g. `1500m`, `5km`, `10000ft`, `0.75mi`). Values larger than **1000 kilometers** are not supported. |
| `maxResults` | unsigned integer | Maximum number of items returned. Acceptable values **0 to 50 inclusive**. Default **5**. **Note:** the API may return fewer items than `maxResults` per page due to internal sorting or filtering even if more results are available; always rely on `nextPageToken` to get further pages. |
| `onBehalfOfContentOwner` | string | Authorized requests only; **YouTube content partners only**. Indicates the credentials identify a CMS user acting on behalf of the specified content owner. |
| `order` | string | Sort method. Default **`relevance`**. Values below. |
| `pageToken` | string | Identifies a specific page of the result set. `nextPageToken` and `prevPageToken` in the response identify other pages. |
| `publishedAfter` | datetime | Only resources created **at or after** the time. RFC 3339 (e.g. `1970-01-01T00:00:00Z`). |
| `publishedBefore` | datetime | Only resources created **before or at** the time. RFC 3339. |
| `q` | string | The query term. Supports Boolean **NOT (`-`)** and **OR (`\|`)**: e.g. `boating\|sailing` finds either; `boating\|sailing -fishing` finds either but not fishing. The pipe character must be URL-escaped as `%7C`. |
| `regionCode` | string | Return results for videos that can be viewed in the specified country. ISO 3166-1 alpha-2 code. |
| `relevanceLanguage` | string | Return results most relevant to the language. Typically ISO 639-1 two-letter code; use `zh-Hans` for simplified Chinese and `zh-Hant` for traditional Chinese. Results in other languages are still returned if highly relevant. |
| `safeSearch` | string | Whether results include restricted content. Values below. |
| `topicId` | string | Only resources associated with the topic. Freebase topic ID; since **27 February 2017** only a small set of curated topic IDs is supported (see [§17](#17-supported-topic-ids)). |
| `type` | string | Restricts to a type of resource. Comma-separated list. Default **`video,channel,playlist`**. Values: `channel`, `playlist`, `video`. **Note:** with a non-default `order`, strict `type` filtering might occasionally be affected, giving unexpected resource types. |
| `videoCaption` | string | Filter by caption availability; requires `type=video`. Values: `any`, `closedCaption` (only with captions), `none` (only without captions). |
| `videoCategoryId` | string | Filters video results by [category](https://developers.google.com/youtube/data/reference/rest/v3/videoCategories); requires `type=video`. |
| `videoDefinition` | string | Requires `type=video`. `any`; `high` (HD, available for playback in at least 720p, possibly higher); `standard`. |
| `videoDimension` | string | Requires `type=video`. `2d` (exclude 3D), `3d` (only 3D), `any` (default). |
| `videoDuration` | string | Requires `type=video`. `any` (default); `long` (longer than 20 minutes); `medium` (between 4 and 20 minutes inclusive); `short` (less than 4 minutes). |
| `videoEmbeddable` | string | Restrict to videos that can be **embedded into a webpage**; requires `type=video`. Values: `any` (embeddable or not), `true` (only embeddable). |
| `videoLicense` | string | Requires `type=video`. `any`; `creativeCommon`; `youtube` (standard YouTube license). |
| `videoPaidProductPlacement` | string | Videos the creator has denoted as having a paid promotion; requires `type=video`. `any`; `true`. |
| `videoSyndicated` | string | Videos that can be played **outside youtube.com**; requires `type=video`. `any`; `true`. |
| `videoType` | string | Requires `type=video`. `any`; `episode` (episodes of shows); `movie`. |

#### `order` values

| Value | Meaning |
|---|---|
| `date` | Reverse chronological order of creation date. Because it relies on the search index, you may see indexing delays for new content or incomplete result sets. **To reliably retrieve a channel's most recent uploads do not use `search.list`; use `playlistItems.list` with the channel's uploads playlist.** |
| `rating` | Highest to lowest rating. Rating is an **internal algorithmic score**, not strictly equivalent to a descending like count. |
| `relevance` | Sorted by relevance to the query. **Default.** |
| `title` | Alphabetically by title. |
| `videoCount` | Channels sorted in descending order of uploaded videos. |
| `viewCount` | Highest to lowest views. For live broadcasts, sorted by concurrent viewers while ongoing. |

**Important (from the source):** a sort order other than `relevance` might result in a smaller or incomplete result set, particularly when combined with `publishedAfter` / `publishedBefore`. Using `order` can also sometimes affect the behaviour of the `type` filter.

#### `safeSearch` values

| Value | Meaning |
|---|---|
| `moderate` | **Default.** YouTube filters some content and, at the least, content restricted in your locale. Results may be removed or demoted. |
| `none` | No filtering. |
| `strict` | YouTube tries to exclude all restricted content. Results may be removed or demoted. |

### 8.5 Request body

Do not provide a request body.

### 8.6 Response

```json
{
  "kind": "youtube#searchListResponse",
  "etag": etag,
  "nextPageToken": string,
  "prevPageToken": string,
  "regionCode": string,
  "pageInfo": {
    "totalResults": integer,
    "resultsPerPage": integer
  },
  "items": [ search Resource ]
}
```

| Property | Type | Description |
|---|---|---|
| `kind` | string | `youtube#searchListResponse`. |
| `etag` | etag | The Etag of this resource. |
| `nextPageToken` | string | Token usable as `pageToken` to fetch the next page. |
| `prevPageToken` | string | Token usable as `pageToken` to fetch the previous page. |
| `regionCode` | string | Region code used for the query (two-letter ISO country code). `i18nRegions.list` returns supported regions. Default `US`. If an unsupported region is specified, YouTube might still select another region rather than the default. |
| `pageInfo` | object | Paging information. |
| `pageInfo.totalResults` | integer | Total results in the result set. **An approximation, may not be exact; maximum value 1,000,000.** Do not use it to create pagination links; use `nextPageToken` / `prevPageToken`. |
| `pageInfo.resultsPerPage` | integer | Number of results in this response. |
| `items[]` | list | Results matching the criteria. |

### 8.7 Errors specific to `search.list`

| Type | Detail | Description |
|---|---|---|
| `badRequest (400)` | `invalidChannelId` | `channelId` is an invalid channel ID. |
| `badRequest (400)` | `invalidLocation` | `location` and/or `locationRadius` formatted incorrectly. |
| `badRequest (400)` | `invalidRelevanceLanguage` | `relevanceLanguage` formatted incorrectly. |
| `badRequest (400)` | `invalidSearchFilter` | Invalid combination of search filters/restrictions. `type` must be `video` if `forContentOwner` or `forMine` is `true`; `type` must also be `video` when setting `eventType`, `videoCaption`, `videoCategoryId`, `videoDefinition`, `videoDimension`, `videoDuration`, `videoEmbeddable`, `videoLicense`, `videoSyndicated`, or `videoType`. |

Common errors also apply (see [§14](#14-errors)).

### 8.8 Official code sample (Apps Script)

```javascript
function searchByKeyword() {
  var results = YouTube.Search.list('id,snippet', {q: 'dogs', maxResults: 25});
  for (var i in results.items) {
    var item = results.items[i];
    Logger.log('[%s] Title: %s', item.id.videoId, item.snippet.title);
  }
}
```

The official page also provides samples in Go, .NET and Ruby which use an API key (`developerKey` / `ApiKey` / `DEVELOPER_KEY`), call the search method with `part=snippet` (`id,snippet` in Go), a query term and `maxResults`, then group items by `id.kind` into `youtube#video`, `youtube#channel` and `youtube#playlist`.

---

## 9. Search result resource

```json
{
  "kind": "youtube#searchResult",
  "etag": etag,
  "id": {
    "kind": string,
    "videoId": string,
    "channelId": string,
    "playlistId": string
  },
  "snippet": {
    "publishedAt": datetime,
    "channelId": string,
    "title": string,
    "description": string,
    "thumbnails": {
      (key): {
        "url": string,
        "width": unsigned integer,
        "height": unsigned integer
      }
    },
    "channelTitle": string,
    "liveBroadcastContent": string
  }
}
```

| Property | Description |
|---|---|
| `kind` | `youtube#searchResult`. |
| `etag` | The Etag of this resource. |
| `id` | Information that can uniquely identify the resource matching the request. |
| `id.kind` | The type of the matching resource (`youtube#video`, `youtube#channel`, `youtube#playlist`). |
| `id.videoId` | Present if the result is a video (`youtube#video`); the ID that uniquely identifies the video. |
| `id.channelId` | Present if the result is a channel (`youtube#channel`). |
| `id.playlistId` | Present if the result is a playlist (`youtube#playlist`). |
| `snippet` | Basic details about the search result, including title, description and thumbnails. |
| `snippet.publishedAt` | Creation date and time of the resource. |
| `snippet.channelId` | The channel that published the resource. |
| `snippet.title` / `snippet.description` | Title and description. |
| `snippet.thumbnails` | Map of thumbnail images. For each key, `url`, `width`, `height`. **To retrieve higher resolution thumbnails, call the resource-specific endpoint (such as `videos.list`) using the resource's ID.** |
| `snippet.channelTitle` | Title of the channel that published the resource. |
| `snippet.liveBroadcastContent` | Indicates whether a video or channel resource has live broadcast content. |

> A search result "does not have its own persistent data". Duration, embeddability and statistics are **not** part of the search result; those are properties of the `video` resource (see [§12](#12-video-resource)).

---

## 10. Search request examples (implementation guide)

The official *Implementation: Search requests* page gives these example patterns (shown there as APIs Explorer URLs):

* **Videos:** most viewed HD videos for "skateboarding dog". Parameters: `part=snippet`, `order=viewCount`, `q=skateboarding+dog`, `type=video`, `videoDefinition=high`.
* **Playlists:** `part=snippet`, `q=GoogleDevelopers`, `type=playlist`.
* **Channels:** `part=snippet`, `q=travel`, `type=channel`.
* **Language relevance:** search results most relevant to a specific language, e.g. `q=marine` with `relevanceLanguage` set.
* **Developer uploads:** the `forDeveloper` parameter restricts results to videos uploaded through the developer's own app or website (each upload is tagged with the project number).

Pagination example from the pagination guide (10 most viewed videos matching "skateboarding dog"): `part=snippet&maxResults=10&order=viewCount&q=skateboarding+dog&type=video`, then repeat with `pageToken=<nextPageToken>`.

---

## 11. `videos.list` method

Returns a list of videos that match the API request parameters.

**Quota impact:** a call to this method has a quota cost of **1 unit**.

### 11.1 HTTP request

```
GET https://www.googleapis.com/youtube/v3/videos
```

All parameters are query parameters. Do not provide a request body.

### 11.2 Required parameter

| Parameter | Type | Description |
|---|---|---|
| `part` | string | Comma-separated list of one or more `video` resource properties the response will include. If the property contains child properties, the child properties are included (e.g. `part=snippet` returns `channelId`, `title`, `description`, `tags`, `categoryId`). Allowed part names: `brandPartner`, `contentDetails`, `fileDetails`, `id`, `liveStreamingDetails`, `localizations`, `paidProductPlacementDetails`, `player`, `processingDetails`, `recordingDetails`, `snippet`, `statistics`, `status`, `suggestions`, `topicDetails`. |

### 11.3 Filters (specify **exactly one** of the following)

| Parameter | Type | Description |
|---|---|---|
| `chart` | string | Identifies the chart to retrieve. Acceptable value: **`mostPopular`** (most popular videos for the specified `regionCode` and `videoCategoryId`). |
| `id` | string | **Comma-separated list of YouTube video IDs** to retrieve. In a `video` resource, the `id` property is the video's ID. |
| `myRating` | string | Authorized requests only. `like` or `dislike`: only videos the authenticated user liked/disliked. The result set is limited to **1,000 videos**; even if `pageInfo.totalResults` is higher, paging with `pageToken` only retrieves the most recent 1,000 items. |

### 11.4 Optional parameters

| Parameter | Type | Description |
|---|---|---|
| `hl` | string | Retrieve localized resource metadata for a specific application language that the YouTube website supports. Must be a language code returned by `i18nLanguages.list`. If localized details exist, `snippet.localized` contains them; otherwise it contains the resource's default-language details. |
| `maxHeight` | unsigned integer | Maximum height of the embedded player returned in `player.embedHtml`. Acceptable values **72 to 8192** inclusive. If `maxWidth` is also provided, the player may be shorter than `maxHeight` to avoid violating the maximum width. |
| `maxResults` | unsigned integer | Maximum number of items in the result set. **Supported with `myRating`, not supported with `id`.** Acceptable **1 to 50**, default **5**. |
| `maxWidth` | unsigned integer | Maximum width of the embedded player returned in `player.embedHtml`. Acceptable values **72 to 8192** inclusive. If `maxHeight` is also provided, the player may be narrower than `maxWidth`. |
| `onBehalfOfContentOwner` | string | Authorized requests only; **YouTube content partners only**. |
| `pageToken` | string | Specific page of the result set. `nextPageToken` / `prevPageToken` identify other pages. **Supported with `myRating`, not supported with `id`.** |
| `regionCode` | string | Select a video chart available in the specified region. **Can only be used with `chart`.** ISO 3166-1 alpha-2 country code. |
| `videoCategoryId` | string | The video category for which the chart should be retrieved. **Can only be used with `chart`.** By default charts are not restricted to a category; default value `0`. |

### 11.5 Response

```json
{
  "kind": "youtube#videoListResponse",
  "etag": etag,
  "nextPageToken": string,
  "prevPageToken": string,
  "pageInfo": {
    "totalResults": integer,
    "resultsPerPage": integer
  },
  "items": [ video Resource ]
}
```

| Property | Description |
|---|---|
| `kind` | `youtube#videoListResponse`. |
| `etag` | The Etag of this resource. |
| `nextPageToken` / `prevPageToken` | Tokens for the next/previous page (usable as `pageToken`). |
| `pageInfo.totalResults` | Total results in the result set. |
| `pageInfo.resultsPerPage` | Results included in the response. |
| `items[]` | Videos matching the request criteria. |

### 11.6 Errors specific to `videos.list`

| Type | Detail | Description |
|---|---|---|
| `badRequest (400)` | `videoChartNotFound` | The requested video chart is not supported or is not available. |
| `forbidden (403)` | `forbidden` | The request is not properly authorized to access video file or processing information. **The `fileDetails`, `processingDetails` and `suggestions` parts are only available to the video's owner.** |
| `forbidden (403)` | `forbidden` | The request cannot access user rating information. May occur because the request is not properly authorized to use `myRating`. |
| `notFound (404)` | `videoNotFound` | The video you are trying to retrieve cannot be found. Check the `id` parameter value. |

### 11.7 Sample request (from the overview)

```
GET https://www.googleapis.com/youtube/v3/videos?id=7lCDEYXw3mM&key=YOUR_API_KEY&part=snippet,contentDetails,statistics,status
```

Sample response structure (abridged from the overview): `kind: youtube#videoListResponse` with items of `kind: youtube#video` containing `snippet` (`publishedAt`, `channelId`, `title`, `description`, `thumbnails` with `default`, `medium`, `high`, `categoryId`), `contentDetails` (`duration` e.g. `PT15M51S`, `aspectRatio`), `statistics` (`viewCount`, `likeCount`, `dislikeCount`, `favoriteCount`, `commentCount`) and `status` (`uploadStatus`, `privacyStatus`).

---

## 12. Video resource

A `video` resource represents a YouTube video.

### 12.1 Methods on the `videos` resource

| Method | Description |
|---|---|
| `list` | Returns a list of videos matching the request parameters. |
| `batchGetStats` | Retrieves a list of video statistics matching the request parameters. |
| `getRating` | Ratings the authorized user gave to specified videos. |
| `insert` | Uploads a video and optionally sets metadata. |
| `update` | Updates a video's metadata. |
| `delete` | Deletes a YouTube video. |
| `rate` | Adds or removes a like/dislike rating. |
| `reportAbuse` | Reports a video for abusive content. |

### 12.2 Resource representation

```json
{
  "kind": "youtube#video",
  "etag": etag,
  "id": string,
  "snippet": {
    "publishedAt": datetime,
    "channelId": string,
    "title": string,
    "description": string,
    "thumbnails": {
      (key): { "url": string, "width": unsigned integer, "height": unsigned integer }
    },
    "channelTitle": string,
    "tags": [ string ],
    "categoryId": string,
    "liveBroadcastContent": string,
    "defaultLanguage": string,
    "localized": { "title": string, "description": string },
    "defaultAudioLanguage": string
  },
  "contentDetails": {
    "duration": string,
    "dimension": string,
    "definition": string,
    "caption": string,
    "licensedContent": boolean,
    "regionRestriction": { "allowed": [ string ], "blocked": [ string ] },
    "contentRating": { "...per-scheme rating fields..." },
    "projection": string,
    "hasCustomThumbnail": boolean
  },
  "status": {
    "uploadStatus": string,
    "failureReason": string,
    "rejectionReason": string,
    "privacyStatus": string,
    "publishAt": datetime,
    "license": string,
    "embeddable": boolean,
    "publicStatsViewable": boolean,
    "madeForKids": boolean,
    "selfDeclaredMadeForKids": boolean,
    "containsSyntheticMedia": boolean
  },
  "statistics": {
    "viewCount": string,
    "likeCount": string,
    "dislikeCount": string,
    "favoriteCount": string,
    "commentCount": string
  },
  "paidProductPlacementDetails": { "hasPaidProductPlacement": boolean },
  "player": { "embedHtml": string, "embedHeight": long, "embedWidth": long },
  "topicDetails": { "topicIds": [ string ], "relevantTopicIds": [ string ], "topicCategories": [ string ] },
  "recordingDetails": { "recordingDate": datetime },
  "fileDetails": { "...owner only..." },
  "processingDetails": { "...owner only..." },
  "suggestions": { "...owner only..." },
  "liveStreamingDetails": {
    "actualStartTime": datetime,
    "actualEndTime": datetime,
    "scheduledStartTime": datetime,
    "scheduledEndTime": datetime,
    "concurrentViewers": unsigned long,
    "activeLiveChatId": string
  },
  "brandPartner": { "channelId": string, "channelHandle": string },
  "localizations": { (key): { "title": string, "description": string } }
}
```

### 12.3 Core properties

| Property | Type | Description |
|---|---|---|
| `kind` | string | `youtube#video`. |
| `etag` | etag | The Etag of this resource. |
| `id` | string | The ID YouTube uses to uniquely identify the video. |

### 12.4 `snippet`

| Property | Description |
|---|---|
| `snippet.publishedAt` | Date and time the video was published (ISO 8601). May differ from upload time: a video uploaded private and made public later reports the time it was made public. Special cases: private upload retrieved by the channel owner reports upload time; unlisted upload reports upload time (anyone with the video ID can retrieve metadata); members-only upload reports upload time. |
| `snippet.channelId` | ID of the channel the video was uploaded to. **This value can change over time**, for example when a video is reassigned to a different channel (e.g. a topic channel or artist channel). |
| `snippet.title` | Title. Max **100 characters**; all valid UTF-8 except `<` and `>`. |
| `snippet.description` | Description. Max **5000 bytes**; all valid UTF-8 except `<` and `>`. URLs render as clickable links only if the channel meets platform requirements (e.g. verification or Advanced Features). Chapters can be created with formatted timestamps such as `00:00`. |
| `snippet.thumbnails` | Map of thumbnail images (see table below). |
| `snippet.channelTitle` | Title of the channel the video belongs to. |
| `snippet.tags[]` | Keyword tags (may contain spaces). Max 500 characters including commas between items; a tag with a space is counted as though wrapped in quotation marks (so `Foo-Baz` counts 7, `Foo Baz` counts 9). |
| `snippet.categoryId` | The YouTube video category (see `videoCategories.list`). |
| `snippet.liveBroadcastContent` | Whether the video is an upcoming/active live broadcast: `live`, `none`, `upcoming`. |
| `snippet.defaultLanguage` | Language of the text in `snippet.title` and `snippet.description`. |
| `snippet.localized` | Localized title and description, or the default-language title if no localized text is available. Localized text is returned when the `videos.list` request used `hl` and localized text exists in that language; otherwise default-language metadata is returned. Read-only; use `localizations` to add/update/delete. |
| `snippet.defaultAudioLanguage` | Language spoken in the video's default audio track. |

#### Thumbnail keys

| Key | Video / video-referencing resource | Channel |
|---|---|---|
| `default` | 120 × 90 px | 88 × 88 px |
| `medium` | 320 × 180 px | 240 × 240 px |
| `high` | 480 × 360 px | 800 × 800 px |
| `standard` | 640 × 480 px (available for some videos and resources that refer to videos) | n/a |
| `maxres` | 1280 × 720 px (available for some videos) | n/a |
| `fhd` | 1920 × 1080 px (some videos) | n/a |
| `qhd` | 2560 × 1440 px (some videos) | n/a |
| `uhd` | 3840 × 2160 px (some videos) | n/a |

### 12.5 `contentDetails`

| Property | Description |
|---|---|
| `contentDetails.duration` | Length of the video as an **ISO 8601 duration**. For 1 minute to under 1 hour: `PT#M#S` (e.g. `PT15M33S` = 15 min 33 s). For ≥ 1 hour: `PT#H#M#S`. For ≥ 1 day: `P#DT#H#M#S`. **The returned duration might differ slightly (e.g. by 1 second) from the actual playback duration** due to transcoding and encoding differences. |
| `contentDetails.dimension` | Whether the video is available in 3D or 2D. |
| `contentDetails.definition` | `hd` or `sd`. |
| `contentDetails.caption` | Whether captions are available: `true` / `false`. |
| `contentDetails.licensedContent` | Whether the video is licensed content: uploaded to a channel linked to a YouTube content partner and then claimed by that partner. |
| `contentDetails.regionRestriction` | Countries where the video is or is not viewable; contains **either** `allowed` **or** `blocked`. `allowed[]`: if present and a country is not listed, the video is blocked there; an empty list means blocked in all countries. `blocked[]`: if present and a country is not listed, the video is viewable there; an empty list means viewable in all countries. |
| `contentDetails.contentRating` | Ratings the video received under various rating schemes. Per-scheme string fields: `acbRating`, `agcomRating`, `anatelRating`, `bbfcRating`, `bfvcRating`, `bmukkRating`, `catvRating`, `catvfrRating`, `cbfcRating`, `cccRating`, `cceRating`, `chfilmRating`, `chvrsRating`, `cicfRating`, `cnaRating`, `cncRating`, `csaRating`, `cscfRating`, `czfilmRating`, `djctqRating` (+ `djctqRatingReasons[]`), `ecbmctRating`, `eefilmRating`, `egfilmRating`, `eirinRating`, `fcbmRating`, `fcoRating`, `fmocRating` (deprecated 2 Nov 2015; use `cncRating`), `fpbRating` (+ `fpbRatingReasons[]`), `fskRating`, `grfilmRating`, `icaaRating`, `ifcoRating`, `ilfilmRating`, `incaaRating`, `kfcbRating`, `kijkwijzerRating`, `kmrbRating`, `lsfRating`, `mccaaRating`, `mccypRating`, `mcstRating`, `mdaRating`, `medietilsynetRating`, `mekuRating`, `mibacRating`, `mocRating`, `moctwRating`, `mpaaRating`, `mpaatRating`, `mtrcbRating`, `nbcRating`, `nfrcRating`, `nfvcbRating`, `nkclvRating`, `oflcRating`, `pefilmRating`, `resorteviolenciaRating`, `rtcRating`, `rteRating`, `russiaRating`, `skfilmRating`, `smaisRating`, `smsaRating`, `tvpgRating`, `ytRating`. The enumerated values for each scheme are defined on the official Videos page. `ytRating` identifies age-restricted content; its valid value is `ytAgeRestricted`. |
| `contentDetails.projection` | `360` or `rectangular`. |
| `contentDetails.hasCustomThumbnail` | Whether the uploader provided a custom thumbnail; visible only to the uploader. |

### 12.6 `status`

| Property | Description |
|---|---|
| `status.uploadStatus` | `deleted`, `failed`, `processed`, `rejected`, `uploaded`. |
| `status.failureReason` | Why an upload failed: `codec`, `conversion`, `emptyFile`, `invalidFile`, `tooSmall`, `uploadAborted`. |
| `status.rejectionReason` | Why YouTube rejected an upload: `claim`, `copyright`, `duplicate`, `inappropriate`, `legal`, `length`, `termsOfUse`, `trademark`, `uploaderAccountClosed`, `uploaderAccountSuspended`. |
| `status.privacyStatus` | `private`, `public`, `unlisted`. In `videos.insert`, defaults to `public` if unspecified (certain uploads might default to private per creator account settings). Videos uploaded from unverified API projects are not restricted to private viewing mode (per this page's current text). |
| `status.publishAt` | Scheduled publish time (ISO 8601). Settable only if privacy status is `private` and the video has never been published; in `videos.update` you must also set `privacyStatus` to `private`. A past time publishes the video right away. |
| `status.license` | `creativeCommon` or `youtube`. |
| **`status.embeddable`** | **Whether the video can be embedded on another website. Note: even if the uploader's settings allow embedding, videos may still be blocked from playback in embedded players due to platform policies or third-party claims (such as Content ID).** |
| `status.publicStatsViewable` | Whether the extended statistics on the watch page are publicly viewable (default viewable; view counts and ratings remain publicly visible even if `false`). |
| `status.madeForKids` | Whether the video is designated child-directed; the current "made for kids" status (e.g. determined from `selfDeclaredMadeForKids`). |
| `status.selfDeclaredMadeForKids` | Lets the owner designate the video as child-directed in insert/update. In `videos.list`, returned only if the channel owner authorized the request. |
| `status.containsSyntheticMedia` | Lets the owner disclose realistic altered or synthetic (A/S) content in insert/update. |

### 12.7 `statistics`

| Property | Description |
|---|---|
| `statistics.viewCount` | Number of times the video has been viewed. **Starting August 24, 2026**, for all video formats (long-form, Live and Shorts) on a channel, `viewCount` is updated to count views the moment a video begins to play (includes autoplay, hold the pointer over, and click/tap to play). |
| `statistics.likeCount` | Number of users who liked the video. |
| `statistics.dislikeCount` | Made **private as of December 13, 2021**: only included if the request was authenticated by the video owner. |
| `statistics.favoriteCount` | **Deprecated** (effective 28 August 2015); value is now always `0`. |
| `statistics.commentCount` | Number of comments. |

### 12.8 `player`

| Property | Description |
|---|---|
| `player.embedHtml` | An `<iframe>` tag that embeds a player playing the video. If the request specified `maxHeight` and/or `maxWidth`, the player is scaled to satisfy them. **If the video's aspect ratio is unknown, the embedded player defaults to 4:3.** |
| `player.embedHeight` | Height of the player in `embedHtml`; only returned if the request specified `maxHeight` and/or `maxWidth` and the aspect ratio is known. |
| `player.embedWidth` | Width of the player in `embedHtml`; same conditions. |

### 12.9 Other parts

| Part / property | Description |
|---|---|
| `paidProductPlacementDetails.hasPaidProductPlacement` | `true` if the content uses paid product placement. Defaults to `false`. |
| `topicDetails.topicIds[]` | **Deprecated** as of 10 November 2016; the API no longer returns values; topics are returned in `relevantTopicIds[]`. |
| `topicDetails.relevantTopicIds[]` | Topic IDs relevant to the video. Since 27 February 2017 a small set of curated IDs is returned (see [§17](#17-supported-topic-ids)). |
| `topicDetails.topicCategories[]` | Wikipedia URLs giving a high-level description of the video's content. |
| `recordingDetails.recordingDate` | Date/time the video was recorded (ISO 8601, `YYYY-MM-DDThh:mm:ss.sssZ`). `locationDescription` and `location.latitude/longitude` are deprecated as of 1 June 2017; `location.altitude` deprecated as of 9 July 2018. |
| `liveStreamingDetails` | Present only if the video is an upcoming, live or completed live broadcast. `actualStartTime`, `actualEndTime`, `scheduledStartTime`, `scheduledEndTime` (empty or absent means scheduled to continue indefinitely), `concurrentViewers` (present if the broadcast has current viewers and the owner has not hidden the count; YouTube stops tracking at broadcast end), `activeLiveChatId`. |
| `brandPartner` | Brand partner linked to the video for Creator Initiated Brand Partner Access: `channelId` (begins with `UC`) and `channelHandle` (begins with `@`); only `channelId` is returned in responses. |
| `localizations` | Translations of title and description, keyed by **BCP-47** language code. |
| `fileDetails`, `processingDetails`, `suggestions` | **Owner-only** parts about the uploaded file, YouTube's processing progress, and improvement suggestions. `fileDetails` is returned only if `processingDetails.fileAvailability` is `available`; `suggestions` only if `tagSuggestionsAvailability` or `editorSuggestionsAvailability` is `available`. |

---

## 13. Pagination

* The API uses the **`maxResults`** parameter to say how many items a response includes. Almost all of the API's `list` methods (`videos.list`, `playlists.list`, etc.) support it.
* If more results are available, the response contains a **`nextPageToken`**, a **`prevPageToken`**, or both. Use those values as the **`pageToken`** parameter to fetch another page.
* Example: first request `part=snippet&maxResults=10&order=viewCount&q=skateboarding+dog&type=video` returns the first 10 matches and a `nextPageToken`; the next request repeats the same parameters and adds `pageToken=<value>`.
* Method-specific rules already stated above:
  * `search.list`: `maxResults` 0–50 (default 5); fewer items than requested may be returned even when more are available; rely on `nextPageToken`; `pageInfo.totalResults` is an approximation capped at 1,000,000 and must not be used to build pagination links; `channelId` + `type=video` is constrained to a maximum of 500 videos.
  * `videos.list`: `maxResults` and `pageToken` are supported with `myRating` but **not** with `id`; `myRating` paging is limited to the latest 1,000 items.
  * Each additional page costs the method's quota cost (see [§5](#5-quota)).
* Error: `invalidPageToken (400)` – "The request specifies an invalid page token."

---

## 14. Errors

### 14.1 Error response shape

The global-domain page shows an error body of this shape:

```json
{
  "error": {
    "errors": [
      {
        "domain": "global",
        "reason": "invalidParameter",
        "message": "Invalid string value: 'asdf'. Allowed values: [mostpopular]",
        "locationType": "parameter",
        "location": "chart"
      }
    ],
    "code": 400,
    "message": "Invalid string value: 'asdf'. Allowed values: [mostpopular]"
  }
}
```

Errors are listed by HTTP status code (RFC 7231). Many APIs define their own `domain` value, such as `youtube.parameter`, for API-specific errors.

### 14.2 YouTube Data API errors (general)

**Core API errors**

| Type | Detail | Description |
|---|---|---|
| `forbidden (403)` | `forbidden` | Access forbidden. The request may not be properly authorized. |
| `quotaExceeded (403)` | `quotaExceeded` | The request cannot be completed because you have exceeded your quota. |

**Common request errors**

| Type | Detail | Description |
|---|---|---|
| `badRequest (400)` | `incompatibleParameters` | Two or more parameters that cannot be used in the same request. |
| `badRequest (400)` | `invalidFilters` | The request specifies an invalid filter parameter. |
| `badRequest (400)` | `invalidPageToken` | The request specifies an invalid page token. |
| `badRequest (400)` | `missingRequiredParameter` | The request is missing a required parameter. |
| `badRequest (400)` | `unexpectedParameter` | The request specifies an unexpected parameter. |
| `forbidden (403)` | `accountDelegationForbidden` | The authenticated user cannot act on behalf of the specified Google Account. |
| `forbidden (403)` | `authenticatedUserAccountClosed` | The authenticated user's YouTube account is closed. |
| `forbidden (403)` | `authenticatedUserAccountSuspended` | The authenticated user's YouTube account is suspended. |
| `forbidden (403)` | `authenticatedUserNotChannel` | The authenticated user must resolve to a channel but does not. With `onBehalfOfContentOwner`, also set `onBehalfOfContentOwnerChannel`. |
| `forbidden (403)` | `channelClosed` | The channel identified in the request has been closed. |
| `forbidden (403)` | `channelNotFound` | The channel identified in the request cannot be found. |
| `forbidden (403)` | `channelSuspended` | The channel identified in the request has been suspended. |
| `forbidden (403)` | `cmsUserAccountNotFound` | The CMS user is not allowed to act on behalf of the content owner. |
| `forbidden (403)` | `insufficientCapabilities` | The CMS user has insufficient capabilities. |
| `forbidden (403)` | `insufficientPermissions` | The OAuth 2.0 token's scopes are insufficient for the requested data. |
| `notFound (404)` | `contentOwnerAccountNotFound` | The specified content owner account was not found. |

**Request context errors**

| Type | Detail | Description |
|---|---|---|
| `badRequest (400)` | `invalidLanguage` | `hl` value is not a valid language code. |
| `badRequest (400)` | `invalidMine` | The use of the `mine` parameter is not supported (also: cannot be used when the authenticated user is a YouTube partner). |
| `badRequest (400)` | `invalidPart` | `part` specifies parts that cannot be written at the same time. |
| `badRequest (400)` | `invalidRegionCode` | `regionCode` specifies an invalid region code. |
| `badRequest (400)` | `unexpectedPart` | `part` specifies an unexpected value. |
| `badRequest (400)` | `unknownPart` | `part` specifies an unknown value. |
| `badRequest (400)` | `unsupportedLanguageCode` | `hl` is not a supported language code. |
| `badRequest (400)` | `unsupportedRegionCode` | `regionCode` specifies an unsupported region code. |
| `unauthorized (401)` | `authorizationRequired` | The request uses the `mine` parameter but is not properly authorized. |
| `unauthorized (401)` | `youtubeSignupRequired` | The user has an unlinked Google Account (no YouTube channel). Commonly seen if you try the OAuth 2.0 **Service Account** flow: YouTube does not support Service Accounts. |

Method-specific error tables for `search.list` and `videos.list` are in [§8.7](#87-errors-specific-to-searchlist) and [§11.6](#116-errors-specific-to-videoslist).

### 14.3 Global domain errors (selection relevant to keys, quota and rate)

| HTTP | Reason | Description |
|---|---|---|
| 304 | `notModified` | The `If-None-Match` condition was not met; the document has not been modified; use the cached response. |
| 400 | `badRequest` | The API request is invalid or improperly formed. |
| 400 | `invalid` | The request contained an invalid value (parameter, header or property). |
| 400 | `invalidParameter` | Contained an invalid parameter or parameter value. |
| 400 | `invalidQuery` | The request is invalid; check the `q` parameter and parameter combinations. |
| 400 | `keyExpired` | The API key expired, so the server cannot check the quota limit; obtain a new key in the console. |
| 400 | `keyInvalid` | The API key is invalid, so the server cannot check the quota limit. |
| 400 | `required` | Missing required information (parameter or resource property). |
| 401 | `authError` | Invalid authorization credentials; check the `Authorization` header. |
| 401 | `expired` | Session expired. |
| 402 | `dailyLimitExceeded402`, `quotaExceeded402`, `user402` | Developer-set daily budget reached / quota exceeded and payment required / payment from the user required. |
| 403 | `accessNotConfigured` | The project is not configured to access this API (activate it in the console), has been blocked due to abuse, or is marked for deletion. |
| 403 | `dailyLimitExceeded` | A daily quota limit for the API has been reached (also used when the project has been blocked due to abuse). |
| 403 | `dailyLimitExceededUnreg` | Daily limit for unauthenticated use reached; sign up through the console. |
| 403 | `concurrentLimitExceeded` | A concurrent usage limit has been reached. |
| 403 | `insufficientPermissions` | The authenticated user lacks permissions. |
| 403 | `limitExceeded` | Cannot be completed due to access or rate limitations. |
| 403 | `quotaExceeded` | The operation requires more resources than the quota allows. |
| 403 | `rateLimitExceeded` | Too many requests within a given time span. |
| 403 | `rateLimitExceededUnreg` | A rate limit was exceeded and the application must be registered. |
| 403 | `responseTooLarge` | The requested resource is too large to return. |
| 403 | `servingLimitExceeded` | The overall rate limit specified for the API has been reached. |
| 403 | `sslRequired` | SSL is required for this operation. |
| 403 | `userRateLimitExceeded` | A per-user rate limit has been reached. |
| 403 | `userRateLimitExceededUnreg` | Per-user rate limit reached and the developer was not identified; create a project in the console. |
| 403 | `variableTermLimitExceeded`, `variableTermExpiredDailyExceeded` | A variable-term quota limit was reached / expired with daily limit reached. |
| 404 | `notFound` | A resource associated with the request could not be found. |
| 409 | `conflict`, `duplicate` | The operation would conflict with an existing item. |
| 410 | `deleted` | The associated resource has been deleted. |
| 412 | `conditionNotMet` | The `If-Match` or `If-None-Match` condition was not met. |
| 428 | `preconditionRequired` | An `If-Match` or `If-None-Match` header is required. |
| 429 | `rateLimitExceeded` | Too many requests within a given time span. |
| 500 | `internalError` | Request failed due to an internal error. |
| 501 | `notImplemented`, `unsupportedMethod` | Operation not implemented / unknown method. |
| 503 | `backendError`, `backendNotConnected`, `notReady` | Backend error / connection error / server not ready to accept requests. |

The full global-domain page also lists 301/303/307 redirect codes, 405, 413, 416 and 417 entries.

---

## 15. YouTube API Services: Developer Policies

These policies are a component of the Agreement (the YouTube API Services Terms of Service). Wording style in the source: **must**/**must not** are absolute; **should** indicates best practice; **may** is optional. Section numbers refer to the Developer Policies page. Note from the source: if local law requires something different (e.g. storing data for a particular length of time), comply with that law.

### 15.1 Software development principles (II)

1. **Build high-quality applications and maintain them.**
2. **Be honest and transparent** (identity, data collection, storage, sharing, use, deletion).
3. **Give users control** (users must know about and have actively consented to actions taken on their behalf; each API Client must provide a privacy policy).
4. **Respect users' privacy** (do not store user data indefinitely; give a clear process to delete data; do not collect users' YouTube login credentials).
5. **Be a good citizen** (no abuse/harassment enabling, malware, law-breaking).

### 15.2 API Client terms and privacy (III.A)

* Display a link to YouTube's Terms of Service (`https://www.youtube.com/t/terms`) and state in your own terms of use that by using the API Client users agree to be bound by the YouTube Terms of Service.
* Require users to agree to a privacy policy **before** accessing the API Client's features. The privacy policy must: be prominently displayed and easily accessible at all times; notify users that the API Client uses YouTube API Services; reference and link to the Google Privacy Policy (`http://www.google.com/policies/privacy`); explain what user information (including API Data relating to users) is accessed, collected, stored and used; explain how it is used, processed and shared (internal or external); disclose third-party content/advertising; disclose device storage/cookies or similar; if Authorized Data is used, explain that users can revoke access via the Google security settings page (`https://security.google.com/settings/security/permissions`) and how to contact the developer.

### 15.3 Maintainability (III.B)

* Use the most recent versions of YouTube API Services; be able to update; non-website clients must be remotely updatable; changes are documented in the Terms of Service Revision History (RSS feed available).

### 15.4 Implementing YouTube features (III.C)

* Comply with the **Required Minimum Functionality** (RMF) and do not place limitations on functionality required by it.
* Any feature that initiates a user action related to a YouTube resource must be (a) clearly identifiable as a YouTube action, (b) distinct and not mixed with your own functionality, and (c) clearly initiated by the user. Examples of resources: videos, channels, playlists, playlist items, subscriptions; examples of actions: playing a video, liking, adding to a playlist, subscribing.
* Write operations: you may suggest values but users have final control; do not modify user-provided values (truncate/append) without explicit consent.
* **III.C.5: API Clients that use search functionality provided by YouTube API Services must not modify or replace the text, images, information or other content of the search results returned. For example, they must not merge or intermix results from sources other than YouTube and present them as YouTube search results.**
* Do not limit or reduce the functionality of a YouTube feature unless it is a core aspect of the API Client and not required by RMF ("Permitted Feature Limitation"); explain limitations to users and make clear they are not imposed by YouTube.
* Offer feature parity across sources to the extent it exists; do not consistently present YouTube features detrimentally.

### 15.5 Accessing YouTube API Services (III.D)

1. **API credentials (III.D.1)**
   * Create credentials for your API Project in the Google Developers Console.
   * Do not mask or misrepresent identity. Use only credentials assigned to you and your API Project.
   * **Create exactly one (1) API Project per API Client**; do not use one project for multiple API Clients.
   * You may share credentials only with agents operating solely on your behalf under a written duty of confidentiality; **do not share them with other third parties or embed credentials in open source projects**.
2. **User authentication and authorization (III.D.2)**
   * Do not obtain, proxy, request, collect, modify, cache, store or use user login credentials.
   * Obtain user consent; request only authorization scopes you currently use (no "future-proofing"); request scopes in context where possible.
   * Identify the entity requesting data and the reason; do not use user data for secondary undisclosed purposes.
   * **Revocation:** provide an easy way to revoke consent; when a user revokes, programmatically revoke the token immediately, and delete all Authorized Data accessed or stored under that consent as soon as possible and within **7 calendar days**. If revocation happens via the Google security settings page, delete related API Data within **30 calendar days**; periodically reconfirm that authorization tokens are still valid.
3. **Usage and quotas (III.D.3)**
   * YouTube may use quotas and place use restrictions. To extend quota you apply by completing an **API Compliance Audit** form specifying the use case. If audited in the past 12 months and marked compliant, you can apply for an additional quota extension. Additional quota may only be used for the approved use case; if the use case changes, resubmit the audit. If rejected, you can file an appeal.
4. **Inactivity (III.D.4):** YouTube may disable or curtail access (revoke credentials, reduce or eliminate quota) if your API Project has been **inactive for 90 consecutive days**; you may reapply.
5. **Contact (III.D.5):** the primary contact is the email on the Google Account used in the Developers Console; you must comply with compliance communications.
6. **Prohibited access (III.D.6):** no access if credentials or the account were suspended, revoked or terminated; no creating new accounts/projects via proxy to evade.
7. **Undocumented services (III.D.7):** do not use undocumented APIs without express permission; do not reverse engineer.

### 15.6 Handling YouTube data and content (III.E)

Aside from the permissions granted in this section, you have no further rights to API Data, including temporarily stored API Data.

1. **Audiovisual content (III.E.1):** you must not, and must not encourage, enable, or require others to: **download, import, backup, cache, or store copies of YouTube audiovisual content without YouTube's prior written approval; make content available for offline playback;** or use YouTube API Services to facilitate or promote copyright infringement.
2. **Data aggregation (III.E.2):** do not aggregate API Data except for channels under the same content owner (viewable only by that owner); do not aggregate or use API Data to gain insights into YouTube's usage, revenue or other aspects of YouTube's business.
3. **Authorized Data usage (III.E.3):** be honest and transparent; do not display Authorized Data to anyone other than the authorizing user or agents expressly approved; use only within the scope of the privacy policy and consent; identify actions that insert/share/update/delete on the user's behalf and obtain express consent before execution; identify the associated channel or content owner; do not modify visibility settings without express instruction.
4. **Refreshing, storing and displaying API Data (III.E.4)**
   * (a) Authorization tokens may be stored as long as necessary for purposes consistent with the active user's consent.
   * (b) Certain Authorized Data (Analytics API data, Reporting API data, and **statistics such as view counts, subscriber counts or videos in a playlist** that are Authorized Data) may be stored as long as necessary, but you must still verify **every 30 days** that authorization has not been revoked and that the video has not been deleted. **Statistics retrieved as Non-Authorized Data must not be stored for more than 30 days** (example: a channel's subscriber count).
   * (c) Other Authorized Data may be stored no longer than **30 calendar days**; after that, delete or refresh.
   * **(d) You may temporarily store limited amounts of Non-Authorized Data for as long as necessary for the purposes of the API Client but not longer than 30 calendar days; after 30 days you must delete or refresh the stored data.**
   * (e) Use reasonable efforts to keep stored API Data consistent with the current data available; reflect metadata changes and view count updates as quickly as possible.
   * (f) **Display the most updated API Data available** in user-facing presentations; historical data may be displayed if presented accurately in context of time.
   * (g) Provide a way for a user to request deletion of stored data; delete as soon as possible and within **7 calendar days**; make clear that deleting your stored data does not affect data stored by YouTube. If a user deletes their account from your API Client, delete their stored user data within 7 calendar days.
   * (h) **Do not (i) replace API Data with similar independently calculated data, or (ii) use API Data to create new or derived data or metrics.** Any non-YouTube information shown alongside API Data must be clearly and prominently disclosed as not from YouTube. Example: use the like count returned by the API; do not compute scores from likes and views.
   * (i) The YouTube embedded player shares basic user data with YouTube on load (to render thumbnail and title, determine playability and content restrictions, and for fraud and abuse reasons); more data is shared on playback. With Autoplay enabled, playback data collection happens on page load. You can limit data shared before user interaction by setting Autoplay to `false`.
   * (j) **API Clients must look up the Made For Kids status of each YouTube video that they embed** (following the official "Find MadeForKids video status" guide). For each video designated Made For Kids, turn off tracking and ensure data collection with respect to that player complies with applicable laws including COPPA and GDPR.
5. **Security (III.E.5):** maintain appropriate administrative, organisational, technical and physical controls; use only industry-standard transport encryption; protect API Data from unauthorized access, use or disclosure.
6. **Scraping (III.E.6):** do not scrape YouTube Applications or Google Applications or obtain scraped YouTube data; public search engines may scrape only per YouTube's robots.txt.

### 15.7 User experience (III.F)

* **Look and feel (III.F.1):** do not change or interfere with YouTube Applications' user interfaces without prior written approval.
* **Branding (III.F.2):** any page or feature that displays YouTube content (search results, videos, channels, playlists, thumbnails, players) must make clear that YouTube is the source by displaying YouTube Brand Features per the Branding Guidelines; content that does not originate from YouTube must not appear to originate from YouTube; do not interfere with or obscure attribution (including attribution in embedded players).
* **Playback integrity (III.F.3):** do not charge users to watch content in an embedded YouTube player; do not gate access to a video by requiring an action other than clicking play (e.g. subscribing or liking), although actions not specific to YouTube API Services such as login or age verification are allowed; do not offer incentives or rewards for engaging with YouTube Applications (viewing, liking, sharing, subscribing, commenting).

### 15.8 Distribution and commercial use (III.G)

Prohibited (some need prior written approval): sell, purchase, lease, lend, convey, redistribute or sublicense YouTube API Services including YouTube audiovisual content; sell access to API Services components without approval; sell advertising/sponsorships/promotions placed on or within YouTube audiovisual content or the player without approval; sell advertising on any page that contains YouTube API Data unless other non-YouTube content on the same page offers enough independent value.

Permitted (subject to other terms): selling an API Client; promoting your own business via YouTube uploads; ad-enabled API Clients subject to the above; placing your own branding that complies with the Branding Guidelines and does not interfere with playback or YouTube Brand Features; selling or distributing devices that run an API Client.

### 15.9 Monitoring and audits (III.H)

YouTube may survey, monitor and audit access/use; you must not interfere with or conceal use, and must provide accounts to access all features of in-production API Clients upon request.

### 15.10 Additional prohibitions (III.I)

You and your API Clients must not, and must not encourage, enable or require others to:

1. Use YouTube API Services to create, offer, or act as a substitute for, or substantially similar service to, any YouTube Applications; **do not mimic or replicate YouTube's core user experiences by recreating features or process flows unless you add significant independent value or functionality that improves users' interactions with YouTube** (example: do not recreate the browse experience of a YouTube Application without adding significant independent value).
2. Misuse the services or engage in abusive behaviours; do not automate or trigger views, uploads, comments, likes, dislikes or other actions without the user's prior specific and express consent.
3. Interfere with the proper workings of API Services or YouTube/Google Applications.
4. Modify, interfere with, replace or disable any functionality, data or content made available with the API Services; do not remove, obscure, alter or disable links in YouTube players or in API Data.
5. Modify, interfere with, replace or block advertisements placed or served by YouTube.
6. **Modify, build upon, or block any portion or functionality of a YouTube player.**
7. **Separate, isolate, or modify the audio or video components of any YouTube audiovisual content** (e.g. do not apply alternate audio tracks).
8. **Promote separately the audio or video components** of YouTube audiovisual content.
9. **Create, include, or promote features that play content, including audio or video components, from a background player, meaning a player that is not displayed in the page, tab, or screen that the user is viewing.**
10. Adversely affect the functionality or performance of the API Services or YouTube/Google Applications.
11. Confuse, deceive, defraud, mislead, misrepresent, defame, abuse, stalk, threaten, spam, surprise or harass anyone.
12. Introduce viruses, malware, etc.
13. Circumvent geographical restrictions, including IP-based restrictions.
14. **Use any technology other than YouTube API Services to access or retrieve API Data, including any portion of YouTube audiovisual content.**
15. Offer an API service that allows users to access data or functionality provided by the YouTube API Services.
16. Modify, translate, create derivative works of, or reverse engineer API Services or related software.
17. Use the API Services where failure could lead to death, personal injury or environmental damage.
18. Infringe copyrights or exploit copyright-infringing materials.
19. Engage in, promote or facilitate unlawful online gambling.
20. Create, display, promote or facilitate disruptive commercial messages or advertisements.
21. **Situate the YouTube player in a nested or hierarchical iframe lineage to circumvent YouTube policies or obfuscate the source of use.**

### 15.11 Child-directed API Clients (III.J)

If an API Client (or part of it) targets children (as defined by laws including COPPA and GDPR): ensure compliance at all times; notify Google of its child-directed nature using Google's provided tools; do not use personalized ads (including remarketing) to target past/current activity of users. Child-Directed API Clients and their users must not perform YouTube API Services **write-based actions** (such as uploading, commenting, creating/sharing playlists) to YouTube; write actions by users of known child-directed clients are not implemented on YouTube. A separate "Upload Project" arrangement (project ID prefixed `mfk110`) exists for uploading your own videos from a non-child-directed client.

### 15.12 Reporting noncompliance (III.K) and derived metrics (III.L)

* You may report others' noncompliance using Google's form.
* **III.L:** additional policies on derived metrics and data storage apply only to **audited developers with analytics use cases that have explicitly applied** for permission through the standard quota extension request form (starting 1 June 2026); details are on the separate "Additional policies for derived metrics and data storage" page (not retrieved).

### 15.13 Key definitions (IV)

| Term | Meaning (abridged) |
|---|---|
| API Client | A website or software application you develop that accesses or uses YouTube API Services. |
| API Credentials | Credentials assigned via the Google Developer Console that each API Project authenticates with. |
| API Data | Data, content (including audiovisual content) and information provided to API Clients through the YouTube API services. |
| API Project | The Google Developer Console project required for API Clients to access YouTube API Services. |
| Authorized Data | API Data that an active user expressly authorizes an API Client to access via User Credentials. |
| Non-Authorized Data | API Data accessible by an API Client without User Credentials. |
| YouTube Applications | YouTube websites, apps, services and properties (youtube.com, m.youtube.com, mobile apps), excluding YouTube API Services. |
| YouTube Brand Features | YouTube's trade names, trademarks, service marks, logos, domain names and other distinctive brand features. |

---

## 16. Required Minimum Functionality (embedded player)

The RMF defines minimum functional requirements for API clients and is an integral part of the YouTube API Terms of Service. The document warns the requirements will change over time (see the Terms of Service revision history).

### 16.1 API Client identity and credentials

* API Clients that use the YouTube embedded player (**including the YouTube IFrame Player API**) **must provide identification through the `HTTP Referer` request header.**
* In environments where the browser sets `Referer` automatically, make sure you are not setting `Referrer-Policy` in a way that suppresses it. **YouTube recommends `strict-origin-when-cross-origin`**, already the default in many browsers.
* If integrating the player in a window created with JavaScript `window.open`, **do not use the `noreferrer` feature**.
* In WebViews (mobile or desktop apps), `Referer` is empty by default; typical techniques include: local HTML file with `baseUrl` (`loadDataWithBaseURL` on Android, `loadHTMLString:baseURL:` on iOS); loading `https://www.youtube.com/embed/VIDEO_ID` directly with a `Referer` header (Android `loadUrl` with `additionalHttpHeaders`, iOS `loadRequest:`); Android `CustomTabs` with `Intent.EXTRA_REFERRER` using the `android-app://` scheme; `SFSafariViewController` (cannot set `Referer`, so set the `origin` player parameter instead); desktop apps by adding a header.
* **Referer format:** a fully qualified URL with `HTTPS`; the domain must be your app identifier ("app ID") registered with the store (e.g. reverse-DNS such as `com.google.android.youtube`; bundle ID on Apple platforms). When the store app ID is a generated alphanumeric string, use `<my-app-name>.<AppID>`.
* Library/framework owners must retrieve the app ID or let developers pass it so `Referer` (and the `widget_referrer` player parameter, if appropriate) can be set.
* **For API Clients with a high number of requests to YouTube, additional credentials might be required to access the YouTube embedded player. Failure to comply with these requirements might result in reduced functionality in the YouTube embedded player.**

### 16.2 WebView type

When integrating the embedded player in a WebView, use one of the OS-provided WebView types when available (Android `WebView` or `CustomTabs`; Apple `WKWebView` or `SFSafariViewController`).

### 16.3 Embedded player size

* Embedded players must have a viewport **at least 200px by 200px**.
* If the player displays controls, it must be large enough to fully display them without shrinking the viewport below the minimum size.
* Recommended: **16:9 players at least 480 pixels wide and 270 pixels tall.**

### 16.4 Autoplay and scripted playbacks

Applies to players using the `autoplay` player parameter or programmatically initiating automatic playback via the IFrame Player API or another YouTube API service.

* Players that automatically play should initiate playback immediately when the page loads or as soon as the player is fully visible; however an API Client must **not initiate automatic playback until the player is visible and more than half of the player is visible** on the page or screen.
* A page or screen **must not have more than one YouTube player that automatically plays content simultaneously**.
* Any YouTube thumbnail that initiates a playback must be at least **120 pixels wide and 70 pixels tall**.

### 16.5 Player attributes, overlays and mouseovers

* **Player attributes:** attributes and parameters of the player, including the appearance of YouTube branding in the player, are specified in YouTube API documentation; **you must not make changes to the YouTube player that are not explicitly described by the API documentation.**
* **Overlays and frames:** **you must not display overlays, frames, or other visual elements in front of any part of a YouTube embedded player, including player controls**, and must not use them to obscure any part of an embedded player, including controls.
* **Mouseovers:** you must not use mouseovers or touch events on a YouTube player to initiate any action on the user's behalf, such as opening a window or subscribing to a channel.

### 16.6 Other RMF sections (not specific to a search/playback app)

The RMF also defines required data and display rules for: uploading videos (title up to 100 characters, description up to 5000 bytes, and privacy status must be user-settable), displaying comments, adding comments, adding comment replies, editing/deleting comment replies, and banning a user from live chat.

---

## 17. Supported topic IDs

Used by the `search.list` `topicId` parameter and returned in `topicDetails.relevantTopicIds[]`. Since 27 February 2017 only this curated set is supported (list "as of February 15, 2017").

| Category | ID | Topic |
|---|---|---|
| Music | `/m/04rlf` | Music (parent topic) |
| | `/m/02mscn` | Christian music |
| | `/m/0ggq0m` | Classical music |
| | `/m/01lyv` | Country |
| | `/m/02lkt` | Electronic music |
| | `/m/0glt670` | Hip hop music |
| | `/m/05rwpb` | Independent music |
| | `/m/03_d0` | Jazz |
| | `/m/028sqc` | Music of Asia |
| | `/m/0g293` | Music of Latin America |
| | `/m/064t9` | Pop music |
| | `/m/06cqb` | Reggae |
| | `/m/06j6l` | Rhythm and blues |
| | `/m/06by7` | Rock music |
| | `/m/0gywn` | Soul music |
| Gaming | `/m/0bzvm2` | Gaming (parent topic) |
| | `/m/025zzc` | Action game |
| | `/m/02ntfj` | Action-adventure game |
| | `/m/0b1vjn` | Casual game |
| | `/m/02hygl` | Music video game |
| | `/m/04q1x3q` | Puzzle video game |
| | `/m/01sjng` | Racing video game |
| | `/m/0403l3g` | Role-playing video game |
| | `/m/021bp2` | Simulation video game |
| | `/m/022dc6` | Sports game |
| | `/m/03hf_rm` | Strategy video game |
| Sports | `/m/06ntj` | Sports (parent topic) |
| | `/m/0jm_` | American football |
| | `/m/018jz` | Baseball |
| | `/m/018w8` | Basketball |
| | `/m/01cgz` | Boxing |
| | `/m/09xp_` | Cricket |
| | `/m/02vx4` | Football |
| | `/m/037hz` | Golf |
| | `/m/03tmr` | Ice hockey |
| | `/m/01h7lh` | Mixed martial arts |
| | `/m/0410tth` | Motorsport |
| | `/m/07bs0` | Tennis |
| | `/m/07_53` | Volleyball |
| Entertainment | `/m/02jjt` | Entertainment (parent topic) |
| | `/m/09kqc` | Humor |
| | `/m/02vxn` | Movies |
| | `/m/05qjc` | Performing arts |
| | `/m/066wd` | Professional wrestling |
| | `/m/0f2f9` | TV shows |
| Lifestyle | `/m/019_rr` | Lifestyle (parent topic) |
| | `/m/032tl` | Fashion |
| | `/m/027x7n` | Fitness |
| | `/m/02wbm` | Food |
| | `/m/03glg` | Hobby |
| | `/m/068hy` | Pets |
| | `/m/041xxh` | Physical attractiveness [Beauty] |
| | `/m/07c1v` | Technology |
| | `/m/07bxq` | Tourism |
| | `/m/07yv9` | Vehicles |
| Society | `/m/098wr` | Society (parent topic) |
| | `/m/09s1f` | Business |
| | `/m/0kt51` | Health |
| | `/m/01h6rj` | Military |
| | `/m/05qt0` | Politics |
| | `/m/06bvp` | Religion |
| Other | `/m/01k8wb` | Knowledge |

---

## 18. Other resources and methods in the API

For completeness, the reference lists these resources and methods (only `search.list` and `videos.list` are documented in detail above):

| Resource | Methods |
|---|---|
| Activities | list |
| Captions | list, insert, update, download, delete |
| ChannelBanners | insert |
| Channels | list, update |
| ChannelSections | list, insert, update, delete |
| Comments | list, insert, update, setModerationStatus, delete |
| CommentThreads | list, insert |
| i18nLanguages | list |
| i18nRegions | list |
| Members | list |
| MembershipsLevels | list |
| PlaylistImages | list, insert, update, delete |
| PlaylistItems | list, insert, update, delete |
| Playlists | list, insert, update, delete |
| Search | list |
| Subscriptions | list, insert, delete |
| Thumbnails | set |
| VideoAbuseReportReasons | list |
| VideoCategories | list |
| Videos | list, insert, update, rate, getRating, reportAbuse, delete, batchGetStats |
| Watermarks | set, unset |

Related facts from the documentation about methods that touch these resources:

* `playlistItems.list` is the method the documentation points to for reliably retrieving a channel's most recent uploads (the channel's uploads playlist), rather than `search.list` with `order=date`.
* `i18nRegions.list` returns the supported regions referenced by `regionCode`; `i18nLanguages.list` returns the language codes accepted by `hl`.
* `videoCategories.list` provides the category IDs referenced by `videoCategoryId` (search) and `snippet.categoryId` (video). Its reference page was not retrieved for this document.

---

## 19. Where each part of the KaraoQ brief is covered in this document

This section is a pointer index only. It lists items named in the KaraoQ master prompt (the linked artifact) and the section of this document where the official documentation covers them. It adds no technical claims of its own.

| KaraoQ brief item (artifact section) | Covered in |
|---|---|
| YouTube Data API v3 used server-side with an API key (§2, §3.1, §9, §13) | [§4](#4-authorization-credentials-api-key-vs-oauth-20), [§15.5](#155-accessing-youtube-api-services-iii-d) |
| `search.list` then `videos.list` merged into a `KaraokeVideo` type (§9) | [§8](#8-searchlist-method), [§9](#9-search-result-resource), [§11](#11-videoslist-method), [§12](#12-video-resource) |
| Query biased with `karaoke`, `type=video`, `videoEmbeddable=true`, `videoCategoryId`, `safeSearch=moderate` (§4.2) | [§8.4](#84-optional-parameters) (parameters, defaults, `invalidSearchFilter` rule) |
| Result cards: thumbnail, title, channel, duration (§4.2) | [§9](#9-search-result-resource) (snippet, thumbnails), [§12.4](#124-snippet), [§12.5](#125-contentdetails) (ISO 8601 `duration`) |
| `nextPageToken` for "load more" / infinite scroll (§4.2) | [§13](#13-pagination), [§8.6](#86-response) |
| Daily quota of 10,000 units and ~100 searches (§0, §9) | [§5](#5-quota) |
| Quota guard and serving cached results (§9) | [§5.1](#51-rules), [§5.4](#54-quota-errors), [§14.3](#143-global-domain-errors-selection-relevant-to-keys-quota-and-rate) |
| Caching in `search_cache` with TTLs (§7, §9) | [§7](#7-performance-etags-and-gzip) (ETags), [§15.6](#156-handling-youtube-data-and-content-iii-e) (III.E.4 storage limits) |
| Skipping non-embeddable videos; embed errors (§9) | [§8.4](#84-optional-parameters) (`videoEmbeddable`), [§12.6](#126-status) (`status.embeddable` note) |
| Normalising metadata and storing title/channel/thumbnail/duration in `queue_items`, `playlist_items`, `favourites` (§7) | [§12](#12-video-resource), [§15.6](#156-handling-youtube-data-and-content-iii-e) (III.E.4) |
| Host's player as the "TV", guests' "Watch along" player, mini player, background audio (§3.2) | [§15.6](#156-handling-youtube-data-and-content-iii-e) (III.E.1), [§15.10](#1510-additional-prohibitions-iii-i) (III.I.6–9, 21), [§16](#16-required-minimum-functionality-embedded-player) |
| Reactions and "Now singing" shown over the host screen (§4.5) | [§16.5](#165-player-attributes-overlays-and-mouseovers) (overlays and frames) |
| "Karaoke verified" badge, ranking and tagging of results by heuristics (§4.2) | [§15.4](#154-implementing-youtube-features-iii-c) (III.C.5), [§15.10](#1510-additional-prohibitions-iii-i) (III.I.1), [§15.6](#156-handling-youtube-data-and-content-iii-e) (III.E.4.h) |
| Computed values such as estimated wait and "Popular in rooms" (§4.4, §4.2) | [§15.6](#156-handling-youtube-data-and-content-iii-e) (III.E.4.h) |
| Delete-my-data feature (§4.1) | [§15.6](#156-handling-youtube-data-and-content-iii-e) (III.E.4.g) |
| Privacy policy, terms and footer content (§6, §10) | [§15.2](#152-api-client-terms-and-privacy-iiia) |
| "Respect YouTube API Services Terms" (§9) | [§15](#15-youtube-api-services-developer-policies), [§16](#16-required-minimum-functionality-embedded-player) |
| Referrer-Policy and CSP security headers (§10) | [§16.1](#161-api-client-identity-and-credentials) |
| Rate limiting and error handling `{ code, message }` (§8, §10) | [§14](#14-errors) |

---

*End of document. Primary sources: Google for Developers, "YouTube Data API" reference and guides, and "YouTube API Services" terms, policies and Required Minimum Functionality (all last updated 2026-10-15 UTC as retrieved on 2026-10-28).*
