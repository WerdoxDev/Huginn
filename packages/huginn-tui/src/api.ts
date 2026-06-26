import { envs } from ".";

export async function fetchPosthogUserInfo(clientId: string) {
   if (!envs.POSTHOG_PERSONAL_API_KEY || !envs.POSTHOG_PROJECT_ID) {
      throw new Error("POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID environment variables are required");
   }

   const body = {
      query: {
         kind: "HogQLQuery",
         query: `SELECT properties.clientId, properties.username FROM persons WHERE properties.clientId = '${clientId}'`,
      },
   };

   const response = await fetch(`https://eu.posthog.com/api/projects/${envs.POSTHOG_PROJECT_ID}/query`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
         Authorization: `Bearer ${envs.POSTHOG_PERSONAL_API_KEY}`,
         "Content-Type": "application/json",
      },
   });

   const data = await response.json();

   const results = data.results;
   return {
      clientId: results[0]?.[0] as string | undefined,
      username: results[0]?.[1] as string | undefined,
   };
}
