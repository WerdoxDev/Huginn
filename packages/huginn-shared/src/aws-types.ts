export type VersionsObject = Record<
	string,
	{
		flavour: "release" | "nightly";
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
