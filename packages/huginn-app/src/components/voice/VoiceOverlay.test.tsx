import { queryClient } from "@lib/queries";
import { storageStore } from "@stores/storageStore";
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
   test.each([false, true])("sorts speakers first without remounting avatars (only speaking: %s)", (voiceOverlayOnlySpeaking) => {
      storageStore.getState().setCachedValue("settings", { ...storageStore.getState().cache.settings, voiceOverlayOnlySpeaking });
      queryClient.setQueryData(["user", "charlie"], { id: "charlie", displayName: "Charlie" });
      queryClient.setQueryData(["user", "dave"], { id: "dave", displayName: "Dave" });
      voiceStore.setState({
         voiceState: participant("alice", "first"),
         voiceStates: [
            participant("alice", "first"),
            participant("bob", "first"),
            participant("charlie", "first"),
            { ...participant("dave", "first"), isAudioMuted: true },
         ],
         speakingStates: [
            { userId: "bob", speaking: true },
            { userId: "charlie", speaking: true },
            { userId: "dave", speaking: true },
         ],
      });
      renderOverlay();
      const alice = screen.getByRole("listitem", { name: "Alice, Not speaking" });
      const bob = screen.getByRole("listitem", { name: "Bob, Speaking" });
      const charlie = screen.getByRole("listitem", { name: "Charlie, Speaking" });
      const dave = screen.getByRole("listitem", { name: "Dave, Muted" });
      const aliceAvatar = alice.firstElementChild;
      const bobAvatar = bob.firstElementChild;
      expect(screen.getAllByRole("listitem")).toEqual([bob, charlie, alice, dave]);

      act(() => {
         voiceStore.getState().updateSpeakingState("alice", true);
         voiceStore.getState().updateSpeakingState("bob", false);
      });
      expect(screen.getAllByRole("listitem")).toEqual([alice, charlie, bob, dave]);
      expect(alice.firstElementChild).toBe(aliceAvatar);
      expect(bob.firstElementChild).toBe(bobAvatar);
      expect(voiceStore.getState().voiceStates.map((state) => state.userId)).toEqual(["alice", "bob", "charlie", "dave"]);
   });

   test("makes silent users transparent without remounting participants or avatars", () => {
      voiceStore.setState({
         voiceState: participant("alice", "first"),
         voiceStates: [participant("alice", "first"), participant("bob", "first")],
         speakingStates: [{ userId: "alice", speaking: true }],
      });
      renderOverlay();
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      const alice = screen.getByRole("listitem", { name: "Alice, Speaking" });
      const bob = screen.getByRole("listitem", { name: "Bob, Not speaking" });
      const aliceAvatar = alice.firstElementChild;
      const bobAvatar = bob.firstElementChild;

      act(() => storageStore.getState().setCachedValue("settings", { ...storageStore.getState().cache.settings, voiceOverlayOnlySpeaking: true }));
      expect(alice.classList.contains("opacity-0")).toBe(false);
      expect(bob.classList.contains("opacity-0")).toBe(true);
      act(() => voiceStore.getState().updateSpeakingState("bob", true));
      expect(bob.classList.contains("opacity-0")).toBe(false);
      act(() => voiceStore.getState().updateSpeakingState("alice", false));
      expect(alice.classList.contains("opacity-0")).toBe(true);
      act(() => voiceStore.getState().updateSpeakingState("bob", false));
      expect(bob.classList.contains("opacity-0")).toBe(true);
      expect(screen.getByRole("listitem", { name: "Alice, Not speaking" })).toBe(alice);
      expect(screen.getByRole("listitem", { name: "Bob, Not speaking" })).toBe(bob);
      expect(alice.firstElementChild).toBe(aliceAvatar);
      expect(bob.firstElementChild).toBe(bobAvatar);

      act(() => storageStore.getState().setCachedValue("settings", { ...storageStore.getState().cache.settings, voiceOverlayOnlySpeaking: false }));
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(alice.classList.contains("opacity-0")).toBe(false);
      expect(bob.classList.contains("opacity-0")).toBe(false);
   });

   test.each(["isAudioMuted", "isAudioDeafened"] as const)("hides stale speakers with %s when only showing talking users", (flag) => {
      storageStore.getState().setCachedValue("settings", { ...storageStore.getState().cache.settings, voiceOverlayOnlySpeaking: true });
      voiceStore.setState({
         voiceState: participant("alice", "first"),
         voiceStates: [{ ...participant("alice", "first"), [flag]: true }],
         speakingStates: [{ userId: "alice", speaking: true }],
      });
      renderOverlay();
      const row = screen.getByRole("listitem");
      expect(row.classList.contains("opacity-0")).toBe(true);
      act(() => voiceStore.getState().updateVoiceState(participant("alice", "first")));
      expect(screen.getByRole("listitem", { name: "Alice, Speaking" })).toBe(row);
      expect(row.classList.contains("opacity-0")).toBe(false);
   });

   test("hides the overlay immediately when disabled globally", () => {
      voiceStore.setState({ voiceState: participant("alice", "first"), voiceStates: [participant("alice", "first")] });
      renderOverlay();
      expect(screen.getByText("Alice")).toBeTruthy();
      act(() => storageStore.getState().setCachedValue("settings", { ...storageStore.getState().cache.settings, overlayEnabled: false }));
      expect(screen.queryByRole("list")).toBeNull();
      act(() => storageStore.getState().setCachedValue("settings", { ...storageStore.getState().cache.settings, overlayEnabled: true }));
      expect(screen.getByText("Alice")).toBeTruthy();
   });

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
