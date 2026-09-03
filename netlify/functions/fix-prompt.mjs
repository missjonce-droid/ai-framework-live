// Netlify Functions wrapper around the shared /api/fix-prompt handler.
// See ai-news.mjs for why this adapter exists.
import { onRequest } from "../../functions/api/fix-prompt.js";

export default async (request) => onRequest({ request, env: process.env });
