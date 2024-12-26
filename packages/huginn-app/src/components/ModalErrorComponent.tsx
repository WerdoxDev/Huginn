import { useErrorBoundary } from "react-error-boundary";

export default function ModalErrorComponent(props: { error: unknown }) {
	const { resetBoundary } = useErrorBoundary();
	const dispatch = useModalsDispatch();
	const handleError = useErrorHandler({
		cancel: {
			callback: () => {
				dispatch({
					info: { isOpen: false },
					addRecipient: { isOpen: false },
					settings: { isOpen: false },
					createDM: { isOpen: false },
					editGroup: { isOpen: false },
					imageCrop: { isOpen: false },
				});
				resetBoundary();
			},
		},
	});

	useEffect(() => {
		handleError(props.error);
	}, []);

	return null;
}
