"use client";

import { ReactNode } from "react";
import {
    LiveblocksProvider,
    RoomProvider,
    ClientSideSuspense,
} from "@liveblocks/react/suspense";

/**
 * Singleton LiveblocksProvider — mount this once near the top of the tree
 * (e.g. in a layout or page wrapper). Never nest two of these.
 */
export function LiveblocksProviderWrapper({ children }: { children: ReactNode }) {
    return (
        <LiveblocksProvider
            throttle={16}
            authEndpoint="/api/liveblocks-auth"
        >
            {children}
        </LiveblocksProvider>
    );
}

/**
 * Per-room wrapper. Must be rendered inside a LiveblocksProviderWrapper.
 */
export function Room({
    roomId,
    children,
}: {
    roomId: string
    children: ReactNode
}) {
    return (
        <RoomProvider id={roomId}>
            <ClientSideSuspense fallback={<div>Loading…</div>}>
                {children}
            </ClientSideSuspense>
        </RoomProvider>
    );
}