import { InternalRequest } from "@huginn/shared";
import { RequestBody } from "@huginn/shared";

export class HTTPError extends Error {
   public requestBody: RequestBody;

   public override name: string = HTTPError.name;

   /**
    * @param status - The status code of the response
    * @param statusText - The status text of the response
    * @param method - The method of the request that erred
    * @param url - The url of the request that erred
    * @param bodyData - The unparsed data for the request that errored
    */
   public constructor(
      public status: number,
      statusText: string,
      public method: string,
      public url: string,
      // TODO: add 'files' here
      bodyData: Pick<InternalRequest, "body">,
   ) {
      super(statusText);
      // TODO: add 'files: bodyData.files'
      this.requestBody = { json: bodyData.body };
   }
}