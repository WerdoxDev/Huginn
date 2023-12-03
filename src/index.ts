import { startServer } from "./server.ts";
import "./database/database-handler.ts";
import { connectToMongoDB } from "./database/database-handler.ts";

const MONGODB_CONNECTION_STRING =
   "mongodb+srv://huginn-root:LL3zR0QBOm9BNbUj@huginn.yzwj9ou.mongodb.net/?retryWrites=true&w=majority";

const MONGODB_DB_NAME = "huginn";

await connectToMongoDB(MONGODB_CONNECTION_STRING, MONGODB_DB_NAME);
startServer("localhost", 3000);
