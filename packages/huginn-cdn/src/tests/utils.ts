import { createToken } from "@huginn/backend-shared";

export async function cdnTokenHeader() {
   const token = await createToken("cdn", undefined);
   return { Authorization: `Bearer ${token}` };
}
