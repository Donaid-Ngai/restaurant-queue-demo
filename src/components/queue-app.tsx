"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Separator,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Tables } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

type QueueRow = Tables<{ schema: "public" }, "queue_entries">;
type QueueInsert = {
  name: string;
  phone: string;
  party_size: number;
  note?: string | null;
  status?: string;
  source?: string;
  updated_at?: string;
};
type QueueSelectedRow = Pick<QueueRow, "id" | "name" | "phone" | "party_size" | "note" | "joined_at" | "status" | "source">;
type QueueStatus = QueueRow["status"];
type QueueSource = QueueRow["source"];

type QueueEntry = {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  note?: string | null;
  joinedAt: string;
  status: QueueStatus;
  source: QueueSource;
};

const seedQueue: QueueEntry[] = [
  {
    id: "q1",
    name: "Maya Chen",
    phone: "555-0142",
    partySize: 2,
    note: "Patio if available",
    joinedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    status: "waiting",
    source: "qr",
  },
  {
    id: "q2",
    name: "Jordan Patel",
    phone: "555-0188",
    partySize: 4,
    note: "Birthday dinner",
    joinedAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    status: "waiting",
    source: "walk-in",
  },
];

function formatWait(joinedAt: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(joinedAt).getTime()) / 60000));
  if (minutes < 1) return "Just joined";
  return `${minutes} min`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function fromRow(row: QueueSelectedRow): QueueEntry {
  return {
    id: row.id ?? crypto.randomUUID(),
    name: row.name ?? "Unknown guest",
    phone: row.phone ?? "",
    partySize: row.party_size ?? 1,
    note: row.note,
    joinedAt: row.joined_at ?? new Date(0).toISOString(),
    status: (row.status ?? "waiting") as QueueStatus,
    source: (row.source ?? "qr") as QueueSource,
  };
}

