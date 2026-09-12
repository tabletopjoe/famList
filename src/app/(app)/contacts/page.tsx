import { getCurrentUser } from "@/lib/auth/dal";
import { getContacts } from "@/modules/contacts/queries";
import { CreateContactForm } from "@/modules/contacts/components/CreateContactForm";
import { ContactCard } from "@/modules/contacts/components/ContactCard";
import { ExportContactsButton } from "@/modules/contacts/components/ExportContactsButton";
import { OwnershipFilterChips, parseOwnershipFilter } from "@/components/OwnershipFilterChips";

const EMPTY_MESSAGE = {
  all: "No contacts yet — add one above.",
  mine: "You haven't added any contacts yet.",
  shared: "No contacts have been shared with you yet.",
};

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await getCurrentUser();
  const { filter: rawFilter } = await searchParams;
  const filter = parseOwnershipFilter(rawFilter);

  const contacts = await getContacts(user.id, filter);

  return (
    <div className="space-y-6">
      {contacts.length > 0 && <ExportContactsButton />}
      <CreateContactForm />
      <OwnershipFilterChips current={filter} hrefFor={(f) => `/contacts${f === "all" ? "" : `?filter=${f}`}`} />
      {contacts.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">{EMPTY_MESSAGE[filter]}</p>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}
