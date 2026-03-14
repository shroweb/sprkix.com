import "./globals.css";

export const metadata = {
  title: "Poison Rana",
  description: "Discover. Rate. Share Pro Wrestling Events.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-b from-[#0d1020] to-black text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
