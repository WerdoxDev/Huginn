export type VersionsObject = Record<
	string,
	{
		publishDate: string;
		description: string;
		downloads: {
			windows?: {
				signature: string;
				url: string;
			};
		};
	}
>;
