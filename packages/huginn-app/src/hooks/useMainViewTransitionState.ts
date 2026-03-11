/**
 * TanStack Router doesn't have built-in view transition state tracking.
 * This hook is kept for compatibility but always returns false.
 * View transitions can be triggered directly using the View Transitions API if needed.
 */
export function useMainViewTransitionState() {
   return {
      isStartTransitioning: false,
      isMainTransitioning: false,
   };
}
