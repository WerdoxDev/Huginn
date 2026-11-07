import { queryClient } from "@lib/queries";
import { voiceStore } from "@stores/voiceStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import VoiceOverlay from "./VoiceOverlay";

vi.mock("@components/UserAvatar", () => ({ default: () => <div /> }));

const initialState = voiceStore.getState();

afterEach(() => {
   voiceStore.setState(initialState);
   queryClient.clear();
});

function renderOverlay() {
   queryClient.setQueryData(["user", "alice"], { id: "alice", displayName: "Alice" });
   queryClient.setQueryData(["user", "bob"], { id: "bob", displayName: "Bob" });
   return render(
      <QueryClientProvider client={queryClient}>
         <VoiceOverlay />
      </QueryClientProvider>,
   );
}

function participant(userId: string, channelId: string) {
   return { ...initialState.voiceState, userId, channelId, isAudioMuted: false, isAudioDeafened: false };
}

describe("voice overlay", () => {
   test("shows only connected participants and follows speaking and channel changes", () => {
      voiceStore.setState({
         voiceState: participant("alice", "first"),
         voiceStates: [participant("alice", "first"), participant("bob", "second")],
         speakingStates: [],
      });
      renderOverlay();

      expect(screen.getByRole("listitem", { name: "Alice, Not speaking" })).toBeTruthy();
      expect(screen.queryByText("Bob")).toBeNull();

      act(() => voiceStore.getState().updateSpeakingState("alice", true));
      expect(screen.getByRole("listitem", { name: "Alice, Speaking" })).toBeTruthy();

      act(() => voiceStore.setState({ voiceState: participant("alice", "second") }));
      expect(screen.queryByText("Alice")).toBeNull();
      expect(screen.getByRole("listitem", { name: "Bob, Not speaking" })).toBeTruthy();

      act(() => voiceStore.setState({ voiceState: initialState.voiceState }));
      expect(screen.queryByRole("list")).toBeNull();
   });

   test("updates participants joining and leaving without showing ringing users", () => {
      voiceStore.setState({ voiceState: participant("alice", "first"), voiceStates: [participant("alice", "first")] });
      renderOverlay();

      act(() => voiceStore.getState().updateVoiceState(participant("bob", "first")));
      expect(screen.getAllByRole("listitem")).toHaveLength(2);

      act(() => voiceStore.getState().removeVoiceState("bob"));
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(screen.queryByText("Bob")).toBeNull();
   });

   test("mute and deafen override stale speaking state", () => {
      voiceStore.setState({
         voiceState: participant("alice", "first"),
         voiceStates: [{ ...participant("alice", "first"), isAudioMuted: true }],
         speakingStates: [{ userId: "alice", speaking: true }],
      });
      renderOverlay();
      expect(screen.getByRole("listitem", { name: "Alice, Muted" })).toBeTruthy();

      act(() => voiceStore.getState().updateVoiceState({ ...participant("alice", "first"), isAudioDeafened: true }));
      expect(screen.getByRole("listitem", { name: "Alice, Deafened" })).toBeTruthy();
   });
});
