import "./globals.css";

export const metadata = {
  title: "Amiko - Production Elder Care Platform",
  description: "A trusted Buddy for daily care needs and companion services.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
