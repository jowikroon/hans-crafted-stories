/**
 * CCP-route. Hergebruikt bewust de bestaande Dashboards-pagina ongewijzigd:
 * die is 727 regels met één monolithische fetch van 9 queries. Opknippen is een
 * eigen refactor met eigen risico (zie het splitsplan) en hoort niet in dezelfde PR
 * als het periodefilter en de navigatie.
 */
export { default } from "@/pages/Dashboards";
