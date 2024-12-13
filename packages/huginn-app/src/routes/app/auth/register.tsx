// import { usePostHog } from "posthog-js/react";
import { redirect } from "react-router";

export default function Register() {
  // const posthog = usePostHog();
  const appWindow = useWindow();
  const { setState: setAuthBackgroundState } = useContext(
    AuthBackgroundContext
  );

  const {
    inputsProps,
    values,
    resetStatuses,
    handleErrors,
    validateValues,
    resetInput,
  } = useInputs([
    { name: "email", required: true },
    { name: "displayName", required: false },
    { name: "username", required: true },
    { name: "password", required: true },
  ]);

  const [hidden, setHidden] = useState(false);
  //   const { message: usernameMessageDetail, onFocusChanged } =
  //     useUniqueUsernameMessage(values, resetInput, "username");

  useEffect(() => {
    setAuthBackgroundState(0);
  }, []);

  async function register() {
    if (!validateValues()) {
      return;
    }

    resetStatuses();
  }

  return (
    <AuthWrapper
      hidden={hidden}
      onSubmit={register}
      transitionName="auth-register"
    >
      <div className="flex w-full select-none flex-col items-center">
        <div className="mb-1 font-medium text-2xl text-text">
          Welcome to Huginn!
        </div>
        <div className="text-text opacity-70">
          We are very happy to have you here!
        </div>
      </div>
      <div className="my-7 flex h-0 w-full select-none items-center justify-center text-center font-semibold text-text/70 text-xs [border-top:thin_solid_rgb(var(--color-text)/0.25)]">
        <span className="bg-background px-2">or</span>
      </div>
      <div className="w-full">
        <div className="flex items-end justify-center gap-x-2">
          <HuginnInput {...inputsProps.username} className="w-1/2">
            <HuginnInput.Label text="Username" className="mb-2" />
            <HuginnInput.Wrapper border="left">
              <HuginnInput.Input className="lowercase" />
            </HuginnInput.Wrapper>
          </HuginnInput>
          <HuginnInput {...inputsProps.displayName} className="w-1/2">
            <HuginnInput.Label text="Display Name" className="mb-2" />
            <HuginnInput.Wrapper border="left">
              <HuginnInput.Input />
            </HuginnInput.Wrapper>
          </HuginnInput>
        </div>

        <HuginnInput className="mt-5 mb-5" {...inputsProps.email}>
          <HuginnInput.Label text="Email" className="mb-2" />
          <HuginnInput.Wrapper border="left">
            <HuginnInput.Input />
          </HuginnInput.Wrapper>
        </HuginnInput>

        <PasswordInput className="mb-5" {...inputsProps.password}>
          <HuginnInput.Label text="Password" className="mb-2" />
          <HuginnInput.Wrapper border="left">
            <HuginnInput.Input />
            <PasswordInput.ToggleButton />
          </HuginnInput.Wrapper>
        </PasswordInput>

        <LoadingButton
          loading={false}
          className="h-10 w-full bg-primary"
          type="submit"
        >
          Register
        </LoadingButton>

        <div className="mt-3 flex select-none items-center">
          <span className="text-sm text-text opacity-70">
            Already have an account?{" "}
          </span>
          <LinkButton viewTransition to="/login" className="ml-1 text-sm">
            Login
          </LinkButton>
        </div>
      </div>
    </AuthWrapper>
  );
}
