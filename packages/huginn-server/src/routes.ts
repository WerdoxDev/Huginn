import fs from "fs/promises";

export async function importRoutes() {
   const routes = (await fs.readdir(`${__dirname}/routes`, { recursive: true })).filter(file => file.endsWith(".ts"));

   for (const route of routes) {
      const fixedRoute = `./routes/${route.replace(".ts", "")}`;
      console.log(fixedRoute);
      await import(fixedRoute);
   }
}
