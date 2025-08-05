import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET(req, context) {
    const { firebase_uid } = await context.params;
  try {
    await dbConnect();

    const user = await User.findOne({ firebase_uid });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Login Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
