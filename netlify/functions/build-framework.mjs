// Netlify Functions wrapper around the shared /api/build-framework handler.
// See ai-news.mjs for why this adapter exists.
import { onRequest } from "../../functions/api/build-framework.js";

export default async (request) => onRequest({ request, env: process.env });
