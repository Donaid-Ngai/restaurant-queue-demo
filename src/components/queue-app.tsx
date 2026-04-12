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
import { FormEvent, useMemo, useState } from "react";

type QueueStatus = "waiting" | "seated";

type QueueEntry = {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  note?: string;
  joinedAt: string;
  status: QueueStatus;
  source: "qr" | "walk-in";
};

const STORAGE_KEY = "restaurant-queue-demo";

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
  {
    id: "q3",
    name: "Alex Rivera",
    phone: "555-0126",
    partySize: 3,
    joinedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    status: "seated",
    source: "qr",
  },
];

function loadQueue(): QueueEntry[] {
  if (typeof window === "undefined") return seedQueue;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedQueue));
    return seedQueue;
  }

  try {
    return JSON.parse(raw) as QueueEntry[];
  } catch {
    return seedQueue;
  }
}

function saveQueue(queue: QueueEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

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

export function QueueApp() {
  const [queue, setQueue] = useState<QueueEntry[]>(() => loadQueue());
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

  const updateQueue = (next: QueueEntry[]) => {
    setQueue(next);
    saveQueue(next);
  };

  const handleGuestSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) return;

    const entry: QueueEntry = {
      id: crypto.randomUUID(),
      name: guestName.trim(),
      phone: guestPhone.trim(),
      partySize: Number(guestPartySize) || 1,
      note: guestNote.trim(),
      joinedAt: new Date().toISOString(),
      status: "waiting",
      source: "qr",
    };

    updateQueue([...queue, entry]);
    setGuestName("");
    setGuestPhone("");
    setGuestPartySize("2");
    setGuestNote("");
  };

  const handleStaffAdd = (event: FormEvent) => {
    event.preventDefault();
    if (!staffName.trim() || !staffPhone.trim()) return;

    const entry: QueueEntry = {
      id: crypto.randomUUID(),
      name: staffName.trim(),
      phone: staffPhone.trim(),
      partySize: Number(staffPartySize) || 1,
      joinedAt: new Date().toISOString(),
      status: "waiting",
      source: "walk-in",
    };

    updateQueue([...queue, entry]);
    setStaffName("");
    setStaffPhone("");
    setStaffPartySize("2");
  };

  const markSeated = (id: string) => {
    updateQueue(queue.map((entry) => (entry.id === id ? { ...entry, status: "seated" } : entry)));
  };

  const removeEntry = (id: string) => {
    updateQueue(queue.filter((entry) => entry.id !== id));
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
                  Guests join from a QR code landing page, staff manage the line from the dashboard, and the whole demo runs client-side for fast iteration.
                </Text>
              </Stack>
              <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap={3} minW={{ md: "320px" }}>
                <StatCard label="Waiting" value={String(waiting.length)} helper="active guests" />
                <StatCard label="Seated" value={String(seated.length)} helper="served today" />
                <StatCard label="Avg wait" value={waiting[0] ? formatWait(waiting[0].joinedAt) : "0 min"} helper="front of line" />
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
                  <Text textStyle="sm" color="gray.500">Demo behavior only. Entries are stored in local browser storage.</Text>
                </Stack>
              </Card.Body>
            </Card.Root>

            <Card.Root bg="whiteAlpha.100" borderColor="whiteAlpha.200" borderWidth="1px">
              <Card.Body>
                <Stack gap={3}>
                  <Heading size="md">How this maps to the real product</Heading>
                  <Text color="gray.300">Later, this local queue can be swapped for Supabase, SMS notifications, and a real staff login with almost the same UI structure.</Text>
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
                    <Button variant="outline" onClick={() => updateQueue(seedQueue)}>Reset demo data</Button>
                    <Button colorPalette="red" variant="subtle" onClick={() => updateQueue([])}>Clear all</Button>
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
                              <Badge colorPalette={entry.status === "waiting" ? "blue" : "green"}>{entry.status}</Badge>
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
