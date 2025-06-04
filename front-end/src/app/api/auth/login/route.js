import { NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/utils";

export async function POST(req) {
  try {
    const body = await req.json();
    const { status, data } = await fetchFromBackend("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    return NextResponse.json(
      { message: "Terjadi kesalahan, coba lagi nanti!" },
      { status: 500 }
    );
  }
}