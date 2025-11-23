// file: src/app/api/veteran-verification/upload/route.js v1 - Document upload for veteran verification

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth.js';
import connectDB from '../../../../lib/mongodb.js';
import { User } from '../../../../models/index.js';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        await connectDB();

        const formData = await request.formData();
        const file = formData.get('document');
        const documentType = formData.get('documentType');

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Validate file type (PDF, JPG, PNG only)
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 5MB.' },
                { status: 400 }
            );
        }

        // Create unique filename
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${session.user.id}_${documentType}_${timestamp}_${originalName}`;

        // Save to uploads directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'veteran-verification');
        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);

        // Update user record with document info
        const user = await User.findById(session.user.id);

        if (!user.veteranBusinessOwner) {
            user.veteranBusinessOwner = {
                isVeteranOwned: true,
                verificationStatus: 'pending',
                verificationDocuments: [],
                businessIds: [],
                certifications: {}
            };
        }

        user.veteranBusinessOwner.verificationDocuments.push({
            documentType,
            documentUrl: `/uploads/veteran-verification/${filename}`,
            uploadedAt: new Date()
        });

        // Update verification status to pending if it was not_applicable
        if (user.veteranBusinessOwner.verificationStatus === 'not_applicable') {
            user.veteranBusinessOwner.verificationStatus = 'pending';
        }

        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Document uploaded successfully',
            document: {
                documentType,
                documentUrl: `/uploads/veteran-verification/${filename}`,
                uploadedAt: new Date()
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Upload failed', details: error.message },
            { status: 500 }
        );
    }
}