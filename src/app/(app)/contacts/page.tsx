import { getCurrentUser } from "@/lib/auth/dal";
import { getContacts } from "@/modules/contacts/queries";
import { CreateContactForm } from "@/modules/contacts/components/CreateContactForm";
import { ContactCard } from "@/modules/contacts/components/ContactCard";

export default async function ContactsPage() {
  await getCurrentUser();
  const contacts = await getContacts();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Contacts</h1>
      <CreateContactForm />
      {contacts.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">No contacts yet — add one above.</p>
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
