import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  const res = await fetch(
    `${process.env.BACKEND_API_URL}/public/chefs/${id}`,
    {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: 'no-store',
    },
  );

  const text = await res.text();
  if (text.startsWith('<!'))
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 502 });

  return NextResponse.json(JSON.parse(text), { status: res.status });
}