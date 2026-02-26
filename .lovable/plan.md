

# Vervang confirm() door AlertDialog

## Wat verandert er

De browser `confirm()` popup bij het verwijderen van een gebruiker wordt vervangen door een styled AlertDialog component (al beschikbaar in het project via `@radix-ui/react-alert-dialog`).

## Aanpak

### Bestand: `src/components/portal/PortalUsersManager.tsx`

1. **Import toevoegen**: Importeer `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` uit `@/components/ui/alert-dialog`

2. **State toevoegen**: Een `userToDelete` state (`PortalProfile | null`) die bijhoudt welke gebruiker geselecteerd is voor verwijdering

3. **Delete handler opsplitsen**:
   - De delete-knop zet `userToDelete` in plaats van direct `handleDeleteUser` aan te roepen
   - `handleDeleteUser` wordt aangepast zodat het de `confirm()` call verwijdert en direct de delete-logica uitvoert
   - De "Confirm" knop in de AlertDialog roept `handleDeleteUser(userToDelete)` aan en reset de state

4. **AlertDialog toevoegen** aan de JSX (buiten de gebruikerslijst):
   - Titel: "Gebruiker verwijderen"
   - Beschrijving: "Weet je zeker dat je [naam] wilt verwijderen? Dit verwijdert permanent het account, profiel en alle toegangsrechten."
   - Cancel knop: "Annuleren"
   - Action knop (destructive styling): "Verwijderen"

### Geen andere bestanden nodig
De AlertDialog component bestaat al in `src/components/ui/alert-dialog.tsx` en hoeft niet aangepast te worden.
