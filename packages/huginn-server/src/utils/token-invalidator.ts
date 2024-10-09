export class TokenInvalidator {
	private readonly invalidTokens: string[] = [];

	public invalidate(token: string) {
		if (!this.invalidTokens.includes(token)) {
			this.invalidTokens.push(token);
		}
	}

	public isInvalid(token: string) {
		return this.invalidTokens.includes(token);
	}
}
