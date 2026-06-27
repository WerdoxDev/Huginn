import type { InternalRequest, RequestBody } from ".";

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
      bodyData: Pick<InternalRequest, "body" | "files">,
   ) {
      super(`${statusText}:${status}`);
      this.requestBody = { files: bodyData.files, json: bodyData.body };
   }
}
