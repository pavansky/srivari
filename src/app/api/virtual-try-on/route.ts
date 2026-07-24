import { NextResponse } from 'next/server';

/**
 * Virtual try-on previously ran on Google Vertex AI (paid). The store now uses
 * only free/open endpoints, and no reliable free try-on host exists that we'd
 * trust with customers' personal photos — so the feature is paused rather than
 * silently shipping photos to a third party.
 *
 * The try-on page handles this response with a friendly notice.
 */
export async function POST() {
    return NextResponse.json(
        {
            error: "The virtual try-on studio is temporarily resting while we craft its next chapter. Meanwhile, our stylists on WhatsApp would love to help you visualise any drape.",
            code: "FEATURE_PAUSED",
        },
        { status: 503 }
    );
}
