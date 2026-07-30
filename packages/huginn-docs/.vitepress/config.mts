import { defineConfig } from "vitepress";

export default defineConfig({
   title: "Huginn Documentation",
   titleTemplate: ":title · Huginn Documentation",
   description: "Documentation for the entire Huginn infrastructure.",
   appearance: "dark",
   cleanUrls: true,
   lastUpdated: true,
   base: "/",
   markdown: {
      lineNumbers: false,
   },
   head: [
      ["meta", { name: "theme-color", content: "#0d1619" }],
      ["meta", { name: "color-scheme", content: "dark" }],
      ["link", { rel: "icon", type: "image/png", href: "/outline-thick-512.png" }],
   ],
   themeConfig: {
      logo: "/outline-thick-512.png",
      siteTitle: "Huginn",
      nav: [
         { text: "API", link: "/api" },
         { text: "Server", link: "/server" },
      ],
      sidebar: {
         "/api": [
            {
               text: "Start",
               base: "/api",
               items: [
                  { text: "Getting started", link: "/" },
                  { text: "Authentication", link: "/guide/authentication" },
                  { text: "Gateway & events", link: "/guide/gateway-events" },
                  { text: "Voice & media", link: "/guide/voice" },
               ],
            },
            {
               text: "Reference",
               link: "/reference",
               base: "/api",
               items: [
                  { text: "HuginnClient", link: "/reference/client" },
                  { text: "REST APIs", link: "/reference/rest-apis" },
                  { text: "Gateway", link: "/reference/gateway" },
                  { text: "Voice", link: "/reference/voice" },
                  { text: "CDN & raw REST", link: "/reference/cdn-rest" },
                  { text: "Configuration & types", link: "/reference/configuration" },
               ],
            },
         ],
      },
      outline: {
         level: [2, 3],
         label: "On this page",
      },
      search: {
         provider: "local",
      },
      socialLinks: [{ icon: "github", link: "https://github.com/WerdoxDev/Huginn" }],
      editLink: {
         pattern: "https://github.com/WerdoxDev/Huginn/edit/master/packages/huginn-docs/:path",
         text: "Edit this page on GitHub",
      },
      lastUpdated: {
         text: "Updated",
         formatOptions: {
            dateStyle: "medium",
            timeStyle: "short",
         },
      },
      docFooter: {
         prev: "Previous",
         next: "Next",
      },
      returnToTopLabel: "Back to top",
      sidebarMenuLabel: "Documentation",
      darkModeSwitchLabel: "Appearance",
      lightModeSwitchTitle: "Use light theme",
      darkModeSwitchTitle: "Use dark theme",
   },
});
