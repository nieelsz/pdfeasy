import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDFEasy",
  description: "Gere PDFs estilizados com templates fixos e conteudo estruturado por IA.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2288%22>📄</text></svg>",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
