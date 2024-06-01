type TokenType = "bold" | "italic" | "underline" | "spoiler";

type Token = {
   type: TokenType;
   fullText: string;
   content: string;
   start: number;
   end: number;
   mark?: string;
};

type Pattern = {
   type: TokenType;
   pattern: RegExp;
};

export function tokenize(text: string) {
   const tokens: Token[] = [];

   // console.log(text);

   const patterns: Pattern[] = [
      { type: "bold", pattern: /(?<!\*)(\*\*)(.+?)(\*\*)(?!\*)/g },
      { type: "underline", pattern: /(?<!_)(__)(.+?)(__)(?!_)/g },
      { type: "italic", pattern: /(?<!\*)(\*)([^ ].*?)(\*)(?!\*)/g },
      { type: "italic", pattern: /(?<!_)(_)([^ ].*?)(_)(?!_)/g },
      { type: "spoiler", pattern: /(\|\|)(.+?)(\|\|)/g },
   ];
   // console.log(text);

   for (const { type, pattern } of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
         const [fullMatch, startMarkers, content, endMarkers] = match;
         const start = match.index;
         const end = start + (fullMatch.length - 1);

         // console.log(fullMatch);
         //end > start, start >
         if (tokens.filter((x) => x.start === start || x.end === start || x.end === end).length === 0) {
            tokens.push({
               type: type,
               fullText: text.slice(start, end + 1),
               content: content,
               start: start,
               end: end,
               mark: startMarkers,
            });
         }
      }
   }

   for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (tokens.filter((x) => x.end > token.start && token.start > x.start).length > 0) {
         tokens.splice(i, 1);
      }
   }

   return tokens;
}
