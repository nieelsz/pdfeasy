import { NextResponse } from "next/server";
import { generatePdfContent } from "@/lib/groq";
import { generatePdfInputSchema } from "@/lib/schema";

export async function POST(request: Request) {
  try {
    const input = generatePdfInputSchema.parse(await request.json());
    const pdf = await generatePdfContent(input);

    return NextResponse.json(pdf);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Não foi possível gerar o conteúdo.";

    return new NextResponse(message, { status: 400 });
  }
}
