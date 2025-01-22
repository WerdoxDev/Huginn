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

//eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjI3Mjc5OTExNzk4NTQ1MjAzNCIsImlzT0F1dGgiOmZhbHNlLCJleHAiOjE3Mzc2NTc5NzgsImlhdCI6MTczNzU3MTU3OH0._C8UUmc49WoG9p6HjThqHmHmqtPNZIyKxT9GRUSZBAM
//eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjI3Mjc5OTExNzk4NTQ1MjAzNCIsImlzT0F1dGgiOmZhbHNlLCJleHAiOjE3Mzc2NTc5NzgsImlhdCI6MTczNzU3MTU3OH0._C8UUmc49WoG9p6HjThqHmHmqtPNZIyKxT9GRUSZBAM
//eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjI3Mjc5OTExNzk4NTQ1MjAzNCIsImlzT0F1dGgiOmZhbHNlLCJleHAiOjE3Mzc2NTc5NzgsImlhdCI6MTczNzU3MTU3OH0._C8UUmc49WoG9p6HjThqHmHmqtPNZIyKxT9GRUSZBAM
