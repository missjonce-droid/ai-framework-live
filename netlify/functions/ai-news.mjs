// Netlify Functions wrapper around the shared /api/ai-news handler.
//
// The handler in functions/api/ai-news.js is written against the Web
// Request/Response APIs, so it runs unchanged here. Netlify Functions read
// configuration from process.env rather than a per-request env object, so that
// is the only thing this adapter has to supply.
import { onRequest } from "../../functions/api/ai-news.js";

export default async (request) => onRequest({ request, env: process.env });
