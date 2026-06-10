"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/components/AuthProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type { Conversation, Message } from "@/lib/api";
import { createConversation, getConversation, getConversations, getMessages, money, sendMessage } from "@/lib/api";

export default function ChatPage() {
  return (
    <RoleGuard roles={["buyer", "seller"]}>
      <ChatContent />
    </RoleGuard>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") ? Number(searchParams.get("id")) : null;
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(initialId);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConversations();
  }, [fetchConversations]);

  // Auto-refresh conversations every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Load selected conversation
  useEffect(() => {
    if (!selectedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConversation(null);
      setMessages([]);
      return;
    }
    const loadConversation = async () => {
      try {
        const conv = await getConversation(selectedId);
        setConversation(conv);
        const msgs = await getMessages(selectedId);
        setMessages(msgs);
      } catch {
        setError("No se pudo cargar la conversación.");
      }
    };
    loadConversation();
  }, [selectedId]);

  // Poll messages every 5s
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await getMessages(selectedId);
        setMessages(msgs);
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedId]);

  // Keep scrolling scoped to the message pane so mobile browsers do not scroll the whole page.
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages.length, selectedId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId) return;
    try {
      const msg = await sendMessage(selectedId, newMessage.trim());
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      setError("");
    } catch {
      setError("Error al enviar el mensaje.");
    }
  };

  const otherPartyName = (conv: Conversation) => {
    if (user?.role === "seller") {
      return (conv as Conversation & { buyer?: { name: string } }).buyer?.name ?? "Comprador";
    }
    return conv.producer_profile?.business_name ?? "Productor";
  };

  // Handle ?producer=ID param from producer profile page: auto-create conversation
  const producerParam = searchParams.get("producer");
  const [, setAutoCreating] = useState(false);

  useEffect(() => {
    if (!producerParam || !user || loading) return;
    const producerId = Number(producerParam);
    if (Number.isNaN(producerId)) return;

    const autoCreate = async () => {
      setAutoCreating(true);
      try {
        const conv = await createConversation({
          producer_profile_id: producerId,
        });
        setSelectedId(conv.id);
        const data = await getConversations();
        setConversations(data);
      } catch {
        // If conversation already exists or error, just stay on the chat page.
      } finally {
        setAutoCreating(false);
      }
    };
    autoCreate();
  }, [producerParam, user, loading]);

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="bg-background py-24 text-center text-sm text-stone-500">
          Cargando conversaciones...
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
          <div className="flex h-[calc(100dvh-118px)] min-h-[520px] overflow-hidden rounded-2xl border border-border-soft bg-white sm:h-[calc(100vh-180px)]">
            <aside
              className={`${
                selectedId ? "hidden md:flex" : "flex"
              } min-w-0 w-full shrink-0 flex-col overflow-hidden border-border-soft md:w-80 md:border-r`}
            >
              <div className="border-b border-border-soft bg-white px-4 py-4">
                <h2 className="font-serif text-lg font-bold text-foreground">Chats</h2>
              </div>
              {conversations.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-stone-500">
                  <p>No tenés conversaciones todavía.</p>
                  <p className="mt-1 text-xs">
                    Iniciá un chat desde la página de un producto.
                  </p>
                </div>
              ) : (
                <ul className="min-h-0 flex-1 divide-y divide-border-soft overflow-y-auto">
                  {conversations.map((conv) => (
                    <li key={conv.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(conv.id)}
                        className={
                          "w-full px-4 py-4 text-left transition " +
                          (selectedId === conv.id
                            ? "bg-olive-muted"
                            : "hover:bg-cream-card")
                        }
                      >
                        <p className="truncate text-sm font-semibold text-foreground">
                          {otherPartyName(conv)}
                        </p>
                        {conv.product && (
                          <p className="mt-0.5 truncate text-xs text-brown-muted">
                            {conv.product.name}
                          </p>
                        )}
                        {conv.messages && conv.messages.length > 0 && (
                          <p className="mt-1 truncate text-xs text-stone-500">
                            {conv.messages[0].body}
                          </p>
                        )}
                        {conv.last_message_at && (
                          <p className="mt-1 text-[10px] text-stone-400">
                            {new Date(conv.last_message_at).toLocaleDateString("es-AR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            <section
              className={`${
                selectedId ? "flex" : "hidden md:flex"
              } min-w-0 flex-1 flex-col`}
            >
              {!selectedId || !conversation ? (
                <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-stone-500">
                  {conversations.length > 0
                    ? "Seleccioná una conversación para ver los mensajes."
                    : "Iniciá un chat desde la página de un producto."}
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3 border-b border-border-soft px-4 py-4 sm:px-6">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-soft text-lg leading-none text-foreground transition hover:bg-cream-card md:hidden"
                      aria-label="Volver a chats"
                    >
                      &larr;
                    </button>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {otherPartyName(conversation)}
                      </p>
                      {conversation.product && (
                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          <Link
                            href={`/products/${conversation.product.slug}`}
                            className="truncate text-sm text-olive transition hover:text-olive-dark"
                          >
                            {conversation.product.name}
                          </Link>
                          <span className="shrink-0 text-sm text-brown-muted">
                            {conversation.product.price_cents != null
                              ? money(conversation.product.price_cents)
                              : ""}
                          </span>
                        </div>
                      )}
                      {conversation.order && (
                        <Link
                          href={user?.role === "seller" ? `/seller/orders?order=${conversation.order.id}` : "/orders"}
                          className="mt-1 inline-flex rounded-full bg-olive-muted px-3 py-1 text-xs font-semibold text-olive-dark transition hover:bg-olive-light/40"
                        >
                          Pedido {conversation.order.order_number}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div
                    ref={messagesContainerRef}
                    className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6"
                  >
                    {messages.length === 0 && (
                      <p className="pt-8 text-center text-sm text-stone-500">
                        No hay mensajes todavía. Enviá el primer mensaje.
                      </p>
                    )}
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[75%] ${
                              isMine
                                ? "bg-olive text-white"
                                : "border border-border-soft bg-cream-card text-foreground"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                            <p
                              className={`mt-1 text-[10px] ${
                                isMine ? "text-olive-muted" : "text-stone-400"
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form
                    onSubmit={handleSend}
                    className="flex gap-2 border-t border-border-soft px-3 py-3 sm:gap-3 sm:px-6 sm:py-4"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribí tu mensaje..."
                      className="min-w-0 flex-1 rounded-full border border-border-soft px-4 py-2.5 text-sm text-foreground placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-olive/30"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="shrink-0 rounded-full bg-olive px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-50 sm:px-5"
                    >
                      Enviar
                    </button>
                  </form>

                  {error && (
                    <div className="border-t border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-6">
                      {error}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
