"use client";

import { Printer } from "lucide-react";

/** The only interactive element on the invoice — kept client-side and tiny so
 *  the document itself stays a server-rendered, print-first page. */
export default function PrintButton() {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            className="btn-royal btn-royal--oxblood !px-8 !py-3.5"
        >
            <Printer size={13} aria-hidden="true" />
            <span>Print / Save as PDF</span>
        </button>
    );
}
