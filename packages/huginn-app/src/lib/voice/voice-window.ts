export const VOICE_HOST_ID_PARAM = "voiceHostId";
export const VOICE_MEDIA_USER_ID_PARAM = "voiceMediaUserId";
export const VOICE_MEDIA_PRODUCER_ID_PARAM = "voiceMediaProducerId";

export type VoiceMediaPopoutTarget = {
   userId: string;
   producerId: string;
};

const requestedHostId = new URLSearchParams(window.location.search).get(VOICE_HOST_ID_PARAM);
const hostId = requestedHostId ?? crypto.randomUUID();

export function getVoiceHostId(): string {
   return hostId;
}

export function isVoiceChildWindow(): boolean {
   return requestedHostId !== null && window.opener !== null;
}

export function addVoiceHostId(url: string, targetHostId = hostId): string {
   const target = new URL(url, window.location.href);
   target.searchParams.set(VOICE_HOST_ID_PARAM, targetHostId);
   return target.href;
}

export function addVoiceMediaTarget(url: string, stream: VoiceMediaPopoutTarget): string {
   const target = new URL(url, window.location.href);
   target.searchParams.set(VOICE_MEDIA_USER_ID_PARAM, stream.userId);
   target.searchParams.set(VOICE_MEDIA_PRODUCER_ID_PARAM, stream.producerId);
   return target.href;
}

export function getVoiceMediaTarget(): VoiceMediaPopoutTarget | null {
   const search = new URLSearchParams(window.location.search);
   const userId = search.get(VOICE_MEDIA_USER_ID_PARAM);
   const producerId = search.get(VOICE_MEDIA_PRODUCER_ID_PARAM);

   return userId && producerId ? { userId, producerId } : null;
}
