export default function Component() {
	const logout = useLogout();
	return (
		<div className="h-full w-full bg-secondary">
			<button onClick={() => logout(true)} type="button">
				Logout
			</button>
		</div>
	);
}
