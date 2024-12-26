import { TabPanel } from "@headlessui/react";

export default function AddFriendTab() {
	const { inputsProps, values, handleErrors, setStatus } = useInputs([{ name: "username", required: false }]);

	const [disabled, setDisabled] = useState(false);

	const mutation = useCreateRelationship(({ username }) => {
		setStatus("username", { code: "success", text: `Friend request sent to ${username}!` });
	}, handleErrors);

	useEffect(() => {
		setDisabled(!values.username.value);
	}, [values]);

	return (
		<TabPanel>
			<div className="font-medium text-lg text-text uppercase">Add Friend</div>
			<div className="mt-1 text-sm text-text/70">You can add your friends using their Huginn username</div>
			<form
				onSubmit={(e) => {
					e.preventDefault();
				}}
			>
				<AddFriendInput
					loading={mutation.isPending}
					className="mt-5 "
					{...inputsProps.username}
					buttonProps={{ type: "submit" }}
					onClick={() => {
						mutation.mutate({ username: values.username.value });
					}}
					disabled={disabled}
				/>
			</form>
		</TabPanel>
	);
}
