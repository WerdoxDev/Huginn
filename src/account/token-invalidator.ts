export class TokenInvalidator {
   private invalidatedTokens: string[] = [];

   public invalidateToken(token: string) {
      this.invalidatedTokens.push(token);
   }

   public getInvalidTokens(): Readonly<string[]> {
      return this.invalidatedTokens;
   }
}
