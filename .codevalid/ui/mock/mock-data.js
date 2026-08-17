export const authUser = {
  id: "user-1",
  username: "johndoe",
  email: "john@example.com",
  fullName: "John Doe",
  phone: "+1 (555) 000-0000",
  organization: "Acme Corp",
};

export const authSession = {
  user: authUser,
  token: "mock-valid-token",
};

export const emptyEvents = [];

export const morningCommutePreset = {
  presetId: 101,
  name: "Morning Commute",
  primaryDirection: "SW",
  periodTag: "morning",
  exactStartTimeLocal: "07:00",
  durationMinutes: 30,
  miles: 5.2,
  lastUsedAtUtc: null,
  updatedAtUtc: "2026-08-17T08:00:00Z",
};

export const afternoonRunPreset = {
  presetId: 102,
  name: "Afternoon Run",
  primaryDirection: "NE",
  periodTag: "afternoon",
  exactStartTimeLocal: "17:30",
  durationMinutes: 45,
  miles: 6.1,
  lastUsedAtUtc: null,
  updatedAtUtc: "2026-08-17T08:05:00Z",
};

export const dailyCommutePreset = {
  presetId: 201,
  name: "Daily Commute",
  primaryDirection: "SW",
  periodTag: "morning",
  exactStartTimeLocal: "07:30",
  durationMinutes: 30,
  miles: 5.2,
  lastUsedAtUtc: null,
  updatedAtUtc: "2026-08-17T08:10:00Z",
};

export const dailyCommuteUpdatedPreset = {
  presetId: 201,
  name: "Daily Commute",
  primaryDirection: "SW",
  periodTag: "morning",
  exactStartTimeLocal: "07:30",
  durationMinutes: 45,
  miles: 6,
  lastUsedAtUtc: null,
  updatedAtUtc: "2026-08-17T08:11:00Z",
};

export const eveningRunPreset = {
  presetId: 202,
  name: "Evening Run",
  primaryDirection: "NE",
  periodTag: "afternoon",
  exactStartTimeLocal: "18:00",
  durationMinutes: 40,
  miles: 4.8,
  lastUsedAtUtc: null,
  updatedAtUtc: "2026-08-17T08:12:00Z",
};

export const normalizedDirectionPreset = {
  presetId: 201,
  name: "Daily Commute",
  primaryDirection: "NE",
  periodTag: "morning",
  exactStartTimeLocal: "07:30",
  durationMinutes: 30,
  miles: 5.2,
  lastUsedAtUtc: null,
  updatedAtUtc: "2026-08-17T08:13:00Z",
};

export const weekendRidePreset = {
  presetId: 203,
  name: "Weekend Ride",
  primaryDirection: "NE",
  periodTag: "morning",
  exactStartTimeLocal: "08:00",
  durationMinutes: 60,
  miles: 10.5,
  lastUsedAtUtc: null,
  updatedAtUtc: "2026-08-17T08:14:00Z",
};

export const morningRunPreset = {
  presetId: 301,
  name: "Morning Run",
  primaryDirection: "SW",
  periodTag: "morning",
  exactStartTimeLocal: "07:00",
  durationMinutes: 30,
  miles: 5,
  lastUsedAtUtc: null,
  updatedAtUtc: "2026-08-17T08:15:00Z",
};

export const morningRunUpdatedPreset = {
  presetId: 301,
  name: "Morning Run",
  primaryDirection: "SW",
  periodTag: "morning",
  exactStartTimeLocal: "07:00",
  durationMinutes: 45,
  miles: 7.5,
  lastUsedAtUtc: null,
  updatedAtUtc: "2026-08-17T08:16:00Z",
};
