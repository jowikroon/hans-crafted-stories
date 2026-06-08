import { useSearchParams } from "react-router-dom";
import "./write-cms.css";
import WriteMode from "./modes/WriteMode";
import ManageMode from "./modes/ManageMode";
import AnalyticsMode from "./modes/AnalyticsMode";

type CmsMode = "write" | "manage" | "analytics";

/**
 * The header + mode sub-bar now live in the global unified Navbar.
 * This shell only resolves the active mode from the URL (?mode=) and
 * renders it. Source of truth = the header sub-bar links (/write?mode=…).
 */
export default function WriteCmsShell({ postId }: { postId?: string }) {
  const [params] = useSearchParams();
  const raw = params.get("mode");
  const mode: CmsMode = postId
    ? "write"
    : raw === "manage" || raw === "analytics"
    ? raw
    : "write";

  return (
    <div className="write-cms" data-theme="light">
      <div className="shell">
        {mode === "write" && <WriteMode postId={postId} />}
        {mode === "manage" && <ManageMode />}
        {mode === "analytics" && <AnalyticsMode />}
      </div>
    </div>
  );
}
