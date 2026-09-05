import ServicePage from "@/components/ServicePage";
import { getServicePage } from "@/data/servicePages";

/** Inhoud en SEO-head staan in data/servicePages.ts (één bron voor React én prerender). */
const page = getServicePage("/bol-com-consultant")!;

const BolComConsultant = () => <ServicePage page={page} />;

export default BolComConsultant;
