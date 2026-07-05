import type { Snowflake } from "@huginn/shared";
import type { BaseEditor, BaseRange, Descendant } from "slate";
import type { ReactEditor } from "slate-react";

import type { electronAPI } from "../electron/preload";

type CustomEditor = BaseEditor & ReactEditor;

type ParagraphElement = {
   type: "paragraph";
   children: Descendant[];
};

type SpoilerElement = {
   type: "spoiler";
   children: Descendant[];
};

type LinkElement = {
   type: "link";
   children: Descendant[];
   url?: string;
};

type CodeElement = {
   type: "code";
   children: Descendant[];
   code: string;
   language?: string;
};

type CodespanElement = {
   type: "codespan";
   children: Descendant[];
};

type EmbedElement = {
   type: "embed";
   thumbnail?: { url: string; width?: number; height?: number };
   video?: { url: string; width?: number; height?: number };
   title?: string;
   description?: string;
   url?: string;
   children: Descendant[];
};

type AttachmentElement = {
   type: "attachment";
   description?: string;
   url: string;
   width?: number;
   height?: number;
   filename: string;
   size: number;
   children: Descendant[];
   contentType: string;
};

export type EmojiElement = {
   type: "emoji";
   id?: string;
   slug: string;
   unicode?: string;
   big?: boolean;
   children: Descendant[];
};

export type UserMentionElement = {
   mentionType: "user";
   userId: Snowflake;
} & MentionElementBase;

export type EveryoneMentionElement = {
   mentionType: "everyone";
   usedText: string;
} & MentionElementBase;

export type OwnerMentionElement = {
   mentionType: "owner";
   usedText: string;
} & MentionElementBase;

type MentionElementBase = {
   type: "mention";
   children: Descendant[];
};
export type MentionElement = UserMentionElement | EveryoneMentionElement | OwnerMentionElement;

type ListElement = {
   type: "unordered-list" | "ordered-list";
   children: Descendant[];
};

export type ListItemElement = {
   type: "list-item";
   children: Descendant[];
};

type CustomElement =
   | ParagraphElement
   | SpoilerElement
   | EmbedElement
   | LinkElement
   | CodeElement
   | AttachmentElement
   | CodespanElement
   | EmojiElement
   | ListElement
   | ListItemElement
   | MentionElement;

type TextFormats = {
   bold?: boolean;
   italic?: boolean;
   underline?: boolean;
   mark?: boolean;
   spoiler?: boolean;
   link?: boolean;
   strikethrough?: boolean;
   codespan?: boolean;
   codeToken?: string | boolean;
   codeLanguage?: boolean;
   list?: boolean;
   throwaway?: boolean;
   escape?: boolean;
};
export type FormattedText = { text: string } & TextFormats;

type CustomText = FormattedText;
type CustomRange = BaseRange & TextFormats & { text?: string };

declare module "slate" {
   interface CustomTypes {
      Editor: CustomEditor;
      Element: CustomElement;
      Text: CustomText;
      Range: CustomRange;
   }
}

declare global {
   // interface globalThis {
   interface Window {
      electronAPI: typeof electronAPI;
   }

   interface AudioContext {
      setSinkId: (sinkId: string) => Promise<void>;
      sinkId: string;
      // setSinkId is undefined on FireFox by default
   }

   interface AudioContextOptions {
      sinkId?: string;
   }

   interface RTCIceCandidateStats {
      address?: string;
      candidateType: string;
      deleted: boolean;
      foundation?: string;
      port?: number;
      priority?: number;
      protocol?: "tcp" | "udp";
      relayProtocol: string;
      transportId: string;
      url?: string;
      usernameFragment?: string;
   }

   interface RTCCodecStats {
      channels?: number;
      clockRate?: number;
      mimeType: string;
      payloadType: number;
      sdpFmtpLine?: string;
      transportId: string;
   }

   interface RTCAudioSourceStats {
      audioLevel?: number;
      totalAudioEnergy?: number;
      totalSamplesDuration?: number;
      trackIdentifier: string;
      kind: "audio";
   }

   interface RTCVideoSourceStats {
      frames?: number;
      framesPerSecond?: number;
      height?: number;
      width: string;
      trackIdentifier: string;
      kind: "video";
   }
}
