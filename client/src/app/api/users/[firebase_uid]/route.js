//for login

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(req, context) {
  const { firebase_uid } = await context.params;
  try {
    await dbConnect();

    const user = await User.findOne({ firebase_uid });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: user._id,
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
    const { firebase_uid: identifier } = await params;

    let updatedUser = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      updatedUser = await User.findByIdAndUpdate(identifier, body, { new: true });
    } else {
      updatedUser = await User.findOneAndUpdate({ firebase_uid: identifier }, body, { new: true });
    }

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { firebase_uid: identifier } = await params;

    let deleted = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      deleted = await User.findByIdAndDelete(identifier);
    } else {
      deleted = await User.findOneAndDelete({ firebase_uid: identifier });
    }

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
  }
}