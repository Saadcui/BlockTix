//for login

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

// UPDATE user role or data
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const body = await req.json();
    const updatedUser = await User.findByIdAndUpdate(params.id, body, { new: true });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    await User.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
  }
}