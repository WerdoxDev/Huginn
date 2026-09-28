import type { Prisma } from "#prisma/client";

const APPLICATION_CATALOG_LOCK_ID = 4_821_947_331n;

export async function nextApplicationCatalogRevision(transaction: Prisma.TransactionClient): Promise<bigint> {
   await transaction.$queryRaw`SELECT pg_advisory_xact_lock(${APPLICATION_CATALOG_LOCK_ID})::text`;

   const [result] = await transaction.$queryRaw<Array<{ revision: bigint }>>`
      SELECT nextval('"ApplicationCatalogRevision_seq"') AS revision
   `;

   return result.revision;
}

export async function getApplicationCatalogRevision(transaction: Prisma.TransactionClient): Promise<bigint> {
   await transaction.$queryRaw`SELECT pg_advisory_xact_lock_shared(${APPLICATION_CATALOG_LOCK_ID})::text`;

   const [result] = await transaction.$queryRaw<Array<{ revision: bigint }>>`
      SELECT CASE WHEN is_called THEN last_value ELSE 0 END::bigint AS revision
      FROM "ApplicationCatalogRevision_seq"
   `;

   return result.revision;
}
