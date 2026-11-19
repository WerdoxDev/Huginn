import {
   ExpressionType,
   expressionReference,
   type APIExpression,
   type APIPostExpressionAddJSONBody,
   type APIPostExpressionUploadBody,
   type APIGetUserExpressionsResult,
   type APIPostExpressionAddResult,
   type APIDeleteExpressionJSONBody,
   type APIPostExpressionUploadResult,
   type ExpressionKind,
   type RawFile,
} from "@huginnjs/shared";

import type { CDN } from "../cdn";
import type { REST } from "../rest";

import { Routes } from "..";

export class ExpressionAPI {
   constructor(
      protected readonly rest: REST,
      protected readonly cdn: CDN,
      private readonly kind: ExpressionKind,
   ) {}

   protected resolve(media: APIExpression): APIExpression {
      return media.type === ExpressionType.UPLOADED ? { ...media, url: this.cdn.asset(media.url), src: this.cdn.asset(media.src) } : media;
   }

   public async getAll(): Promise<APIGetUserExpressionsResult> {
      const media = (await this.rest.get(Routes.userExpressions(this.kind), { auth: true })) as APIGetUserExpressionsResult;
      return media.map((item) => this.resolve(item));
   }

   public async add(body: APIPostExpressionAddJSONBody): Promise<APIPostExpressionAddResult> {
      return this.resolve(
         (await this.rest.post(Routes.userExpressions(this.kind), {
            auth: true,
            body: expressionReference(body),
         })) as APIPostExpressionAddResult,
      );
   }

   public async remove(body: APIDeleteExpressionJSONBody): Promise<void> {
      await this.rest.delete(Routes.deleteExpression(this.kind, body.type, encodeURIComponent(body.id)), { auth: true });
   }

   public async upload(file: RawFile, body?: APIPostExpressionUploadBody): Promise<APIPostExpressionUploadResult> {
      return this.resolve(
         (await this.rest.post(Routes.uploadExpression(this.kind), {
            auth: true,
            files: [file],
            body,
            appendToFormData: true,
         })) as APIPostExpressionUploadResult,
      );
   }
}
