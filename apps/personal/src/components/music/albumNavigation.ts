import { createContext } from "react";
import type { useNavigationType } from "react-router-dom";

// Routes with an explicit location expose POP to descendants. Capture the
// actual navigation action outside that override for album scroll handling.
export const AlbumNavigationTypeContext = createContext<ReturnType<typeof useNavigationType> | null>(null);
