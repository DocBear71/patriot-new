// file: src/app/api/auth/[...nextauth]/route.js
// Traditional NextAuth route handler using authOptions

import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;