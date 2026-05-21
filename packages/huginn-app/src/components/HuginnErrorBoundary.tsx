import React from "react";

// import { ModalErrorContext } from "./ModalErrorProvider";

interface Props {
   children: React.ReactNode;
   resetKey?: React.Key;
   onError?: (error: Error) => void;
}

interface State {
   hasError: boolean;
}

export class HuginnErrorBoundary extends React.Component<Props, State> {
   // static contextType = ModalErrorContext;
   // declare context: React.ContextType<typeof ModalErrorContext>;

   state: State = { hasError: false };

   static getDerivedStateFromError(): State {
      return { hasError: true };
   }

   componentDidCatch(error: Error) {
      this.props.onError?.(error);
      // Report to the provider — triggers the info modal
      // this.context?.reportError(error);
   }

   componentDidUpdate(prevProps: Props) {
      // Allow external reset via key change or resetKey change
      if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
         this.setState({ hasError: false });
      }
   }

   render() {
      if (this.state.hasError) {
         // Render nothing — the info modal handles UX
         return null;
      }
      return this.props.children;
   }
}
