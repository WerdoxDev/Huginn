export class CacheStorage<K, V> {
   private _storage = new Map<K, { cachedTime: number; value: V }>();
   private _cacheTime?: number;

   public constructor(cacheTime?: number) {
      this._cacheTime = cacheTime;
   }

   public async cacheOrGet(key: K, getter: (() => V) | (() => Promise<V>)): Promise<V> {
      const now = new Date();
      const existing = this._storage.get(key);

      if (existing && (!this._cacheTime || (now.getTime() - existing.cachedTime) / 1000 <= this._cacheTime)) {
         return existing.value;
      } else {
         const item = await getter();
         this._storage.set(key, { cachedTime: now.getTime(), value: item });
         return item;
      }
   }
}