export function QueueApp() {
  const [queue, setQueue] = useState<QueueEntry[]>(supabase ? [] : seedQueue);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [error, setError] = useState<string | null>(supabase ? null : "Supabase env is missing, showing local demo data.");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestPartySize, setGuestPartySize] = useState("2");
  const [guestNote, setGuestNote] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPartySize, setStaffPartySize] = useState("2");

  const waiting = useMemo(
    () => queue.filter((entry) => entry.status === "waiting").sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)),
    [queue],
  );

  const seated = useMemo(
    () => queue.filter((entry) => entry.status === "seated").sort((a, b) => b.joinedAt.localeCompare(a.joinedAt)),
    [queue],
  );

  async function fetchQueue() {
    if (!supabase) {
      setQueue(seedQueue);
      setError("Supabase env is missing, showing local demo data.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error: fetchError } = await supabase
      .from("queue_entries")
      .select("id, name, phone, party_size, note, joined_at, status, source")
      .neq("status", "removed")
      .order("joined_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setQueue(seedQueue);
    } else {
      setError(null);
      setQueue((data ?? []).map(fromRow));
    }
    setIsLoading(false);
  }

  useEffect(() => {
    if (!supabase) return;

    const run = async () => {
      await fetchQueue();
    };

    void run();
  }, []);

  const handleGuestSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) return;
    if (!supabase) return;

    const payload: QueueInsert = {
      name: guestName.trim(),
      phone: guestPhone.trim(),
      party_size: Number(guestPartySize) || 1,
      note: guestNote.trim() || null,
      status: "waiting",
      source: "qr",
    };

    const { error: insertError } = await supabase.from("queue_entries").insert(payload);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setGuestName("");
    setGuestPhone("");
    setGuestPartySize("2");
    setGuestNote("");
    fetchQueue();
  };

  const handleStaffAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!staffName.trim() || !staffPhone.trim()) return;
    if (!supabase) return;

    const payload: QueueInsert = {
      name: staffName.trim(),
      phone: staffPhone.trim(),
      party_size: Number(staffPartySize) || 1,
      status: "waiting",
      source: "walk-in",
    };

    const { error: insertError } = await supabase.from("queue_entries").insert(payload);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setStaffName("");
    setStaffPhone("");
    setStaffPartySize("2");
    fetchQueue();
  };

  const markSeated = async (id: string) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("queue_entries")
      .update({ status: "seated", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    fetchQueue();
  };

  const removeEntry = async (id: string) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("queue_entries")
      .update({ status: "removed", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    fetchQueue();
  };

  return (
    <Box bg="gray.950" minH="100vh" color="white" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
      <Stack gap={8} maxW="1400px" mx="auto">
        <Card.Root bg="whiteAlpha.120" borderColor="whiteAlpha.300" borderWidth="1px" backdropFilter="blur(18px)">
          <Card.Body>
            <Flex direction={{ base: "column", md: "row" }} justify="space-between" gap={6}>
              <Stack gap={3}>
                <Badge colorPalette="green" width="fit-content">Restaurant queue demo</Badge>
                <Heading size="2xl">One app, two views, quick prototype.</Heading>
                <Text color="gray.300" maxW="3xl">
                  Guests join from a QR code landing page, staff manage the line from the dashboard, and now both views use the shared Supabase demo database.
                </Text>
                {error && <Text color="orange.300">{error}</Text>}
              </Stack>
              <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap={3} minW={{ md: "320px" }}>
                <StatCard label="Waiting" value={String(waiting.length)} helper="active guests" />
                <StatCard label="Seated" value={String(seated.length)} helper="served today" />
                <StatCard label="Status" value={isLoading ? "Syncing" : "Live"} helper="Supabase" />
              </Grid>
            </Flex>
          </Card.Body>
        </Card.Root>

        <Grid templateColumns={{ base: "1fr", xl: "420px 1fr" }} gap={8} alignItems="start">
          <Stack gap={8}>
            <Card.Root bg="white" color="gray.900" shadow="2xl" borderRadius="2xl">
              <Card.Body>
                <Stack gap={5} as="form" onSubmit={handleGuestSubmit}>
                  <Stack gap={2}>
                    <Text textStyle="sm" color="green.600" fontWeight="bold">Guest view</Text>
                    <Heading size="lg">Join the waitlist</Heading>
                    <Text color="gray.600">This is the page a diner would see after scanning a QR code at the entrance.</Text>
                  </Stack>

                  <Input placeholder="Your name" value={guestName} onChange={(e) => setGuestName(e.target.value)} size="lg" />
                  <Input placeholder="Phone number" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} size="lg" />
                  <Input placeholder="Party size" type="number" min={1} max={12} value={guestPartySize} onChange={(e) => setGuestPartySize(e.target.value)} size="lg" />
                  <Input placeholder="Optional note" value={guestNote} onChange={(e) => setGuestNote(e.target.value)} size="lg" />

                  <Button type="submit" colorPalette="green" size="lg">Join queue</Button>
                  <Text textStyle="sm" color="gray.500">This version writes to the shared Supabase demo project.</Text>
                </Stack>
              </Card.Body>
            </Card.Root>

            <Card.Root bg="whiteAlpha.100" borderColor="whiteAlpha.200" borderWidth="1px">
              <Card.Body>
                <Stack gap={3}>
                  <Heading size="md">Demo architecture</Heading>
                  <Text color="gray.300">The app now reads and writes to the `restaurant_queue` schema in the shared demo database.</Text>
                </Stack>
              </Card.Body>
            </Card.Root>
          </Stack>

          <Card.Root bg="white" color="gray.900" shadow="2xl" borderRadius="2xl">
            <Card.Body>
              <Stack gap={6}>
                <Flex direction={{ base: "column", md: "row" }} justify="space-between" gap={4}>
                  <Stack gap={1}>
                    <Text textStyle="sm" color="blue.600" fontWeight="bold">Restaurant view</Text>
                    <Heading size="lg">Queue dashboard</Heading>
                    <Text color="gray.600">Monitor the live line, add walk-ins, seat guests, or clear entries.</Text>
                  </Stack>
                  <HStack align="stretch">
                    <Button variant="outline" onClick={fetchQueue}>Refresh</Button>
                  </HStack>
                </Flex>

                <Grid templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} gap={3} as="form" onSubmit={handleStaffAdd}>
                  <Input placeholder="Walk-in name" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
                  <Input placeholder="Phone number" value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} />
                  <HStack>
                    <Input placeholder="Party size" type="number" min={1} max={12} value={staffPartySize} onChange={(e) => setStaffPartySize(e.target.value)} />
                    <Button type="submit" colorPalette="blue">Add</Button>
                  </HStack>
                </Grid>

                <Separator />

                <Stack gap={4}>
                  <Heading size="md">Current queue</Heading>
                  <Box overflowX="auto">
                    <Table.Root size="sm" striped>
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>Name</Table.ColumnHeader>
                          <Table.ColumnHeader>Phone</Table.ColumnHeader>
                          <Table.ColumnHeader>Party</Table.ColumnHeader>
                          <Table.ColumnHeader>Joined</Table.ColumnHeader>
                          <Table.ColumnHeader>Wait</Table.ColumnHeader>
                          <Table.ColumnHeader>Source</Table.ColumnHeader>
                          <Table.ColumnHeader>Status</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {queue.map((entry) => (
                          <Table.Row key={entry.id}>
                            <Table.Cell fontWeight="medium">{entry.name}</Table.Cell>
                            <Table.Cell>{entry.phone}</Table.Cell>
                            <Table.Cell>{entry.partySize}</Table.Cell>
                            <Table.Cell>{formatTime(entry.joinedAt)}</Table.Cell>
                            <Table.Cell>{formatWait(entry.joinedAt)}</Table.Cell>
                            <Table.Cell>
                              <Badge colorPalette={entry.source === "qr" ? "purple" : "orange"}>{entry.source}</Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge colorPalette={entry.status === "waiting" ? "blue" : entry.status === "seated" ? "green" : "red"}>
                                {entry.status}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <HStack justify="flex-end">
                                {entry.status === "waiting" && (
                                  <Button size="xs" colorPalette="green" onClick={() => markSeated(entry.id)}>
                                    Seat
                                  </Button>
                                )}
                                <Button size="xs" variant="outline" onClick={() => removeEntry(entry.id)}>
                                  Remove
                                </Button>
                              </HStack>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                </Stack>
              </Stack>
            </Card.Body>
          </Card.Root>
        </Grid>
      </Stack>
    </Box>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card.Root bg="blackAlpha.400" borderColor="whiteAlpha.200" borderWidth="1px">
      <Card.Body>
        <Text color="gray.400" textStyle="sm">{label}</Text>
        <Heading size="lg">{value}</Heading>
        <Text color="gray.500" textStyle="sm">{helper}</Text>
      </Card.Body>
    </Card.Root>
  );
}
