import type { InputOptions, InputProps, InputStatus, InputStatuses, InputValues } from "@/types";
import { type HuginnErrorData, omit } from "@huginn/shared";

export function useInputs(inputsOptions: InputOptions[]) {
	const newValues: InputValues = {};
	const newStatuses: InputStatuses = {};

	for (const x of inputsOptions) {
		newValues[x.name] = { value: x.default ?? "", required: x.required };
		newStatuses[x.name] = { code: "none", text: "" };
	}

	const [values, setValues] = useState<InputValues>(newValues);
	const [statuses, setStatuses] = useState<InputStatuses>(newStatuses);
	const [errorStatuses, setErrorStatuses] = useState<InputStatuses>({});

	const inputsProps = useMemo<InputProps>(() => {
		const newInputsProps: InputProps = {};

		for (const x of inputsOptions) {
			newInputsProps[x.name] = {
				value: values[x.name].value,
				status: statuses[x.name],
				required: x.required,
				onChange: (e) => {
					e.preventDefault();
					let finalValue = e.target.value;
					if (x.lowercase) {
						finalValue = finalValue.toLowerCase();
					}
					setValue(x.name, finalValue);
				},
			};
		}

		return newInputsProps;
	}, [values, statuses]);

	function setValue(inputName: string, value: string | null) {
		const updatedValues = { ...values };
		const updatedStatuses = { ...statuses };

		updatedValues[inputName].value = value ?? "";
		updatedStatuses[inputName] = getInputCurrentStatus(values[inputName], inputName, errorStatuses);

		setValues(updatedValues);
		setStatuses(updatedStatuses);
	}

	function validateValues() {
		const validatedStatuses = getInputsValidatedStatuses(values, statuses);
		setStatuses(validatedStatuses);
		if (doStatusesHaveErrors(validatedStatuses, errorStatuses)) {
			return false;
		}

		return true;
	}

	function resetStatuses() {
		setStatuses(getEmptyStatuses(statuses));
		setErrorStatuses({});
	}

	function handleErrors(errors: HuginnErrorData) {
		const newStatuses = getInputsStatusesFromError(statuses, errors);

		setStatuses(newStatuses);
		setErrorStatuses({ ...newStatuses });
	}

	function setStatus(inputName: string, status: InputStatus) {
		const newStatuses = { ...statuses };
		newStatuses[inputName] = status;

		setStatuses(newStatuses);
	}

	function resetInput(inputName: string) {
		const newStatuses = { ...statuses };
		newStatuses[inputName] = { code: "none", text: "" };
		const newErrors = omit({ ...errorStatuses }, [inputName]);

		setStatuses(newStatuses);
		setErrorStatuses(newErrors);
	}

	return {
		inputsProps,
		values,
		statuses,
		setValue,
		validateValues,
		resetStatuses,
		handleErrors,
		setStatus,
		resetInput,
	};
}
