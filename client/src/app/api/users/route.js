// src/app/api/users/route.js

//for signup
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req) {
  try {
    await dbConnect();

    const { name, email, firebase_uid , role } = await req.json();

    if (!name || !email || !firebase_uid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = new User({ name, email, firebase_uid, role: role || 'user' });
    await user.save();

    return NextResponse.json({ message: 'User saved successfully', role: user.role });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();

    const users = await User.find({}).lean(); // Fetch all users

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('GET Users Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
