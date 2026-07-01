import { idFix } from "@huginn/shared";
import { neon } from "@neondatabase/serverless";
import { better } from "better-drizzle";
import { drizzle } from "drizzle-orm/neon-http";

import * as relations from "./relations";
import * as schema from "./schema";

// types.setTypeParser(20, (value) => {
//    console.log(value, typeof value);
//    return String(value);
// });
// types.setTypeParser(1016, (val) => types.getTypeParser(1016)(val).map(BigInt));
// types.setTypeParser(114, (val) => JSON.parse(val));  // json
// types.setTypeParser(3802, parseJsonWithBigInt); // jsonb

const sql = neon(process.env.POSTGRESQL_URL!, {});
const mySchema = { ...schema, ...relations };
// const mySchema = testSchema;
const db = drizzle({ client: sql, schema: mySchema });

// const plugin = definePlugin({
//    id: "exists-plugin",
//    extendModel({ client, model }) {
//       return {
//          async exists(where: WhereArg<typeof mySchema, any>) {
//             return (await client.$withoutPlugins().count({ where: where })) !== 0;
//          },
//       };
//    },
// });

const client = better(db, { schema: mySchema });

// const pUser = await prisma.user.findFirst({ where: { id: BigInt("266669721963729052") }, select: { includedChannels: true } });
// console.log(user);

// --- With better-drizzle ---
// await client.channel.findMany({ select: { recipients: { select: { user: { select: { id: true } } } } } },);
// gives { recipients: [ { user: { id: '123' } } ] }

// --- With prisma ---
// await prisma.channel.findMany({ select: { recipients: { select: { id: true } } } ,});
// gives { recipients: [ { id: 123 } ] }

export { client as drizzle, mySchema as schema };
