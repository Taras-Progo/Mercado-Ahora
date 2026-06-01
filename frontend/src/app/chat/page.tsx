"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/components/AuthProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type { Conversation, Message } from "@/lib/api";
import { getConversations, getConversation, getMessages, sendMessage, createConversation, money } from "@/lib/api";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      // Show the buyer's name from the loaded buyer relation
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
    if (isNaN(producerId)) return;

    const autoCreate = async () => {
      setAutoCreating(true);
      try {
        const conv = await createConversation({
          producer_profile_id: producerId,
        });
        setSelectedId(conv.id);
        // Refresh conversations list
        const data = await getConversations();
        setConversations(data);
      } catch {
        // If conversation already exists or error, just go to chat page
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
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
          <div className="flex h-[calc(100vh-180px)] overflow-hidden rounded-2xl border border-border-soft bg-white">
            {/* Conversation list sidebar */}
            <aside className="w-80 shrink-0 border-r border-border-soft overflow-y-auto">
              <div className="sticky top-0 border-b border-border-soft bg-white px-4 py-4">
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
                <ul className="divide-y divide-border-soft">
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
                        <p className="text-sm font-semibold text-foreground">
                          {otherPartyName(conv)}
                        </p>
                        {conv.product && (
                          <p className="mt-0.5 text-xs text-brown-muted truncate">
                            {conv.product.name}
                          </p>
                        )}
                        {conv.messages && conv.messages.length > 0 && (
                          <p className="mt-1 text-xs text-stone-500 truncate">
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

            {/* Message area */}
            <section className="flex flex-1 flex-col min-w-0">
              {!selectedId || !conversation ? (
                <div className="flex flex-1 items-center justify-center text-center text-sm text-stone-500">
                  {conversations.length > 0
                    ? "Seleccioná una conversación para ver los mensajes."
                    : "Iniciá un chat desde la página de un producto."}
                </div>
              ) : (
                <>
                  {/* Conversation header */}
                  <div className="border-b border-border-soft px-6 py-4">
                    <p className="font-semibold text-foreground">
                      {otherPartyName(conversation)}
                    </p>
                    {conversation.product && (
                      <div className="mt-1 flex items-center gap-2">
                        <Link
                          href={`/products/${conversation.product.slug}`}
                          className="text-sm text-olive hover:text-olive-dark transition truncate"
                        >
                          {conversation.product.name}
                        </Link>
                        <span className="text-sm text-brown-muted">
                          {conversation.product.price_cents != null
                            ? money(conversation.product.price_cents)
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {messages.length === 0 && (
                      <p className="text-center text-sm text-stone-500 pt-8">
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
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                              isMine
                                ? "bg-olive text-white"
                                : "bg-cream-card text-foreground border border-border-soft"
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
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message input */}
                  <form
                    onSubmit={handleSend}
                    className="border-t border-border-soft px-6 py-4 flex gap-3"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribí tu mensaje..."
                      className="flex-1 rounded-full border border-border-soft px-4 py-2.5 text-sm text-foreground placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-olive/30"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="rounded-full bg-olive px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-50"
                    >
                      Enviar
                    </button>
                  </form>

                  {error && (
                    <div className="border-t border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}