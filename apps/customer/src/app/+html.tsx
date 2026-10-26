import { WEB_FOCUS_CSS } from "@foodiedeals/ui-native";
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#1B1613" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: WEB_FOCUS_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
