import type { InputValues, MessageDetail, StatusCode } from "@/types";

export function useUniqueUsernameMessage(
  values: InputValues,
  resetInput: (inputName: string) => void,
  usernameField: string
) {
  const client = useClient();
  const { user } = useUser();

  const defaultMessage = "Please only use numbers, letters, _ or .";
  const [message, setMessage] = useState<MessageDetail>({
    text: defaultMessage,
    status: "default",
    visible: false,
  });

  const usernameTimeout = useRef<number>();
  const lastFocus = useRef<boolean>(false);
  const prevUsername = useRef(values[usernameField].value);

  useEffect(() => {
    if (prevUsername.current === values[usernameField].value) {
      return;
    }

    onChanged(values[usernameField].value, user?.username);
    prevUsername.current = values[usernameField].value;
  }, [values, user]);

  function set(message: string, status: StatusCode, visible: boolean) {
    setMessage({ text: message, status: status, visible });
    if (status === "success") {
      resetInput(usernameField);
    }
  }

  async function checkForUniqueUsername(value: string) {
    const result = await client.common.uniqueUsername({ username: value });

    if (result.taken) {
      set(
        "Username is taken. Try adding numbers, letters, underlines _ or fullstops .",
        "error",
        true
      );
    } else {
      set("Username is available!", "success", true);
    }
  }

  function validateLength(value: string) {
    return value.length >= 0 && value.length <= 10;
  }

  function validateRegex(value: string) {
    return true;
    // return value.match(constants.USERNAME_REGEX);
  }

  function onChanged(value: string, username?: string) {
    window.clearTimeout(usernameTimeout.current);

    if (!value || value === username) {
      set(defaultMessage, "default", lastFocus.current);
      // clearTimeout(usernameTimeout.current);
      return;
    }

    // if (!validateLength(value)) {
    //   set(
    //     Fields.wrongLength(
    //       constants.USERNAME_MIN_LENGTH,
    //       constants.USERNAME_MAX_LENGTH
    //     )[0],
    //     "error",
    //     true
    //   );
    //   return;
    // }

    // if (!validateRegex(value)) {
    //   set(Fields.usernameInvalid()[0], "error", true);
    //   return;
    // }

    if (usernameTimeout.current) {
      window.clearTimeout(usernameTimeout.current);
    }

    usernameTimeout.current = window.setTimeout(async () => {
      await checkForUniqueUsername(value);
      onFocusChanged(lastFocus.current);
    }, 1000);
  }

  function onFocusChanged(isFocused: boolean) {
    lastFocus.current = isFocused;
    setMessage((prev) => ({
      text: prev.text,
      status: prev.status,
      visible: prev.status === "error" ? true : isFocused,
    }));
  }

  return { message, onFocusChanged, onChanged };
}
