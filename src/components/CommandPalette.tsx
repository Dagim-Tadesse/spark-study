import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CreditCard, LayoutDashboard, Library, Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { deckService, Deck } from "@/services/deckService";
import { cardService, Card } from "@/services/cardService";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/contexts/I18nContext";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open && user) {
      Promise.all([
        deckService.getDecks(user.id),
        cardService.getCards(user.id),
      ]).then(([d, c]) => {
        setDecks(d);
        setCards(c);
      });
    }
  }, [open, user]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t("common.search") + "..."} />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/decks"))}>
            <Library className="mr-2 h-4 w-4" />
            <span>Library</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/study"))}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Study</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Decks">
          {decks.map((deck) => (
            <CommandItem
              key={deck.id}
              onSelect={() =>
                runCommand(() => navigate(`/decks`, { state: { usr: { deckId: deck.id } } }))
              }
            >
              <Library className="mr-2 h-4 w-4 opacity-50" />
              <span>{deck.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Cards">
          {cards.map((card) => (
            <CommandItem
              key={card.id}
              onSelect={() =>
                runCommand(() =>
                  navigate(`/decks`, {
                    state: { usr: { deckId: card.deck_id, cardId: card.id } },
                  })
                )
              }
            >
              <CreditCard className="mr-2 h-4 w-4 opacity-50" />
              <span className="truncate">
                {card.front.replace(/<[^>]*>/g, "").slice(0, 50) || "Empty Card"}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
