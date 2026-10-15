import ServicePage from "@/components/ServicePage";
import { getServicePage } from "@/data/servicePages";

/** Inhoud en SEO-head staan in data/servicePages.ts (één bron voor React én prerender). */
const page = getServicePage("/webshopbeheerder-inhuren")!;

const WebshopbeheerderInhuren = () => <ServicePage page={page} />;

export default WebshopbeheerderInhuren;
