import fs from "fs";
import path from "path";

async function checkDeepgram() {
  const envRaw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  const projectId = envRaw.match(/DEEPGRAM_PROJECT_ID=(.*)/)?.[1]?.trim();
  const apiKey = envRaw.match(/DEEPGRAM_API_KEY=(.*)/)?.[1]?.trim();
  if(!projectId || !apiKey) return console.error("missing env");
  
  // Just get the 100 most recent requests without a start date to see what comes back
  const url = `https://api.deepgram.com/v1/projects/${projectId}/requests?limit=100`;
  const res = await fetch(url, { headers: { Authorization: `Token ${apiKey}` }});
  const data = await res.json();
  
  console.log(JSON.stringify(data.requests[0], null, 2));
}
checkDeepgram().catch(console.error);
