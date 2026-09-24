import { Unlink01Icon } from "@hugeicons/core-free-icons";
import { Link } from "react-router";
import { EmptyState } from "@/components/chrome/empty-state";
import { appRoutes } from "@/lib/routes";
import { useDocumentTitle } from "@/lib/use-document-title";

export function NotFoundPage() {
  useDocumentTitle("Page not found");

  return (
    <EmptyState
      icon={Unlink01Icon}
      headingLevel="h1"
      title="Page not found"
      description="That address does not exist in the Reins console."
      action={
        <Link
          to={appRoutes.dashboard}
          className="mt-8 rounded-[13px] bg-cta px-7 py-4 text-[15px] leading-none font-medium text-white transition-colors hover:bg-black"
        >
          Back to the overview
        </Link>
      }
    />
  );
}
