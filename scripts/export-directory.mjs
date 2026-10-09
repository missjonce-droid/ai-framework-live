// Export a small, independent search index from the current catalog.
// Run after catalog updates: node scripts/export-directory.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const generator=fs.readFileSync(path.join(root,'scripts/generate-redirects.mjs'),'utf8');
const extractor=generator.slice(generator.indexOf('function extractArray'),generator.indexOf('// A destination'));
const extract=vm.runInNewContext(extractor+';extractArray',{vm});
const manifest=JSON.parse(fs.readFileSync(path.join(root,'asset-manifest.json'),'utf8'));
const all=extract(fs.readFileSync(path.join(root,manifest.files['main.js'].replace(/^\//,'')),'utf8'));
const records=all.filter(r=>r.status==='active' && !(r.badges||[]).includes('advanced_gated'));
const affiliateLinks=JSON.parse(fs.readFileSync(path.join(root,'data/affiliate-links.json'),'utf8')).links || {};
const seen=new Set();
const entries=records.map(r=>{
 if(!/^[a-z0-9-]+$/.test(r.slug)||seen.has(r.slug))throw new Error('Invalid or duplicate slug: '+r.slug);seen.add(r.slug);
 const kind=r.resource_type==='creator'?'creator':r.resource_type==='company'?'company':'tool';
 return {slug:r.slug,name:r.name,description:r.short_description||'',category:r.primary_category||'Other',categories:[r.primary_category,...(r.additional_categories||[])].filter(Boolean),tags:r.tags||[],kind,path:`/${kind}/${r.slug}`,pricing:r.pricing_type||'unknown',affiliate:affiliateLinks[r.slug]?.approved === true};
});
const categories=[...new Set(entries.flatMap(r=>r.categories))].sort();
fs.mkdirSync(path.join(root,'data'),{recursive:true});
fs.writeFileSync(path.join(root,'data/directory-index.json'),JSON.stringify({schemaVersion:1,count:entries.length,categories,entries}));
const indexPath=path.join(root,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
html=html.replace(/(<span data-directory-count>)[\s\S]*?(<\/span>)/g,`$1${entries.length.toLocaleString('en-US')}$2`);
fs.writeFileSync(indexPath,html);
console.log(`Exported ${entries.length} public tools and resources; ${categories.length} categories.`);
