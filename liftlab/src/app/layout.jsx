import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});
const sora = Sora({
    variable: "--font-sora",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});
const jetbrains = JetBrains_Mono({
    variable: "--font-jetbrains",
    subsets: ["latin"],
});
export const metadata = {
    title: "LiftLab — Train Smart. Track Everything.",
    description: "LiftLab is a full-featured gym management dashboard: members, staff, scheduling, machines, nutrition, supplements, fees & reports.",
    keywords: [
        "LiftLab",
        "Gym Management",
        "Fitness Dashboard",
        "Workout Tracker",
        "Nutrition",
    ],
    authors: [{ name: "LiftLab" }],
};
export default function RootLayout({ children, }) {
    return (<html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash: default to light theme, respect saved preference */}
        <script dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':false;document.documentElement.classList.toggle('dark',d);document.documentElement.classList.toggle('light',!d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){document.documentElement.classList.add('light');document.documentElement.style.colorScheme='light';}})();`,
        }}/>
      </head>
      <body className={`${inter.variable} ${sora.variable} ${jetbrains.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>);
}
